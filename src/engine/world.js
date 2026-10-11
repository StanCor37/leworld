// World: one attempt at a level - player, enemies, items, checkpoints and their rules.
// No rendering or input here, so the whole simulation can be stepped headlessly in tests.
//
// Rules (from the design doc):
//  - Three hearts per attempt. Enemy contact, spikes or falling into a gap cost one heart.
//  - Non-fatal hits give brief invulnerability. A fall returns Hunter to the last checkpoint.
//  - The third hit ends the attempt (state 'defeated'); restarting begins at the level start.
//  - Checkpoints do not restore hearts.
//  - Books: 100 points each (once per adventure). Three books in an attempt unlock firing
//    for the rest of the attempt; damage never removes it.
//  - Tools: 50 points each. Every three tools make a repair charge: +1 heart, or held while
//    at full health and spent the next time a heart is lost.
(function () {
  const Ph = () => LW.Physics;
  const T = LW.TILE;
  const BOOK_LOOKS = ['book', 'book_teal', 'book_orange', 'book_pink', 'book_green'];
  const TOOL_LOOKS = ['tool_drill', 'tool_hammer', 'tool_wrench', 'tool_saw'];

  function World(levelDef, session) {
    this.session = session || LW.Session.create('casual');
    this.diff = LW.CFG.difficulty[this.session.difficulty];
    this.level = new LW.Level(levelDef, { difficulty: this.session.difficulty });
    const L = this.level;
    this.player = new LW.Player(L.start.x, L.start.y);
    this.enemies = [];
    this.items = [];
    this.checkpoints = [];
    this.cats = [];
    this.goal = null;
    let books = 0, tools = 0;
    for (const e of L.entities) {
      if (e.type === 'b' || e.type === 't') {
        const kind = e.type === 'b' ? 'book' : 'tool';
        const id = kind + '@' + e.tx + ',' + e.ty;
        const n = kind === 'book' ? books++ : tools++;
        const look = kind === 'book' ? BOOK_LOOKS[n % BOOK_LOOKS.length] : TOOL_LOOKS[n % TOOL_LOOKS.length];
        const it = { kind, id, look, x: e.x - 6, y: e.y - 14, w: 12, h: 12, taken: false,
          scored: LW.Session.hasScored(this.session, L.id, id) };
        this.items.push(it);
      } else if (e.type === 'C') {
        this.checkpoints.push({ x: e.x - 6, y: e.y - 32, w: 12, h: 32, active: false, feetY: e.y, cx: e.x });
      } else if (e.type === 'K') {
        this.cats.push({ x: e.x - 7, y: e.y - 13, w: 14, h: 13, petted: false, id: L.id + '@' + e.tx + ',' + e.ty });
      } else if (e.type === 'G') {
        this.goal = { x: e.x - 8, y: e.y - 40, w: 16, h: 40, cx: e.x, feetY: e.y };
      } else {
        const en = LW.Enemies.create(e.type, e.x, e.y, this.diff);
        if (en) this.enemies.push(en);
      }
    }
    this.checkpoints.sort((a, b) => a.x - b.x);
    // every book in the adventure is a different real book, handed out left to right
    // (7 per level fit in the 50)
    if (LW.BOOKS) this.items.filter(i => i.kind === 'book').sort((a, b) => a.x - b.x)
      .forEach((it, n) => { it.book = LW.BOOKS[((levelDef.order || 0) * 7 + n) % LW.BOOKS.length]; });
    LW.Enemies.formSquads(this.enemies, this.diff.enemySpeed);
    // generic walkers can wear a level-specific look: def.walker = [walkSprite, defeatSprite]
    if (levelDef.walker) for (const e of this.enemies) if (e instanceof LW.Enemies.Walker) { e.sprite = levelDef.walker[0]; e.defeatSprite = levelDef.walker[1]; }
    this.boss = this.enemies.find(e => e.isBoss) || null;
    this.enemyShots = [];
    this.bossDownT = null;
    this.hazards = LW.Hazards.build(L, this.diff);
    this.platforms = this.hazards.filter(h => h.platform);
    this.respawn = { x: L.start.x, y: L.start.y };

    // Attempt state
    this.hearts = LW.CFG.player.maxHearts;
    this.booksThisAttempt = 0;
    this.firing = false;
    this.toolProgress = 0;
    this.charges = 0;
    this.cooldown = 0;
    this.shots = [];
    this.state = 'playing';      // 'playing' | 'defeated' | 'complete'
    this.events = [];            // drained by the game for sounds/effects/messages
    this.time = 0;
  }

  World.prototype.emit = function (type, data) { this.events.push(Object.assign({ type }, data)); };

  // ---------------------------------------------------------------- damage
  World.prototype.loseHeart = function (cause) {
    this.hearts -= 1;
    this.emit('hurt', { cause, hearts: this.hearts });
    if (this.hearts <= 0) {
      this.hearts = 0;
      this.state = 'defeated';
      this.emit('defeated');
      return;
    }
    if (this.charges > 0 && this.hearts < LW.CFG.player.maxHearts) {
      this.charges -= 1; this.hearts += 1;
      this.emit('repair', { held: true });
    }
  };

  World.prototype.hit = function (fromX, cause) {
    if (!this.player.hurt(fromX, this.diff.invulnTime)) return false;
    this.loseHeart(cause);
    return true;
  };

  // ---------------------------------------------------------------- items
  World.prototype.collect = function (it) {
    it.taken = true;
    const R = LW.CFG.rules;
    const pts = LW.Session.award(this.session, this.level.id, it.id, it.kind === 'book' ? R.bookPoints : R.toolPoints);
    this.emit('collect', { kind: it.kind, points: pts, x: it.x + it.w / 2, y: it.y, book: it.book, look: it.look });
    if (it.kind === 'book') {
      this.booksThisAttempt++;
      if (!this.firing && this.booksThisAttempt >= R.booksToUnlock) { this.firing = true; this.emit('unlockFire'); }
    } else {
      this.toolProgress++;
      if (this.toolProgress >= R.toolsPerRepair) {
        this.toolProgress = 0;
        if (this.hearts < LW.CFG.player.maxHearts) { this.hearts++; this.emit('repair', { held: false }); }
        else { this.charges++; this.emit('chargeStored'); }
      }
    }
  };

  // ---------------------------------------------------------------- platforms
  // Dynamic platforms are solid from above only (like one-way ledges).
  World.prototype.landOnPlatforms = function (prevBottom, wasGround) {
    const p = this.player;
    let landed = null;
    if (p.vy >= 0) {
      for (const h of this.platforms) {
        if (!h.active) continue;
        if (p.x < h.x + h.w && p.x + p.w > h.x && prevBottom <= h.y + 1 + Math.abs(h.dy || 0) && p.y + p.h >= h.y) {
          p.y = h.y - p.h; p.vy = 0; p.onGround = true; landed = h;
          break;
        }
      }
    }
    p.standingOn = landed;
    if (landed) {
      if (!wasGround) { p.justLanded = true; }
      p.updateAnim(0);
    }
  };

  // ---------------------------------------------------------------- enemy helpers
  World.prototype.say = function (ent, text) { this.emit('say', { ent, text }); };

  const SHOT_BOX = { hey: [30, 10], blah: [20, 8], amen: [22, 9], scroll: [8, 6] };
  // x, y = centre of the projectile.
  World.prototype.spawnShot = function (kind, x, y, vx, vy, g) {
    const [w, h] = SHOT_BOX[kind];
    this.enemyShots.push({ kind, x, y, vx, vy, g: g || 0, w, h, age: 0, live: true });
    this.emit('enemyShot', { kind });
  };
  // Arcing scroll aimed to land at (tx, ty) after `flight` seconds.
  World.prototype.lobScroll = function (x0, y0, tx, ty, flight) {
    const g = LW.CFG.projectiles.scrollGravity;
    const vx = Math.max(-130, Math.min(130, (tx - x0) / flight));
    const vy = (ty - y0 - 0.5 * g * flight * flight) / flight;
    this.spawnShot('scroll', x0, y0, vx, vy, g);
  };
  World.prototype.enemyShotBox = function (s) { return { x: s.x - s.w / 2, y: s.y - s.h / 2, w: s.w, h: s.h }; };

  World.prototype.updateEnemyShots = function (dt) {
    const L = this.level, p = this.player;
    for (const s of this.enemyShots) {
      if (!s.live) continue;
      s.age += dt;
      s.x += s.vx * dt;
      s.vy += s.g * dt; s.y += s.vy * dt;
      const b = this.enemyShotBox(s);
      if (s.kind === 'amen') {
        // rolls along the floor; dissolves at walls and ledge ends
        const ahead = s.vx > 0 ? b.x + b.w + 1 : b.x - 1;
        const below = L.at(Math.floor(ahead / LW.TILE), Math.floor((b.y + b.h + 8) / LW.TILE));
        if (L.overlaps(b.x, b.y, b.w, b.h, LW.Level.SOLID) || (below !== LW.Level.SOLID && below !== LW.Level.ONEWAY)) s.live = false;
      } else if (L.overlaps(b.x, b.y, b.w, b.h, LW.Level.SOLID)) s.live = false;
      if (s.age > LW.CFG.projectiles.maxAge || s.y > L.ph + 20 || s.x < -40 || s.x > L.pw + 40) s.live = false;
      if (s.live && Ph().overlap(p, b)) {
        if (this.hit(s.x, 'projectile')) s.live = false;
      }
    }
    this.enemyShots = this.enemyShots.filter(s => s.live);
  };

  // ---------------------------------------------------------------- firing
  World.prototype.tryFire = function () {
    const p = this.player, S = LW.CFG.shot;
    if (!this.firing || this.cooldown > 0 || p.crouching) return false;
    if (this.shots.filter(s => s.live).length >= S.maxActive) return false;
    const x0 = p.x + p.w / 2 + p.facing * 6;
    this.shots.push({ x0, y: p.y + 11, dir: p.facing, travelled: 0, live: true, fade: 0 });
    this.cooldown = this.diff.fireCooldown;
    p.fireAnim = 0.2;
    this.emit('fire');
    return true;
  };

  World.prototype.shotBox = function (s) {
    const hb = LW.CFG.shot.hitbox;
    return { x: s.x0 + s.dir * s.travelled - hb / 2, y: s.y - hb / 2, w: hb, h: hb };
  };

  World.prototype.updateShots = function (dt) {
    const S = LW.CFG.shot, L = this.level;
    for (const s of this.shots) {
      if (!s.live) { s.fade += dt; continue; }
      s.travelled += S.speed * dt;
      const b = this.shotBox(s);
      if (s.travelled >= S.range || L.overlaps(b.x, b.y, b.w, b.h, LW.Level.SOLID)) { s.live = false; continue; }
      for (const e of this.enemies) {
        if (!e.alive || !Ph().overlap(b, e)) continue;
        s.live = false;
        if (e.canShoot()) { e.defeat(b.x); this.emit('shotHit', { x: b.x, y: b.y }); }
        else this.emit('deflect', { x: b.x, y: b.y });
        break;
      }
      // MALE LONELINESS pops enemy bubbles and knocks scrolls out of the air
      if (s.live) for (const es of this.enemyShots) {
        if (es.live && es.kind !== 'amen' && Ph().overlap(b, this.enemyShotBox(es))) {
          es.live = false; s.live = false;
          this.emit('pop', { x: es.x, y: es.y, kind: es.kind });
          break;
        }
      }
    }
    this.shots = this.shots.filter(s => s.live || s.fade < 0.8);
  };

  // ---------------------------------------------------------------- step
  World.prototype.step = function (dt, controls) {
    if (this.state !== 'playing') return;
    const p = this.player, L = this.level, C = LW.CFG.player;
    this.time += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    for (const h of this.hazards) h.update(dt, this);

    // Ride whatever platform Hunter is standing on.
    const ride = p.standingOn;
    if (ride && ride.active) {
      if (ride.dx) Ph().moveX(p, L, ride.dx);
      if (ride.dy) p.y += ride.dy;
    }
    const wasGround = p.onGround;
    const prevBottom = p.y + p.h;
    p.update(dt, controls, L);
    this.landOnPlatforms(prevBottom, wasGround);
    if (p.justJumped) this.emit('jump');
    if (p.justLanded) this.emit('land', { x: p.x + p.w / 2, y: p.y + p.h });
    if (controls.firePressed || (controls.fireHeld && this.cooldown === 0 && this.firing)) this.tryFire();

    for (const e of this.enemies) e.update(dt, this);
    this.updateShots(dt);
    this.updateEnemyShots(dt);
    if (this.state !== 'playing') return;

    // Player vs enemies: landing on top stomps, anything else hurts.
    const descending = p.y + p.h >= prevBottom - 0.001 && !p.justJumped;
    let stomped = false;
    for (const e of this.enemies) {
      if (!e.alive || !Ph().overlap(p, e)) continue;
      if (e.canStomp() && descending && prevBottom <= e.stompZone() + C.stompGrace) {
        e.defeat(p.x + p.w / 2);
        stomped = true;
        this.emit('stomp', { x: e.x + e.w / 2, y: e.y, boss: !!e.isBoss });
      } else if (!stomped) {
        this.hit(e.x + e.w / 2, 'enemy');
      }
    }
    if (stomped) p.stomp();
    this.enemies = this.enemies.filter(e => !e.dead || e.isBoss);
    if (this.state !== 'playing') return;

    // Boss defeated: short celebration, then the level is complete.
    if (this.boss && !this.boss.alive) {
      if (this.bossDownT === null) { this.bossDownT = 0; this.enemyShots = []; this.emit('bossDefeated'); }
      this.bossDownT += dt;
      if (this.bossDownT > 3) { this.state = 'complete'; this.emit('complete'); return; }
    }

    // Spikes and timed hazards
    if (L.touchesHazard(p.x, p.y, p.w, p.h)) this.hit(p.x + p.w / 2 - p.facing, 'spikes');
    for (const h of this.hazards) {
      if (this.state !== 'playing') break;
      if (h.harmful && Ph().overlap(p, h)) this.hit(h.x + h.w / 2, h.kind);
    }
    if (this.state !== 'playing') return;

    // Items
    for (const it of this.items) if (!it.taken && Ph().overlap(p, it)) this.collect(it);

    // Checkpoints: activate on touch (only moving forward), save happens in the game layer.
    for (const cp of this.checkpoints) {
      if (!cp.active && Ph().overlap(p, cp)) {
        cp.active = true;
        this.respawn = { x: cp.cx, y: cp.feetY };
        this.emit('checkpoint', { index: this.checkpoints.indexOf(cp) });
      }
    }

    // Secret cats: crouch beside one to pet her (once per adventure for the tally)
    for (const cat of this.cats) {
      if (!cat.petted && p.crouching && Ph().overlap(p, { x: cat.x - 6, y: cat.y, w: cat.w + 12, h: cat.h })) {
        cat.petted = true;
        const first = !this.session.cats[cat.id];
        this.session.cats[cat.id] = true;
        this.emit('pet', { x: cat.x + cat.w / 2, y: cat.y, first });
      }
    }

    // Goal
    if (this.goal && Ph().overlap(p, this.goal)) {
      this.state = 'complete';
      this.emit('complete');
      return;
    }

    // Falling into a gap: lose a heart, return to the latest checkpoint.
    if (p.y > L.ph + 24) {
      this.loseHeart('fall');
      if (this.state !== 'playing') return;
      p.reset(this.respawn.x, this.respawn.y);
      p.invuln = this.diff.invulnTime;
      this.shots = [];
      this.emit('fell');
    }
  };

  World.prototype.itemTotals = function () {
    const t = { book: 0, tool: 0 };
    for (const it of this.items) t[it.kind]++;
    return t;
  };

  LW.World = World;
})();

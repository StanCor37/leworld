// Enemies. Every enemy has a clear silhouette and a predictable, telegraphed pattern.
// Tuning numbers are in LW.CFG.enemies; Casual/Challenge scale speed and attack tempo.
//
//   e  walker (generic patroller)       x  Chloe's ex       X  the ex, final confrontation (3 hits)
//   s/S  male suitors (two looks)        a  far-right agitators (adjacent ones march as a squad)
//   r  hostile preacher                  i  relationship inspector (cone hat: cannot be stomped)
//   O  the Pontiff (boss)
(function () {
  const Ph = () => LW.Physics;
  const T = LW.TILE;
  const G = () => LW.CFG.player.gravity;
  // Lines live in src/data/content.js (LW.TAUNTS); each enemy cycles through its list.
  const line = (kind, n) => { const l = (LW.TAUNTS && LW.TAUNTS[kind]) || ['...']; return l[n % l.length]; };

  // ---------------------------------------------------------------- base
  class Enemy {
    constructor(x, feetY, o) {
      o = o || {};
      this.w = o.w || 10; this.h = o.h || 22;
      this.x = x - this.w / 2; this.y = feetY - this.h;
      this.home = x;
      this.vx = 0; this.vy = 0; this.onGround = false;
      this.dir = -1;
      this.mul = o.mul || 1;              // difficulty tempo multiplier
      this.hp = o.hp || 1;
      this.alive = true; this.dead = false;
      this.stompable = true; this.shootable = true;
      this.state = 'idle'; this.stateT = 0;
      this.animT = 0; this.spin = 0; this.hurtT = 0;
      this.warn = false;                  // draw a "!" telegraph
      this.sprite = null; this.defeatSprite = null;
    }
    get cx() { return this.x + this.w / 2; }
    get feet() { return this.y + this.h; }
    setState(s) { this.state = s; this.stateT = 0; }
    // seconds scaled by difficulty: faster tempo = shorter waits
    secs(s) { return s / this.mul; }

    // gravity + horizontal move with tile collision; returns true if a wall was hit
    physics(dt, level) {
      const wall = Ph().moveX(this, level, this.vx * dt);
      this.vy = Math.min(this.vy + G() * dt, LW.CFG.player.maxFall);
      Ph().moveY(this, level, this.vy * dt);
      return wall;
    }
    // is there ground one step ahead in direction d?
    groundAhead(level, d) {
      const ax = d > 0 ? this.x + this.w + 1 : this.x - 1;
      const t = level.at(Math.floor(ax / T), Math.floor((this.feet + 1) / T));
      return t === LW.Level.SOLID || t === LW.Level.ONEWAY;
    }
    // walk in this.dir at speed, turning at walls and ledges
    patrol(dt, level, speed) {
      this.vx = this.dir * speed;
      const wall = this.physics(dt, level);
      if (this.onGround && (wall || !this.groundAhead(level, this.dir))) this.dir *= -1;
    }
    // move toward a direction but never off a ledge; returns false if blocked
    stepToward(dt, level, d, speed) {
      if (this.onGround && !this.groundAhead(level, d)) { this.vx = 0; this.physics(dt, level); return false; }
      this.vx = d * speed;
      return !this.physics(dt, level);
    }
    facePlayer(p) { this.dir = (p.x + p.w / 2) < this.cx ? -1 : 1; }
    sees(p, range, vrange) {
      const dx = (p.x + p.w / 2) - this.cx, dy = (p.y + p.h) - this.feet;
      return Math.abs(dx) < range && Math.abs(dy) < (vrange || 40);
    }

    canStomp() { return this.stompable && this.hurtT <= 0; }
    canShoot() { return this.shootable; }
    stompZone() { return this.y; }
    // Take one hit. Returns true when the enemy is defeated.
    defeat(fromX) {
      if (this.hurtT > 0) return false;
      this.hp -= 1;
      if (this.hp > 0) { this.hurtT = 0.7; this.vx = (this.cx < fromX ? -1 : 1) * 80; this.vy = -120; this.warn = false; return false; }
      this.alive = false;
      this.warn = false;
      this.vy = -180;
      this.vx = (this.cx < fromX ? -1 : 1) * 60;
      return true;
    }
    update(dt, world) {
      this.animT += dt * 5;
      this.stateT += dt;
      this.hurtT = Math.max(0, this.hurtT - dt);
      if (!this.alive) {
        // comic defeat: pop up, spin, fall off screen
        this.vy += G() * dt;
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.spin += dt * 12;
        if (this.y > world.level.ph + 60) this.dead = true;
        return;
      }
      if (this.hurtT > 0) { this.vx *= 0.9; this.physics(dt, world.level); return; }
      this.think(dt, world);
      this.warn = this.telegraphing();
      if (this.y > world.level.ph + 40) this.dead = true;
    }
    think() {}
    telegraphing() { return false; }
    anim() { return this.sprite; }
    draw(ctx, camX, camY, rim, t) {
      const cx = Math.round(this.cx - camX), fy = Math.round(this.feet - camY);
      if (!this.alive) { LW.Sprites.draw(ctx, this.defeatSprite, 0, cx, fy, { rot: this.spin }); return; }
      const flash = this.hurtT > 0 && Math.floor(this.hurtT * 16) % 2 === 0;
      LW.Sprites.draw(ctx, this.anim(), Math.floor(this.animT), cx, fy, { flip: this.dir < 0, rim, flash });
      if (this.warn) LW.Props.drawWarning(ctx, cx, fy - this.h - (this.above || 8), t);
    }
  }

  // ---------------------------------------------------------------- walker (generic)
  class Walker extends Enemy {
    constructor(x, y, mul) { super(x, y, { mul }); this.sprite = 'suitor_walk'; this.defeatSprite = 'suitor_defeat'; this.speed = LW.CFG.enemies.walker.speed * mul; }
    think(dt, w) { this.patrol(dt, w.level, this.speed); }
  }

  // ---------------------------------------------------------------- Chloe's ex
  // Pursues over short distances, pauses to flex dramatically, then telegraphs a charge.
  class Ex extends Enemy {
    telegraphing() { return this.state === 'windup'; }
    constructor(x, y, mul, final) {
      super(x, y, { mul, hp: final ? 3 : 1, w: 12 });
      this.final = final;
      this.sprite = 'ex_walk'; this.defeatSprite = 'ex_defeat';
      this.gestures = 0; this.taunt = 0;
      this.C = LW.CFG.enemies.ex;
    }
    anim() {
      if (this.state === 'gesture') return 'ex_gesture';
      if (this.state === 'windup' || this.state === 'charge') return 'ex_charge';
      return 'ex_walk';
    }
    think(dt, w) {
      const p = w.player, L = w.level, C = this.C;
      const leash = C.leash * T;
      switch (this.state) {
        case 'idle':
          this.vx = 0; this.physics(dt, L);
          if (this.sees(p, C.notice * T)) { this.setState('pursue'); w.say(this, line('ex', this.taunt++)); }
          break;
        case 'pursue': {
          this.facePlayer(p);
          const atLeash = Math.abs(this.cx + this.dir * 2 - this.home) > leash;
          if (atLeash) { this.vx = 0; this.physics(dt, L); } else this.stepToward(dt, L, this.dir, C.speed * this.mul);
          if (!this.sees(p, (C.notice + 3) * T, 60)) this.setState('return');
          else if (this.stateT > this.secs(C.pursueTime)) {
            this.gestures++;
            const chargeNow = this.gestures % (this.final ? 1 : 2) === 0;
            this.setState(chargeNow ? 'windup' : 'gesture');
            if (!chargeNow) w.say(this, line('ex', this.taunt++));
          }
          break;
        }
        case 'gesture':           // flexing: stands still, a safe moment to stomp him
          this.vx = 0; this.physics(dt, L);
          if (this.stateT > this.secs(C.gestureTime)) this.setState('pursue');
          break;
        case 'windup':            // telegraph: leans in with a "!" before charging
          this.facePlayer(p); this.vx = 0; this.physics(dt, L);
          if (this.stateT > C.windupTime) this.setState('charge');
          break;
        case 'charge': {
          // charges are bounded too: he never strays more than 2 tiles past his leash
          const tooFar = Math.abs(this.cx - this.home) > leash + 2 * T && (this.cx - this.home) * this.dir > 0;
          if (tooFar || !this.stepToward(dt, L, this.dir, C.chargeSpeed * this.mul) || this.stateT > C.chargeTime) this.setState('recover');
          break;
        }
        case 'recover':
          this.vx = 0; this.physics(dt, L);
          if (this.stateT > this.secs(C.recoverTime)) this.setState('pursue');
          break;
        case 'return': {
          const d = this.home < this.cx ? -1 : 1; this.dir = d;
          this.stepToward(dt, L, d, C.speed * this.mul * 0.7);
          if (Math.abs(this.cx - this.home) < 4) this.setState('idle');
          else if (this.sees(p, C.notice * T)) this.setState('pursue');
          break;
        }
      }
    }
  }

  // ---------------------------------------------------------------- male suitors
  class Suitor extends Enemy {
    telegraphing() { return this.state === 'aim'; }
    constructor(x, y, mul, alt) {
      super(x, y, { mul });
      const pre = alt ? 'suitor2_' : 'suitor_';
      this.walkS = pre + 'walk'; this.throwS = pre + 'throw'; this.defeatSprite = pre + 'defeat';
      this.C = LW.CFG.enemies.suitor;
      this.cool = 0;
      this.throws = 0;
      this.n = Math.floor(x / T);           // different suitors start on different lines
    }
    anim() { return this.state === 'aim' || (this.state === 'cool' && this.stateT < 0.3) ? this.throwS : this.walkS; }
    think(dt, w) {
      const p = w.player, L = w.level, C = this.C;
      this.cool = Math.max(0, this.cool - dt);
      if (this.state === 'aim') {
        this.vx = 0; this.physics(dt, L);
        if (this.stateT > C.aimTime) {
          w.spawnShot('hey', this.cx + this.dir * 8, this.y + 4, this.dir * C.bubbleSpeed * this.mul, 0);
          if (this.throws++ % 2 === 1) w.say(this, line('suitor', this.n++));
          this.cool = this.secs(C.cooldown);
          this.setState('cool');
        }
        return;
      }
      this.patrol(dt, L, C.speed * this.mul);
      if (this.cool <= 0 && this.sees(p, C.range * T, 30)) { this.facePlayer(p); this.setState('aim'); }
    }
  }

  // ---------------------------------------------------------------- agitators (squads)
  // Adjacent agitators share a Squad: they march in step, telegraph together, charge together.
  class Squad {
    constructor(mul, seed) { this.members = []; this.state = 'march'; this.t = 0; this.dir = -1; this.flips = 0; this.mul = mul; this.shout = seed || 0; }
    get alive() { return this.members.filter(m => m.alive); }
    update(dt, w) {
      const C = LW.CFG.enemies.agitator, live = this.alive;
      if (!live.length) return;
      this.t += dt;
      const lead = live[0];
      if (this.state === 'march') {
        if (this.t > C.marchTime / this.mul) {
          this.t = 0; this.dir *= -1; this.flips++;
          if (this.flips >= C.marchesBeforeCharge && lead.sees(w.player, C.range * T, 50)) {
            this.state = 'telegraph'; this.t = 0;
            this.dir = (w.player.x + w.player.w / 2) < lead.cx ? -1 : 1;
            w.say(lead, line('agitator', this.shout++));
          }
        }
      } else if (this.state === 'telegraph') {
        if (this.t > C.telegraphTime) { this.state = 'charge'; this.t = 0; }
      } else if (this.state === 'charge') {
        if (this.t > C.chargeTime) { this.state = 'reset'; this.t = 0; }
      } else if (this.state === 'reset') {
        if (this.t > C.resetTime / this.mul) { this.state = 'march'; this.t = 0; this.flips = 0; this.dir *= -1; }
      }
    }
  }
  class Agitator extends Enemy {
    telegraphing() { return this.squad.state === 'telegraph'; }
    constructor(x, y, mul) {
      super(x, y, { mul });
      this.defeatSprite = 'agitator_defeat';
      this.squad = null;
      this.above = 30;                    // warnings and speech go above the placard
    }
    anim() {
      const s = this.squad.state;
      if (s === 'telegraph') return 'agitator_telegraph';
      if (s === 'charge') return 'agitator_charge';
      return 'agitator_march';
    }
    defeat(fromX) {
      const done = super.defeat(fromX);
      // comic defeat: the placard goes flying on its own
      if (done) this.signFall = { x: this.cx - this.dir * 4, y: this.feet - 34, vx: -this.vx * 0.6 + (Math.random() - 0.5) * 40, vy: -150, rot: 0 };
      return done;
    }
    update(dt, w) {
      super.update(dt, w);
      const s = this.signFall;
      if (s) { s.vy += G() * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += dt * 9; }
    }
    draw(ctx, camX, camY, rim, t) {
      const fy = Math.round(this.feet - camY);
      if (this.alive) {
        // placard on a pole, held in the back hand, bobbing with the march
        const bob = this.squad.state === 'march' ? Math.round(Math.sin(this.animT * Math.PI)) : 0;
        const lift = this.squad.state === 'telegraph' ? 3 : 0;
        const px = Math.round(this.cx - camX - this.dir * 5);
        ctx.fillStyle = LW.PAL.k; ctx.fillRect(px - 1, fy - 33 - lift + bob, 3, 24);
        ctx.fillStyle = LW.PAL.b; ctx.fillRect(px, fy - 33 - lift + bob, 1, 23);
        LW.Sprites.draw(ctx, 'sign_eu_no', 0, px, fy - 30 - lift + bob, { rim });
      } else if (this.signFall) {
        LW.Sprites.draw(ctx, 'sign_eu_no', 0, this.signFall.x - camX, this.signFall.y - camY + 15, { rot: this.signFall.rot });
      }
      super.draw(ctx, camX, camY, rim, t);
    }
    think(dt, w) {
      const sq = this.squad, C = LW.CFG.enemies.agitator, L = w.level;
      if (sq.alive[0] === this) sq.update(dt, w);           // leader drives the squad clock
      this.dir = sq.dir;
      if (sq.state === 'march') this.animT = sq.t * 4;       // marching in lock-step
      let speed = 0;
      if (sq.state === 'march') speed = C.marchSpeed * this.mul;
      else if (sq.state === 'charge') speed = C.chargeSpeed * this.mul;
      if (speed) this.stepToward(dt, L, this.dir, speed); else { this.vx = 0; this.physics(dt, L); }
    }
  }

  // ---------------------------------------------------------------- hostile preacher
  class Preacher extends Enemy {
    telegraphing() { return this.state === 'raise'; }
    constructor(x, y, mul) {
      super(x, y, { mul });
      this.defeatSprite = 'preacher_defeat';
      this.C = LW.CFG.enemies.preacher;
      this.n = 0;
      this.seed = Math.floor(x / T);
    }
    anim() { return this.state === 'raise' ? 'preacher_throw' : 'preacher_idle'; }
    think(dt, w) {
      const p = w.player, C = this.C;
      this.vx = 0; this.physics(dt, w.level);
      if (!this.sees(p, C.range * T, 120)) { this.setState('idle'); return; }
      this.facePlayer(p);
      if (this.state === 'idle' && this.stateT > this.secs(C.interval)) {
        this.setState('raise');
        if (this.n % 2 === 0) w.say(this, line('preacher', this.n / 2 + this.seed));
      } else if (this.state === 'raise' && this.stateT > C.raiseTime) {
        w.lobScroll(this.cx, this.y + 2, p.x + p.w / 2, p.y + p.h - 6, C.flightTime);
        this.n++;
        this.setState('idle');
      }
    }
  }

  // ---------------------------------------------------------------- relationship inspector
  class Inspector extends Enemy {
    constructor(x, y, mul) {
      super(x, y, { mul });
      this.stompable = false;          // traffic cone hat: landing on it hurts
      this.defeatSprite = 'inspector_defeat';
      this.C = LW.CFG.enemies.inspector;
      this.n = Math.floor(x / T);
    }
    anim() { return this.state === 'inspect' ? 'inspector_inspect' : 'inspector_walk'; }
    think(dt, w) {
      const p = w.player, C = this.C;
      if (this.state === 'inspect') {
        this.vx = 0; this.physics(dt, w.level);
        if (this.stateT > this.secs(C.inspectTime)) this.setState('idle');
        return;
      }
      this.patrol(dt, w.level, C.speed * this.mul);
      if (this.stateT > this.secs(C.inspectEvery) && this.sees(p, 10 * T, 60)) {
        this.facePlayer(p); this.setState('inspect');
        w.say(this, line('inspector', this.n++));
      }
    }
  }

  // ---------------------------------------------------------------- the Pontiff (boss)
  // Stands on an oversized soapbox. Each phase is a readable attack pattern followed by a
  // "catching his breath" window where he slumps (dizzy) and can be stomped or shot.
  // Each hit cracks the soapbox; three hits break it and end the fight.
  const SERMONS = [
    ['BEHOLD MY SERMON!', 'MORE SCROLLS!'],
    ['BLAH BLAH BLAH!', 'DUCK, OR JUMP. EITHER WAY: BLAH'],
    ['AMEN! AMEN! AMEN!', 'MY SOAPBOX! NOOO!']
  ];
  class Pontiff extends Enemy {
    constructor(x, y, mul) {
      super(x, y, { mul, w: 26, h: 66, hp: 3 });
      this.C = LW.CFG.enemies.pontiff;
      this.isBoss = true;
      this.name = 'THE PONTIFF';
      this.phase = 0;                  // 0..2
      this.count = 0;
      this.quips = 0;
      this.setState('intro');
    }
    get damage() { return 3 - this.hp; }
    get vulnerable() { return this.alive && this.state === 'tired'; }
    canStomp() { return this.vulnerable && this.hurtT <= 0; }
    canShoot() { return this.vulnerable && this.hurtT <= 0; }
    stompZone() { return this.y + 26; }  // he is tall: landing anywhere on his upper half counts
    defeat(fromX) {
      if (!this.vulnerable || this.hurtT > 0) return false;
      this.hp -= 1;
      this.hurtT = 1.0;
      if (this.hp <= 0) { this.alive = false; this.vy = -220; this.vx = (this.cx < fromX ? -1 : 1) * 50; return true; }
      this.phase++;
      this.count = 0;
      this.setState('angry');
      return false;
    }
    update(dt, w) {
      this.animT += dt * 4; this.stateT += dt;
      this.hurtT = Math.max(0, this.hurtT - dt);
      if (!this.alive) {
        this.vy += G() * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.spin += dt * 6;
        if (this.y > w.level.ph + 120) this.dead = true;
        return;
      }
      this.think(dt, w);
      this.warn = this.state === 'windup';
    }
    think(dt, w) {
      const p = w.player, C = this.C;
      this.facePlayer(p);
      const s = this.state;
      if (s === 'intro') {
        if (this.sees(p, 12 * T, 200)) { w.say(this, 'WHO DARES ROMANCE IN MY PALACE?'); this.setState('rest'); }
      } else if (s === 'rest') {
        if (!this.quipped && this.count === 1 && this.stateT > 0.1) { this.quipped = true; w.say(this, line('pontiff', this.quips++)); }
        if (this.stateT > this.secs(C.restTime)) {
          this.quipped = this.count === 1 ? this.quipped : false;
          this.setState('windup');
          if (this.count === 0) w.say(this, SERMONS[this.phase][0]);
        }
      } else if (s === 'windup') {
        if (this.stateT > C.windupTime) {
          this.attack(w); this.count++;
          if (this.count >= C.attacksPerPhase[this.phase]) { this.setState('tired'); w.say(this, '*WHEEZE* ...AMEN...'); }
          else this.setState('rest');
        }
      } else if (s === 'tired') {
        if (this.stateT > this.secs(C.tiredTime)) { this.count = 0; this.setState('rest'); }
      } else if (s === 'angry') {
        if (!this.saidAngry) { w.say(this, SERMONS[Math.min(this.phase, 2)][1]); this.saidAngry = true; }
        if (this.stateT > 1.2) { this.saidAngry = false; this.setState('rest'); }
      }
    }
    attack(w) {
      const p = w.player, C = this.C, mouthY = this.y + 20, feet = this.feet;
      if (this.phase === 0) {
        // three scrolls, fanned around the player
        for (const off of [-40, 0, 40]) w.lobScroll(this.cx, mouthY, p.x + p.w / 2 + off, feet - 6, C.scrollFlight + Math.abs(off) / 200);
      } else if (this.phase === 1) {
        // BLAH bubbles: low ones must be jumped, high ones ducked under
        const high = this.count % 2 === 1;
        w.spawnShot('blah', this.cx + this.dir * 14, high ? feet - 22 : feet - 11, this.dir * C.blahSpeed * this.mul, 0);
      } else {
        // stomps the soapbox: AMEN shockwaves roll both ways along the floor, plus a scroll
        w.spawnShot('amen', this.cx - 20, feet - 11, -C.amenSpeed * this.mul, 0);
        w.spawnShot('amen', this.cx + 20, feet - 11, C.amenSpeed * this.mul, 0);
        w.lobScroll(this.cx, mouthY, p.x + p.w / 2, feet - 6, C.scrollFlight);
        w.emit('shake');
      }
    }
    draw(ctx, camX, camY, rim, t) {
      const cx = Math.round(this.cx - camX), fy = Math.round(this.feet - camY);
      if (!this.alive) {
        ctx.drawImage(LW.Props.soapbox(3), Math.round(this.home - camX) - 24, Math.round(this.groundY - camY) - 22);
        LW.Sprites.draw(ctx, 'pontiff_hurt', 0, cx, fy - 22, { rot: this.spin });
        return;
      }
      ctx.drawImage(LW.Props.soapbox(this.damage), cx - 24, fy - 22);
      let a = 'pontiff_idle';
      if (this.state === 'windup' || this.state === 'angry') a = 'pontiff_preach';
      if (this.state === 'tired' || this.hurtT > 0) a = 'pontiff_hurt';
      const flash = this.hurtT > 0 && Math.floor(this.hurtT * 16) % 2 === 0;
      LW.Sprites.draw(ctx, a, Math.floor(this.animT), cx, fy - 21, { flip: this.dir > 0, rim, flash });
      if (this.state === 'tired') {
        for (let i = 0; i < 3; i++) {
          const ang = t * 4 + i * 2.1;
          LW.Sprites.draw(ctx, 'star', 0, cx + Math.cos(ang) * 14, fy - 66 + Math.sin(ang) * 4);
        }
      }
      if (this.warn) LW.Props.drawWarning(ctx, cx, fy - 72, t);
    }
  }

  LW.Enemies = {
    create(type, x, y, diff) {
      const m = diff ? diff.enemySpeed : 1;
      switch (type) {
        case 'e': return new Walker(x, y, m);
        case 'x': return new Ex(x, y, m, false);
        case 'X': return new Ex(x, y, m, true);
        case 's': return new Suitor(x, y, m, false);
        case 'S': return new Suitor(x, y, m, true);
        case 'a': return new Agitator(x, y, m);
        case 'r': return new Preacher(x, y, m);
        case 'i': return new Inspector(x, y, m);
        case 'O': { const b = new Pontiff(x, y, m); b.groundY = y; return b; }
      }
      return null;
    },
    // Agitators standing within 3 tiles of each other on the same row march as one squad.
    formSquads(enemies, mul) {
      const ags = enemies.filter(e => e instanceof Agitator).sort((a, b) => a.feet - b.feet || a.x - b.x);
      let sq = null, prev = null;
      for (const a of ags) {
        if (!prev || Math.abs(prev.feet - a.feet) > 1 || a.x - prev.x > 3 * T) sq = new Squad(mul, Math.floor(a.x / T));
        sq.members.push(a); a.squad = sq; prev = a;
      }
    },
    Enemy, Walker, Ex, Suitor, Agitator, Preacher, Inspector, Pontiff
  };
})();

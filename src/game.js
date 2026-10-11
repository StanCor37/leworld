// LeWorld game shell: scenes (title, controls, play), menus, saving, the fixed-step loop,
// rendering and feedback. Story scenes, audio and touch controls plug in here.
(function () {
  const VH = LW.VIEW_H, P = LW.PAL, F = LW.Font, I = LW.Input;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = LW.VIEW_W; canvas.height = VH;
  ctx.imageSmoothingEnabled = false;
  I.attachPointer(canvas);
  LW.Touch.attach(canvas);

  // Integer scaling on big screens (perfectly even pixels); small screens use the largest
  // fractional fit so phones get the whole picture (still nearest-neighbour).
  // The height is always 180 game pixels; the width adapts to the screen's shape (16:9 up to
  // about 20:9) so wide phones fill the screen instead of showing side bars.
  function fit() {
    const aspect = innerWidth / Math.max(1, innerHeight);
    if (aspect >= 1) {
      const w = Math.round(Math.min(LW.MAX_VIEW_W, Math.max(LW.MIN_VIEW_W, VH * aspect)));
      if (w !== canvas.width) { LW.VIEW_W = w; canvas.width = w; ctx.imageSmoothingEnabled = false; }
    }
    const k = Math.min(innerWidth / LW.VIEW_W, innerHeight / VH);
    const s = k >= 3 && !LW.Touch.enabled ? Math.floor(k) : k;
    canvas.style.width = Math.floor(LW.VIEW_W * s) + 'px';
    canvas.style.height = Math.floor(VH * s) + 'px';
  }
  addEventListener('orientationchange', () => setTimeout(fit, 250));
  addEventListener('resize', fit); fit();

  LW.Sprites.build();
  const settings = LW.Save.settings;
  const A = LW.Audio;
  A.setMuted(!settings.sound);

  const state = {
    scene: 'title',           // 'title' | 'story' | 'controls' | 'play' | 'ending'
    story: null, ending: null,
    modal: null,              // null | { type: 'pause' | 'confirm' | 'controls', ... }
    adv: null,                // the adventure: { countries, completed: [], unlocked }
    session: LW.Session.create(settings.difficulty),
    devMode: false,           // ?level=... skips the menus and never touches the save
    levelKey: null, levelNum: 0,
    world: null, camera: new LW.Camera(), debug: false,
    effects: [], floaters: [], toasts: [], speech: [], pings: [], card: null, shake: 0, t: 0, overlayT: 0, pingN: 0, saidOnce: {},
    saveError: null
  };

  // ---------------------------------------------------------------- levels
  function load(levelKey, levelNum) {
    state.levelKey = levelKey;
    const def = LW.LEVELS[levelKey];
    state.levelNum = levelNum != null ? levelNum : (def.order != null ? def.order + 1 : 0);
    state.world = new LW.World(def, state.session);
    state.camera.snap(state.world.player, state.world.level);
    state.effects = []; state.floaters = []; state.toasts = []; state.speech = []; state.pings = []; state.card = null;
    state.overlayT = 0;
    acc = 0;
  }
  function restartLevel() { load(state.levelKey); saveNow(); }
  function nextKey() {
    const order = LW.LEVEL_ORDER || [];
    const i = order.indexOf(state.levelKey);
    return i >= 0 && i + 1 < order.length ? order[i + 1] : null;
  }
  function nextLevel() {
    const k = nextKey();
    if (k) { load(k); saveNow(); } else restartLevel();
  }

  // ---------------------------------------------------------------- saving
  // What the current attempt looks like, so Continue can rebuild it.
  function snapshot() {
    const w = state.world;
    let cp = -1;
    w.checkpoints.forEach((c, i) => { if (c.active) cp = i; });
    return {
      level: state.levelKey, checkpoint: cp, hearts: w.hearts,
      books: w.booksThisAttempt, firing: w.firing, toolProgress: w.toolProgress, charges: w.charges,
      taken: w.items.filter(i => i.taken).map(i => i.id)
    };
  }
  function saveNow(current) {
    if (state.devMode || !state.adv) return;
    const s = state.session;
    LW.Save.store({
      countries: state.adv.countries, difficulty: s.difficulty, score: s.score,
      collected: s.collected, cats: s.cats, completed: state.adv.completed, unlocked: state.adv.unlocked,
      current: current || snapshot()
    });
  }
  function applySnapshot(cur) {
    const w = state.world;
    w.hearts = Math.max(1, Math.min(LW.CFG.player.maxHearts, cur.hearts | 0 || 3));
    w.booksThisAttempt = cur.books | 0;
    w.firing = !!cur.firing;
    w.toolProgress = cur.toolProgress | 0;
    w.charges = cur.charges | 0;
    const taken = new Set(cur.taken || []);
    for (const it of w.items) if (taken.has(it.id)) it.taken = true;
    if (cur.checkpoint >= 0 && w.checkpoints[cur.checkpoint]) {
      w.checkpoints.forEach((c, i) => { c.active = i <= cur.checkpoint; });
      const c = w.checkpoints[cur.checkpoint];
      w.respawn = { x: c.cx, y: c.feetY };
      w.player.reset(c.cx, c.feetY);
      state.camera.snap(w.player, w.level);
    }
  }

  function newAdventure() {
    state.session = LW.Session.create(settings.difficulty);
    state.adv = { countries: LW.pickCountries(), completed: [], unlocked: 0 };
    state.saidOnce = {};
    LW.Save.clear();
    state.controlsThen = () => { load(LW.LEVEL_ORDER[0]); saveNow(); state.scene = 'play'; };
    state.scene = 'story';
    state.story = LW.Story.intro(state.adv, () => { state.story = null; state.scene = 'controls'; });
    saveNow({ level: LW.LEVEL_ORDER[0], checkpoint: -1, hearts: 3, books: 0, firing: false, toolProgress: 0, charges: 0, taken: [] });
    I.flush();
  }

  // After a level: Chloe chat + travel map, then the next level. After the last: the date.
  function afterLevel() {
    const nk = nextKey();
    if (!nk) { startEnding(); return; }
    const done = LW.LEVELS[state.levelKey].order || 0, next = LW.LEVELS[nk];
    state.scene = 'story';
    state.story = LW.Story.interlude(state.adv, done, next.theme, next.name.toUpperCase(), () => {
      state.story = null; load(nk); state.scene = 'play'; saveNow();
    });
    I.flush();
  }

  // Totals across the whole adventure for the final card and the reading list.
  function adventureStats() {
    const s = state.session, reading = [];
    let books = 0, booksTotal = 0, tools = 0, toolsTotal = 0, catsTotal = 0;
    for (const key of LW.LEVEL_ORDER) {
      const w = new LW.World(LW.LEVELS[key], LW.Session.create(s.difficulty));
      const got = s.collected[w.level.id] || {};
      for (const it of w.items.slice().sort((a, b) => a.x - b.x)) {
        if (it.kind === 'book') { booksTotal++; if (got[it.id]) { books++; reading.push(it.book); } }
        else { toolsTotal++; if (got[it.id]) tools++; }
      }
      catsTotal += w.cats.length;
    }
    return {
      score: s.score, books, booksTotal, tools, toolsTotal, cats: Object.keys(s.cats).length, catsTotal,
      km: LW.Story.km(state.adv.countries.hunter, state.adv.countries.chloe), reading, firstBook: reading[0], difficulty: s.difficulty
    };
  }
  function startEnding() {
    state.scene = 'ending';
    state.ending = new LW.Ending(adventureStats(), {
      replay: () => { state.ending = null; newAdventure(); },
      menu: () => { state.ending = null; state.scene = 'title'; titleMenu.sel = 0; I.flush(); }
    });
    I.flush();
  }
  function continueAdventure() {
    const d = LW.Save.load();
    if (!d) { state.saveError = LW.Save.error(); return; }
    state.session = { difficulty: d.difficulty, score: d.score, collected: d.collected || {}, cats: d.cats || {} };
    state.adv = { countries: d.countries, completed: d.completed, unlocked: d.unlocked | 0 };
    state.saidOnce = {};
    load(d.current.level);
    applySnapshot(d.current);
    state.scene = 'play';
    I.flush();
  }
  function toTitle() {
    saveNow();
    state.modal = null;
    state.scene = 'title';
    titleMenu.sel = 0;
    I.flush();
  }

  // ---------------------------------------------------------------- menus
  const DIFFS = ['casual', 'challenge'];
  const diffLabel = d => LW.CFG.difficulty[d].label;
  function toggleSound() { settings.sound = !settings.sound; LW.Save.saveSettings(); if (LW.Audio) LW.Audio.setMuted(!settings.sound); }

  function confirm(title, text, onYes) {
    const back = state.modal;
    const c = { type: 'confirm', title, text };
    c.menu = new LW.Menus.Menu([
      { label: 'YES', action: () => { state.modal = null; onYes(); I.flush(); } },
      { label: 'NO', action: () => { state.modal = back; I.flush(); } }
    ]);
    c.menu.sel = 1;                               // default to the safe answer
    c.back = back;
    state.modal = c;
    I.flush();
  }

  const titleMenu = new LW.Menus.Menu([
    {
      label: 'CONTINUE', hidden: () => !LW.Save.has(), action: continueAdventure,
      note: () => {
        const d = LW.Save.load();
        if (!d) return '';
        const lvl = LW.LEVELS[d.current.level];
        return 'LEVEL ' + (lvl.order + 1) + ' - ' + d.score + ' PTS - ' + d.countries.hunter.name + ' TO ' + d.countries.chloe.name;
      }
    },
    {
      label: 'NEW ADVENTURE',
      action: () => LW.Save.has()
        ? confirm('START OVER?', 'A NEW ADVENTURE REPLACES YOUR SAVED ONE.', newAdventure)
        : newAdventure(),
      note: 'NEW COUNTRIES, NEW DATE, SAME SENSIBLE BOOTS'
    },
    {
      label: 'DIFFICULTY', value: () => diffLabel(settings.difficulty),
      change: () => { settings.difficulty = settings.difficulty === 'casual' ? 'challenge' : 'casual'; LW.Save.saveSettings(); },
      note: () => '"' + LW.CFG.difficulty[settings.difficulty].tagline + '"'
    },
    { label: 'SOUND', value: () => (settings.sound ? 'ON' : 'OFF'), change: toggleSound }
  ]);

  function openPause() {
    if (!state.devMode) saveNow();
    state.modal = { type: 'pause' };
    pauseMenu.sel = 0;
    I.flush();
  }
  const pauseMenu = new LW.Menus.Menu([
    { label: 'RESUME', action: () => { state.modal = null; I.flush(); } },
    {
      label: 'RESTART LEVEL',
      action: () => confirm('RESTART LEVEL?', 'BACK TO THE START OF THIS LEVEL WITH THREE HEARTS.', () => restartLevel())
    },
    {
      label: 'DIFFICULTY', value: () => diffLabel(state.session.difficulty),
      change: () => {
        const nd = state.session.difficulty === 'casual' ? 'challenge' : 'casual';
        confirm('SWITCH TO ' + diffLabel(nd) + '?', 'CHANGING DIFFICULTY RESTARTS THIS LEVEL.', () => {
          state.session.difficulty = nd; settings.difficulty = nd; LW.Save.saveSettings(); restartLevel();
        });
      },
      note: () => '"' + LW.CFG.difficulty[state.session.difficulty].tagline + '"'
    },
    { label: 'CONTROLS', action: () => { state.modal = { type: 'controls', back: state.modal }; I.flush(); } },
    { label: 'SOUND', value: () => (settings.sound ? 'ON' : 'OFF'), change: toggleSound },
    { label: 'MAIN MENU', action: toTitle, note: 'YOUR PROGRESS IS SAVED' }
  ]);

  // ---------------------------------------------------------------- play feedback
  function ping(text) { if (text) { state.pings.push({ text, t: 0 }); A.sfx('ping'); } }
  function pingOnce(key, text) { if (!state.saidOnce[key]) { state.saidOnce[key] = true; ping(text); } }
  function addEffect(sprite, x, y, dur, fps, rise) { state.effects.push({ sprite, x, y, t: 0, dur, fps, rise: rise || 0 }); }
  function floater(text, x, y, color) { state.floaters.push({ text, x, y, t: 0, color }); }
  function toast(text, color) { state.toasts.push({ text, color: color || P.g, t: 0 }); }

  function handleEvent(ev) {
    switch (ev.type) {
      case 'jump': A.sfx('jump'); break;
      case 'fire': A.sfx('fire'); break;
      case 'land': addEffect('dust', ev.x, ev.y, 0.25, 12); A.sfx('land'); break;
      case 'stomp': addEffect('star', ev.x, ev.y, 0.4, 1, 30); floater('BYE!', ev.x, ev.y - 6, P.w); A.sfx(ev.boss ? 'bossHit' : 'stomp'); break;
      case 'shotHit': addEffect('star', ev.x, ev.y + 4, 0.4, 1, 30); A.sfx('shotHit'); break;
      case 'enemyShot': A.sfx({ hey: 'kiss', blah: 'blah', amen: 'amen', scroll: 'scroll' }[ev.kind]); break;
      case 'defeated': A.sfx('defeat'); break;
      case 'collect':
        A.sfx(ev.points ? (ev.kind === 'book' ? 'book' : 'tool') : 'reread');
        addEffect('sparkle', ev.x, ev.y + 10, 0.3, 10);
        floater(ev.points ? '+' + ev.points : (ev.kind === 'book' ? 'REREAD' : 'GOT IT'), ev.x, ev.y, ev.points ? P.g : P.i);
        if (ev.kind === 'book' && ev.book) state.card = { kind: 'book', look: ev.look, line1: ev.book[0], line2: ev.book[1], t: 0 };
        else if (ev.kind === 'tool') {
          const q = (LW.TOOL_QUIPS && LW.TOOL_QUIPS[ev.look]) || ['HANDY'];
          state.card = { kind: 'tool', look: ev.look, line1: ev.look.replace('tool_', ''), line2: q[(state.pingN++) % q.length], t: 0 };
        }
        break;
      case 'unlockFire': A.sfx('unlockFire'); toast('RADICAL READER MODE! SHIFT TO FIRE', P.x); pingOnce('fire', LW.CHLOE_PINGS.unlockFire); break;
      case 'repair': A.sfx('repair'); toast(ev.held ? 'REPAIR CHARGE USED +1 HEART' : 'REPAIRED! +1 HEART', P.a); pingOnce('repair', LW.CHLOE_PINGS.repair); break;
      case 'chargeStored': A.sfx('charge'); toast('REPAIR CHARGE STORED', P.a); break;
      case 'checkpoint': {
        toast('PROGRESS SAVED', P.f);
        A.sfx('checkpoint');
        const custom = state.world.level.def.pings;
        const list = LW.CHLOE_PINGS.checkpoint;
        ping(custom && custom[ev.index] ? custom[ev.index] : list[(state.levelNum * 2 + ev.index) % list.length]);
        state.pendingSave = true;
        break;
      }
      case 'pet': {
        for (let i = 0; i < 3; i++) addEffect('heart_small', ev.x - 6 + i * 6, ev.y - 2, 0.9, 1, 22 + i * 6);
        floater(LW.CAT_LINES[(state.pingN++) % LW.CAT_LINES.length], ev.x, ev.y - 4, P.p);
        A.sfx('purr');
        if (ev.first) pingOnce('cat', LW.CHLOE_PINGS.cat);
        break;
      }
      case 'hurt': state.shake = 0.2; A.sfx('hurt'); if (ev.hearts === 1) pingOnce('low' + state.levelKey, LW.CHLOE_PINGS.lowHealth); break;
      case 'shake': state.shake = 0.25; break;
      case 'rumble': addEffect('dust', ev.x, ev.y + 2, 0.4, 8); A.sfx('rumble'); break;
      case 'thud': A.sfx('thud'); state.shake = Math.max(state.shake, 0.12); addEffect('dust', ev.x - 6, ev.y, 0.3, 10); addEffect('dust', ev.x + 6, ev.y, 0.3, 10); break;
      case 'say':
        state.speech = state.speech.filter(s => s.ent !== ev.ent);
        state.speech.push({ ent: ev.ent, text: ev.text, t: 0 });
        A.sfx('say');
        break;
      case 'pop': A.sfx('pop'); addEffect('sparkle', ev.x, ev.y + 4, 0.3, 10); floater('POP!', ev.x, ev.y - 4, P.x); break;
      case 'deflect': A.sfx('deflect'); addEffect('dust', ev.x, ev.y + 4, 0.25, 12); floater('NOPE', ev.x, ev.y - 4, P.i); break;
      case 'bossDefeated': A.sfx('bossDown'); state.shake = 0.6; toast('THE SOAPBOX IS BROKEN!', P.g); break;
      case 'fell': A.sfx('fell'); toast('OOPS! BACK YOU GO', P.p); break;
      case 'complete': A.sfx('complete'); onComplete(); break;
    }
  }

  // Level finished: record it and save the start of the next level.
  function onComplete() {
    if (!state.adv) return;
    if (!state.adv.completed.includes(state.levelKey)) state.adv.completed.push(state.levelKey);
    const nk = nextKey();
    const idx = LW.LEVEL_ORDER.indexOf(nk || state.levelKey);
    state.adv.unlocked = Math.max(state.adv.unlocked, idx);
    saveNow({ level: nk || state.levelKey, checkpoint: -1, hearts: 3, books: 0, firing: false, toolProgress: 0, charges: 0, taken: [] });
  }

  function step(dt) {
    const w = state.world;
    w.step(dt, I.controls());
    for (const ev of w.events) handleEvent(ev);
    w.events.length = 0;
    if (state.pendingSave) { state.pendingSave = false; saveNow(); }
    state.camera.update(dt, w.player, w.level);
    for (const e of state.effects) e.t += dt;
    state.effects = state.effects.filter(e => e.t < e.dur);
    for (const f of state.floaters) f.t += dt;
    for (const s of state.speech) s.t += dt;
    state.speech = state.speech.filter(s => s.t < 1.9 && s.ent.alive);
    state.floaters = state.floaters.filter(f => f.t < 0.9);
    if (state.toasts.length) { state.toasts[0].t += dt; if (state.toasts[0].t > 2) state.toasts.shift(); }
    if (state.pings.length) { state.pings[0].t += dt; if (state.pings[0].t > 3.2) state.pings.shift(); }
    if (state.card) { state.card.t += dt; if (state.card.t > 2.4) state.card = null; }
    state.shake = Math.max(0, state.shake - dt);
  }

  // ---------------------------------------------------------------- rendering
  function render() {
    const t = state.t;
    if (state.scene === 'title') {
      LW.Save.has();
      LW.Menus.drawTitle(ctx, t, titleMenu, { error: LW.Save.error() });
    } else if (state.scene === 'controls') {
      LW.Menus.drawControls(ctx, t, false);
    } else if (state.scene === 'story') {
      if (state.story) state.story.draw(ctx, t);
    } else if (state.scene === 'ending') {
      if (state.ending) state.ending.draw(ctx);
    } else {
      renderPlay();
      const m = state.modal;
      if (m) {
        if (m.type === 'pause' || (m.type === 'confirm' && m.back && m.back.type === 'pause')) LW.Menus.drawPause(ctx, t, pauseMenu);
        if (m.type === 'controls') LW.Menus.drawControls(ctx, t, true);
      }
    }
    if (state.modal && state.modal.type === 'confirm') LW.Menus.drawConfirm(ctx, t, state.modal);
  }

  function renderPlay() {
    const w = state.world, cam = state.camera, L = w.level;
    let cx = Math.round(cam.x), cy = Math.round(cam.y);
    if (state.shake > 0 && !state.modal) { cx += Math.round((Math.random() - 0.5) * 4); cy += Math.round((Math.random() - 0.5) * 3); }
    const t = state.t;
    LW.Backgrounds.draw(ctx, L.theme, cx, t);
    L.draw(ctx, cx, cy);

    for (const cp of w.checkpoints)
      LW.Sprites.draw(ctx, cp.active ? 'checkpoint_on' : 'checkpoint_off', Math.floor(t * 4), cp.cx - cx, cp.feetY - cy);
    if (w.goal) {
      if (L.def.goalChloe) {
        // the meeting place: Chloe waits (and waves when Hunter gets close)
        const near = Math.abs(w.player.x - w.goal.cx) < 90;
        LW.Sprites.draw(ctx, near ? 'chloe_wave' : 'chloe_phone', Math.floor(t * 3), w.goal.cx - cx + 4, w.goal.feetY - cy, { flip: true, rim: LW.Backgrounds.rim(L.theme) });
        if (near) LW.Sprites.draw(ctx, 'heart_small', 0, w.goal.cx - cx + 2, w.goal.feetY - cy - 30 + Math.round(Math.sin(t * 5) * 2));
      } else LW.Sprites.draw(ctx, 'goal_gate', 0, w.goal.cx - cx, w.goal.feetY - cy);
    }
    for (const cat of w.cats)
      LW.Sprites.draw(ctx, cat.petted ? 'cat_happy' : 'cat', Math.floor(t * (cat.petted ? 3 : 1.5)), Math.round(cat.x + cat.w / 2 - cx), Math.round(cat.y + cat.h - cy));

    const bob = Math.round(Math.sin(t * 4) * 1.5);
    for (const it of w.items) {
      if (it.taken) continue;
      // Already scored in an earlier attempt: still collectable for power-ups, shown faded.
      if (it.scored) ctx.globalAlpha = 0.45;
      LW.Sprites.draw(ctx, it.look, 0, Math.round(it.x + it.w / 2 - cx), Math.round(it.y + it.h + 1 - cy + bob));
      ctx.globalAlpha = 1;
    }

    const rim = LW.Backgrounds.rim(L.theme);
    for (const h of w.hazards) h.draw(ctx, cx, cy, L.theme, t);
    for (const e of w.enemies) e.draw(ctx, cx, cy, rim, t);
    for (const s of w.enemyShots) drawEnemyShot(s, cx, cy, t);
    for (const s of w.shots)
      LW.Props.drawLonelinessShot(ctx, Math.round(s.x0 - cx), Math.round(s.y - cy), s.dir, s.travelled, t, { spent: s.live ? null : s.fade });
    w.player.draw(ctx, cx, cy, rim);
    for (const e of state.effects)
      LW.Sprites.draw(ctx, e.sprite, Math.floor(e.t * e.fps), Math.round(e.x - cx), Math.round(e.y - cy - e.t * e.rise));
    for (const f of state.floaters) {
      ctx.globalAlpha = Math.min(1, (0.9 - f.t) * 3);
      F.draw(ctx, f.text, Math.round(f.x - cx), Math.round(f.y - cy - f.t * 24), { color: f.color, outline: P.k, align: 'center' });
      ctx.globalAlpha = 1;
    }

    for (const sp of state.speech) drawSpeech(sp, cx, cy);
    if (w.boss && w.boss.state !== 'intro' && w.bossDownT === null) drawBossBar(w.boss);

    LW.UI.drawHUD(ctx, {
      level: state.levelNum, levelName: L.def.name, hearts: w.hearts, score: state.session.score,
      books: Math.min(w.booksThisAttempt, LW.CFG.rules.booksToUnlock), booksNeeded: LW.CFG.rules.booksToUnlock,
      firing: w.firing, cooldown: w.cooldown / w.diff.fireCooldown,
      tools: w.toolProgress, toolsPerCharge: LW.CFG.rules.toolsPerRepair, charge: w.charges > 0, muted: !settings.sound
    });

    if (w.state === 'playing') LW.Touch.draw(ctx, w.firing);
    const pr = state.pings.length ? drawPing(state.pings[0]) : null;
    if (state.toasts.length) {
      const tt = state.toasts[0];
      const slide = Math.min(1, tt.t * 6, (2 - tt.t) * 6);
      const tw = F.width(tt.text) + 14;
      let tx = LW.VIEW_W / 2, y = LW.HUD_H + 4;
      if (pr && pr.x + pr.w > 0) {
        // step around Chloe's message: to its right if there's room, otherwise below it
        const right = pr.x + pr.w + 4 + tw / 2;
        if (right + tw / 2 <= LW.VIEW_W - 3) tx = Math.max(tx, right); else y = pr.y + pr.h + 3;
      }
      y += Math.round((1 - slide) * -14);
      LW.roundBox(ctx, Math.round(tx - tw / 2), y, tw, 13, P.k, tt.color);
      F.draw(ctx, tt.text, tx, y + 3, { color: tt.color, align: 'center' });
    }

    if (state.card) drawCard(state.card);
    if (state.debug) drawDebug(cx, cy);
    if (w.state === 'defeated') drawDefeat();
    else if (w.state === 'complete') drawComplete();
  }

  // Pickup card: book title + author, or a tool's one-liner. Bottom-centre, fades out.
  function drawCard(cd) {
    const a = Math.min(1, cd.t * 8, (2.4 - cd.t) * 3);
    const l1 = cd.line1.toUpperCase(), l2 = cd.kind === 'book' ? cd.line2.toUpperCase() : '"' + cd.line2 + '"';
    const tw = Math.min(LW.VIEW_W - 8, Math.max(F.width(l1), F.width(l2)) + 32);
    const base = LW.Touch.enabled ? 60 : VH - 28;      // above the touch buttons and Hunter
    const x = Math.round(LW.VIEW_W / 2 - tw / 2), y = base + Math.round((1 - Math.min(1, cd.t * 6)) * 10);
    ctx.globalAlpha = Math.max(0, a);
    LW.roundBox(ctx, x, y, tw, 25, '#2b2633', cd.kind === 'book' ? P.v : P.a);
    LW.Sprites.draw(ctx, cd.look, 0, x + 13, y + 20);
    F.draw(ctx, l1, x + 26, y + 4, { color: cd.kind === 'book' ? P.w : P.a });
    F.draw(ctx, l2, x + 26, y + 14, { color: cd.kind === 'book' ? P.v : P.w });
    ctx.globalAlpha = 1;
  }

  // Chloe's phone notification: compact, top-left under the HUD, away from the action.
  function drawPing(pg) {
    const slide = Math.min(1, pg.t * 6, (3.2 - pg.t) * 6);
    const lines = F.wrap(pg.text, 118);
    const bw = 148, bh = Math.max(24, 13 + lines.length * 9);
    const x = Math.round(-bw + slide * (bw + 3)), y = LW.HUD_H + 3;
    LW.roundBox(ctx, x, y, bw, bh, '#fff0f6', P.k);
    const img = LW.Sprites.get('portrait_chloe');
    LW.roundBox(ctx, x + 3, y + 3, 20, 20, '#d9c4ff', P.k);
    ctx.drawImage(img, 3, 1, 20, 20, x + 3, y + 3, 20, 20);
    F.draw(ctx, 'CHLOE', x + 27, y + 3, { color: '#c9306a' });
    LW.Sprites.draw(ctx, 'heart_small', 0, x + 27 + F.width('CHLOE') + 3, y + 3, { topLeft: true });
    lines.forEach((l, i) => F.draw(ctx, l, x + 27, y + 13 + i * 9, { color: P.k }));
    return { x, y, w: bw, h: bh };
  }

  function drawEnemyShot(s, cx, cy, t) {
    const x = Math.round(s.x - cx), y = Math.round(s.y - cy);
    if (s.kind === 'scroll') { LW.Sprites.draw(ctx, 'scroll', Math.floor(t * 10), x, y + 4); return; }
    // bubble tail points back toward whoever said it
    const tail = s.vx > 0 ? 'left' : 'right';
    const img = s.kind === 'hey' ? LW.Props.bubble(['HEY', 'BEAUTIFUL'], { fill: '#ffd0e4', ink: P.P, tail })
      : s.kind === 'blah' ? LW.Props.bubble(['BLAH'], { fill: P.g, ink: P.k, tail })
      : LW.Props.bubble(['AMEN!'], { fill: '#fff2c8', ink: P.L, tail });
    const wob = s.kind === 'amen' ? 0 : Math.round(Math.sin(s.age * 6) * 1);
    ctx.drawImage(img, x - Math.floor(img.width / 2), y - Math.floor(img.height / 2) + wob);
  }

  function drawSpeech(sp, cx, cy) {
    const e = sp.ent;
    const lines = F.wrap(sp.text, 132);
    const tw = Math.max.apply(null, lines.map(l => F.width(l)));
    const bw = tw + 10, bh = lines.length * 9 + 4;
    let x = Math.round(e.x + e.w / 2 - cx - bw / 2);
    const top = e.isBoss ? e.y - 4 : e.y - (e.above || 8);
    let y = Math.round(top - cy - bh - 4 - Math.min(3, sp.t * 12));
    x = Math.max(2, Math.min(LW.VIEW_W - bw - 2, x)); y = Math.max(LW.HUD_H + 3, y);
    ctx.globalAlpha = Math.min(1, (1.9 - sp.t) * 4);
    LW.roundBox(ctx, x, y, bw, bh, P.w, P.k);
    const tx = Math.max(x + 3, Math.min(x + bw - 5, Math.round(e.x + e.w / 2 - cx)));
    ctx.fillStyle = P.w; ctx.fillRect(tx, y + bh - 1, 2, 2); ctx.fillStyle = P.k; ctx.fillRect(tx - 1, y + bh, 1, 2); ctx.fillRect(tx + 2, y + bh, 1, 2); ctx.fillRect(tx, y + bh + 2, 2, 1);
    lines.forEach((l, i) => F.draw(ctx, l, x + 5, y + 3 + i * 9, { color: P.k }));
    ctx.globalAlpha = 1;
  }

  function drawBossBar(b) {
    const w = 150, x = Math.round(LW.VIEW_W / 2 - w / 2), y = VH - 17;
    LW.roundBox(ctx, x, y, w, 14, '#2b2633', P.w);
    F.draw(ctx, b.name, x + 6, y + 4, { color: P.g });
    for (let i = 0; i < 3; i++) {
      const sx = x + 82 + i * 21;
      ctx.fillStyle = P.k; ctx.fillRect(sx, y + 3, 19, 8);
      ctx.fillStyle = i < b.hp ? P.b : P.E; ctx.fillRect(sx + 1, y + 4, 17, 6);
      if (i < b.hp) { ctx.fillStyle = '#a86a3a'; ctx.fillRect(sx + 1, y + 4, 17, 1); }
    }
  }

  function dim(a) { ctx.globalAlpha = a; ctx.fillStyle = P.k; ctx.fillRect(0, 0, LW.VIEW_W, VH); ctx.globalAlpha = 1; }
  function blinkPrompt(text, y) { if (Math.floor(state.t * 2.5) % 2 === 0) F.draw(ctx, text, LW.VIEW_W / 2, y, { color: P.w, align: 'center', outline: P.k }); }

  function drawDefeat() {
    dim(Math.min(0.7, state.overlayT * 2));
    const ox = Math.round((LW.VIEW_W - 320) / 2);
    LW.roundBox(ctx, ox + 46, 34, 228, 112, '#2b2633', P.w);
    F.draw(ctx, 'OUCH.', LW.VIEW_W / 2, 44, { color: P.r, scale: 3, align: 'center', outline: P.k });
    F.draw(ctx, 'THREE HITS. HUNTER DUSTS OFF', LW.VIEW_W / 2, 74, { color: P.w, align: 'center' });
    F.draw(ctx, 'HER SENSIBLE BOOTS.', LW.VIEW_W / 2, 84, { color: P.w, align: 'center' });
    F.draw(ctx, 'SCORE ' + state.session.score, LW.VIEW_W / 2, 100, { color: P.g, align: 'center' });
    blinkPrompt('JUMP OR TAP TO RESTART THE LEVEL', 124);
    LW.Sprites.draw(ctx, 'hunter_hurt', 0, ox + 70, 66);
  }

  function drawComplete() {
    const w = state.world;
    dim(Math.min(0.6, state.overlayT * 2));
    const ox = Math.round((LW.VIEW_W - 320) / 2);
    LW.roundBox(ctx, ox + 40, 28, 240, 124, '#2b2633', P.w);
    F.draw(ctx, 'LEVEL COMPLETE!', LW.VIEW_W / 2, 36, { color: P.g, scale: 2, align: 'center', outline: P.k });
    const tot = w.itemTotals(), lid = w.level.id;
    F.draw(ctx, 'BOOKS  ' + LW.Session.count(state.session, lid, 'book') + ' / ' + tot.book, LW.VIEW_W / 2, 62, { color: P.v, align: 'center' });
    F.draw(ctx, 'TOOLS  ' + LW.Session.count(state.session, lid, 'tool') + ' / ' + tot.tool, LW.VIEW_W / 2, 74, { color: P.a, align: 'center' });
    F.draw(ctx, 'SCORE  ' + state.session.score, LW.VIEW_W / 2, 88, { color: P.w, align: 'center' });
    F.draw(ctx, 'PROGRESS SAVED', LW.VIEW_W / 2, 102, { color: P.f, align: 'center' });
    blinkPrompt(nextKey() ? 'JUMP OR TAP FOR THE NEXT LEVEL' : 'JUMP OR TAP TO PLAY AGAIN', 134);
    LW.Sprites.draw(ctx, 'hunter_win', Math.floor(state.t * 3), ox + 66, 128);
    LW.Sprites.draw(ctx, 'chloe_wave', Math.floor(state.t * 3), ox + 254, 128, { flip: true });
  }

  function drawDebug(cx, cy) {
    const w = state.world, p = w.player;
    ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(p.x - cx) + 0.5, Math.round(p.y - cy) + 0.5, p.w - 1, p.h - 1);
    ctx.strokeStyle = '#ff4060';
    for (const e of w.enemies) ctx.strokeRect(Math.round(e.x - cx) + 0.5, Math.round(e.y - cy) + 0.5, e.w - 1, e.h - 1);
    ctx.strokeStyle = '#ffd23f';
    for (const s of w.shots) if (s.live) { const b = w.shotBox(s); ctx.strokeRect(Math.round(b.x - cx) + 0.5, Math.round(b.y - cy) + 0.5, b.w - 1, b.h - 1); }
    const lines = [
      'X ' + p.x.toFixed(1) + '  Y ' + p.y.toFixed(1),
      'VX ' + p.vx.toFixed(0) + '  VY ' + p.vy.toFixed(0),
      'GROUND ' + (p.onGround ? 'Y' : 'N') + '  CROUCH ' + (p.crouching ? 'Y' : 'N'),
      'COYOTE ' + (p.coyote * 1000).toFixed(0) + 'MS  BUFFER ' + (p.buffer * 1000).toFixed(0) + 'MS',
      'MODE ' + state.session.difficulty.toUpperCase() + '  ANIM ' + p.anim.replace('hunter_', '')
    ];
    ctx.globalAlpha = 0.7; ctx.fillStyle = P.k; ctx.fillRect(2, 23, 120, lines.length * 7 + 4); ctx.globalAlpha = 1;
    lines.forEach((l, i) => F.draw(ctx, l, 4, 25 + i * 7, { color: '#00ff88', font: 'small' }));
  }

  // ---------------------------------------------------------------- input per scene
  const inRect = (p, x, y, w, h) => p && p.x >= x && p.x < x + w && p.y >= y && p.y < y + h;

  function updateMenus() {
    const m = state.modal;
    if (state.scene === 'title' && !m) { titleMenu.handle(); return true; }
    if (state.scene === 'story') { if (state.story) state.story.update(lastDt); return true; }
    if (state.scene === 'ending') { if (state.ending) state.ending.update(lastDt); return true; }
    if (state.scene === 'controls') {
      const a = I.consume('mOk'), b = I.consume('jump'), c = I.takeTap();
      if (a || b || c) { const go = state.controlsThen; state.controlsThen = null; I.flush(); if (go) go(); }
      return true;
    }
    if (!m) return false;
    if (m.type === 'confirm') { if (I.consume('mBack')) { state.modal = m.back; I.flush(); } else m.menu.handle(); }
    else if (m.type === 'controls') { if (I.consume('mOk') || I.consume('jump') || I.consume('mBack') || I.takeTap()) { state.modal = m.back; I.flush(); } }
    else if (m.type === 'pause') {
      if (I.consume('pause') || I.consume('mBack')) { state.modal = null; I.flush(); }
      else pauseMenu.handle();
    }
    return true;
  }

  // Which song fits right now.
  function currentSong() {
    if (state.scene === 'story') return 'chat';
    if (state.scene !== 'play') return 'love';
    const w = state.world;
    if (!w || w.state !== 'playing') return null;          // fanfares and stings play alone
    if (w.boss && w.boss.alive && w.boss.state !== 'intro') return 'boss';
    return w.level.theme;
  }

  // ---------------------------------------------------------------- loop
  let last = performance.now(), acc = 0, lastDt = 1 / 60;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now; lastDt = dt;
    state.t += dt;
    if (I.consume('mute')) toggleSound();
    if (LW.Touch.isPortrait()) {
      // phones held upright: pause everything and ask for landscape
      LW.Touch.setActive(false);
      acc = 0;
      LW.Touch.drawRotate(ctx, state.t);
      if (auto) requestAnimationFrame(frame);
      return;
    }
    LW.Touch.setActive(state.scene === 'play' && !state.modal && !!state.world && state.world.state === 'playing');
    A.music(currentSong());
    A.duck(!!state.modal && state.scene === 'play');
    const busy = updateMenus();
    if (!busy && state.scene === 'play') {
      const w = state.world;
      if (I.consume('debug')) state.debug = !state.debug;
      const tap = I.takeTap();
      if (w.state !== 'playing') {
        state.overlayT += dt;
        const go = I.consume('jump') || I.consume('mOk') || !!tap;
        if (state.overlayT > 0.6 && go) { I.flush(); if (w.state === 'complete') afterLevel(); else restartLevel(); }
        for (const e of state.effects) e.t += dt;
      } else if (I.consume('pause') || inRect(tap, LW.VIEW_W - 36, 0, 18, 20)) {
        openPause();
      } else {
        if (inRect(tap, LW.VIEW_W - 18, 0, 18, 20)) toggleSound();
        acc += dt;
        while (acc >= LW.CFG.STEP && state.world.state === 'playing') { step(LW.CFG.STEP); acc -= LW.CFG.STEP; }
      }
    }
    render();
    if (auto) requestAnimationFrame(frame);
  }
  let auto = true;                 // tests switch to manual ticking

  // Dev shortcuts: ?level=<key>[&mode=challenge] jumps straight into a level without
  // touching the saved adventure.
  const qs = new URLSearchParams(location.search);
  if (LW.LEVELS[qs.get('level')]) {
    state.devMode = true;
    state.session = LW.Session.create(qs.get('mode') === 'challenge' ? 'challenge' : 'casual');
    state.adv = { countries: LW.pickCountries(), completed: [], unlocked: 0 };
    load(qs.get('level'));
    state.scene = 'play';
  } else {
    state.saveError = LW.Save.error();
    LW.Save.load();
    state.saveError = LW.Save.error();
  }
  // exposed for automated checks (deterministic snapshots, save round-trips)
  LW.Game = { state, load, restartLevel, nextLevel, step, render, saveNow, snapshot, continueAdventure, newAdventure, openPause, toTitle, afterLevel, startEnding, adventureStats,
    tick: ms => { auto = false; frame(last + (ms || 16.7)); } };
  requestAnimationFrame(frame);
})();

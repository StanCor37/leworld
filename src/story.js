// Story scenes: the LeMatch intro, the between-level chat + travel map, and the cafe ending.
// Everything is skippable (Esc or the SKIP button); Jump / Enter / tap advances.
(function () {
  const VH = LW.VIEW_H, P = LW.PAL, F = LW.Font, I = () => LW.Input;
  const LM = { bg: '#fff0f6', head: '#ff4f8a', head2: '#c9306a', them: '#ffffff', me: '#ff4f8a', sys: '#e8c6d6' };

  // ---------------------------------------------------------------- helpers
  function fill(text, vars) {
    return text.replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? vars[k] : m));
  }
  function km(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)));
  }
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const pressed = () => { const a = I().consume('mOk'), b = I().consume('jump'), c = I().takeTap(); return a || b || !!c; };

  // ---------------------------------------------------------------- world map
  // Coarse continent outlines [lon, lat], rasterised once and thresholded so the edges are
  // crisp pixels (no anti-aliasing).
  const LAND = [
    [[-168, 65], [-140, 70], [-95, 72], [-75, 62], [-60, 50], [-80, 25], [-97, 18], [-90, 15], [-80, 8], [-105, 22], [-118, 32], [-125, 48], [-140, 60]],
    [[-50, 60], [-20, 70], [-30, 83], [-60, 80]],
    [[-80, 10], [-60, 10], [-35, -6], [-40, -22], [-58, -38], [-68, -55], [-75, -45], [-72, -20], [-81, -5]],
    [[-10, 36], [-9, 44], [-5, 48], [5, 52], [10, 55], [20, 60], [30, 70], [40, 66], [40, 45], [28, 40], [20, 38], [10, 44], [0, 40]],
    [[-6, 50], [1, 51], [-2, 58], [-6, 56]],
    [[-24, 64], [-14, 64], [-15, 66], [-22, 66]],
    [[-17, 15], [-10, 30], [10, 37], [32, 32], [43, 12], [51, 11], [40, -15], [35, -25], [20, -35], [12, -18], [9, 4], [-8, 5]],
    [[40, 45], [40, 66], [70, 73], [110, 77], [140, 72], [170, 66], [160, 58], [140, 50], [130, 40], [122, 30], [110, 20], [105, 10], [98, 15], [90, 22], [78, 8], [72, 20], [60, 25], [50, 30], [48, 38]],
    [[130, 31], [141, 37], [142, 45], [138, 38]],
    [[118, 18], [126, 7], [122, 6], [117, 10]],
    [[95, 5], [120, -5], [140, -8], [118, -9], [105, -7]],
    [[114, -22], [130, -12], [142, -11], [153, -27], [146, -38], [135, -35], [115, -34]],
    [[172, -34], [178, -38], [172, -46], [167, -45]]
  ];
  const MW = 180, MH = 70, LAT0 = 80, LAT1 = -60;
  const proj = (lon, lat) => [(lon + 180) / 360 * MW, (LAT0 - lat) / (LAT0 - LAT1) * MH];
  let mapCanvas = null;
  function mapBase() {
    if (mapCanvas) return mapCanvas;
    const c = LW.makeCanvas(MW, MH), x = c.getContext('2d');
    x.fillStyle = '#000';
    for (const poly of LAND) {
      x.beginPath();
      poly.forEach(([lon, lat], i) => { const [px, py] = proj(lon, lat); i ? x.lineTo(px, py) : x.moveTo(px, py); });
      x.closePath(); x.fill();
    }
    const img = x.getImageData(0, 0, MW, MH), out = x.createImageData(MW, MH);
    const land = LW.hexToRgb('#7fd08a'), shade = LW.hexToRgb('#4aa060'), sea = LW.hexToRgb('#3a6fc0'), sea2 = LW.hexToRgb('#3466b4');
    const solid = (px, py) => px >= 0 && py >= 0 && px < MW && py < MH && img.data[(py * MW + px) * 4 + 3] > 110;
    for (let py = 0; py < MH; py++) for (let px = 0; px < MW; px++) {
      const i = (py * MW + px) * 4;
      let col = (px + py) % 7 === 0 ? sea2 : sea;
      if (solid(px, py)) col = solid(px, py + 1) ? land : shade;
      out.data[i] = col[0]; out.data[i + 1] = col[1]; out.data[i + 2] = col[2]; out.data[i + 3] = 255;
    }
    x.putImageData(out, 0, 0);
    return (mapCanvas = c);
  }

  // Route from Hunter's country to Chloe's: a curved dotted line (wrapping across the
  // Pacific when that's shorter), 7 stops for the 7 levels, a marker at `progress` (0..1).
  function routePoint(from, to, t) {
    let tl = to.lon;
    if (tl - from.lon > 180) tl -= 360; else if (tl - from.lon < -180) tl += 360;
    const [x0, y0] = proj(from.lon, from.lat), [x2, y2] = proj(tl, to.lat);
    const d = Math.hypot(x2 - x0, y2 - y0);
    const x1 = (x0 + x2) / 2, y1 = (y0 + y2) / 2 - d * 0.28;
    const u = 1 - t;
    return [u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2];
  }
  const wrapX = x => ((x % MW) + MW) % MW;

  function drawMap(ctx, x, y, from, to, progress, t, opts) {
    opts = opts || {};
    LW.roundBox(ctx, x - 3, y - 3, MW + 6, MH + 6, '#2b2633', P.w);
    ctx.drawImage(mapBase(), x, y);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, MW, MH); ctx.clip();
    for (let k = 0; k <= 60; k++) {                       // dotted route
      const [px, py] = routePoint(from, to, k / 60);
      ctx.fillStyle = k / 60 <= progress ? P.g : '#fff8e7';
      if (k % 2 === 0) ctx.fillRect(Math.round(x + wrapX(px)), Math.round(y + py), 1, 1);
    }
    for (let s = 1; s < 7; s++) {                          // one stop per level
      const [px, py] = routePoint(from, to, s / 7);
      ctx.fillStyle = P.k; ctx.fillRect(Math.round(x + wrapX(px)) - 1, Math.round(y + py) - 1, 3, 3);
      ctx.fillStyle = s / 7 <= progress + 0.001 ? P.g : '#fff8e7'; ctx.fillRect(Math.round(x + wrapX(px)), Math.round(y + py), 1, 1);
    }
    const [hx, hy] = routePoint(from, to, 0), [cx2, cy2] = routePoint(from, to, 1);
    ctx.fillStyle = P.k; ctx.fillRect(Math.round(x + wrapX(hx)) - 2, Math.round(y + hy) - 2, 5, 5);
    ctx.fillStyle = P.a; ctx.fillRect(Math.round(x + wrapX(hx)) - 1, Math.round(y + hy) - 1, 3, 3);
    LW.Sprites.draw(ctx, 'heart_small', 0, Math.round(x + wrapX(cx2)) - 3, Math.round(y + cy2) - 3, { topLeft: true });
    // Hunter's position, bobbing
    const [mx, my] = routePoint(from, to, Math.max(0, Math.min(1, progress)));
    const bob = Math.round(Math.sin(t * 6) * 1);
    const hp = LW.Sprites.get('portrait_hunter');
    const px = Math.round(x + wrapX(mx)) - 5, py = Math.round(y + my) - 12 + bob;
    ctx.fillStyle = P.k; ctx.fillRect(px - 1, py - 1, 12, 12);
    ctx.drawImage(hp, 6, 4, 12, 12, px, py, 10, 10);
    ctx.restore();
    if (opts.labels !== false) {
      F.draw(ctx, from.name, x, y + MH + 6, { color: P.a, outline: P.k });
      F.draw(ctx, to.name, x + MW, y + MH + 6, { color: P.p, outline: P.k, align: 'right' });
    }
  }

  // ---------------------------------------------------------------- the LeMatch phone
  function logo(ctx, x, y) {
    LW.Sprites.draw(ctx, 'heart', 0, x, y - 1, { topLeft: true });
    F.draw(ctx, 'LE', x + 11, y, { color: P.w });
    F.draw(ctx, 'MATCH', x + 11 + F.width('LE') + 1, y, { color: P.g });
  }

  // Lays out and draws the chat; only the newest messages that fit are shown.
  function drawPhone(ctx, x, y, w, h, msgs, typing, t) {
    LW.roundBox(ctx, x - 4, y - 4, w + 8, h + 12, '#2b2633', P.k);
    ctx.fillStyle = '#4a4458'; ctx.fillRect(x - 3, y - 3, w + 6, 1);
    ctx.fillStyle = LM.bg; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = LM.head; ctx.fillRect(x, y, w, 14); ctx.fillStyle = LM.head2; ctx.fillRect(x, y + 14, w, 1);
    logo(ctx, x + 4, y + 4);
    ctx.fillStyle = '#4a4458'; ctx.fillRect(x + w / 2 - 8, y + h + 3, 16, 3);
    const top = y + 18, bottom = y + h - 3, maxW = w - 40;
    const items = msgs.map(([who, text]) => {
      if (who === 'sys') { const lines = F.wrap(text, w - 16); return { who, lines, h: lines.length * 9 + 5 }; }
      const lines = F.wrap(text, maxW);
      return { who, lines, h: Math.max(16, lines.length * 9 + 5) };
    });
    if (typing) items.push({ who: typing, typing: true, h: 16 });
    let total = items.reduce((s, it) => s + it.h + 3, 0);
    let cy = Math.min(top, bottom - total);
    ctx.save(); ctx.beginPath(); ctx.rect(x, top - 2, w, bottom - top + 2); ctx.clip();
    for (const it of items) {
      if (cy + it.h >= top - 4) drawMsg(ctx, x, cy, w, maxW, it, t);
      cy += it.h + 3;
    }
    ctx.restore();
  }
  function avatar(ctx, who, ax, ay) {
    const img = LW.Sprites.get(who === 'hunter' ? 'portrait_hunter' : 'portrait_chloe');
    LW.roundBox(ctx, ax, ay, 16, 16, who === 'hunter' ? '#ffcf8a' : '#d9c4ff', P.k);
    ctx.drawImage(img, 4, 2, 16, 16, ax + 1, ay + 1, 14, 14);
  }
  function drawMsg(ctx, x, y, w, maxW, it, t) {
    if (it.who === 'sys') {
      const tw = Math.max.apply(null, it.lines.map(l => F.width(l))) + 8;
      LW.roundBox(ctx, Math.round(x + w / 2 - tw / 2), y, tw, it.h - 1, LM.sys);
      it.lines.forEach((l, i) => F.draw(ctx, l, x + w / 2, y + 3 + i * 9, { color: '#7a3a5a', align: 'center' }));
      return;
    }
    const mine = it.who === 'hunter';
    const ax = mine ? x + w - 19 : x + 3;
    avatar(ctx, it.who, ax, y);
    if (it.typing) {
      const bx = mine ? ax - 26 : ax + 19;
      LW.roundBox(ctx, bx, y + 1, 24, 13, mine ? LM.me : LM.them, P.k);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = (Math.floor(t * 4) % 3) === i ? P.k : '#a07090'; ctx.fillRect(bx + 6 + i * 5, y + 7, 3, 3); }
      return;
    }
    const tw = Math.max.apply(null, it.lines.map(l => F.width(l)));
    const bw = tw + 9, bh = it.lines.length * 9 + 4;
    const bx = mine ? ax - 3 - bw : ax + 19;
    LW.roundBox(ctx, bx, y, bw, bh, mine ? LM.me : LM.them, P.k);
    it.lines.forEach((l, i) => F.draw(ctx, l, bx + 5, y + 3 + i * 9, { color: mine ? P.w : P.k }));
  }

  // ---------------------------------------------------------------- match splash
  function profileCard(ctx, x, y, who, name, place, line, t) {
    const w = 108, h = 118;
    LW.roundBox(ctx, x, y, w, h, P.w, P.k);
    ctx.fillStyle = who === 'hunter' ? '#ffcf8a' : '#d9c4ff'; ctx.fillRect(x + 2, y + 2, w - 4, 52);
    ctx.drawImage(LW.Sprites.get(who === 'hunter' ? 'portrait_hunter' : 'portrait_chloe'), x + w / 2 - 24, y + 6, 48, 48);
    F.draw(ctx, name, x + 6, y + 58, { color: P.k, scale: 2 });
    F.draw(ctx, place, x + 6, y + 76, { color: LM.head2 });
    F.wrap(line, w - 12).forEach((l, i) => F.draw(ctx, l, x + 6, y + 87 + i * 9, { color: '#55556a' }));
  }
  function drawMatch(ctx, t, adv) {
    ctx.fillStyle = '#2a1440'; ctx.fillRect(0, 0, LW.VIEW_W, VH);
    for (let i = 0; i < 24; i++) {
      const hx = (i * 41 + Math.sin(t + i) * 6) % LW.VIEW_W, hy = VH - ((t * 25 + i * 37) % (VH + 10));
      LW.Sprites.draw(ctx, 'heart_small', 0, hx, hy, { topLeft: true });
    }
    F.draw(ctx, "IT'S A MATCH!", LW.VIEW_W / 2, 8, { color: P.g, scale: 2, align: 'center', outline: P.k });
    const bob = Math.round(Math.sin(t * 4) * 2);
    profileCard(ctx, LW.VIEW_W / 2 - 124, 28 + bob, 'hunter', 'HUNTER', adv.countries.hunter.name, 'OWNS A DRILL. WILL USE IT FOR YOU.', t);
    profileCard(ctx, LW.VIEW_W / 2 + 16, 28 - bob, 'chloe', 'CHLOE', adv.countries.chloe.name, 'SEEKS SOMEONE WHO BUILDS SHELVES.', t);
    LW.Sprites.draw(ctx, 'heart', 0, LW.VIEW_W / 2, 92 + bob);
  }

  // ---------------------------------------------------------------- scene runner
  // steps: [{ type: 'match' | 'chat' | 'map', ... }]. onDone runs after the last step or a skip.
  function Runner(steps, adv, onDone) {
    this.steps = steps; this.i = 0; this.t = 0; this.adv = adv; this.onDone = onDone; this.done = false;
    this.enter();
  }
  Runner.prototype.enter = function () {
    const s = this.steps[this.i];
    this.t = 0; this.shown = 0; this.wait = 0.6; this.ready = false;
    if (s && s.type === 'chat') this.wait = 0.7;
  };
  Runner.prototype.finish = function () { if (!this.done) { this.done = true; I().flush(); this.onDone(); } };
  Runner.prototype.next = function () { this.i++; I().flush(); if (this.i >= this.steps.length) this.finish(); else this.enter(); };
  Object.defineProperty(Runner.prototype, 'skipRect', { get: () => ({ x: LW.VIEW_W - 50, y: 3, w: 47, h: 13 }) });
  Runner.prototype.update = function (dt) {
    if (this.done) return;
    const r = this.skipRect, tap = I().peekTap();
    if (I().consume('mBack') || I().consume('pause') || (tap && tap.x >= r.x && tap.y >= r.y && tap.x < r.x + r.w && tap.y < r.y + r.h)) { I().takeTap(); this.finish(); return; }
    const s = this.steps[this.i];
    this.t += dt;
    if (s.type === 'chat') {
      const msgs = s.msgs;
      if (this.shown < msgs.length) {
        this.wait -= dt;
        if (pressed() && this.t > 0.2) this.wait = 0;     // hurry the conversation along
        if (this.wait <= 0) {
          this.shown++;
          const who = msgs[this.shown - 1][0];
          if (LW.Audio) LW.Audio.sfx(who === 'chloe' ? 'ping' : who === 'hunter' ? 'blip' : 'type');
          const nx = msgs[this.shown];
          this.wait = nx ? (nx[0] === 'sys' ? 0.6 : Math.min(1.6, 0.55 + nx[1].length * 0.022)) : 0;
        }
      } else if (pressed()) this.next();
    } else {
      if (this.t > 0.5 && pressed()) this.next();
      else if (s.auto && this.t > s.auto) this.next();
    }
  };
  Runner.prototype.draw = function (ctx, t) {
    if (this.done) return;
    const s = this.steps[this.i], adv = this.adv;
    if (s.type === 'match') drawMatch(ctx, t, adv);
    else if (s.type === 'chat') {
      LW.Backgrounds.draw(ctx, s.theme || 'sunset', t * 12, t);
      ctx.globalAlpha = 0.45; ctx.fillStyle = P.k; ctx.fillRect(0, 0, LW.VIEW_W, VH); ctx.globalAlpha = 1;
      const msgs = s.msgs.slice(0, this.shown).map(([w, txt]) => [w, fill(txt, s.vars)]);
      const nx = s.msgs[this.shown];
      const typing = nx && nx[0] !== 'sys' && this.wait < 99 ? nx[0] : null;
      if (s.map) {
        const p = s.map.from + (s.map.to - s.map.from) * Math.min(1, this.t / 1.6);
        if (s.title) F.wrap(s.title, MW).forEach((l, i) => F.draw(ctx, l, 8, 8 + i * 10, { color: P.g, outline: P.k }));
        drawMap(ctx, 8, 32, adv.countries.hunter, adv.countries.chloe, p, t);
        if (s.sub) F.draw(ctx, s.sub, 8 + MW / 2, 126, { color: P.w, outline: P.k, align: 'center' });
        drawPhone(ctx, LW.VIEW_W - 122, 8, 116, 158, msgs, typing, t);
      } else {
        const C = LW.VIEW_W / 2;
        LW.Sprites.draw(ctx, 'hunter_idle', Math.floor(t * 2), C - 126, 170, { rim: 'rgba(255,230,200,0.7)' });
        LW.Sprites.draw(ctx, 'chloe_phone', 0, C + 126, 170, { flip: true, rim: 'rgba(255,230,200,0.7)' });
        drawPhone(ctx, C - 70, 8, 140, 158, msgs, typing, t);
      }
      if (this.shown >= s.msgs.length && Math.floor(t * 2.5) % 2 === 0)
        F.draw(ctx, 'JUMP OR TAP', s.map ? 8 + MW / 2 : LW.VIEW_W / 2, VH - 12, { color: P.w, align: 'center', outline: P.k });
    } else if (s.type === 'map') {
      LW.Backgrounds.draw(ctx, 'sunset', t * 8, t);
      ctx.globalAlpha = 0.5; ctx.fillStyle = P.k; ctx.fillRect(0, 0, LW.VIEW_W, VH); ctx.globalAlpha = 1;
      F.draw(ctx, s.title, LW.VIEW_W / 2, 10, { color: P.g, scale: 2, align: 'center', outline: P.k });
      const p = (s.from || 0) + ((s.to || 0) - (s.from || 0)) * Math.min(1, this.t / 1.6);
      drawMap(ctx, LW.VIEW_W / 2 - MW / 2, 36, adv.countries.hunter, adv.countries.chloe, p, t);
      if (s.sub) F.draw(ctx, fill(s.sub, s.vars), LW.VIEW_W / 2, 132, { color: P.w, align: 'center', outline: P.k });
      if (this.t > 0.5 && Math.floor(t * 2.5) % 2 === 0) F.draw(ctx, 'JUMP OR TAP TO GO', LW.VIEW_W / 2, 158, { color: P.w, align: 'center', outline: P.k });
    }
    // skip button
    const r = this.skipRect;
    LW.roundBox(ctx, r.x, r.y, r.w, r.h, '#2b2633', P.i);
    F.draw(ctx, 'SKIP >', r.x + r.w / 2, r.y + 3, { color: P.w, align: 'center' });
  };

  // ---------------------------------------------------------------- scripts
  function vars(adv) {
    return { HUNTER_COUNTRY: adv.countries.hunter.name.toUpperCase(), CHLOE_COUNTRY: adv.countries.chloe.name.toUpperCase(), KM: fmt(km(adv.countries.hunter, adv.countries.chloe)) };
  }
  function intro(adv, onDone) {
    const v = vars(adv);
    return new Runner([
      { type: 'match', auto: 4.5 },
      { type: 'chat', msgs: LW.STORY.intro, vars: v },
      { type: 'map', title: 'THE PLAN', from: 0, to: 0, sub: 'SEVEN LEVELS. {KM} KM. ONE DATE.', vars: v }
    ], adv, onDone);
  }
  // After finishing level index `done` (0-based); `theme` is the next level's look.
  function interlude(adv, done, theme, nextName, onDone) {
    const lines = LW.STORY.interludes[done] || [];
    const v = vars(adv);
    const left = Math.round(km(adv.countries.hunter, adv.countries.chloe) * (1 - (done + 1) / 7));
    return new Runner([
      { type: 'chat', msgs: lines, vars: v, theme, map: { from: done / 7, to: (done + 1) / 7 },
        title: 'NEXT: ' + nextName, sub: fmt(left) + ' KM TO GO' }
    ], adv, onDone);
  }

  LW.Story = { intro, interlude, drawMap, drawPhone, km, fmt, fill, Runner };
})();

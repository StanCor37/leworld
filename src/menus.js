// Menus: a small keyboard/mouse/touch menu widget plus the title, pause, controls and
// confirmation screens. Screens draw onto the 320x180 canvas.
(function () {
  const VH = LW.VIEW_H, P = LW.PAL, F = LW.Font, I = () => LW.Input;
  const ROW = 15;

  // items: [{ label, value?: () => string, action?: () => void, change?: dir => void, hidden?: () => bool, note?: string }]
  function Menu(items) { this.items = items; this.sel = 0; this.rects = []; }
  Menu.prototype.visible = function () { return this.items.filter(i => !(i.hidden && i.hidden())); };
  Menu.prototype.handle = function () {
    const items = this.visible();
    if (!items.length) return;
    this.sel = Math.max(0, Math.min(this.sel, items.length - 1));
    const sfx = n => LW.Audio && LW.Audio.sfx(n);
    if (I().consume('mUp')) { this.sel = (this.sel + items.length - 1) % items.length; sfx('blip'); }
    if (I().consume('mDown')) { this.sel = (this.sel + 1) % items.length; sfx('blip'); }
    const it = items[this.sel];
    if (it.change) {
      if (I().consume('mLeft')) { it.change(-1); sfx('blip'); }
      if (I().consume('mRight')) { it.change(1); sfx('blip'); }
    } else { I().consume('mLeft'); I().consume('mRight'); }
    if (I().consume('mOk')) { sfx('select'); if (it.action) it.action(); else if (it.change) it.change(1); return; }
    const tap = I().peekTap();
    if (tap) {
      const k = this.rects.findIndex(r => tap.x >= r.x && tap.x < r.x + r.w && tap.y >= r.y && tap.y < r.y + r.h);
      if (k >= 0) {
        I().takeTap();
        this.sel = k;
        sfx('select');
        const t = items[k];
        if (t.action) t.action(); else if (t.change) t.change(1);
      }
    }
    const hv = I().hover();
    if (hv && this.lastHover !== hv) {
      this.lastHover = hv;
      const k = this.rects.findIndex(r => hv.x >= r.x && hv.x < r.x + r.w && hv.y >= r.y && hv.y < r.y + r.h);
      if (k >= 0) this.sel = k;
    }
  };
  Menu.prototype.draw = function (ctx, x, y, w, t) {
    const items = this.visible();
    this.rects = [];
    items.forEach((it, i) => {
      const yy = y + i * ROW, on = i === this.sel;
      this.rects.push({ x, y: yy, w, h: ROW - 1 });
      if (on) LW.roundBox(ctx, x, yy, w, ROW - 1, '#4a1e3a', P.p);
      if (on) LW.Sprites.draw(ctx, 'heart_small', 0, x + 3, yy + 4 + (Math.floor(t * 3) % 2), { topLeft: true });
      F.draw(ctx, it.label, x + 13, yy + 4, { color: on ? P.w : P.i });
      if (it.value) {
        const v = it.value();
        F.draw(ctx, (it.change && on ? '< ' : '') + v + (it.change && on ? ' >' : ''), x + w - 7, yy + 4, { color: on ? P.g : P.e, align: 'right' });
      }
    });
    const cur = items[this.sel];
    return cur && cur.note ? (typeof cur.note === 'function' ? cur.note() : cur.note) : null;
  };

  function dim(ctx, a) { ctx.globalAlpha = a; ctx.fillStyle = P.k; ctx.fillRect(0, 0, LW.VIEW_W, VH); ctx.globalAlpha = 1; }
  function panel(ctx, x, y, w, h) { LW.roundBox(ctx, x, y, w, h, '#2b2633', P.w); }

  // ---------------------------------------------------------------- title
  function drawLogo(ctx, cx, y, t) {
    const bob = Math.round(Math.sin(t * 2) * 1.5);
    const lw = F.width('LEWORLD', 3);
    // chunky outline, pink drop shadow, then the gold letters
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [3, 4], [4, 3], [4, 4], [2, 4], [4, 2]])
      F.draw(ctx, 'LEWORLD', cx + dx, y + dy + bob, { color: P.k, scale: 3, align: 'center' });
    F.draw(ctx, 'LEWORLD', cx + 2, y + 2 + bob, { color: '#c9306a', scale: 3, align: 'center' });
    F.draw(ctx, 'LEWORLD', cx, y + bob, { color: P.g, scale: 3, align: 'center' });
    LW.Sprites.draw(ctx, 'heart', 0, cx + Math.ceil(lw / 2) + 4, y - 3 + bob, { topLeft: true });
    F.draw(ctx, 'A FIRST DATE, ACROSS THE WORLD', cx, y + 27, { color: P.w, align: 'center', outline: P.k });
  }

  function drawTitle(ctx, t, menu, info) {
    LW.Backgrounds.draw(ctx, 'sunset', t * 14, t);
    dim(ctx, 0.25);
    drawLogo(ctx, LW.VIEW_W / 2, 10, t);
    const C = LW.VIEW_W / 2;
    LW.Sprites.draw(ctx, 'hunter_idle', Math.floor(t * 2), C - 114, 168, { rim: 'rgba(255,230,200,0.7)' });
    LW.Sprites.draw(ctx, 'chloe_wave', Math.floor(t * 3), C + 114, 168, { flip: true, rim: 'rgba(255,230,200,0.7)' });
    const n = menu.visible().length;
    panel(ctx, C - 90, 48, 180, 4 + n * ROW + 3);
    const note = menu.draw(ctx, C - 87, 51, 174, t);
    const ny = 48 + 4 + n * ROW + 8;
    if (note) F.wrap(note, 250).forEach((l, i) => F.draw(ctx, l, LW.VIEW_W / 2, ny + i * 9, { color: P.g, align: 'center', outline: P.k }));
    if (info.error) F.wrap(info.error, 230).forEach((l, i) => F.draw(ctx, l, LW.VIEW_W / 2, 138 + i * 9, { color: P.p, align: 'center', outline: P.k }));
    F.draw(ctx, 'PROGRESS IS SAVED ON THIS BROWSER AND DEVICE', LW.VIEW_W / 2, VH - 11, { color: P.i, align: 'center', outline: P.k });
  }

  // ---------------------------------------------------------------- controls
  const TOUCH_CONTROLS = [
    ['MOVE', 'ARROW BUTTONS, BOTTOM LEFT'],
    ['JUMP', 'BIG BUTTON, BOTTOM RIGHT'],
    ['CROUCH', 'SMALL BUTTON ABOVE ARROWS'],
    ['FIRE', 'BUBBLE BUTTON (3 BOOKS)'],
    ['PAUSE', 'TOP RIGHT'],
    ['TIP', 'HOLD A DIRECTION WHILE YOU JUMP']
  ];
  const CONTROLS = [
    ['MOVE', 'LEFT / RIGHT  OR  A / D'],
    ['JUMP', 'UP  OR  W  OR  SPACE'],
    ['CROUCH', 'DOWN  OR  S'],
    ['FIRE', 'SHIFT  (AFTER 3 BOOKS)'],
    ['PAUSE', 'ESC  OR  P'],
    ['MUTE', 'M']
  ];
  const TIPS = ['3 BOOKS UNLOCK RADICAL READER MODE', 'EVERY 3 TOOLS FIX A HEART', 'STOMP MOST ENEMIES. NOT CONES.', 'CROUCH BY A CAT. TRUST ME.'];
  function drawControls(ctx, t, fromPause) {
    if (!fromPause) LW.Backgrounds.draw(ctx, 'street', t * 10, t);
    dim(ctx, fromPause ? 0.75 : 0.55);
    const ox = Math.round((LW.VIEW_W - 320) / 2);   // keep the 320-wide layout centred
    panel(ctx, ox + 14, 6, 292, 168);
    F.draw(ctx, 'HOW TO PLAY', LW.VIEW_W / 2, 12, { color: P.g, scale: 2, align: 'center', outline: P.k });
    (LW.Touch && LW.Touch.enabled ? TOUCH_CONTROLS : CONTROLS).forEach(([k, v], i) => {
      F.draw(ctx, k, ox + 26, 34 + i * 11, { color: P.p });
      F.draw(ctx, v, ox + 84, 34 + i * 11, { color: P.w });
    });
    F.draw(ctx, LW.Touch && LW.Touch.enabled ? 'KEYBOARD WORKS TOO: ARROWS + SPACE' : 'PHONES: ON-SCREEN BUTTONS, LANDSCAPE', LW.VIEW_W / 2, 103, { color: P.x, align: 'center' });
    TIPS.forEach((l, i) => F.draw(ctx, '♥ ' + l, ox + 26, 116 + i * 10, { color: P.i }));
    if (Math.floor(t * 2.5) % 2 === 0) F.draw(ctx, fromPause ? 'JUMP OR TAP TO GO BACK' : 'JUMP OR TAP TO START', LW.VIEW_W / 2, 160, { color: P.w, align: 'center' });
  }

  // ---------------------------------------------------------------- pause & confirm
  function drawPause(ctx, t, menu) {
    dim(ctx, 0.65);
    const n = menu.visible().length;
    panel(ctx, LW.VIEW_W / 2 - 90, 10, 180, 28 + n * ROW);
    F.draw(ctx, 'PAUSED', LW.VIEW_W / 2, 15, { color: P.g, scale: 2, align: 'center', outline: P.k });
    const note = menu.draw(ctx, LW.VIEW_W / 2 - 87, 34, 174, t);
    const y = 10 + 28 + n * ROW + 5;
    F.draw(ctx, note || 'PROGRESS SAVED ON THIS DEVICE', LW.VIEW_W / 2, y, { color: note ? P.g : P.f, align: 'center', outline: P.k });
  }

  function drawConfirm(ctx, t, c) {
    dim(ctx, 0.7);
    const lines = F.wrap(c.text, 220);
    const h = 30 + lines.length * 9 + c.menu.visible().length * ROW;
    const y = Math.round(VH / 2 - h / 2);
    panel(ctx, LW.VIEW_W / 2 - 120, y, 240, h);
    F.draw(ctx, c.title || 'ARE YOU SURE?', LW.VIEW_W / 2, y + 6, { color: P.p, align: 'center' });
    lines.forEach((l, i) => F.draw(ctx, l, LW.VIEW_W / 2, y + 17 + i * 9, { color: P.w, align: 'center' }));
    c.menu.draw(ctx, LW.VIEW_W / 2 - 40, y + 22 + lines.length * 9, 80, t);
  }

  LW.Menus = { Menu, drawTitle, drawControls, drawPause, drawConfirm };
})();

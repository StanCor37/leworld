// Touch controls for phones and tablets. Each finger is tracked separately, so you can hold
// a direction while jumping or firing, and slide a thumb between left and right. Buttons feed
// the same actions as the keyboard (LW.Input.press/release). Shown only on touch devices.
(function () {
  const VH = LW.VIEW_H, P = LW.PAL;

  // Visible buttons (internal pixels). Hit zones below are deliberately larger than the art.
  // Right-hand buttons are positioned from the right edge (the view widens on long phones).
  const BUTTONS = {
    left: { x: 26, y: 152, r: 19, icon: 'left' },
    right: { x: 70, y: 152, r: 19, icon: 'right' },
    down: { x: 48, y: 118, r: 11, icon: 'down' },
    fire: { fromRight: 70, y: 156, r: 16, icon: 'fire' },
    jump: { fromRight: 28, y: 146, r: 21, icon: 'jump' }
  };
  const bx = b => (b.fromRight != null ? LW.VIEW_W - b.fromRight : b.x);
  const dist = (x, y, b) => Math.hypot(x - bx(b), y - b.y);
  // Which action is under a finger? Generous zones in the bottom corners.
  function zone(x, y) {
    if (y < 96) return null;
    if (dist(x, y, BUTTONS.down) < 16) return 'down';
    if (x < 48 && y > 124) return 'left';
    if (x >= 48 && x < 100 && y > 124) return 'right';
    const R = LW.VIEW_W;
    if (x >= R - 48 && y > 112) return 'jump';
    if (x >= R - 94 && x < R - 48 && y > 130) return 'fire';
    if (x >= R - 94 && y > 112) return 'jump';
    return null;
  }

  const fingers = new Map();      // pointerId -> action currently held
  let enabled = false;            // a touch device has been detected
  let active = false;             // gameplay is running (set by the game each frame)
  let canvas = null;

  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * LW.VIEW_W, y: (e.clientY - r.top) / r.height * VH };
  }
  function setFinger(id, action) {
    const prev = fingers.get(id);
    if (prev === action) return;
    if (prev) LW.Input.release(prev, 'touch' + id);
    if (action) { LW.Input.press(action, 'touch' + id); fingers.set(id, action); navigator.vibrate && action === 'jump' && navigator.vibrate(8); }
    else fingers.delete(id);
  }
  function releaseAll() { for (const id of [...fingers.keys()]) setFinger(id, null); }

  function attach(cv) {
    canvas = cv;
    const isTouch = e => e.pointerType === 'touch' || e.pointerType === 'pen';
    cv.addEventListener('pointerdown', e => {
      if (!isTouch(e)) return;
      enabled = true;
      e.preventDefault();
      if (!active) return;                         // menus use the plain tap from LW.Input
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      const p = toCanvas(e);
      setFinger(e.pointerId, zone(p.x, p.y));
    }, { passive: false });
    cv.addEventListener('pointermove', e => {
      if (!isTouch(e) || !fingers.has(e.pointerId) && !active) return;
      e.preventDefault();
      if (!active) return;
      const p = toCanvas(e);
      // slide between left/right (and on to jump) without lifting the thumb
      if (fingers.has(e.pointerId)) setFinger(e.pointerId, zone(p.x, p.y));
    }, { passive: false });
    const up = e => { if (fingers.has(e.pointerId)) setFinger(e.pointerId, null); };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('lostpointercapture', up);
    // never scroll, zoom or pop up menus while playing
    const stop = e => { if (e.target === cv || e.cancelable) e.preventDefault(); };
    document.addEventListener('touchmove', stop, { passive: false });
    document.addEventListener('touchstart', e => { if (e.target === cv && e.cancelable) e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturestart', stop, { passive: false });
    document.addEventListener('dblclick', stop, { passive: false });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    // devices that report a coarse pointer get the buttons straight away
    if (window.matchMedia && matchMedia('(pointer: coarse)').matches) enabled = true;
  }

  // The game tells us when touches should drive gameplay.
  function setActive(on) {
    if (on === active) return;
    active = on;
    if (!on) releaseAll();
  }

  function draw(ctx, canFire) {
    if (!enabled) return;
    const H = LW.Input.held;
    for (const k in BUTTONS) {
      const b = BUTTONS[k];
      if (k === 'fire' && !canFire) {
        // locked until Radical Reader Mode: faded, with the books still needed
        ctx.globalAlpha = 0.35;
        LW.UI.touchButton(ctx, bx(b), b.y, b.r, b.icon, false);
        ctx.globalAlpha = 1;
        continue;
      }
      LW.UI.touchButton(ctx, bx(b), b.y, b.r, b.icon, !!H[k]);
    }
  }

  function isPortrait() {
    return enabled && innerHeight > innerWidth * 1.05;
  }

  function drawRotate(ctx, t) {
    ctx.fillStyle = '#1a1423'; ctx.fillRect(0, 0, LW.VIEW_W, VH);
    // a phone turning sideways
    const a = (Math.sin(t * 2) + 1) / 2 * Math.PI / 2;
    ctx.save(); ctx.translate(LW.VIEW_W / 2, 70); ctx.rotate(-a);
    ctx.fillStyle = P.k; ctx.fillRect(-14, -24, 28, 48);
    ctx.fillStyle = '#4a4458'; ctx.fillRect(-13, -23, 26, 46);
    ctx.fillStyle = '#ff4f8a'; ctx.fillRect(-11, -19, 22, 36);
    ctx.fillStyle = P.w; ctx.fillRect(-3, 19, 6, 2);
    ctx.restore();
    LW.Sprites.draw(ctx, 'heart', 0, LW.VIEW_W / 2, 74);
    LW.Font.draw(ctx, 'TURN YOUR PHONE SIDEWAYS', LW.VIEW_W / 2, 112, { color: P.g, scale: 2, align: 'center', outline: P.k });
    LW.Font.draw(ctx, 'LEWORLD IS BEST IN LANDSCAPE.', LW.VIEW_W / 2, 138, { color: P.w, align: 'center' });
    LW.Font.draw(ctx, 'HUNTER NEEDS THE ROOM TO RUN.', LW.VIEW_W / 2, 150, { color: P.i, align: 'center' });
  }

  LW.Touch = { attach, setActive, draw, isPortrait, drawRotate, zone, BUTTONS, get enabled() { return enabled; }, set enabled(v) { enabled = v; } };
})();

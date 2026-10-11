// Input: keyboard (and, via press/release, touch buttons) -> abstract actions.
// A key can drive several actions: e.g. ArrowUp is "jump" in play and "mUp" in menus.
// Pointer taps on the canvas are reported in internal pixel coordinates for menus/HUD.
(function () {
  const KEYS = {
    ArrowLeft: ['left', 'mLeft'], KeyA: ['left', 'mLeft'],
    ArrowRight: ['right', 'mRight'], KeyD: ['right', 'mRight'],
    ArrowUp: ['jump', 'mUp'], KeyW: ['jump', 'mUp'], Space: ['jump', 'mOk'],
    ArrowDown: ['down', 'mDown'], KeyS: ['down', 'mDown'],
    Enter: ['mOk'], NumpadEnter: ['mOk'],
    ShiftLeft: ['fire'], ShiftRight: ['fire'],
    Escape: ['pause', 'mBack'], KeyP: ['pause'], Backspace: ['mBack'],
    KeyM: ['mute'],
    Backquote: ['debug']
  };
  const held = {};       // action -> bool (from any source)
  const pressed = {};    // action -> true until consumed
  const sources = {};    // action -> Set of sources holding it (keys, touch ids)

  function press(action, src) {
    const set = sources[action] || (sources[action] = new Set());
    if (!set.size) pressed[action] = true;
    set.add(src);
    held[action] = true;
  }
  function release(action, src) {
    const set = sources[action];
    if (!set) return;
    set.delete(src);
    held[action] = set.size > 0;
  }

  addEventListener('keydown', e => {
    const acts = KEYS[e.code];
    if (!acts) return;
    e.preventDefault();
    if (!e.repeat) for (const a of acts) press(a, e.code);
  });
  addEventListener('keyup', e => {
    const acts = KEYS[e.code];
    if (!acts) return;
    e.preventDefault();
    for (const a of acts) release(a, e.code);
  });
  addEventListener('blur', () => { for (const a in sources) { sources[a].clear(); held[a] = false; } });

  // ---------------------------------------------------------------- pointer (menus + HUD)
  let tap = null;              // {x, y} in internal pixels, until consumed
  let hover = null;
  function toCanvas(canvas, e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * LW.VIEW_W, y: (e.clientY - r.top) / r.height * LW.VIEW_H };
  }
  function attachPointer(canvas) {
    canvas.addEventListener('pointerdown', e => { tap = toCanvas(canvas, e); });
    canvas.addEventListener('pointermove', e => { hover = toCanvas(canvas, e); });
  }
  function takeTap() { const t = tap; tap = null; return t; }
  function peekTap() { return tap; }

  // Snapshot for one simulation step. Edge presses are consumed once.
  function controls() {
    const c = {
      left: !!held.left, right: !!held.right, down: !!held.down,
      jumpHeld: !!held.jump, fireHeld: !!held.fire,
      jumpPressed: !!pressed.jump, firePressed: !!pressed.fire
    };
    pressed.jump = false; pressed.fire = false;
    return c;
  }
  function consume(action) { const p = !!pressed[action]; pressed[action] = false; return p; }
  // Drop all pending presses (e.g. when switching screens so a menu "OK" doesn't also jump).
  function flush() { for (const a in pressed) pressed[a] = false; tap = null; }

  LW.Input = { controls, consume, flush, press, release, held, attachPointer, takeTap, peekTap, hover: () => hover };
})();

// Shared tile collision for any box body {x, y, w, h, vx, vy, onGround}.
// x,y is the top-left of the hitbox. Axes are resolved separately (X then Y).
(function () {
  const T = LW.TILE;
  const EPS = 0.001;

  function moveX(b, level, dx) {
    if (!dx) return false;
    b.x += dx;
    const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - EPS) / T);
    if (dx > 0) {
      const tx = Math.floor((b.x + b.w - EPS) / T);
      for (let ty = y0; ty <= y1; ty++) if (level.at(tx, ty) === LW.Level.SOLID) { b.x = tx * T - b.w; b.vx = 0; return true; }
    } else {
      const tx = Math.floor(b.x / T);
      for (let ty = y0; ty <= y1; ty++) if (level.at(tx, ty) === LW.Level.SOLID) { b.x = (tx + 1) * T; b.vx = 0; return true; }
    }
    return false;
  }

  // Returns 'floor' | 'ceiling' | null. One-way ledges only stop a body falling onto them
  // from above (its feet were at or above the ledge top before this move).
  function moveY(b, level, dy, dropThrough) {
    b.onGround = false;
    if (!dy) return null;
    const prevBottom = b.y + b.h;
    b.y += dy;
    const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - EPS) / T);
    if (dy > 0) {
      const ty = Math.floor((b.y + b.h - EPS) / T);
      for (let tx = x0; tx <= x1; tx++) {
        const t = level.at(tx, ty);
        const top = ty * T;
        if (t === LW.Level.SOLID || (t === LW.Level.ONEWAY && !dropThrough && prevBottom <= top + EPS)) {
          b.y = top - b.h; b.vy = 0; b.onGround = true; return 'floor';
        }
      }
    } else {
      const ty = Math.floor(b.y / T);
      for (let tx = x0; tx <= x1; tx++) if (level.at(tx, ty) === LW.Level.SOLID) { b.y = (ty + 1) * T; b.vy = 0; return 'ceiling'; }
    }
    return null;
  }

  // Is there solid/one-way ground directly under the body's feet?
  function groundBelow(b, level) {
    const ty = Math.floor((b.y + b.h + 0.5) / T);
    const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - EPS) / T);
    for (let tx = x0; tx <= x1; tx++) { const t = level.at(tx, ty); if (t === LW.Level.SOLID || t === LW.Level.ONEWAY) return true; }
    return false;
  }

  function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function approach(v, target, amount) { return v < target ? Math.min(v + amount, target) : Math.max(v - amount, target); }

  LW.Physics = { moveX, moveY, groundBelow, overlap, approach };
})();

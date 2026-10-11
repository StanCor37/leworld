// Level reachability checker (used by tests.html). Explores every standing spot Hunter can
// reach from the start by simulating the real player physics: walking, walking off ledges
// and jumps with different run-ups and amounts of air control.
//
// Simplifications (deliberately optimistic about timing, strict about geometry):
//  - enemies and damage are ignored; timed hazards count as safe
//  - disappearing platforms (D) count as solid; moving platforms (M, V) are treated as a
//    one-way walkway along their whole travel path; falling blocks are ignored
(function () {
  const T = LW.TILE;

  function staticLevel(def) {
    const L = new LW.Level(def, { difficulty: def.__difficulty || 'casual' });
    const over = def.hazards || {};
    const C = LW.CFG.hazards.mover;
    for (const e of L.entities) {
      const o = over[e.tx + ',' + e.ty] || {};
      const set = (x, y) => { if (x >= 0 && x < L.w && y >= 0 && y < L.h && !L.grid[y * L.w + x]) L.grid[y * L.w + x] = LW.Level.ONEWAY; };
      if (e.type === 'D') set(e.tx, e.ty);
      if (e.type === 'M') { const r = o.range || C.range, w = o.width || C.width; for (let x = e.tx; x < e.tx + r + w; x++) set(x, e.ty); }
      if (e.type === 'V') { const r = o.vRange || o.range || C.vRange, w = o.width || C.width; for (let y = e.ty; y >= e.ty - r; y--) for (let x = e.tx; x < e.tx + w; x++) set(x, y); }
    }
    return L;
  }

  const NO = { left: false, right: false, down: false, jumpHeld: false, fireHeld: false, jumpPressed: false, firePressed: false };

  function check(def, opts) {
    opts = opts || {};
    const L = staticLevel(def);
    const STEP = 1 / 60;                       // coarser step is plenty for reachability
    const targets = [];
    for (const e of L.entities) {
      if ('btCGKO'.includes(e.type)) {
        const box = e.type === 'G' ? { x: e.x - 8, y: e.y - 40, w: 16, h: 40 }
          : e.type === 'C' ? { x: e.x - 6, y: e.y - 32, w: 12, h: 32 }
          : e.type === 'K' ? { x: e.x - 13, y: e.y - 13, w: 26, h: 13 }
          : e.type === 'O' ? { x: e.x - 14, y: e.y - 70, w: 28, h: 70 }
          : { x: e.x - 6, y: e.y - 14, w: 12, h: 12 };
        targets.push({ type: e.type, tx: e.tx, ty: e.ty, box, hit: false });
      }
    }
    const touch = p => { for (const t of targets) if (!t.hit && p.x < t.box.x + t.box.w && p.x + p.w > t.box.x && p.y < t.box.y + t.box.h && p.y + p.h > t.box.y) t.hit = true; };

    const standable = (tx, ty) => {      // feet on top of row ty+1, body in rows ty-1..ty
      if (tx < 0 || tx >= L.w || ty < 1 || ty >= L.h - 1) return false;
      const below = L.at(tx, ty + 1);
      return (below === LW.Level.SOLID || below === LW.Level.ONEWAY) && L.at(tx, ty) !== LW.Level.SOLID && L.at(tx, ty - 1) !== LW.Level.SOLID;
    };
    const seen = new Set(), queue = [];
    const key = (x, y) => x + ',' + y;
    const visit = (tx, ty) => { const k = key(tx, ty); if (!seen.has(k) && standable(tx, ty)) { seen.add(k); queue.push([tx, ty]); } };
    visit(Math.floor(L.start.x / T), Math.floor(L.start.y / T) - 1);

    const p = new LW.Player(0, 0);
    const patterns = [];
    for (const dir of [-1, 1]) {
      for (const v0 of [0, 1]) {
        for (const hold of [0.05, 0.12, 0.2, 0.3, 0.45, 0.6, 2]) patterns.push({ dir, v0, jump: true, hold });
        patterns.push({ dir, v0, jump: false, hold: 2 });
      }
    }
    patterns.push({ dir: 0, v0: 0, jump: true, hold: 0 });
    patterns.push({ dir: 0, v0: 0, jump: false, hold: 0, drop: true });

    let sims = 0;
    while (queue.length) {
      const [tx, ty] = queue.shift();
      // walking to neighbours on the same level
      for (const d of [-1, 1]) if (standable(tx + d, ty)) visit(tx + d, ty);
      for (const pat of patterns) {
        sims++;
        p.reset(tx * T + T / 2, (ty + 1) * T);
        p.onGround = true; p.coyote = LW.CFG.player.coyoteTime;
        p.vx = pat.v0 * pat.dir * LW.CFG.player.maxSpeed;
        touch(p);
        let left = false;
        for (let i = 0; i < 180; i++) {
          const t = i * STEP;
          const c = Object.assign({}, NO, {
            left: pat.dir < 0 && t < pat.hold, right: pat.dir > 0 && t < pat.hold,
            jumpPressed: pat.jump && i === 0, jumpHeld: pat.jump
          });
          p.update(STEP, c, L);
          touch(p);
          if (!p.onGround) left = true;
          if (p.y > L.ph) break;
          if (left && p.onGround) { visit(Math.floor((p.x + p.w / 2) / T), Math.floor((p.y + p.h) / T) - 1); break; }
          if (!left && i > 40) break;          // walked along the ground without leaving it
        }
      }
    }
    const missing = targets.filter(t => !t.hit);
    return { nodes: seen.size, sims, targets, missing, goalReached: targets.some(t => (t.type === 'G' || t.type === 'O') && t.hit) };
  }

  LW.Reach = { check };
})();

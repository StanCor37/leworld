// Level: parses a character map into a tile grid, answers collision queries and draws tiles.
//
// Map legend
//   .  empty            #  ground (top/fill picked automatically)   B  solid block
//   -  one-way ledge    ^  spikes (hazard, non-solid)               P  player start
//   +  ground that only exists in Casual (wider landings)
//   b  feminist book    t  power tool    T  power tool (Casual only)
//   C  checkpoint       G  level goal    K  secret cat (crouch next to her to pet)
//   enemies: e x X s S a r i O (see enemy.js)   hazards: M V D F W R (see hazards.js)
(function () {
  const T = LW.TILE;
  const SOLID = 1, ONEWAY = 2, HAZARD = 3;

  function Level(def, opts) {
    opts = opts || {};
    const diff = LW.CFG.difficulty[opts.difficulty || 'casual'];
    this.def = def;
    this.id = def.id || def.name;
    this.theme = def.theme || 'street';
    this.rows = def.map.slice();
    this.h = this.rows.length;
    this.w = Math.max.apply(null, this.rows.map(r => r.length));
    this.pw = this.w * T;
    this.ph = this.h * T;
    this.grid = new Uint8Array(this.w * this.h);
    this.kinds = new Array(this.w * this.h).fill(null);
    this.entities = [];
    this.start = { x: 2 * T, y: 0 };
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        let ch = this.rows[y][x] || '.';
        const i = y * this.w + x;
        if (ch === '+') ch = diff.widePlatforms ? '#' : '.';
        if (ch === 'T') { if (!diff.extraTools) continue; ch = 't'; }
        this.rows[y] = this.rows[y].slice(0, x) + ch + this.rows[y].slice(x + 1);
        if (ch === '#' || ch === 'B') this.grid[i] = SOLID;
        else if (ch === '-') this.grid[i] = ONEWAY;
        else if (ch === '^') this.grid[i] = HAZARD;
        else if (ch === 'P') this.start = { x: x * T + T / 2, y: (y + 1) * T };
        else if (ch !== '.') this.entities.push({ type: ch, tx: x, ty: y, x: x * T + T / 2, y: (y + 1) * T });
      }
    }
    // Choose tile art: ground with open space above is a surface, otherwise fill.
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const ch = this.rows[y][x];
      const i = y * this.w + x;
      if (ch === '#') this.kinds[i] = (y > 0 && this.at(x, y - 1) === SOLID && this.rows[y - 1][x] === '#') ? 'fill' : 'top';
      else if (ch === 'B') this.kinds[i] = 'block';
      else if (ch === '-') this.kinds[i] = 'plat';
      else if (ch === '^') this.kinds[i] = 'spikes';
    }
  }

  Level.prototype.at = function (tx, ty) {
    if (tx < 0 || tx >= this.w) return SOLID;     // side walls of the world are solid
    if (ty < 0 || ty >= this.h) return 0;         // open above and below (falling out = pit)
    return this.grid[ty * this.w + tx];
  };

  // Is any tile of `type` overlapping the box?
  Level.prototype.overlaps = function (x, y, w, h, type) {
    const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.001) / T);
    const y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.at(tx, ty) === type) return true;
    return false;
  };

  // Spikes only hurt where the visible spikes are (lower part of the tile).
  Level.prototype.touchesHazard = function (x, y, w, h) {
    const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.001) / T);
    const y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (this.at(tx, ty) !== HAZARD) continue;
      const top = ty * T + 8, l = tx * T + 2, r = tx * T + T - 2;
      if (y + h > top && x < r && x + w > l) return true;
    }
    return false;
  };

  Level.prototype.draw = function (ctx, camX, camY) {
    const x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(this.w - 1, Math.floor((camX + LW.VIEW_W) / T));
    const y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(this.h - 1, Math.floor((camY + LW.VIEW_H) / T));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const k = this.kinds[ty * this.w + tx];
      if (!k) continue;
      const sx = Math.round(tx * T - camX), sy = Math.round(ty * T - camY);
      if (k === 'spikes') LW.Sprites.draw(ctx, 'spikes', 0, sx, sy, { topLeft: true });
      else ctx.drawImage(LW.Tiles.tile(this.theme, k, (tx * 7 + ty * 3) % 4), sx, sy);
    }
  };

  Level.SOLID = SOLID; Level.ONEWAY = ONEWAY; Level.HAZARD = HAZARD;
  LW.Level = Level;
})();

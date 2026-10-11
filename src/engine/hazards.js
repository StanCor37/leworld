// Timed hazards and moving platforms. Each one has a visible warning phase and a fixed
// rhythm, so nothing can hit Hunter without being seen and learned first.
//
// Map letters
//   M  moving platform (horizontal, 2 tiles wide, travels right then back)
//   V  moving platform (vertical, travels up then back)
//   D  disappearing platform (solid > cracking warning > gone; neighbours go in sequence)
//   F  falling block (shakes with a "!" when Hunter walks underneath, drops, rests, rises)
//   W  swinging sign on a chain (pivot at the top of the tile)
//   R  pop-up spikes (hidden > red tips warning > out; neighbours go in sequence)
// A level can tweak individual hazards with def.hazards = { 'col,row': { range, period, ... } }.
(function () {
  const T = LW.TILE;
  const H = () => LW.CFG.hazards;
  const SIGN_TEXT = { street: 'SALE', avenue: 'U UP?', country: 'BRIDGE OUT', industrial: 'KEEP OUT', train: 'REPENT', palace: 'SILENCE', sunset: 'CAFE >' };

  // Smooth back-and-forth 0..1..0 over one period.
  const pingpong = (t, period) => (1 - Math.cos((t / period) * Math.PI * 2)) / 2;

  class Mover {
    constructor(tx, ty, axis, o, mul) {
      const C = H().mover;
      this.kind = 'mover'; this.platform = true; this.active = true;
      this.axis = axis;
      this.w = (o.width || C.width) * T; this.h = 8;
      this.x0 = tx * T; this.y0 = ty * T;
      this.range = (o.range || (axis === 'x' ? C.range : C.vRange)) * T;
      this.period = (o.period || C.period) / mul;
      this.t = o.phase || 0;
      this.x = this.x0; this.y = this.y0; this.dx = 0; this.dy = 0;
    }
    update(dt) {
      this.t += dt;
      const s = pingpong(this.t, this.period);
      const nx = this.axis === 'x' ? this.x0 + s * this.range : this.x0;
      const ny = this.axis === 'y' ? this.y0 - s * this.range : this.y0;
      this.dx = nx - this.x; this.dy = ny - this.y;
      this.x = nx; this.y = ny;
    }
    draw(ctx, cx, cy, theme) { ctx.drawImage(LW.Props.movingPlatform(theme, this.w / T), Math.round(this.x - cx), Math.round(this.y - cy)); }
  }

  class Vanish {
    constructor(tx, ty, index, o, mul) {
      const C = H().vanish;
      this.kind = 'vanish'; this.platform = true;
      this.x = tx * T; this.y = ty * T; this.w = T; this.h = 8; this.dx = 0; this.dy = 0;
      this.solidT = (o.solid || C.solid) / mul; this.warnT = (o.warn || C.warn); this.goneT = (o.gone || C.gone) / mul;
      // each platform vanishes `stagger` seconds after the one before it (left to right),
      // so a bridge crumbles behind a player who keeps moving
      this.t = -index * C.stagger;
      this.update(0);
    }
    get cycle() { return this.solidT + this.warnT + this.goneT; }
    update(dt) {
      this.t += dt;
      const c = ((this.t % this.cycle) + this.cycle) % this.cycle;
      this.state = c < this.solidT ? 'solid' : c < this.solidT + this.warnT ? 'warn' : 'gone';
      this.active = this.state !== 'gone';
    }
    draw(ctx, cx, cy, theme, t) {
      let f = this.state === 'solid' ? 0 : this.state === 'warn' ? (Math.floor(t * 14) % 2 ? 1 : 0) : 2;
      if (this.state === 'warn' && f === 0) f = 1;
      const shake = this.state === 'warn' ? (Math.floor(t * 30) % 2) : 0;
      ctx.drawImage(LW.Props.vanishPlatform(f), Math.round(this.x - cx) + shake, Math.round(this.y - cy));
    }
  }

  class FallBlock {
    constructor(tx, ty, o, mul) {
      this.kind = 'fallBlock'; this.platform = true; this.active = true;
      this.C = Object.assign({}, H().fallBlock, o);
      this.mul = mul;
      this.homeY = ty * T;
      this.x = tx * T; this.y = this.homeY; this.w = T; this.h = T; this.dx = 0; this.dy = 0;
      this.state = 'idle'; this.t = 0;
    }
    set(s) { this.state = s; this.t = 0; }
    update(dt, w) {
      const C = this.C, p = w.player, L = w.level;
      this.t += dt;
      const oy = this.y;
      if (this.state === 'idle') {
        const pcx = p.x + p.w / 2;
        if (Math.abs(pcx - (this.x + T / 2)) < C.trigger * T && p.y > this.y + this.h - 2) { this.set('shake'); w.emit('rumble', { x: this.x + T / 2, y: this.y }); }
      } else if (this.state === 'shake') {
        if (this.t > C.shake) this.set('fall');
      } else if (this.state === 'fall') {
        this.y += C.fallSpeed * dt;
        const ty = Math.floor((this.y + this.h) / T);
        if (L.at(Math.floor((this.x + 2) / T), ty) === LW.Level.SOLID || L.at(Math.floor((this.x + T - 2) / T), ty) === LW.Level.SOLID) {
          this.y = ty * T - this.h; this.set('rest'); w.emit('thud', { x: this.x + T / 2, y: this.y + this.h });
        } else if (this.y > L.ph + 40) { this.y = this.homeY; this.set('idle'); }
      } else if (this.state === 'rest') {
        if (this.t > C.rest / this.mul) this.set('rise');
      } else if (this.state === 'rise') {
        this.y = Math.max(this.homeY, this.y - C.riseSpeed * this.mul * dt);
        if (this.y <= this.homeY) this.set('idle');
      }
      this.dy = this.y - oy;
      this.active = this.state !== 'fall';
      this.harmful = this.state === 'fall';
      this.warn = this.state === 'shake';
    }
    draw(ctx, cx, cy, theme, t) {
      const sx = this.state === 'shake' ? (Math.floor(t * 30) % 2 ? 1 : -1) : 0;
      LW.Sprites.draw(ctx, 'falling_block', 0, Math.round(this.x - cx) + sx, Math.round(this.y - cy), { topLeft: true });
      if (this.warn) LW.Props.drawWarning(ctx, Math.round(this.x + T / 2 - cx), Math.round(this.y - cy) - 2, t);
      if (this.state === 'rise') {          // the winch chain pulling it back up
        ctx.fillStyle = LW.PAL.E;
        for (let y = this.homeY; y < this.y; y += 3) ctx.fillRect(Math.round(this.x + T / 2 - cx), Math.round(y - cy), 1, 2);
      }
    }
  }

  class SwingSign {
    constructor(tx, ty, theme, o, mul) {
      const C = H().swingSign;
      this.kind = 'swingSign';
      this.px = tx * T + T / 2; this.py = ty * T;
      this.len = o.length || C.length; this.swing = o.swing || C.swing;
      this.period = (o.period || C.period) / mul;
      this.text = o.text || SIGN_TEXT[theme] || 'NO';
      this.t = o.phase || 0;
      this.bw = LW.Font.width(this.text, 1, 'small') + 8; this.bh = 13;
      this.update(0);
    }
    update(dt) {
      this.t += dt;
      this.angle = this.swing * Math.sin((this.t / this.period) * Math.PI * 2);
      const ex = this.px + Math.sin(this.angle) * this.len, ey = this.py + Math.cos(this.angle) * this.len;
      // hitbox: the board, slightly inset so near-misses feel fair
      this.x = Math.round(ex - this.bw / 2) + 2; this.y = Math.round(ey) + 2; this.w = this.bw - 4; this.h = this.bh - 4;
      this.harmful = true;
    }
    draw(ctx, cx, cy) { LW.Props.drawSwingSign(ctx, this.px - cx, this.py - cy, this.angle, this.len, this.text); }
  }

  class PopSpikes {
    constructor(tx, ty, index, o, mul) {
      const C = H().popSpikes;
      this.kind = 'popSpikes';
      this.tx = tx; this.ty = ty;
      this.x = tx * T + 2; this.y = ty * T + 8; this.w = T - 4; this.h = 8;
      this.hiddenT = (o.hidden || C.hidden) / mul; this.warnT = o.warn || C.warn; this.outT = (o.out || C.out) / mul;
      this.t = -index * C.stagger;
      this.update(0);
    }
    update(dt) {
      this.t += dt;
      const cyc = this.hiddenT + this.warnT + this.outT;
      const c = ((this.t % cyc) + cyc) % cyc;
      this.state = c < this.hiddenT ? 'hidden' : c < this.hiddenT + this.warnT ? 'warn' : 'out';
      this.harmful = this.state === 'out';
    }
    draw(ctx, cx, cy) {
      LW.Sprites.draw(ctx, 'spikes_retract', this.state === 'hidden' ? 0 : this.state === 'warn' ? 1 : 2, this.tx * T - cx, this.ty * T - cy, { topLeft: true });
    }
  }

  // Build every hazard for a level. Consecutive identical letters on a row get a sequence
  // index so they fire one after another (a readable "wave").
  function build(level, diff) {
    const mul = diff.hazardSpeed || 1;
    const over = level.def.hazards || {};
    const list = [];
    const run = {};
    for (const e of level.entities) {
      const o = over[e.tx + ',' + e.ty] || {};
      const prev = run[e.type];
      const idx = (prev && prev.ty === e.ty && prev.tx === e.tx - 1) ? prev.idx + 1 : 0;
      run[e.type] = { tx: e.tx, ty: e.ty, idx };
      switch (e.type) {
        case 'M': list.push(new Mover(e.tx, e.ty, 'x', o, mul)); break;
        case 'V': list.push(new Mover(e.tx, e.ty, 'y', o, mul)); break;
        case 'D': list.push(new Vanish(e.tx, e.ty, o.index != null ? o.index : idx, o, mul)); break;
        case 'F': list.push(new FallBlock(e.tx, e.ty, o, mul)); break;
        case 'W': list.push(new SwingSign(e.tx, e.ty, level.theme, o, mul)); break;
        case 'R': list.push(new PopSpikes(e.tx, e.ty, o.index != null ? o.index : idx, o, mul)); break;
      }
    }
    return list;
  }

  LW.Hazards = { build, Mover, Vanish, FallBlock, SwingSign, PopSpikes, TYPES: 'MVDFWR' };
})();

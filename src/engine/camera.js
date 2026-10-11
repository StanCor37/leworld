// Camera: follows Hunter horizontally with look-ahead in the facing direction,
// eases smoothly (no snapping) and only moves vertically past a small deadzone.
(function () {
  function Camera() { this.x = 0; this.y = 0; this.look = 0; }

  Camera.prototype.snap = function (p, level) {
    this.look = p.facing * LW.CFG.camera.lookAhead;
    this.x = this.targetX(p);
    this.y = p.y + p.h - LW.VIEW_H * 0.65;
    this.clamp(level);
  };

  Camera.prototype.targetX = function (p) { return p.x + p.w / 2 + this.look - LW.VIEW_W / 2; };

  Camera.prototype.update = function (dt, p, level) {
    const C = LW.CFG.camera;
    // look-ahead glides toward the facing side rather than flipping instantly
    const want = p.facing * C.lookAhead;
    this.look += (want - this.look) * Math.min(1, dt * 2.5);
    this.x += (this.targetX(p) - this.x) * Math.min(1, dt * C.followX);
    // vertical: keep feet around 65% down the screen, with a deadzone
    const feetScreen = p.y + p.h - this.y;
    const ideal = LW.VIEW_H * 0.65;
    const off = feetScreen - ideal;
    if (Math.abs(off) > C.deadzoneY) this.y += (off - Math.sign(off) * C.deadzoneY) * Math.min(1, dt * C.followY);
    this.clamp(level);
  };

  Camera.prototype.clamp = function (level) {
    this.x = Math.max(0, Math.min(this.x, level.pw - LW.VIEW_W));
    this.y = Math.max(0, Math.min(this.y, level.ph - LW.VIEW_H));
  };

  LW.Camera = Camera;
})();

// Hunter: movement, jumping, crouching and animation state.
// update() is pure simulation (controls in, state out) so it can be tested headlessly.
(function () {
  const Ph = () => LW.Physics;

  function Player(x, feetY) {
    const C = LW.CFG.player;
    this.w = C.w; this.h = C.h;
    this.reset(x, feetY);
  }

  // x = centre, feetY = bottom of the hitbox.
  Player.prototype.reset = function (x, feetY) {
    const C = LW.CFG.player;
    this.h = C.h;
    this.x = x - this.w / 2; this.y = feetY - this.h;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.facing = 1;
    this.crouching = false;
    this.coyote = 0;
    this.buffer = 0;
    this.invuln = 0;
    this.hurtTimer = 0;
    this.anim = 'hunter_idle'; this.animT = 0;
    this.fireAnim = 0;
    this.justJumped = false; this.justLanded = false; this.justStomped = false;
  };

  Player.prototype.setCrouch = function (on, level) {
    const C = LW.CFG.player;
    if (on === this.crouching) return true;
    const feet = this.y + this.h;
    const nh = on ? C.crouchH : C.h;
    // Standing up needs headroom.
    if (!on && level.overlaps(this.x, feet - nh, this.w, nh - this.h, LW.Level.SOLID)) return false;
    this.h = nh; this.y = feet - nh; this.crouching = on;
    return true;
  };

  Player.prototype.update = function (dt, c, level) {
    const C = LW.CFG.player;
    const wasGround = this.onGround;
    this.justJumped = this.justLanded = false;

    // Timers
    if (c.jumpPressed) this.buffer = C.jumpBuffer; else this.buffer = Math.max(0, this.buffer - dt);
    this.coyote = this.onGround ? C.coyoteTime : Math.max(0, this.coyote - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.fireAnim = Math.max(0, this.fireAnim - dt);

    // Crouch: only on the ground; stays crouched under low ceilings until there is room.
    if (c.down && this.onGround) this.setCrouch(true, level);
    else if (this.crouching) this.setCrouch(false, level);

    // Horizontal
    let dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    if (this.hurtTimer > 0) dir = 0;
    if (this.crouching && this.onGround) dir = 0;
    if (dir) this.facing = dir;
    if (dir) {
      const reversing = this.vx * dir < 0;
      const a = this.onGround ? (reversing ? C.turnAccel : C.accel) : C.airAccel;
      this.vx = Ph().approach(this.vx, dir * C.maxSpeed, a * dt);
    } else {
      this.vx = Ph().approach(this.vx, 0, (this.onGround ? C.decel : C.airDecel) * dt);
    }

    // Jump: fixed height. Release of the button is deliberately ignored.
    if (this.buffer > 0 && (this.onGround || this.coyote > 0) && (!this.crouching || this.setCrouch(false, level))) {
      this.vy = -C.jumpVel;
      this.onGround = false;
      this.coyote = 0; this.buffer = 0;
      this.justJumped = true;
    }

    // Gravity and movement
    this.vy = Math.min(this.vy + C.gravity * dt, C.maxFall);
    Ph().moveX(this, level, this.vx * dt);
    Ph().moveY(this, level, this.vy * dt);
    if (this.onGround && !wasGround) this.justLanded = true;

    this.updateAnim(dt);
  };

  // Called by the game when Hunter lands on an enemy.
  Player.prototype.stomp = function () {
    this.vy = -LW.CFG.player.stompBounce;
    this.onGround = false;
    this.coyote = 0;
    this.justStomped = true;
  };

  // Knockback away from a source x. Returns false while invulnerable.
  Player.prototype.hurt = function (fromX, invulnTime) {
    const C = LW.CFG.player;
    if (this.invuln > 0) return false;
    const away = (this.x + this.w / 2) < fromX ? -1 : 1;
    this.vx = away * C.hurtKnockX;
    this.vy = -C.hurtKnockY;
    this.onGround = false;
    this.invuln = invulnTime || 1.2;
    this.hurtTimer = 0.35;
    return true;
  };

  Player.prototype.updateAnim = function (dt) {
    let a;
    if (this.hurtTimer > 0) a = 'hunter_hurt';
    else if (this.crouching) a = 'hunter_crouch';
    else if (this.fireAnim > 0) a = 'hunter_fire';
    else if (!this.onGround) a = this.vy < 0 ? 'hunter_jump' : 'hunter_fall';
    else if (Math.abs(this.vx) > 8) a = 'hunter_run';
    else a = 'hunter_idle';
    if (a !== this.anim) { this.anim = a; this.animT = 0; }
    // Run cycle speeds up with velocity.
    this.animT += dt * (a === 'hunter_run' ? 4 + Math.abs(this.vx) / 12 : a === 'hunter_idle' ? 2 : 8);
  };

  Player.prototype.draw = function (ctx, camX, camY, rim) {
    if (this.invuln > 0 && this.hurtTimer <= 0 && Math.floor(this.invuln * 16) % 2) return; // blink
    LW.Sprites.draw(ctx, this.anim, Math.floor(this.animT), Math.round(this.x + this.w / 2 - camX), Math.round(this.y + this.h - camY),
      { flip: this.facing < 0, rim, flash: this.hurtTimer > 0.25 });
  };

  LW.Player = Player;
})();

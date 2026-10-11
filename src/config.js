// LeWorld tuning. Movement, enemy and camera numbers live here so they are easy to adjust.
// Units: pixels and seconds (internal resolution 320x180, tiles are 16px).
window.LW = window.LW || {};

LW.CFG = {
  STEP: 1 / 120,            // fixed simulation step

  player: {
    w: 10, h: 22,           // standing hitbox
    crouchH: 14,            // crouching hitbox height (feet stay put)
    maxSpeed: 115,          // top running speed
    accel: 1100,            // ground acceleration
    turnAccel: 1900,        // ground acceleration when reversing direction (snappy turns)
    decel: 1300,            // ground braking with no input
    airAccel: 800,          // air control
    airDecel: 250,          // air drag with no input (keeps a little momentum)
    gravity: 950,
    maxFall: 320,
    jumpHeight: 58,         // fixed jump apex in px (about 3.6 tiles); releasing early does NOT shorten it
    coyoteTime: 0.10,       // can still jump this long after walking off a ledge
    jumpBuffer: 0.12,       // a jump pressed this long before landing still fires
    stompBounce: 210,       // upward speed after stomping an enemy
    stompGrace: 7,          // px: feet may be this far below an enemy's top and still count as a stomp
    hurtKnockX: 110, hurtKnockY: 160,
    maxHearts: 3
  },

  // Collectibles and the Radical Reader power-up.
  rules: {
    bookPoints: 100,
    toolPoints: 50,
    booksToUnlock: 3,       // books collected in one attempt to unlock firing
    toolsPerRepair: 3       // tools per repair charge (+1 heart)
  },

  shot: {
    speed: 190,             // px/s
    range: 230,             // px before it fizzles
    maxActive: 2,           // simultaneous shots on screen
    hitbox: 8
  },

  // Difficulty modes. Both keep three hearts, unlimited retries and the same story.
  difficulty: {
    casual: {
      label: 'CASUAL', tagline: 'LET ME GET TO MY DATE',
      enemySpeed: 0.75,     // multiplier on enemy movement and attack tempo
      hazardSpeed: 0.85,    // multiplier on timed hazard cycles
      fireCooldown: 0.35,
      invulnTime: 1.6,
      extraTools: true,     // map 'T' tools only appear in casual
      widePlatforms: true   // map '+' ground only exists in casual (wider landings)
    },
    challenge: {
      label: 'CHALLENGE', tagline: 'LOVE TAKES EFFORT',
      enemySpeed: 1.25,
      hazardSpeed: 1.15,
      fireCooldown: 0.55,
      invulnTime: 1.0,
      extraTools: false,
      widePlatforms: false
    }
  },

  camera: {
    lookAhead: 48,          // px of extra space shown in the facing direction
    followX: 5,             // horizontal smoothing (higher = snappier)
    followY: 4,
    deadzoneY: 20           // vertical wiggle room before the camera moves
  },

  // Enemy behaviour. Distances in tiles where noted, speeds in px/s, times in seconds.
  // Movement speeds and waits scale with difficulty; telegraph (warning) times never shrink.
  enemies: {
    walker: { speed: 28 },
    ex: {
      notice: 7,            // tiles: starts pursuing when Hunter is this close
      leash: 6,             // tiles: never strays further than this from home
      speed: 46, pursueTime: 1.6,
      gestureTime: 1.1,     // dramatic flex (standing still)
      windupTime: 0.55,     // "!" before a charge
      chargeSpeed: 150, chargeTime: 0.7, recoverTime: 0.7
    },
    suitor: { speed: 22, range: 9, aimTime: 0.5, bubbleSpeed: 55, cooldown: 2.6 },
    agitator: {
      marchSpeed: 30, marchTime: 1.4, marchesBeforeCharge: 2, range: 10,
      telegraphTime: 0.75, chargeSpeed: 120, chargeTime: 0.6, resetTime: 0.6
    },
    preacher: { range: 12, interval: 2.0, raiseTime: 0.45, flightTime: 1.1 },
    inspector: { speed: 24, inspectEvery: 3.5, inspectTime: 1.2 },
    pontiff: {
      restTime: 0.9, windupTime: 0.6,
      attacksPerPhase: [3, 4, 3],
      tiredTime: 2.8,       // the window to hit him
      scrollFlight: 1.1, blahSpeed: 85, amenSpeed: 95
    }
  },

  projectiles: { scrollGravity: 420, maxAge: 8 },

  // Timed hazards. Every one has a visible warning phase and a fixed, learnable rhythm.
  hazards: {
    mover: { range: 4, vRange: 3, period: 4.0, width: 2 },   // tiles / seconds per round trip
    vanish: { solid: 2.2, warn: 0.7, gone: 1.4, stagger: 0.3 },   // stagger: delay between neighbours
    fallBlock: { trigger: 1.2, shake: 0.55, fallSpeed: 360, rest: 1.4, riseSpeed: 40 },
    swingSign: { length: 34, swing: 0.95, period: 2.6 },
    popSpikes: { hidden: 1.8, warn: 0.6, out: 1.2, stagger: 0 }   // stagger 0 = a row moves together
  }
};

// Derived: jump launch speed that reaches exactly jumpHeight with the fixed-step integrator
// (v^2/2g - v*dt/2 = h, solved for v).
(function () {
  const P = LW.CFG.player, a = P.gravity * LW.CFG.STEP / 2;
  P.jumpVel = a + Math.sqrt(a * a + 2 * P.gravity * P.jumpHeight);
})();

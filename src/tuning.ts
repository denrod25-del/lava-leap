export const TUNING = {
  // Canvas (portrait climber). Width is freely tunable — set-piece templates and
  // all scene layout are derived from it, so changing this one value rescales the
  // playfield. 600 keeps the portrait identity while filling more of a wide window.
  width: 600,
  height: 720,

  // Physics (Arcade, pixels, seconds)
  gravityY: 1800,
  moveSpeed: 220,
  jumpVelocity: 650,        // magnitude of initial jump impulse
  doubleJumpVelocity: 560,
  jumpCutMultiplier: 0.45,  // velocity retained on early jump release
  dashSpeed: 520,
  dashDurationMs: 160,
  dashCooldownRefreshOnLand: true,
  wallSlideMax: 90,         // max downward speed while wall-sliding
  wallJumpX: 300,
  wallJumpY: 560,

  // Feel helpers
  coyoteMs: 90,
  jumpBufferMs: 110,
  bouncePadVelocity: 1040,  // ≈1.6× jumpVelocity 650
  stompBounceVelocity: 350, // upward kick after a successful enemy stomp

  // World
  groundY: 640,             // y of the starting platform's top
  playerStartX: 300,        // centered: width / 2

  // Player presentation vs collision: the sprite is drawn a touch larger than its
  // hitbox for presence. Hitbox (playerBody*) is what gameplay is tuned against and
  // must not change; display (playerDisplay*) is purely visual. Source art is 48x48.
  playerDisplayW: 30,
  playerDisplayH: 40,
  playerBodyW: 24,
  playerBodyH: 32,
} as const;

// Generator reach budget — kept strictly below true physics reach (with margin),
// then validated live. Generator NEVER produces a gap exceeding these.
export const REACH = {
  minVerticalGap: 70,
  maxVerticalGap: 140,      // single+double jump apex exceeds this comfortably
  maxHorizontalEdgeGap: 165,// edge-to-edge horizontal gap the player can clear
  minPlatformWidth: 56,
  maxPlatformWidth: 150,
  difficultySpan: 4000,     // height (px) over which difficulty ramps 0 -> 1
  coinChance: 0.28,
  movingRangeBase: 60,
  movingRangeSpan: 60,
  movingSpeedBase: 40,
  movingSpeedSpan: 50,
} as const;

export const STREAM = {
  generateMargin: 200,
} as const;

export const SETPIECE = {
  minInterval: 15, // parametric platforms between chunks (inclusive)
  maxInterval: 25,
} as const;

export const HAZARD = {
  graceHeight: 400,        // no bounce/enemies/powerups below this height
  bounceChance: 0.06,      // flat
  enemyBaseChance: 0.05,
  enemyChancePerT: 0.20,
  drifterShare: 0.4,       // of enemies, fraction that are drifters
  powerupChance: 0.03,     // per eligible platform
} as const;

export const POWERUP = {
  rocketMs: 2000, rocketVelocity: 900,
  magnetMs: 8000, magnetRadius: 160, magnetPull: 320,
  slowLavaMs: 6000, slowLavaFactor: 0.5,
  pickupSize: 16,
} as const;

export const ENEMY = {
  crawlerSpeed: 55,      // px/s patrol speed
  drifterAmplitude: 30,  // px sine bob amplitude
  drifterFreq: 1.4,      // Hz of sine bob
  drifterHoverH: 28,     // px above platform top
  stompWindow: 12,       // px: player feet must be above enemy top by this much
  bodyW: 20,
  bodyH: 20,
} as const;

export const AUTOPILOT = {
  bounceVelocity: 820,   // apex ≈ v²/(2·gravityY); 820²/(2·1800) ≈ 187px > REACH.maxVerticalGap
  steerMaxSpeed: 260,    // px/s cap on follow-finger horizontal speed
  steerGain: 9,          // horizontal velocity per px of (fingerX - playerX) offset
} as const;

export const JUICE = {
  jumpSquashX: 0.8, jumpStretchY: 1.2,
  landSquashX: 1.25, landSquashY: 0.75,
  squashMs: 120,
  shakeSmall: { duration: 80, intensity: 0.004 },
  shakeBig: { duration: 250, intensity: 0.012 },
  popupRise: 28, popupMs: 600,
  slowMoScale: 3,      // Arcade world.timeScale (>1 = slower)
  slowMoMs: 400,
  emberRatePerSec: 14,
} as const;

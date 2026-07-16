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
  fastFallSpeed: 640,       // px/s dive speed while fast-falling (airborne, descending)

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
  powerupChance: 0.06,     // per eligible platform (was 0.03 — ~2x across all 4 kinds)
  rocketUnlockHeight: 4000, // endless/daily only — Levels Mode passes Infinity (never gated)
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

// Touch run-joystick tuning (left-half floating stick → runAxis ∈ [-1,1]).
export const TOUCH = {
  joystickRange: 60,     // px of finger travel from the origin = full run
  joystickDeadzone: 8,   // px; within this the runAxis is 0 (stand still)
  fastFallThreshold: 40, // px the run stick must be pulled DOWN to fast-fall
} as const;

// AUTO control scheme (one-handed): hold anywhere = steer toward the finger,
// tap = dash (tap mid-dash = dash-jump launch), jumping is automatic.
export const AUTO = {
  steerRange: 140,   // px finger-to-player distance for full run speed
  steerDeadzone: 12, // px; closer than this = stand still
  tapMaxMs: 180,     // press shorter than this counts as a tap...
  tapMaxDrift: 14,   // ...if the finger moved less than this (px)
} as const;

export const COMBO = {
  step: 0.5,
  max: 5,
  decayMs: 2500,
} as const;

export const COMBO_POINTS = {
  coin: 10,
  stomp: 25,
  bounce: 5,
  powerup: 15,
} as const;

// Dash-Flow: momentum-as-a-resource. Builds airborne/dashing + on chain beats,
// drains when camping on the ground. value ∈ [0,1] maps to 4 tiers.
export const FLOW = {
  // Passive airborne build is deliberately a garnish: a no-dash hopper (~70% airtime)
  // plateaus around WARM. HOT/BLAZING require chain beats. (0.06 let hoppers reach
  // BLAZING passively in ~20s, trivializing the mastery layer.)
  buildAirbornePerSec: 0.02,
  buildDashingPerSec: 0.30,   // strong build while a dash is active
  beatBonus: 0.12,            // burst per chain beat (dash/cancel/coin/stomp/bounce)
  drainGroundPerSec: 0.25,    // drain while grounded past the grace window
  groundGraceMs: 350,         // brief ground touches don't drain
  tierThresholds: [0.25, 0.55, 0.85] as const, // Warm, Hot, Blazing lower bounds
  tierNames: ['COOL', 'WARM', 'HOT', 'BLAZING'] as const,
  heatMultipliers: [1, 1.25, 1.6, 2] as const, // score multiplier per tier
  speedNudge: [0, 0, 0.04, 0.08] as const,     // fraction added to moveSpeed per tier
  combinedCap: 8,             // max (combo.multiplier × heatMultiplier) for pickups
} as const;

export interface UpgradeDef { id: 'powerupDuration' | 'startShield' | 'revive'; name: string; maxLevel: number; costs: number[]; desc: string }
export const UPGRADES: UpgradeDef[] = [
  { id: 'powerupDuration', name: 'Power-Up Time', maxLevel: 3, costs: [150, 300, 500], desc: '+15% power-up duration / level' },
  { id: 'startShield',     name: 'Start Shield',  maxLevel: 1, costs: [400],          desc: 'Begin each run with a shield' },
  { id: 'revive',          name: 'Revive',        maxLevel: 1, costs: [600],          desc: 'Auto-revive once per run' },
];
export function powerupDurationFactor(level: number): number { return 1 + 0.15 * level; }

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

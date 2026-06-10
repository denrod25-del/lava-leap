export const TUNING = {
  // Canvas (portrait climber)
  width: 480,
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

  // World
  groundY: 640,             // y of the starting platform's top
  playerStartX: 240,
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

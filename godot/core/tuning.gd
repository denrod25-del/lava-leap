class_name Tuning
## Feel constants, ported from src/tuning.ts (TUNING). These are the STARTING
## point for the Godot build — physics integration differs from Phaser Arcade
## (fixed-step move_and_slide vs per-frame), so expect a re-tuning pass against
## the web build (see docs/GODOT-PORT-PLAN.md §7). Keep this the single source of
## truth for numbers; don't scatter literals through the actors.

# Canvas / play-field (portrait base; the viewport "expand"s around it).
const WIDTH := 600
const HEIGHT := 720

# Physics (pixels, seconds — Godot Y is down-positive, same as the web game).
const GRAVITY_Y := 1800.0
const MOVE_SPEED := 220.0
const JUMP_VELOCITY := 650.0          # magnitude of the initial jump impulse
const DOUBLE_JUMP_VELOCITY := 560.0
const JUMP_CUT_MULTIPLIER := 0.45     # velocity retained on early jump release
const DASH_SPEED := 520.0
const DASH_DURATION_MS := 160.0
const WALL_SLIDE_MAX := 90.0          # max downward speed while wall-sliding
const WALL_JUMP_X := 300.0
const WALL_JUMP_Y := 560.0
const FAST_FALL_SPEED := 640.0

# Feel helpers.
const COYOTE_MS := 90.0
const JUMP_BUFFER_MS := 110.0

# World.
const GROUND_Y := 640.0               # y of the starting platform's top
const PLAYER_START_X := 300.0
const PLAYER_BODY_W := 24.0
const PLAYER_BODY_H := 32.0
const PLAYER_DISPLAY_W := 30.0
const PLAYER_DISPLAY_H := 40.0
const PLATFORM_H := 16.0

# Rising lava (from src/entities/Lava.ts BASE_SPEED / SPEED_PER_HEIGHT, post-v0.12).
const LAVA_BASE_SPEED := 35.0
const LAVA_SPEED_PER_HEIGHT := 0.008
const LAVA_START_BELOW := 500.0       # starts this far below the ground platform

# Enemies (from src/tuning.ts ENEMY + src/tuning.ts HAZARD enemy rolls).
const ENEMY_CRAWLER_SPEED := 55.0     # px/s patrol speed along the platform
const ENEMY_DRIFTER_AMPLITUDE := 30.0 # px sine-bob amplitude
const ENEMY_DRIFTER_FREQ := 1.4       # Hz of the bob
const ENEMY_DRIFTER_HOVER_H := 28.0   # px the drifter floats above the platform top
const ENEMY_STOMP_WINDOW := 12.0      # px: feet-below-top slack that still counts as a stomp
const ENEMY_BODY_W := 20.0
const ENEMY_BODY_H := 20.0
const ENEMY_STOMP_BOUNCE := 520.0     # upward velocity awarded on a successful stomp

# Enemy spawn rolls (HAZARD.* in src/tuning.ts).
const ENEMY_BASE_CHANCE := 0.05
const ENEMY_CHANCE_PER_T := 0.20
const ENEMY_DRIFTER_SHARE := 0.4      # fraction of enemies that are drifters

# Hazard/pickup gating + rolls (HAZARD.* in src/tuning.ts). Below the grace
# height the climb stays clean — no bounce pads, enemies, or power-ups.
const HAZARD_GRACE_HEIGHT := 400.0
const BOUNCE_CHANCE := 0.06           # flat, static platforms only
const POWERUP_CHANCE := 0.20          # per eligible static platform

# Bounce pad (TUNING.bouncePadVelocity).
const BOUNCE_PAD_VELOCITY := 1040.0   # ~1.6x a normal jump

# Power-up effects (POWERUP.* in src/tuning.ts).
const POWERUP_ROCKET_MS := 2000.0
const POWERUP_ROCKET_VELOCITY := 900.0
const POWERUP_MAGNET_MS := 8000.0
const POWERUP_MAGNET_RADIUS := 160.0
const POWERUP_MAGNET_PULL := 320.0
const POWERUP_SLOWLAVA_MS := 6000.0
const POWERUP_SLOWLAVA_FACTOR := 0.5
const POWERUP_PICKUP_SIZE := 16.0

# Combo multiplier (COMBO in src/tuning.ts) — grows with pickup/kill actions,
# decays to 1 after a quiet window.
const COMBO_STEP := 0.5
const COMBO_MAX := 5.0
const COMBO_DECAY_MS := 2500.0

# Points each combo action is worth before the combo x heat multiplier
# (COMBO_POINTS in src/tuning.ts).
const COMBO_POINTS_COIN := 10
const COMBO_POINTS_STOMP := 25
const COMBO_POINTS_BOUNCE := 5
const COMBO_POINTS_POWERUP := 15

# Dash-Flow momentum meter (FLOW in src/tuning.ts). value in [0,1] -> 4 tiers.
const FLOW_BUILD_AIRBORNE_PER_SEC := 0.02
const FLOW_BUILD_DASHING_PER_SEC := 0.30
const FLOW_BEAT_BONUS := 0.12
const FLOW_DRAIN_GROUND_PER_SEC := 0.25
const FLOW_GROUND_GRACE_MS := 350.0
const FLOW_TIER_THRESHOLDS := [0.25, 0.55, 0.85]           # Warm/Hot/Blazing lower bounds
const FLOW_TIER_NAMES := ["COOL", "WARM", "HOT", "BLAZING"]
const FLOW_HEAT_MULTIPLIERS := [1.0, 1.25, 1.6, 2.0]       # score multiplier per tier
const FLOW_SPEED_NUDGE := [0.0, 0.0, 0.04, 0.08]           # move-speed fraction per tier
const FLOW_COMBINED_CAP := 8.0                             # max combo x heat for pickups

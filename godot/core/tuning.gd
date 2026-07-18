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
const ENEMY_GRACE_HEIGHT := 400.0     # no enemies below this climbed height
const ENEMY_BASE_CHANCE := 0.05
const ENEMY_CHANCE_PER_T := 0.20
const ENEMY_DRIFTER_SHARE := 0.4      # fraction of enemies that are drifters

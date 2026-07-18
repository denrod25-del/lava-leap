class_name Reach
## Generator reach budget, ported from src/tuning.ts (REACH). Kept strictly below
## true physics reach with margin; the generator NEVER produces a gap exceeding
## these, and tests/test_level_generator.gd proves it holds over a long stream.

const MIN_VERTICAL_GAP := 70.0
const MAX_VERTICAL_GAP := 140.0       # single + double jump apex clears this comfortably
const MAX_HORIZONTAL_EDGE_GAP := 165.0
const MIN_PLATFORM_WIDTH := 56.0
const MAX_PLATFORM_WIDTH := 150.0
const DIFFICULTY_SPAN := 4000.0       # px climbed over which difficulty ramps 0 -> 1
const COIN_CHANCE := 0.28
const MOVING_RANGE_BASE := 60.0
const MOVING_RANGE_SPAN := 60.0
const MOVING_SPEED_BASE := 40.0
const MOVING_SPEED_SPAN := 50.0

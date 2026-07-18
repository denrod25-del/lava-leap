class_name PlatformDesc
extends RefCounted
## Pure data for one platform — the Godot analogue of PlatformDescriptor in
## src/core/types.ts. `y` is the top edge in world px (smaller = higher).
## Phase-1 slice: hazards/enemies/powerups/bounce are not modelled yet (Phase 2).

var id: int
var x: float                 # left edge, world px
var y: float                 # top edge, world px
var width: float
var type: String = "static"  # "static" | "crumbling" | "moving"
var has_coin: bool = false
var move_range: float = 0.0  # px travel from origin to each extreme (moving only)
var move_speed: float = 0.0  # px/s

func is_moving() -> bool:
	return type == "moving" and move_range > 0.0

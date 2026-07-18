class_name Lava
extends Node2D
## Rising lava hazard. `surface_y` is the world y of the lava top (smaller =
## higher); it climbs faster the higher the player has gone, chasing them.
## Drawn in world space (node sits at the origin). Ported from src/entities/Lava.ts.

var surface_y: float

func _ready() -> void:
	surface_y = Tuning.GROUND_Y + Tuning.LAVA_START_BELOW
	z_index = -1
	queue_redraw()

## Advance the lava for this frame given how far the player has climbed.
## `factor` scales the rise speed (the slow-lava power-up passes < 1).
func rise(delta: float, height_climbed: float, factor: float = 1.0) -> void:
	var speed := (Tuning.LAVA_BASE_SPEED + Tuning.LAVA_SPEED_PER_HEIGHT * height_climbed) * factor
	surface_y -= speed * delta
	queue_redraw()

func _draw() -> void:
	# Wide enough to cover the viewport at any horizontal camera position.
	draw_rect(Rect2(-3000.0, surface_y, 6000.0, 8000.0), Color(0.95, 0.32, 0.10, 0.92))
	draw_rect(Rect2(-3000.0, surface_y, 6000.0, 6.0), Color(1.0, 0.82, 0.38))  # hot crust line

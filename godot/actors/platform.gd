class_name Platform
extends AnimatableBody2D
## One platform, built in code from a PlatformDesc so width can vary per instance.
## AnimatableBody2D (not StaticBody2D) so a moving platform carries the player
## standing on it. One-way collision lets the player jump up THROUGH platforms
## and land on top — standard climber feel.
##
## Phase-1 scope: static + moving. "crumbling" is drawn distinctly but doesn't
## crumble yet (Phase 2), so it currently behaves like a static platform.

var desc: PlatformDesc
var _origin_x: float
var _time := 0.0

func setup(d: PlatformDesc) -> void:
	desc = d
	_origin_x = d.x + d.width / 2.0
	position = Vector2(_origin_x, d.y + Tuning.PLATFORM_H / 2.0)
	sync_to_physics = true
	var shape := RectangleShape2D.new()
	shape.size = Vector2(d.width, Tuning.PLATFORM_H)
	var col := CollisionShape2D.new()
	col.shape = shape
	col.one_way_collision = true
	add_child(col)
	queue_redraw()

func _physics_process(delta: float) -> void:
	if desc != null and desc.is_moving():
		_time += delta
		# Smooth ping-pong of amplitude move_range; peak speed == move_speed.
		var off := desc.move_range * sin(_time * desc.move_speed / desc.move_range)
		position.x = _origin_x + off

func _draw() -> void:
	if desc == null:
		return
	var w := desc.width
	var h := Tuning.PLATFORM_H
	var body := Color(0.62, 0.55, 0.47)          # static: stone
	if desc.type == "crumbling":
		body = Color(0.78, 0.42, 0.28)           # crumbling: warm red
	elif desc.type == "moving":
		body = Color(0.42, 0.74, 0.82)           # moving: cyan
	draw_rect(Rect2(-w / 2.0, -h / 2.0, w, h), body)
	draw_rect(Rect2(-w / 2.0, -h / 2.0, w, 3.0), body.lightened(0.35))  # lit top edge

class_name Platform
extends AnimatableBody2D
## One platform, built in code from a PlatformDesc so width can vary per instance.
## AnimatableBody2D (not StaticBody2D) so a moving platform carries the player
## standing on it. One-way collision lets the player jump up THROUGH platforms
## and land on top — standard climber feel.

const CRUMBLE_DELAY := 0.45   # seconds after first stood-on before it drops away

var desc: PlatformDesc
var _origin_x: float
var _time := 0.0
var _col: CollisionShape2D
var _crumbling := false
var _crumble_t := 0.0

func setup(d: PlatformDesc) -> void:
	desc = d
	_origin_x = d.x + d.width / 2.0
	position = Vector2(_origin_x, d.y + Tuning.PLATFORM_H / 2.0)
	sync_to_physics = true
	var shape := RectangleShape2D.new()
	shape.size = Vector2(d.width, Tuning.PLATFORM_H)
	_col = CollisionShape2D.new()
	_col.shape = shape
	_col.one_way_collision = true
	add_child(_col)
	queue_redraw()

## Called by the game when the player is standing on this platform.
func on_stood() -> void:
	if desc != null and desc.type == "crumbling" and not _crumbling:
		_crumbling = true
		_crumble_t = CRUMBLE_DELAY

func _physics_process(delta: float) -> void:
	if desc != null and desc.is_moving():
		_time += delta
		# Smooth ping-pong of amplitude move_range; peak speed == move_speed.
		var off := desc.move_range * sin(_time * desc.move_speed / desc.move_range)
		position.x = _origin_x + off

	if _crumbling:
		_crumble_t -= delta
		modulate.a = clampf(_crumble_t / CRUMBLE_DELAY, 0.15, 1.0)
		if _crumble_t <= 0.0 and _col != null and not _col.disabled:
			_col.set_deferred("disabled", true)   # drop the floor out from under
			modulate.a = 0.0

func _draw() -> void:
	if desc == null:
		return
	var w := desc.width
	var h := Tuning.PLATFORM_H
	var body := Color(0.62, 0.55, 0.47)          # static: stone
	if desc.bounce:
		body = Color(0.36, 0.86, 0.45)           # bounce pad: springy green
	elif desc.type == "crumbling":
		body = Color(0.78, 0.42, 0.28)           # crumbling: warm red
	elif desc.type == "moving":
		body = Color(0.42, 0.74, 0.82)           # moving: cyan
	draw_rect(Rect2(-w / 2.0, -h / 2.0, w, h), body)
	draw_rect(Rect2(-w / 2.0, -h / 2.0, w, 3.0), body.lightened(0.35))  # lit top edge
	if desc.bounce:
		# A chevron cue that this platform will launch you.
		var cy := -h / 2.0 - 4.0
		draw_line(Vector2(-8.0, cy), Vector2(0.0, cy - 6.0), Color(0.7, 1.0, 0.8), 2.0)
		draw_line(Vector2(0.0, cy - 6.0), Vector2(8.0, cy), Color(0.7, 1.0, 0.8), 2.0)

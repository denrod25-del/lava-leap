class_name Fireball
extends Area2D
## A Lava Titan projectile: rises from the lava on a straight vertical path and is
## lethal on contact — unless the player is dashing (i-frames), in which case it
## passes through, matching the web boss. Self-frees after a few seconds aloft.

signal hit_player

const RADIUS := 8.0
const LIFETIME := 4.0

var _vy := -260.0   # upward
var _age := 0.0

func setup(vy: float) -> void:
	_vy = vy

func _ready() -> void:
	var shape := CircleShape2D.new()
	shape.radius = RADIUS
	var col := CollisionShape2D.new()
	col.shape = shape
	add_child(col)
	body_entered.connect(_on_body_entered)
	z_index = 6
	queue_redraw()

func _physics_process(delta: float) -> void:
	_age += delta
	position.y += _vy * delta
	if _age > LIFETIME:
		queue_free()

func _on_body_entered(body: Node) -> void:
	if body is Player:
		if (body as Player).is_dashing():
			return  # dash i-frames: the fireball passes through
		hit_player.emit()
		queue_free()

func _draw() -> void:
	draw_circle(Vector2.ZERO, RADIUS + 2.0, Color(1.0, 0.35, 0.0, 0.35))  # glow
	draw_circle(Vector2.ZERO, RADIUS, Color(1.0, 0.48, 0.0))
	draw_circle(Vector2.ZERO, RADIUS * 0.5, Color(1.0, 0.86, 0.42))

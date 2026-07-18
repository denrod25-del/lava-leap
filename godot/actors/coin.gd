class_name Coin
extends Area2D
## A collectible coin that floats above a platform (parented to it, so it moves
## and prunes with the platform). Emits `collected` when the player touches it.

signal collected

const RADIUS := 8.0

func _ready() -> void:
	var shape := CircleShape2D.new()
	shape.radius = RADIUS
	var col := CollisionShape2D.new()
	col.shape = shape
	add_child(col)
	body_entered.connect(_on_body_entered)
	queue_redraw()

func _on_body_entered(body: Node) -> void:
	if body is Player:
		collected.emit()
		queue_free()

func _draw() -> void:
	draw_circle(Vector2.ZERO, RADIUS, Color(1.0, 0.82, 0.25))
	draw_circle(Vector2.ZERO, RADIUS * 0.55, Color(1.0, 0.92, 0.55))

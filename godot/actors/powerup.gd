class_name Powerup
extends Area2D
## A floating power-up pickup, parented to its platform (rides moving platforms,
## prunes with the platform). Emits `collected(kind)` when the player touches it.
## Ported from src/entities/PowerupController.ts — one of rocket / shield /
## magnet / slowlava, each a distinctly coloured disc with a hand-drawn glyph.

signal collected(kind: String)

const COLORS := {
	"rocket": Color(1.0, 0.482, 0.239),
	"shield": Color(0.4, 0.867, 1.0),
	"magnet": Color(1.0, 0.82, 0.4),
	"slowlava": Color(0.604, 0.478, 1.0),
}

var _kind := "rocket"
var _pulse := 0.0

func setup(kind: String) -> void:
	_kind = kind
	var shape := CircleShape2D.new()
	shape.radius = Tuning.POWERUP_PICKUP_SIZE / 2.0
	var col := CollisionShape2D.new()
	col.shape = shape
	add_child(col)
	body_entered.connect(_on_body_entered)
	queue_redraw()

func _process(delta: float) -> void:
	# Purely visual bob of the glyph; the collision circle stays fixed size.
	_pulse += delta
	queue_redraw()

func _on_body_entered(body: Node) -> void:
	if body is Player:
		collected.emit(_kind)
		queue_free()

func _draw() -> void:
	var r := Tuning.POWERUP_PICKUP_SIZE / 2.0
	var scale := 1.0 + 0.12 * sin(_pulse * 3.0)
	var color: Color = COLORS.get(_kind, Color.WHITE)
	draw_circle(Vector2.ZERO, r * scale, color)
	draw_circle(Vector2.ZERO, r * scale * 0.62, Color(color.r, color.g, color.b, 0.45))
	_draw_glyph(r * scale)

## Blocky white glyph per kind so pickups read before you clock the colour.
func _draw_glyph(r: float) -> void:
	var w := Color.WHITE
	match _kind:
		"rocket":
			var pts := PackedVector2Array([
				Vector2(0, -r * 0.7), Vector2(r * 0.5, r * 0.45),
				Vector2(0, r * 0.15), Vector2(-r * 0.5, r * 0.45)])
			draw_colored_polygon(pts, w)
		"shield":
			var pts := PackedVector2Array([
				Vector2(0, -r * 0.7), Vector2(r * 0.55, -r * 0.3),
				Vector2(r * 0.55, r * 0.2), Vector2(0, r * 0.7),
				Vector2(-r * 0.55, r * 0.2), Vector2(-r * 0.55, -r * 0.3)])
			draw_polyline(_closed(pts), w, 2.0)
		"magnet":
			draw_arc(Vector2(0, -r * 0.1), r * 0.55, PI, TAU, 12, w, 2.0)
			draw_line(Vector2(-r * 0.55, -r * 0.1), Vector2(-r * 0.55, r * 0.55), w, 2.0)
			draw_line(Vector2(r * 0.55, -r * 0.1), Vector2(r * 0.55, r * 0.55), w, 2.0)
		"slowlava":
			draw_arc(Vector2.ZERO, r * 0.6, 0.0, TAU, 16, w, 2.0)
			draw_line(Vector2.ZERO, Vector2(0, -r * 0.45), w, 2.0)
			draw_line(Vector2.ZERO, Vector2(r * 0.35, r * 0.12), w, 2.0)

func _closed(pts: PackedVector2Array) -> PackedVector2Array:
	var out := PackedVector2Array(pts)
	out.append(pts[0])
	return out

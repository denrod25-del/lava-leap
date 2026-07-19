class_name Titan
extends Node2D
## The Lava Titan's body — sits at the lava surface during an encounter. Uses the
## boss art if present, else a menacing drawn dome so the fight still reads.

const TEX_PATH := "res://assets/boss/titan.png"
const DISPLAY := 152.0

var _tex: Texture2D

func _ready() -> void:
	if ResourceLoader.exists(TEX_PATH):
		_tex = load(TEX_PATH)
	z_index = 4
	queue_redraw()

func _draw() -> void:
	if _tex != null:
		# Anchor the art so its base sits on the origin (the lava line).
		var rect := Rect2(-DISPLAY / 2.0, -DISPLAY, DISPLAY, DISPLAY)
		draw_texture_rect(_tex, rect, false)
	else:
		draw_circle(Vector2(0.0, -20.0), 70.0, Color(0.48, 0.06, 0.12))
		draw_circle(Vector2(-24.0, -34.0), 8.0, Color(1.0, 0.7, 0.2))  # eyes
		draw_circle(Vector2(24.0, -34.0), 8.0, Color(1.0, 0.7, 0.2))

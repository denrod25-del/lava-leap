extends Control
## Game Over screen. Reads the finished run's stats from RunResult and offers a
## quick restart. A brief input lock stops the death-frame keypress from
## instantly restarting. Controller + keyboard + touch all continue the same way.

const RESTART_LOCK := 0.6   # seconds before input is accepted

var _lock := RESTART_LOCK
var _hint: Label

func _ready() -> void:
	Engine.time_scale = 1.0  # in case a death-frame hit-stop was still active
	# Don't let any Control swallow the tap/click that restarts — let it fall
	# through to _unhandled_input.
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var cx := Tuning.WIDTH / 2.0

	var bg := ColorRect.new()
	bg.color = Color(0.055, 0.031, 0.043, 0.92)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	SaveData.load_data()
	_add_label("GAME OVER", cx, 140.0, 46, Color(1.0, 0.42, 0.2))
	if RunResult.is_best:
		_add_label("NEW BEST!", cx, 190.0, 20, Color(1.0, 0.82, 0.35))

	_add_label("SCORE", cx, 250.0, 16, Color(0.7, 0.74, 0.82))
	_add_label(str(RunResult.score), cx, 280.0, 40, Color.WHITE)
	_add_label("Best  %d" % RunResult.best, cx, 330.0, 16, Color(1.0, 0.82, 0.35))

	_add_label("Height  %d      Coins  %d      Kills  %d"
		% [RunResult.height, RunResult.coins, RunResult.kills],
		cx, 384.0, 15, Color(0.62, 0.68, 0.78))
	_add_label("+%d coins banked      Bank  %d" % [RunResult.banked, SaveData.coin_bank],
		cx, 414.0, 15, Color(1.0, 0.82, 0.35))

	_hint = _add_label("", cx, 500.0, 18, Color(0.09, 0.88, 0.88))
	_hint.visible = false

func _add_label(text: String, cx: float, y: float, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	# Anchor a full-width label centred on cx by offsetting half the width.
	l.size = Vector2(Tuning.WIDTH, size + 8)
	l.position = Vector2(cx - Tuning.WIDTH / 2.0, y)
	add_child(l)
	return l

func _process(delta: float) -> void:
	if _lock > 0.0:
		_lock -= delta
		if _lock <= 0.0:
			_hint.text = "SPACE / tap to climb again      ESC for menu"
			_hint.visible = true

func _unhandled_input(event: InputEvent) -> void:
	if _lock > 0.0:
		return
	if event.is_action_pressed("ui_cancel") or event.is_action_pressed("pause"):
		Audio.play("ui_move", -2.0, 0.0)
		get_tree().change_scene_to_file("res://scenes/menu.tscn")
	elif event.is_action_pressed("jump") or event.is_action_pressed("ui_accept") \
			or (event is InputEventMouseButton and event.pressed) \
			or (event is InputEventScreenTouch and event.pressed):
		Audio.play("ui_select", -2.0, 0.0)
		get_tree().change_scene_to_file("res://scenes/game.tscn")

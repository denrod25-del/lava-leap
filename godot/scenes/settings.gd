extends Control
## Options screen: music/SFX volume and the screen-shake toggle. Changes apply and
## persist immediately (GameSettings + Audio). Reached from the menu; ESC returns.
## Keyboard/gamepad: ↑/↓ select, ←/→ adjust, ESC back. On-screen arrows mirror it
## for touch.

const ROWS := ["Music volume", "SFX volume", "Screen shake"]

var _idx := 0
var _rows: Array[Label] = []

func _ready() -> void:
	Engine.time_scale = 1.0
	var cx := Tuning.WIDTH / 2.0

	var bg := ColorRect.new()
	bg.color = Color(0.055, 0.031, 0.043, 0.96)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	_add_label("SETTINGS", cx, 130, 34, Color(1.0, 0.69, 0.4))
	for i in ROWS.size():
		var l := _add_label("", cx, 240 + i * 56, 20, Color.WHITE)
		_rows.append(l)
	_add_label("↑/↓ select    ←/→ adjust    ESC back", cx, 470, 14, Color(0.55, 0.6, 0.7))

	# On-screen controls for touch.
	_tap_button(cx - 150, 540, "▲", func() -> void: _move(-1))
	_tap_button(cx - 90, 540, "▼", func() -> void: _move(1))
	_tap_button(cx - 20, 540, "◀", func() -> void: _adjust(-1))
	_tap_button(cx + 40, 540, "▶", func() -> void: _adjust(1))
	_tap_button(cx + 130, 540, "BACK", _back)

	_render()

func _add_label(text: String, cx: float, y: float, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	l.size = Vector2(Tuning.WIDTH, size + 8)
	l.position = Vector2(cx - Tuning.WIDTH / 2.0, y)
	add_child(l)
	return l

func _tap_button(x: float, y: float, label: String, fn: Callable) -> void:
	var b := Button.new()
	b.text = label
	b.add_theme_font_size_override("font_size", 22)
	b.position = Vector2(x - 28, y)
	b.custom_minimum_size = Vector2(56, 40)
	b.pressed.connect(fn)
	add_child(b)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") or event.is_action_pressed("pause"):
		_back()
	elif event.is_action_pressed("ui_up"):
		_move(-1)
	elif event.is_action_pressed("ui_down"):
		_move(1)
	elif event.is_action_pressed("ui_left"):
		_adjust(-1)
	elif event.is_action_pressed("ui_right"):
		_adjust(1)

func _move(d: int) -> void:
	_idx = wrapi(_idx + d, 0, ROWS.size())
	Audio.play("ui_move", -4.0, 0.0)
	_render()

func _adjust(d: int) -> void:
	match _idx:
		0:
			GameSettings.music_vol = clampi(GameSettings.music_vol + d, 0, 10)
			Audio.apply_settings()
		1:
			GameSettings.sfx_vol = clampi(GameSettings.sfx_vol + d, 0, 10)
		2:
			GameSettings.screen_shake = d > 0
	GameSettings.save_settings()
	Audio.play("ui_move", -3.0, 0.0)  # audible at the new SFX level
	_render()

func _render() -> void:
	var vals := [
		_bar(GameSettings.music_vol),
		_bar(GameSettings.sfx_vol),
		"ON " if GameSettings.screen_shake else "OFF",
	]
	for i in _rows.size():
		var cursor := "> " if i == _idx else "  "
		_rows[i].text = "%s%s   %s" % [cursor, ROWS[i].rpad(14), vals[i]]
		_rows[i].add_theme_color_override("font_color",
			Color(0.09, 0.88, 0.88) if i == _idx else Color.WHITE)

func _bar(v: int) -> String:
	return "%s%s %d" % ["#".repeat(v), ".".repeat(10 - v), v]

func _back() -> void:
	Audio.play("ui_select", -2.0, 0.0)
	get_tree().change_scene_to_file("res://scenes/menu.tscn")

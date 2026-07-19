extends Control
## Title screen. Volcano-hub art behind a monospace title, best-score line, and a
## pulsing "tap to climb" prompt. Any of SPACE / jump / A-button / tap starts a
## run. Keeps the same input-agnostic feel as the rest of the port.

var _prompt: Label
var _pulse := 0.0

func _ready() -> void:
	Engine.time_scale = 1.0
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var cx := Tuning.WIDTH / 2.0

	# Background art, dimmed so the UI stays legible.
	if ResourceLoader.exists("res://assets/backgrounds/menu.jpg"):
		var bg := TextureRect.new()
		bg.texture = load("res://assets/backgrounds/menu.jpg")
		bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
		bg.modulate = Color(1, 1, 1, 0.55)
		add_child(bg)
	var scrim := ColorRect.new()
	scrim.color = Color(0.04, 0.02, 0.03, 0.35)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	scrim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(scrim)

	# Carved-titan emblem above the title.
	if ResourceLoader.exists("res://assets/titan-emblem.png"):
		var logo := TextureRect.new()
		logo.texture = load("res://assets/titan-emblem.png")
		logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		logo.size = Vector2(120, 120)
		logo.position = Vector2(cx - 60, 96)
		logo.mouse_filter = Control.MOUSE_FILTER_IGNORE
		logo.modulate = Color(1, 1, 1, 0.9)
		add_child(logo)

	_add_label("LAVA LEAP", cx, 236, 52, Color(1.0, 0.48, 0.0))
	_add_label("Arcade Lava Climber", cx, 300, 16, Color(1.0, 0.69, 0.4))
	if RunResult.best > 0:
		_add_label("Best  %d" % RunResult.best, cx, 344, 18, Color(1.0, 0.82, 0.35))

	_prompt = _add_label("SPACE / tap to climb", cx, 430, 22, Color(0.09, 0.88, 0.88))
	_add_label("← → move    SPACE jump    SHIFT dash    ↓ fast-fall",
		cx, 640, 13, Color(0.6, 0.66, 0.76))

	# Settings button (consumes its own click, so it doesn't also start a run).
	var gear := Button.new()
	gear.text = "⚙  Settings  (S)"
	gear.add_theme_font_size_override("font_size", 16)
	gear.position = Vector2(cx - 90, 500)
	gear.custom_minimum_size = Vector2(180, 36)
	gear.pressed.connect(_open_settings)
	add_child(gear)

	Audio.play_menu_music()

func _open_settings() -> void:
	Audio.play("ui_select", -2.0, 0.0)
	get_tree().change_scene_to_file("res://scenes/settings.tscn")

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

func _process(delta: float) -> void:
	# Gentle breathing pulse on the prompt.
	_pulse += delta
	_prompt.modulate.a = 0.6 + 0.4 * (0.5 + 0.5 * sin(_pulse * 3.0))

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_S:
		_open_settings()
		return
	if event.is_action_pressed("jump") or event.is_action_pressed("ui_accept") \
			or (event is InputEventMouseButton and event.pressed) \
			or (event is InputEventScreenTouch and event.pressed):
		Audio.play("ui_select", -2.0, 0.0)
		get_tree().change_scene_to_file("res://scenes/game.tscn")

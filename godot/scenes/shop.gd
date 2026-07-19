extends Control
## Shop: spend banked coins on cosmetics (player tint) and upgrades. Two tabs,
## switched with TAB / on-screen button. ↑/↓ select, ENTER buy-or-equip, ESC back.
## Reads/writes SaveData; every purchase persists immediately.

var _tab := "cosmetics"   # "cosmetics" | "upgrades"
var _idx := 0
var _rows: Array[Label] = []
var _bank: Label
var _tab_lbl: Label
var _hint: Label

func _ready() -> void:
	Engine.time_scale = 1.0
	SaveData.load_data()
	var cx := Tuning.WIDTH / 2.0

	var bg := ColorRect.new()
	bg.color = Color(0.055, 0.031, 0.043, 0.96)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	_add_label("SHOP", cx, 70, 34, Color(1.0, 0.82, 0.35))
	_bank = _add_label("", cx, 116, 18, Color.WHITE)
	_tab_lbl = _add_label("", cx, 150, 15, Color(0.09, 0.88, 0.88))
	_hint = _add_label("", cx, 176, 12, Color(0.72, 0.53, 0.35))
	for i in 6:
		_rows.append(_add_label("", cx, 220 + i * 40, 18, Color.WHITE))
	_add_label("↑/↓ select   TAB switch   ENTER buy/equip   ESC back",
		cx, 500, 13, Color(0.55, 0.6, 0.7))

	_tap_button(cx - 150, 560, "▲", func() -> void: _move(-1))
	_tap_button(cx - 96, 560, "▼", func() -> void: _move(1))
	_tap_button(cx - 40, 560, "TAB", _switch_tab)
	_tap_button(cx + 34, 560, "BUY", _buy_or_equip)
	_tap_button(cx + 120, 560, "BACK", _back)

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
	b.add_theme_font_size_override("font_size", 18)
	b.position = Vector2(x - 26, y)
	b.custom_minimum_size = Vector2(52, 38)
	b.pressed.connect(fn)
	add_child(b)

func _list_length() -> int:
	return SaveData.COSMETICS.size() if _tab == "cosmetics" else SaveData.UPGRADE_DEFS.size()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") or event.is_action_pressed("pause"):
		_back()
	elif event.is_action_pressed("ui_up"):
		_move(-1)
	elif event.is_action_pressed("ui_down"):
		_move(1)
	elif event is InputEventKey and event.pressed and event.keycode == KEY_TAB:
		_switch_tab()
	elif event.is_action_pressed("ui_accept") or event.is_action_pressed("jump"):
		_buy_or_equip()

func _move(d: int) -> void:
	_idx = wrapi(_idx + d, 0, _list_length())
	Audio.play("ui_move", -4.0, 0.0)
	_render()

func _switch_tab() -> void:
	_tab = "upgrades" if _tab == "cosmetics" else "cosmetics"
	_idx = 0
	Audio.play("ui_select", -3.0, 0.0)
	_render()

func _buy_or_equip() -> void:
	if _tab == "cosmetics":
		_buy_cosmetic()
	else:
		_buy_upgrade()

func _buy_cosmetic() -> void:
	var c: Dictionary = SaveData.COSMETICS[_idx]
	var id: String = c["id"]
	if SaveData.owned_cosmetics.has(id):
		SaveData.cosmetic = id
		Audio.play("ui_select", -2.0, 0.0)
	elif SaveData.coin_bank >= int(c["price"]):
		SaveData.coin_bank -= int(c["price"])
		SaveData.owned_cosmetics.append(id)
		SaveData.cosmetic = id
		Audio.play("kaching", -2.0, 0.0)
	else:
		Audio.play("ui_move", -6.0, 0.0)  # can't afford
		return
	SaveData.save_data()
	_render()

func _buy_upgrade() -> void:
	var u: Dictionary = SaveData.UPGRADE_DEFS[_idx]
	var id: String = u["id"]
	var lvl := SaveData.upgrade_level(id)
	if lvl >= int(u["max"]):
		return
	var cost: int = int(u["costs"][lvl])
	if SaveData.coin_bank >= cost:
		SaveData.coin_bank -= cost
		SaveData.upgrades[id] = lvl + 1
		SaveData.save_data()
		Audio.play("kaching", -2.0, 0.0)
	else:
		Audio.play("ui_move", -6.0, 0.0)
	_render()

func _render() -> void:
	_bank.text = "Bank:  %d coins" % SaveData.coin_bank
	if _tab == "cosmetics":
		_tab_lbl.text = "[ COSMETICS | Upgrades ]"
		_hint.text = "Player colour"
		_render_cosmetics()
	else:
		_tab_lbl.text = "[ Cosmetics | UPGRADES ]"
		_hint.text = "Permanent boosts"
		_render_upgrades()

func _render_cosmetics() -> void:
	for i in _rows.size():
		if i >= SaveData.COSMETICS.size():
			_rows[i].text = ""
			continue
		var c: Dictionary = SaveData.COSMETICS[i]
		var id: String = c["id"]
		var owned: bool = SaveData.owned_cosmetics.has(id)
		var equipped := SaveData.cosmetic == id
		var price := int(c["price"])
		var status := "[EQUIPPED]" if equipped else ("[owned]" if owned else "%dc" % price)
		var text := "%s %s" % [str(c["name"]).rpad(10), status]
		_row(i, text, c["tint"], owned or SaveData.coin_bank >= price)

func _render_upgrades() -> void:
	for i in _rows.size():
		if i >= SaveData.UPGRADE_DEFS.size():
			_rows[i].text = ""
			continue
		var u: Dictionary = SaveData.UPGRADE_DEFS[i]
		var lvl := SaveData.upgrade_level(str(u["id"]))
		var lvl_max := int(u["max"])
		var maxed := lvl >= lvl_max
		var next_cost := int(u["costs"][mini(lvl, lvl_max - 1)])
		var status := "[MAX]" if maxed else "%dc" % next_cost
		var text := "%s Lv%d/%d %s" % [str(u["name"]).rpad(14), lvl, lvl_max, status]
		_row(i, text, Color.WHITE, maxed or SaveData.coin_bank >= next_cost)

func _row(i: int, text: String, tint: Color, affordable: bool) -> void:
	var cursor := "> " if i == _idx else "  "
	_rows[i].text = cursor + text
	_rows[i].add_theme_color_override("font_color", tint if affordable else Color(0.4, 0.4, 0.46))

func _back() -> void:
	Audio.play("ui_select", -2.0, 0.0)
	get_tree().change_scene_to_file("res://scenes/menu.tscn")

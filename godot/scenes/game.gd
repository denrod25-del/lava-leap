extends Node2D
## Phase-1 vertical slice: wires the ported generator stream to spawned platform
## nodes, follows the climbing player with an up-only camera, rises the lava, and
## restarts on death. This is the "does the climb feel right" milestone — the
## meta/HUD/scoring/enemies/bosses come in later phases.

const PLAYER_SCENE := preload("res://actors/player.tscn")
const CAM_PLAYER_OFFSET := 120.0   # player sits this far below the camera centre

var _player: Player
var _cam: Camera2D
var _lava: Lava
var _bg: Background
var _stream: LevelStream
var _plats: Dictionary = {}        # PlatformDesc.id -> Platform node
var _max_height := 0.0
var _coins := 0
var _kills := 0
var _dead := false
var _grace := 2.5              # seconds before the lava starts rising
var _hud: Label

# Power-up state.
var _shield := false           # one-hit absorb from the shield pickup
var _active_kind := ""         # timed effect: "rocket" | "magnet" | "slowlava"
var _active_ms := 0.0          # remaining duration of the timed effect
var _coin_nodes: Array = []    # live coins, for the magnet pull (pruned lazily)

# Flow + combo momentum, and the derived score.
var _flow: FlowMeter
var _combo: ComboTracker
var _bonus_score := 0          # already-multiplied pickup/kill points
var _heat_acc := 0.0           # fractional Flow-heat bonus on height gained
var _was_dashing := false      # rising-edge detect so a dash beats Flow once

func _ready() -> void:
	_stream = LevelStream.new(randi())
	_flow = FlowMeter.new()
	_combo = ComboTracker.new()

	_bg = Background.new()
	add_child(_bg)

	_player = PLAYER_SCENE.instantiate()
	_player.position = Vector2(Tuning.PLAYER_START_X, Tuning.GROUND_Y - Tuning.PLAYER_BODY_H / 2.0)
	add_child(_player)

	_cam = Camera2D.new()
	_cam.position = Vector2(Tuning.WIDTH / 2.0, _player.position.y - CAM_PLAYER_OFFSET)
	add_child(_cam)
	_cam.make_current()

	_lava = Lava.new()
	add_child(_lava)

	var layer := CanvasLayer.new()
	add_child(layer)
	_hud = Label.new()
	_hud.position = Vector2(12, 10)
	_hud.add_theme_font_size_override("font_size", 20)
	layer.add_child(_hud)

	# Spawn nodes for platforms already in the stream (the starting platform),
	# then generate the ones above. Without this the player spawns in mid-air and
	# falls to an instant death every frame — the "keeps looping" bug.
	for d in _stream.active:
		_spawn_platform(d)
	_sync_platforms()

func _physics_process(delta: float) -> void:
	# Up-only climber camera.
	_cam.position.x = Tuning.WIDTH / 2.0
	_cam.position.y = minf(_cam.position.y, _player.position.y - CAM_PLAYER_OFFSET)

	_sync_platforms()

	var dt_ms := delta * 1000.0

	# Platforms the player is standing on: crumbling ones start to drop, bounce
	# pads launch them skyward (once per landing, guarded on downward velocity).
	for i in _player.get_slide_collision_count():
		var c := _player.get_slide_collision(i)
		if c.get_collider() is Platform and c.get_normal().y < -0.5:
			var plat := c.get_collider() as Platform
			plat.on_stood()
			if plat.desc != null and plat.desc.bounce and _player.velocity.y >= 0.0:
				_player.spring(Tuning.BOUNCE_PAD_VELOCITY)
				_combo_action(Tuning.COMBO_POINTS_BOUNCE)
				_flow.beat()

	# Flow momentum: build airborne/dashing, drain on the ground, beat on dash.
	var dashing := _player.is_dashing()
	if dashing and not _was_dashing:
		_flow.beat()
	_was_dashing = dashing
	_flow.update(dt_ms, not _player.is_on_floor(), dashing)
	_combo.update(dt_ms)
	_player.speed_scale = 1.0 + _flow.speed_nudge()

	var climbed := maxf(0.0, Tuning.GROUND_Y - _player.position.y)
	# Flow heat: newly-gained height earns (heat - 1) bonus points before we bank
	# the new max, so the multiplier only rewards fresh climbing.
	var heat := _flow.heat_multiplier()
	if heat > 1.0 and climbed > _max_height:
		_heat_acc += (climbed - _max_height) * (heat - 1.0)
	_max_height = maxf(_max_height, climbed)
	_bg.update_height(_max_height)

	# Timed power-ups (rocket boost, magnet, slow-lava) tick every frame, including
	# during grace; the returned factor slows the lava while slow-lava is active.
	var lava_factor := _update_powerups(delta)
	_hud.text = "Score: %d\nHeight: %d  Coins: %d  Kills: %d\nFlow: %s  Combo: x%.1f%s" % \
		[_score(), int(_max_height), _coins, _kills, _flow.tier_name(), _combo.multiplier, _power_label()]

	# Grace period at the start so you can settle + test movement before the lava
	# becomes a threat.
	if _grace > 0.0:
		_grace -= delta
	else:
		_lava.rise(delta, _max_height, lava_factor)

	# Death: hit by an enemy, caught by lava, or fell well below the view.
	var cam_bottom := _cam.position.y + Tuning.HEIGHT / 2.0
	if _dead or _player.position.y >= _lava.surface_y or _player.position.y > cam_bottom + 120.0:
		get_tree().reload_current_scene()

func _spawn_platform(d: PlatformDesc) -> void:
	if _plats.has(d.id):
		return
	var p := Platform.new()
	add_child(p)
	p.setup(d)
	if d.has_coin:
		var coin := Coin.new()
		coin.position = Vector2(0.0, -Tuning.PLATFORM_H / 2.0 - 22.0)  # float above the top
		coin.collected.connect(_on_coin)
		p.add_child(coin)
		_coin_nodes.append(coin)
	if d.has_enemy():
		var enemy := Enemy.new()
		enemy.setup(d, _player)
		enemy.stomped.connect(_on_enemy_stomped)
		enemy.killed.connect(_on_enemy_killed)
		enemy.hit_player.connect(_on_player_hit)
		p.add_child(enemy)
	if d.has_powerup():
		var pw := Powerup.new()
		pw.setup(d.powerup)
		pw.position = Vector2(0.0, -Tuning.PLATFORM_H / 2.0 - 26.0)  # float above the top
		pw.collected.connect(_on_powerup)
		p.add_child(pw)
	_plats[d.id] = p

func _on_coin() -> void:
	_coins += 1
	_player.refresh_dash()  # mid-air coin grab re-arms the dash (chain enabler)
	_combo_action(Tuning.COMBO_POINTS_COIN)
	_flow.beat()

func _on_enemy_stomped() -> void:
	_kills += 1
	_player.spring(Tuning.ENEMY_STOMP_BOUNCE)  # spring off the squashed enemy
	_combo_action(Tuning.COMBO_POINTS_STOMP)
	_flow.beat()

func _on_enemy_killed() -> void:
	_kills += 1
	_combo_action(Tuning.COMBO_POINTS_STOMP)

## Bump the combo and bank base points scaled by combo x heat (capped).
func _combo_action(base_points: int) -> void:
	_combo.bump()
	var combined := FlowMeter.combined_multiplier(_combo.multiplier, _flow.heat_multiplier())
	_bonus_score += int(floor(base_points * combined))

func _score() -> int:
	return int(_max_height) + _bonus_score + int(_heat_acc)

func _on_player_hit() -> void:
	# The shield absorbs one otherwise-lethal hit.
	if _shield:
		_shield = false
		return
	_dead = true

func _on_powerup(kind: String) -> void:
	_combo_action(Tuning.COMBO_POINTS_POWERUP)
	if kind == "shield":
		_shield = true
		return
	_active_kind = kind
	if kind == "rocket":
		_active_ms = Tuning.POWERUP_ROCKET_MS
	elif kind == "magnet":
		_active_ms = Tuning.POWERUP_MAGNET_MS
	else:
		_active_ms = Tuning.POWERUP_SLOWLAVA_MS

## Advance the active timed power-up, apply its per-frame effect, and return the
## factor the lava rise should be multiplied by this frame (< 1 while slow-lava).
func _update_powerups(delta: float) -> float:
	var lava_factor := 1.0
	if _active_kind != "" and _active_ms > 0.0:
		_active_ms -= delta * 1000.0
		match _active_kind:
			"rocket":
				_player.spring(Tuning.POWERUP_ROCKET_VELOCITY)  # sustained boost
			"magnet":
				_pull_coins(delta)
			"slowlava":
				lava_factor = Tuning.POWERUP_SLOWLAVA_FACTOR
		if _active_ms <= 0.0:
			_active_kind = ""
	return lava_factor

## Drag nearby coins toward the player while the magnet is active. Prunes freed
## coins from the tracking list as it goes.
func _pull_coins(delta: float) -> void:
	var pp := _player.global_position
	var kept: Array = []
	for c in _coin_nodes:
		if not is_instance_valid(c):
			continue
		kept.append(c)
		var coin := c as Node2D
		var to_player := pp - coin.global_position
		if to_player.length() <= Tuning.POWERUP_MAGNET_RADIUS:
			coin.global_position += to_player.normalized() * Tuning.POWERUP_MAGNET_PULL * delta
	_coin_nodes = kept

func _power_label() -> String:
	var out := ""
	if _shield:
		out += " shield"
	if _active_kind != "":
		out += " %s %.1fs" % [_active_kind, _active_ms / 1000.0]
	return out

func _sync_platforms() -> void:
	var cam_top := _cam.position.y - Tuning.HEIGHT / 2.0
	var prune_below := _cam.position.y + Tuning.HEIGHT / 2.0 + 160.0
	var res := _stream.update(cam_top, prune_below)
	for d in res["added"]:
		_spawn_platform(d)
	for d in res["removed"]:
		if _plats.has(d.id):
			_plats[d.id].queue_free()
			_plats.erase(d.id)

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
var _stream: LevelStream
var _plats: Dictionary = {}        # PlatformDesc.id -> Platform node
var _max_height := 0.0
var _coins := 0
var _grace := 2.5              # seconds before the lava starts rising
var _hud: Label

func _ready() -> void:
	_stream = LevelStream.new(randi())

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

	# Start crumbling any crumbling platform the player is standing on.
	for i in _player.get_slide_collision_count():
		var c := _player.get_slide_collision(i)
		if c.get_collider() is Platform and c.get_normal().y < -0.5:
			(c.get_collider() as Platform).on_stood()

	var climbed := maxf(0.0, Tuning.GROUND_Y - _player.position.y)
	_max_height = maxf(_max_height, climbed)
	_hud.text = "Height: %d\nCoins: %d" % [int(_max_height), _coins]

	# Grace period at the start so you can settle + test movement before the lava
	# becomes a threat.
	if _grace > 0.0:
		_grace -= delta
	else:
		_lava.rise(delta, _max_height)

	# Death: caught by lava, or fell well below the view.
	var cam_bottom := _cam.position.y + Tuning.HEIGHT / 2.0
	if _player.position.y >= _lava.surface_y or _player.position.y > cam_bottom + 120.0:
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
	_plats[d.id] = p

func _on_coin() -> void:
	_coins += 1

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

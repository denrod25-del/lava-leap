class_name BossController
extends Node2D
## Drives a Lava Titan encounter: raises the Titan at the lava surface, lobs
## telegraphed fireballs on the deterministic schedule from core/boss.gd, then
## submerges after Boss.DURATION_MS. Ported from src/entities/BossController.ts.
## Fireball contact is routed out via player_hit so the game applies the same
## shield/death rules as any other hit.

signal player_hit
signal started(zone: int)
signal ended(zone: int)

const FIREBALL_VY := -260.0

var _active := false
var _schedule: Array = []
var _elapsed := 0.0
var _fired := 0
var _index := 0
var _seed := 0
var _titan: Titan
var _player: Player
var _lava: Lava

func setup(player: Player, lava: Lava, seed: int) -> void:
	_player = player
	_lava = lava
	_seed = seed

func is_active() -> bool:
	return _active

## Begin the encounter for the given 0-based boss index.
func start(boss_index: int) -> void:
	if _active:
		return
	_active = true
	_elapsed = 0.0
	_fired = 0
	_index = boss_index
	_schedule = Boss.projectile_schedule(boss_index, _seed)
	_titan = Titan.new()
	add_child(_titan)
	_titan.position = Vector2(Tuning.WIDTH / 2.0, _lava.surface_y)
	started.emit(boss_index + 1)

func _physics_process(delta: float) -> void:
	if not _active:
		return
	_elapsed += delta * 1000.0
	if _titan != null:
		_titan.position = Vector2(Tuning.WIDTH / 2.0, _lava.surface_y)
	# Fire every projectile whose telegraph time has arrived.
	while _fired < _schedule.size() and _elapsed >= _schedule[_fired]["t_ms"]:
		_launch(_schedule[_fired]["x"], _lava.surface_y)
		_fired += 1
	if _elapsed >= Boss.DURATION_MS:
		_end()

func _launch(x: float, from_y: float) -> void:
	var fb := Fireball.new()
	fb.setup(FIREBALL_VY)
	add_child(fb)
	fb.position = Vector2(x, from_y)
	fb.hit_player.connect(func() -> void: player_hit.emit())
	Audio.play("projectile", -5.0, 0.12)

func _end() -> void:
	_active = false
	if _titan != null:
		_titan.queue_free()
		_titan = null
	for c in get_children():
		if c is Fireball:
			c.queue_free()
	ended.emit(_index + 1)

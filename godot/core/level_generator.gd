class_name LevelGenerator
extends RefCounted
## Reach-based procedural platform generator — ported from
## src/core/LevelGenerator.ts. Deterministic given a seed (uses core/rng.gd).
##
## PHASE-1 SCOPE: the core placement loop only — difficulty ramp, type mix, and
## the reach-valid vertical/horizontal placement that makes the climb possible.
## Deliberately omitted for now (restored in Phase 2, which also restores exact
## web-seed parity): set-pieces, hazard/bounce/enemy/powerup rolls, and per-zone
## type bias. So the stream is deterministic here but not yet identical to web.

var _rng: Rng
var _next_id := 0
var _last: PlatformDesc
var _start_offset: float

func _init(seed: int, start_height_offset: float = 0.0) -> void:
	_rng = Rng.new(seed)
	_start_offset = start_height_offset

## The starting platform — wide, static, centered under the spawn.
func first() -> PlatformDesc:
	var p := PlatformDesc.new()
	p.width = Reach.MAX_PLATFORM_WIDTH
	p.x = roundf(Tuning.PLAYER_START_X - p.width / 2.0)
	p.y = Tuning.GROUND_Y - _start_offset
	p.type = "static"
	p.id = _next_id
	_next_id += 1
	_last = p
	return p

## Normalized difficulty 0..1 from the height climbed so far.
func _difficulty() -> float:
	var height := Tuning.GROUND_Y - _last.y
	return clampf(height / Reach.DIFFICULTY_SPAN, 0.0, 1.0)

func _pick_type(t: float) -> String:
	var p_crumble := minf(0.45, 0.05 + 0.30 * t)
	var p_moving := minf(0.45, 0.05 + 0.25 * t)
	var r := _rng.next()
	if r < p_crumble:
		return "crumbling"
	if r < p_crumble + p_moving:
		return "moving"
	return "static"

func next() -> PlatformDesc:
	var t := _difficulty()

	# Type picked first (consumes one rng draw), matching the web ordering.
	var type := _pick_type(t)

	# Vertical gap widens with difficulty.
	var v_gap := _rng.range_float(
		Reach.MIN_VERTICAL_GAP,
		Reach.MIN_VERTICAL_GAP + (Reach.MAX_VERTICAL_GAP - Reach.MIN_VERTICAL_GAP) * t)
	var y := _last.y - v_gap

	# Width shrinks with difficulty.
	var width := _rng.range_float(
		Reach.MAX_PLATFORM_WIDTH - (Reach.MAX_PLATFORM_WIDTH - Reach.MIN_PLATFORM_WIDTH) * t,
		Reach.MAX_PLATFORM_WIDTH)

	# Horizontal placement within reach of the previous platform AND on-screen.
	var prev_center := _last.x + _last.width / 2.0
	var reach := Reach.MAX_HORIZONTAL_EDGE_GAP + _last.width / 2.0 + width / 2.0
	var min_center := maxf(width / 2.0, prev_center - reach)
	var max_center := minf(Tuning.WIDTH - width / 2.0, prev_center + reach)
	if min_center > max_center:
		min_center = width / 2.0
		max_center = Tuning.WIDTH - width / 2.0
	var center := _rng.range_float(min_center, max_center)

	# Round width once, then clamp x after rounding so x + width <= WIDTH.
	var w := roundi(width)
	var x := clampi(roundi(center - width / 2.0), 0, Tuning.WIDTH - w)

	var p := PlatformDesc.new()
	p.id = _next_id
	_next_id += 1
	p.x = x
	p.y = roundf(y)
	p.width = w
	p.type = type

	if type == "moving":
		var left_room := float(p.x)
		var right_room := Tuning.WIDTH - (p.x + p.width)
		var headroom := maxf(0.0, minf(left_room, right_room))
		var desired := Reach.MOVING_RANGE_BASE + roundf(Reach.MOVING_RANGE_SPAN * t)
		var mrange := minf(desired, headroom)
		if mrange > 0.0:
			p.move_range = mrange
			p.move_speed = Reach.MOVING_SPEED_BASE + roundf(Reach.MOVING_SPEED_SPAN * t)
		else:
			# Spans nearly the full width — demote to static so the invariant
			# "moving => move_range > 0" always holds.
			p.type = "static"

	# Coin draw happens ONLY for non-crumbling platforms (short-circuit matches
	# the web build: the rng draw is skipped for crumbling ones).
	p.has_coin = p.type != "crumbling" and _rng.next() < Reach.COIN_CHANCE

	_last = p
	return p

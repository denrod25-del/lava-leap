class_name Player
extends CharacterBody2D
## Phase-1 movement controller: run / jump / double-jump / jump-cut / dash /
## wall-slide / wall-jump / coyote / jump-buffer / fast-fall, from Tuning.
## Ported in spirit from src/entities/Player.ts and adapted to CharacterBody2D.
##
## FEEL IS NOT FINAL: Godot's move_and_slide integration differs from Phaser
## Arcade, so these numbers are a starting point for a re-tuning pass against the
## web build (plan §7). Ledge-grab/vault, animations, and juice come later.

var _facing := 1
var _coyote_ms := 0.0
var _buffer_ms := 0.0
var _jumps_left := 0
var _dash_ms := 0.0
var _dash_ready := true
var _max_jumps := 2

func is_dashing() -> bool:
	return _dash_ms > 0.0

## Launch the player upward and refresh air moves (bounce pad / stomp / rocket).
## Mirrors Player.bounce/stompBounce/applyRocket in the web build.
func spring(vy: float) -> void:
	velocity.y = -vy
	_jumps_left = _max_jumps
	_dash_ready = true

func _ready() -> void:
	queue_redraw()

func _physics_process(delta: float) -> void:
	var dt_ms := delta * 1000.0
	var on_floor := is_on_floor()

	if on_floor:
		_coyote_ms = Tuning.COYOTE_MS
		_jumps_left = _max_jumps
		_dash_ready = true
	else:
		_coyote_ms = maxf(0.0, _coyote_ms - dt_ms)

	_buffer_ms = maxf(0.0, _buffer_ms - dt_ms)
	if Input.is_action_just_pressed("jump"):
		_buffer_ms = Tuning.JUMP_BUFFER_MS

	# --- Dash overrides normal control while active (air-dash, refresh on land) ---
	if _dash_ms > 0.0:
		_dash_ms -= dt_ms
		velocity = Vector2(_facing * Tuning.DASH_SPEED, 0.0)
		move_and_slide()
		if _dash_ms <= 0.0:
			velocity.x = 0.0
		return
	if Input.is_action_just_pressed("dash") and _dash_ready and not on_floor:
		_dash_ready = false
		_dash_ms = Tuning.DASH_DURATION_MS
		return

	# --- Horizontal ---
	var dir := Input.get_axis("move_left", "move_right")
	if dir > 0.01:
		_facing = 1
	elif dir < -0.01:
		_facing = -1
	velocity.x = dir * Tuning.MOVE_SPEED

	# --- Gravity, wall-slide clamp, fast-fall ---
	var on_wall := is_on_wall() and not on_floor
	velocity.y += Tuning.GRAVITY_Y * delta
	if on_wall and velocity.y > 0.0:
		velocity.y = minf(velocity.y, Tuning.WALL_SLIDE_MAX)
	if Input.is_action_pressed("fast_fall") and not on_floor and velocity.y > 0.0:
		velocity.y = maxf(velocity.y, Tuning.FAST_FALL_SPEED)

	# --- Jump (buffered): wall-jump > ground/coyote > double ---
	if _buffer_ms > 0.0:
		if on_wall:
			velocity.x = get_wall_normal().x * Tuning.WALL_JUMP_X
			velocity.y = -Tuning.WALL_JUMP_Y
			_buffer_ms = 0.0
		elif on_floor or _coyote_ms > 0.0:
			velocity.y = -Tuning.JUMP_VELOCITY
			_jumps_left = _max_jumps - 1
			_coyote_ms = 0.0
			_buffer_ms = 0.0
		elif _jumps_left > 0:
			velocity.y = -Tuning.DOUBLE_JUMP_VELOCITY
			_jumps_left -= 1
			_buffer_ms = 0.0

	# --- Jump-cut on early release ---
	if Input.is_action_just_released("jump") and velocity.y < 0.0:
		velocity.y *= Tuning.JUMP_CUT_MULTIPLIER

	move_and_slide()

func _draw() -> void:
	var w := Tuning.PLAYER_DISPLAY_W
	var h := Tuning.PLAYER_DISPLAY_H
	draw_rect(Rect2(-w / 2.0, -h / 2.0, w, h), Color(0.96, 0.34, 0.44))
	draw_rect(Rect2(-w / 2.0, -h / 2.0, w, 4.0), Color(1.0, 0.72, 0.42))  # lit top edge

class_name Player
extends CharacterBody2D
## Phase-1 movement controller: run / jump / double-jump / jump-cut / dash /
## wall-slide / wall-jump / coyote / jump-buffer / fast-fall, from Tuning.
## Ported in spirit from src/entities/Player.ts and adapted to CharacterBody2D.
##
## FEEL IS NOT FINAL: Godot's move_and_slide integration differs from Phaser
## Arcade, so these numbers are a starting point for a re-tuning pass against the
## web build (plan §7). Ledge-grab/vault, animations, and juice come later.

const FRAME_CANVAS := 512.0      # sprite frames: square canvas, feet at the bottom
const FRAME_BODY_H := 233.0      # character height on the idle frame (scale reference)

# name -> [frame count, fps, loops]
const ANIMS := {
	"idle": [4, 6.0, true],
	"run": [4, 10.0, true],
	"jump": [1, 1.0, false],
	"double": [1, 1.0, false],
	"fall": [1, 1.0, false],
	"dash": [2, 14.0, true],
	"wall": [1, 1.0, false],
	"hurt": [1, 1.0, false],
	"dead": [1, 1.0, false],
}

var speed_scale := 1.0   # Flow heat nudges run speed (set by the game each frame)
var _facing := 1
var _coyote_ms := 0.0
var _buffer_ms := 0.0
var _jumps_left := 0
var _dash_ms := 0.0
var _dash_ready := true
var _max_jumps := 2
var _sprite: AnimatedSprite2D   # null -> fall back to the drawn box
var _double_air := false        # last airborne impulse was the double jump

func is_dashing() -> bool:
	return _dash_ms > 0.0

## Re-arm the air-dash (mid-air coin grab, per the web build's chain enabler).
func refresh_dash() -> void:
	_dash_ready = true

## Launch the player upward and refresh air moves (bounce pad / stomp / rocket).
## Mirrors Player.bounce/stompBounce/applyRocket in the web build.
func spring(vy: float) -> void:
	velocity.y = -vy
	_jumps_left = _max_jumps
	_dash_ready = true

func _ready() -> void:
	_build_sprite()
	queue_redraw()

## Build the AnimatedSprite2D from the sliced character frames. If the art isn't
## imported/present, leave _sprite null and the drawn box takes over.
func _build_sprite() -> void:
	if not ResourceLoader.exists("res://assets/player/idle_0.png"):
		return
	var frames := SpriteFrames.new()
	frames.rename_animation("default", "idle")  # a new SpriteFrames starts with "default"
	for anim in ANIMS:
		var count: int = ANIMS[anim][0]
		if anim != "idle":
			frames.add_animation(anim)
		frames.set_animation_speed(anim, ANIMS[anim][1])
		frames.set_animation_loop(anim, ANIMS[anim][2])
		for i in count:
			var path := "res://assets/player/%s_%d.png" % [anim, i]
			if ResourceLoader.exists(path):
				frames.add_frame(anim, load(path))
	_sprite = AnimatedSprite2D.new()
	_sprite.sprite_frames = frames
	var s := Tuning.PLAYER_DISPLAY_H / FRAME_BODY_H
	_sprite.scale = Vector2(s, s)
	# Canvas feet sit at its bottom edge; align that with the body's bottom.
	_sprite.offset = Vector2(0.0, Tuning.PLAYER_BODY_H / 2.0 / s - FRAME_CANVAS / 2.0)
	add_child(_sprite)
	_sprite.play("idle")

## Pick the animation for the current movement state each frame.
func _update_anim(on_floor: bool, dir: float) -> void:
	if _sprite == null:
		return
	_sprite.flip_h = _facing < 0
	var anim := "idle"
	if _dash_ms > 0.0:
		anim = "dash"
	elif is_on_wall() and not on_floor and velocity.y > 0.0:
		anim = "wall"
	elif not on_floor:
		if velocity.y < 0.0:
			anim = "double" if _double_air else "jump"
		else:
			anim = "fall"
	elif absf(dir) > 0.01:
		anim = "run"
	if _sprite.animation != anim:
		_sprite.play(anim)

func _physics_process(delta: float) -> void:
	var dt_ms := delta * 1000.0
	var on_floor := is_on_floor()

	if on_floor:
		_coyote_ms = Tuning.COYOTE_MS
		_jumps_left = _max_jumps
		_dash_ready = true
		_double_air = false
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
		_update_anim(is_on_floor(), 0.0)
		return
	if Input.is_action_just_pressed("dash") and _dash_ready and not on_floor:
		_dash_ready = false
		_dash_ms = Tuning.DASH_DURATION_MS
		_update_anim(on_floor, 0.0)
		return

	# --- Horizontal ---
	var dir := Input.get_axis("move_left", "move_right")
	if dir > 0.01:
		_facing = 1
	elif dir < -0.01:
		_facing = -1
	velocity.x = dir * Tuning.MOVE_SPEED * speed_scale

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
			Audio.play("jump", -3.0, 0.06)
		elif on_floor or _coyote_ms > 0.0:
			velocity.y = -Tuning.JUMP_VELOCITY
			_jumps_left = _max_jumps - 1
			_coyote_ms = 0.0
			_buffer_ms = 0.0
			Audio.play("jump", -3.0, 0.06)
		elif _jumps_left > 0:
			velocity.y = -Tuning.DOUBLE_JUMP_VELOCITY
			_jumps_left -= 1
			_buffer_ms = 0.0
			_double_air = true
			Audio.play("jump", -1.0, 0.1)  # double-jump: a touch higher

	# --- Jump-cut on early release ---
	if Input.is_action_just_released("jump") and velocity.y < 0.0:
		velocity.y *= Tuning.JUMP_CUT_MULTIPLIER

	move_and_slide()
	_update_anim(is_on_floor(), dir)

func _draw() -> void:
	if _sprite != null:
		return  # character art active; the box is only the no-assets fallback
	var w := Tuning.PLAYER_DISPLAY_W
	var h := Tuning.PLAYER_DISPLAY_H
	draw_rect(Rect2(-w / 2.0, -h / 2.0, w, h), Color(0.96, 0.34, 0.44))
	draw_rect(Rect2(-w / 2.0, -h / 2.0, w, 4.0), Color(1.0, 0.72, 0.42))  # lit top edge

class_name Enemy
extends Node2D
## A crawler or drifter enemy, parented to its platform (so it rides moving
## platforms and prunes when the platform is culled). Ported from
## src/entities/EnemyManager.ts: the crawler patrols the platform top, the drifter
## sine-bobs above it. Contact is resolved each frame against the player:
##   descending onto its top  -> stomp (kill + bounce)
##   dashing through it        -> kill
##   any other touch          -> lethal hit
##
## Positions are in the platform's local space; the platform's origin is its
## centre, so its top edge sits at -PLATFORM_H/2 and it spans [-width/2, width/2].

signal stomped     ## killed by a stomp; the player is bounced
signal killed      ## killed by a dash
signal hit_player  ## lethal contact -> the run ends

var _kind := "crawler"
var _half_w := 0.0        # patrol half-extent for the crawler
var _top_y := 0.0         # platform top edge, local y
var _dir := 1.0
var _phase := 0.0
var _time := 0.0
var _player: Player
var _dead := false

func setup(desc: PlatformDesc, player: Player) -> void:
	_kind = desc.enemy
	_player = player
	_top_y = -Tuning.PLATFORM_H / 2.0
	_half_w = desc.width / 2.0
	# Deterministic per-platform bob phase (no RNG), mirroring the web build.
	_phase = float(desc.id % 8) / 8.0 * TAU
	if _kind == "crawler":
		position = Vector2(0.0, _top_y - Tuning.ENEMY_BODY_H / 2.0)
	else:
		position = Vector2(0.0, _top_y - Tuning.ENEMY_DRIFTER_HOVER_H)
	queue_redraw()

func _physics_process(delta: float) -> void:
	if _dead:
		return
	_time += delta
	if _kind == "crawler":
		var min_x := -_half_w + Tuning.ENEMY_BODY_W / 2.0
		var max_x := _half_w - Tuning.ENEMY_BODY_W / 2.0
		position.x += _dir * Tuning.ENEMY_CRAWLER_SPEED * delta
		if position.x <= min_x:
			position.x = min_x
			_dir = 1.0
		elif position.x >= max_x:
			position.x = max_x
			_dir = -1.0
		position.y = _top_y - Tuning.ENEMY_BODY_H / 2.0
	else:
		position.x = 0.0
		position.y = _top_y - Tuning.ENEMY_DRIFTER_HOVER_H \
			+ sin(_time * Tuning.ENEMY_DRIFTER_FREQ * TAU + _phase) * Tuning.ENEMY_DRIFTER_AMPLITUDE
	_resolve_contact()

## AABB overlap test + stomp/dash/hit decision, ported 1:1 from EnemyManager.
func _resolve_contact() -> void:
	if _player == null:
		return
	var e := global_position
	var p := _player.global_position
	var e_hw := Tuning.ENEMY_BODY_W / 2.0
	var e_hh := Tuning.ENEMY_BODY_H / 2.0
	var p_hw := Tuning.PLAYER_BODY_W / 2.0
	var p_hh := Tuning.PLAYER_BODY_H / 2.0
	if absf(p.x - e.x) >= e_hw + p_hw:
		return
	if absf(p.y - e.y) >= e_hh + p_hh:
		return
	# Overlapping this frame — classify the contact.
	var feet_y := p.y + p_hh
	var enemy_top := e.y - e_hh
	var feet_below_top := feet_y - enemy_top
	if _player.velocity.y > 0.0 and feet_below_top >= 0.0 \
			and feet_below_top < Tuning.ENEMY_STOMP_WINDOW * 2.0:
		_die()
		stomped.emit()
	elif _player.is_dashing():
		_die()
		killed.emit()
	else:
		hit_player.emit()

func _die() -> void:
	_dead = true
	queue_free()

func _draw() -> void:
	if _kind == "crawler":
		var w := Tuning.ENEMY_BODY_W
		var h := Tuning.ENEMY_BODY_H
		draw_rect(Rect2(-w / 2.0, -h / 2.0, w, h), Color(0.902, 0.224, 0.275))
		draw_circle(Vector2(-w * 0.22, -h * 0.12), 2.5, Color(1.0, 0.82, 0.4))
		draw_circle(Vector2(w * 0.22, -h * 0.12), 2.5, Color(1.0, 0.82, 0.4))
	else:
		var rx := Tuning.ENEMY_BODY_W / 2.0
		var ry := Tuning.ENEMY_BODY_H / 2.0
		# Body: an ellipse approximated by a scaled circle polygon.
		var pts := PackedVector2Array()
		for i in 16:
			var a := float(i) / 16.0 * TAU
			pts.append(Vector2(cos(a) * rx, sin(a) * ry))
		draw_colored_polygon(pts, Color(0.482, 0.176, 0.545))
		draw_circle(Vector2(-rx * 0.35, -ry * 0.25), 2.0, Color(0.878, 0.667, 1.0))
		draw_circle(Vector2(rx * 0.35, -ry * 0.25), 2.0, Color(0.878, 0.667, 1.0))

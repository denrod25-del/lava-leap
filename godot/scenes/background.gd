class_name Background
extends CanvasLayer
## Zone backdrop for the climb. Shows one of the four AI-generated environment
## images (bg-z0..3) and crossfades to the next zone every BG_SCENE_SPAN pixels of
## height, looping through the four so the endless climber reads as distinct
## "levels". Sits behind the gameplay (layer = -5) and fills the viewport
## regardless of orientation via STRETCH_KEEP_ASPECT_COVERED.

const BG_SCENE_SPAN := 2000.0        # pixels of height per zone before switching
const ZONE_COUNT := 4
const FADE_TIME := 1.1               # crossfade duration in seconds

# Two stacked layers: _back holds the settled zone, _front fades the new one in
# on top of it. After a fade completes the front becomes the settled layer.
var _back: TextureRect
var _front: TextureRect
var _zone := -1
var _tween: Tween
var _textures: Array = []

func _ready() -> void:
	layer = -5
	for i in ZONE_COUNT:
		var path := "res://assets/backgrounds/bg-z%d.jpg" % i
		_textures.append(load(path) if ResourceLoader.exists(path) else null)
	_back = _make_rect()
	_front = _make_rect()
	add_child(_back)
	add_child(_front)
	_apply_zone(0)

func _make_rect() -> TextureRect:
	var r := TextureRect.new()
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	r.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r

## Set the initial zone with no fade.
func _apply_zone(idx: int) -> void:
	_zone = idx
	_back.texture = _textures[idx]
	_front.texture = null
	_front.modulate.a = 0.0

## Called each frame with the player's climbed height. Switches zones as the
## player crosses each BG_SCENE_SPAN boundary, cycling through the four.
func update_height(height: float) -> void:
	var target := int(maxf(0.0, height) / BG_SCENE_SPAN) % ZONE_COUNT
	if target == _zone:
		return
	_zone = target
	if _textures[target] == null:
		return
	# Bring the new zone in on the front layer, fading over the settled one.
	if _tween != null and _tween.is_running():
		_tween.kill()
	_front.texture = _textures[target]
	_front.modulate.a = 0.0
	_tween = create_tween()
	_tween.tween_property(_front, "modulate:a", 1.0, FADE_TIME)
	_tween.tween_callback(_settle)

## Fade finished: promote the front layer to the settled back layer so the next
## switch can fade cleanly again.
func _settle() -> void:
	_back.texture = _front.texture
	_back.modulate.a = 1.0
	_front.texture = null
	_front.modulate.a = 0.0

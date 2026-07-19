extends Node
## Global audio director (autoload `Audio`). Plays one-shot SFX from a small
## voice pool and a single looping music track. SFX/music assets came over from
## the web build. Volumes are broad strokes for now — a settings-driven mixer
## lands with the options menu.

const VOICES := 10  # simultaneous SFX voices before the oldest is reused

# name -> stream. Loaded lazily so a missing file degrades to silence instead of
# a load error (assets are imported by the editor on first open).
const SFX_PATHS := {
	"jump": "res://assets/sfx/jump.wav",
	"coin": "res://assets/sfx/coin.wav",
	"stomp": "res://assets/sfx/stomp.wav",
	"hit": "res://assets/sfx/hit.wav",
	"death": "res://assets/sfx/death.wav",
	"pickup": "res://assets/sfx/pickup.wav",
	"kaching": "res://assets/sfx/kaching.wav",
	"crack": "res://assets/sfx/crack.wav",
	"ding": "res://assets/sfx/ding.wav",
	"expire": "res://assets/sfx/expire.wav",
	"ui_select": "res://assets/sfx/ui-select.wav",
	"ui_move": "res://assets/sfx/ui-move.wav",
	"boss_roar": "res://assets/sfx/boss-roar.wav",
	"projectile": "res://assets/sfx/projectile.wav",
}
const MUSIC_GAMEPLAY := "res://assets/music/gameplay.ogg"
const MUSIC_MENU := "res://assets/sfx/music-menu.wav"

var _sfx: Dictionary = {}
var _voices: Array[AudioStreamPlayer] = []
var _next := 0
var _music: AudioStreamPlayer
var _loop_music := false  # replay on finish (for streams without built-in looping)

func _ready() -> void:
	# Keep audio alive across scene changes.
	process_mode = Node.PROCESS_MODE_ALWAYS
	for name_key in SFX_PATHS:
		var path: String = SFX_PATHS[name_key]
		_sfx[name_key] = load(path) if ResourceLoader.exists(path) else null
	for i in VOICES:
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		add_child(p)
		_voices.append(p)
	_music = AudioStreamPlayer.new()
	_music.bus = "Master"
	_music.finished.connect(_on_music_finished)
	add_child(_music)

func _on_music_finished() -> void:
	if _loop_music:
		_music.play()  # gap-replay loop for streams without built-in looping

## Fire a one-shot SFX. `pitch` randomises around 1.0 by ±`pitch_var` so repeated
## sounds (coins, stomps) don't machine-gun the exact same sample.
func play(sound: String, volume_db: float = 0.0, pitch_var: float = 0.0) -> void:
	var stream: AudioStream = _sfx.get(sound)
	if stream == null:
		return
	var p := _voices[_next]
	_next = (_next + 1) % VOICES
	p.stream = stream
	p.volume_db = volume_db
	p.pitch_scale = 1.0 + randf_range(-pitch_var, pitch_var)
	p.play()

## Start (or restart) the looping gameplay music.
func play_music(volume_db: float = -9.0) -> void:
	if not ResourceLoader.exists(MUSIC_GAMEPLAY):
		return
	var ogg := load(MUSIC_GAMEPLAY) as AudioStreamOggVorbis
	if ogg == null:
		return
	ogg.loop = true         # seamless internal loop; no finished-replay needed
	_loop_music = false
	_music.stream = ogg
	_music.volume_db = volume_db
	_music.play()

## Start (or restart) the looping menu music. The WAV has no built-in loop, so we
## replay it on finish.
func play_menu_music(volume_db: float = -11.0) -> void:
	if not ResourceLoader.exists(MUSIC_MENU):
		return
	var wav := load(MUSIC_MENU) as AudioStream
	if wav == null:
		return
	_loop_music = true
	_music.stream = wav
	_music.volume_db = volume_db
	_music.play()

func stop_music() -> void:
	_loop_music = false
	_music.stop()

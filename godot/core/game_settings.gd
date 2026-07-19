class_name GameSettings
extends RefCounted
## Persisted player options, saved to user://settings.cfg. Static so any scene can
## read/write without an autoload. Volumes are 0..10 (mapped to dB by the Audio
## director); screen_shake gates the camera shake. Call load_settings() once at
## startup (the Audio autoload does this) and save_settings() after any change.

const PATH := "user://settings.cfg"

static var music_vol := 7
static var sfx_vol := 8
static var screen_shake := true
static var _loaded := false

static func load_settings() -> void:
	if _loaded:
		return
	_loaded = true
	var cfg := ConfigFile.new()
	if cfg.load(PATH) != OK:
		return
	music_vol = clampi(int(cfg.get_value("audio", "music_vol", music_vol)), 0, 10)
	sfx_vol = clampi(int(cfg.get_value("audio", "sfx_vol", sfx_vol)), 0, 10)
	screen_shake = bool(cfg.get_value("video", "screen_shake", screen_shake))

static func save_settings() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("audio", "music_vol", music_vol)
	cfg.set_value("audio", "sfx_vol", sfx_vol)
	cfg.set_value("video", "screen_shake", screen_shake)
	cfg.save(PATH)

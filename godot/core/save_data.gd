class_name SaveData
extends RefCounted
## Persistent meta progression, saved to user://save.cfg. Static so any scene can
## touch it without an autoload. Holds the lifetime best score, the coin bank, the
## equipped/owned cosmetics, and upgrade levels. Coins earned in a run are banked
## on death; the shop spends them.

const PATH := "user://save.cfg"

# Cosmetic tints (the drawn player is modulated by the equipped one). Prices in
# banked coins. Mirrors the web build's COSMETICS.
const COSMETICS := [
	{"id": "default", "name": "Default", "tint": Color(1.0, 1.0, 1.0), "price": 0},
	{"id": "crimson", "name": "Crimson", "tint": Color(1.0, 0.353, 0.353), "price": 50},
	{"id": "gold", "name": "Gold", "tint": Color(1.0, 0.82, 0.4), "price": 100},
	{"id": "emerald", "name": "Emerald", "tint": Color(0.357, 0.851, 0.541), "price": 200},
	{"id": "void", "name": "Void", "tint": Color(0.541, 0.478, 1.0), "price": 350},
	{"id": "frost", "name": "Frost", "tint": Color(0.639, 0.909, 1.0), "price": 500},
]

# Upgrade definitions (id, display name, max level, per-level costs). Mirrors the
# web build's UPGRADES.
const UPGRADE_DEFS := [
	{"id": "powerupDuration", "name": "Power-Up Time", "max": 3, "costs": [150, 300, 500],
		"desc": "+15% power-up duration / level"},
	{"id": "startShield", "name": "Start Shield", "max": 1, "costs": [400],
		"desc": "Begin each run with a shield"},
	{"id": "revive", "name": "Revive", "max": 1, "costs": [600],
		"desc": "Auto-revive once per run"},
]

static var high_score := 0
static var coin_bank := 0
static var cosmetic := "default"
static var owned_cosmetics: Array = ["default"]
static var upgrades := {"powerupDuration": 0, "startShield": 0, "revive": 0}
static var _loaded := false

static func load_data() -> void:
	if _loaded:
		return
	_loaded = true
	var cfg := ConfigFile.new()
	if cfg.load(PATH) != OK:
		return
	high_score = int(cfg.get_value("meta", "high_score", high_score))
	coin_bank = int(cfg.get_value("meta", "coin_bank", coin_bank))
	cosmetic = str(cfg.get_value("cosmetics", "equipped", cosmetic))
	owned_cosmetics = cfg.get_value("cosmetics", "owned", owned_cosmetics)
	var stored: Dictionary = cfg.get_value("upgrades", "levels", {})
	for key in upgrades:
		if stored.has(key):
			upgrades[key] = int(stored[key])

static func save_data() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("meta", "high_score", high_score)
	cfg.set_value("meta", "coin_bank", coin_bank)
	cfg.set_value("cosmetics", "equipped", cosmetic)
	cfg.set_value("cosmetics", "owned", owned_cosmetics)
	cfg.set_value("upgrades", "levels", upgrades)
	cfg.save(PATH)

static func upgrade_level(id: String) -> int:
	return int(upgrades.get(id, 0))

static func cosmetic_color() -> Color:
	for c in COSMETICS:
		if c["id"] == cosmetic:
			return c["tint"]
	return Color.WHITE

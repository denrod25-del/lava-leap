class_name RunResult
extends RefCounted
## Carries the final stats of a run from the Game scene to the Game Over scene.
## Uses static vars (persist across scene changes, no autoload needed) — the game
## writes them just before switching scenes; game_over.gd reads them once.

static var score := 0
static var height := 0
static var coins := 0
static var kills := 0
static var best := 0        # best score this session (survives restarts)

## Record a finished run and update the session best.
static func record(s: int, h: int, c: int, k: int) -> void:
	score = s
	height = h
	coins = c
	kills = k
	best = maxi(best, s)

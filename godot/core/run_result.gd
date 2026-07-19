class_name RunResult
extends RefCounted
## Carries the final stats of a run from the Game scene to the Game Over scene.
## Uses static vars (persist across scene changes, no autoload needed) — the game
## writes them just before switching scenes; game_over.gd reads them once.

static var score := 0
static var height := 0
static var coins := 0
static var kills := 0
static var best := 0        # lifetime best (from SaveData) after this run
static var is_best := false # this run set a new lifetime best
static var banked := 0      # coins added to the bank this run

class_name LevelStream
extends RefCounted
## Windowed platform stream — ported from src/core/LevelStream.ts. Generates
## platforms up to `camera_top_y - GENERATE_MARGIN` (smaller y = higher) and
## prunes ones below `prune_below_y`. `update()` returns the descriptors added
## and removed this tick so the scene can spawn / free nodes to match.

const GENERATE_MARGIN := 200.0

var active: Array[PlatformDesc] = []
var _gen: LevelGenerator
var _top_y: float

func _init(seed: int, start_height_offset: float = 0.0) -> void:
	_gen = LevelGenerator.new(seed, start_height_offset)
	var f := _gen.first()
	active.append(f)
	_top_y = f.y

func update(camera_top_y: float, prune_below_y: float) -> Dictionary:
	var added: Array[PlatformDesc] = []
	while _top_y > camera_top_y - GENERATE_MARGIN:
		var p := _gen.next()
		active.append(p)
		_top_y = p.y
		added.append(p)

	var removed: Array[PlatformDesc] = []
	for i in range(active.size() - 1, -1, -1):
		if active[i].y > prune_below_y:
			removed.append(active[i])
			active.remove_at(i)

	return {"added": added, "removed": removed}

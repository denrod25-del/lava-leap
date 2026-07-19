class_name Boss
extends RefCounted
## Pure Lava Titan logic — ported from src/core/boss.ts. Boundary detection and a
## deterministic, telegraphed fireball schedule. The presentation/physics live in
## actors/boss_controller.gd + actors/fireball.gd + actors/titan.gd.

const BOUNDARIES := [1000.0, 2000.0, 3000.0]   # climbed-height triggers
const DURATION_MS := 15000.0                   # encounter length

## Boss index whose boundary was crossed between prev_height and height, or -1.
static func boundary_crossed(prev_height: float, height: float) -> int:
	for i in BOUNDARIES.size():
		var b: float = BOUNDARIES[i]
		if prev_height < b and height >= b:
			return i
	return -1

## Telegraphed fireballs over the encounter as [{t_ms, x}, ...]. Higher boss index
## = more fireballs. Deterministic given the run seed + boss index.
static func projectile_schedule(boss_index: int, seed: int) -> Array:
	var rng := Rng.new(seed + boss_index * 7919)
	var count := 6 + boss_index * 4
	var out: Array = []
	for i in count:
		out.append({
			"t_ms": roundi((i + 0.5) * (DURATION_MS / count)),
			"x": roundi(rng.next() * (Tuning.WIDTH - 40)) + 20,
		})
	return out

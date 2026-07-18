class_name Rng
extends RefCounted
## Deterministic PRNG — a 1:1 port of src/core/rng.ts (mulberry32).
##
## WHY a hand-rolled PRNG instead of Godot's RandomNumberGenerator: the daily
## challenge and replays must produce the *same* platform stream from the same
## seed on every platform (web, mobile, Pi). mulberry32 is bit-exact and cheap,
## so a run seeded with N is identical here and in the web build. The parity is
## locked by tests/test_rng.gd against values captured from the JS original.
##
## All arithmetic is kept in the unsigned 32-bit domain (& 0xFFFFFFFF) so it
## matches JavaScript's `| 0`, `>>> n`, and `Math.imul` semantics exactly.

const _U32 := 0xFFFFFFFF
const _POW32 := 4294967296.0

var _a: int

func _init(seed: int) -> void:
	_a = seed & _U32

## 32-bit multiply keeping the low 32 bits — matches JS Math.imul in the
## unsigned domain (sign is irrelevant downstream: only XOR / shift / add-mod).
static func _imul(x: int, y: int) -> int:
	return (x * y) & _U32

## Next float in [0, 1).
func next() -> float:
	_a = (_a + 0x6d2b79f5) & _U32
	var t := _imul(_a ^ (_a >> 15), 1 | _a)
	t = ((t + _imul(t ^ (t >> 7), 61 | t)) & _U32) ^ t
	t &= _U32
	return float((t ^ (t >> 14)) & _U32) / _POW32

## Inclusive-min float range helper (mirrors randRange in rng.ts).
func range_float(min_v: float, max_v: float) -> float:
	return min_v + (max_v - min_v) * next()

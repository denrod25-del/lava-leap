class_name ComboTracker
extends RefCounted
## Score multiplier that grows with combo actions (coin / stomp / bounce /
## power-up) and decays back to 1 after a quiet window. Ported from
## src/core/ComboTracker.ts. Pure — the scene feeds bump()/update().

var multiplier := 1.0
var _timer := 0.0

## Register a combo action.
func bump() -> void:
	multiplier = minf(Tuning.COMBO_MAX, roundf((multiplier + Tuning.COMBO_STEP) * 100.0) / 100.0)
	_timer = Tuning.COMBO_DECAY_MS

## Advance time. Returns true if the multiplier reset to 1 this tick.
func update(dt_ms: float) -> bool:
	if multiplier <= 1.0:
		return false
	_timer -= dt_ms
	if _timer <= 0.0:
		multiplier = 1.0
		_timer = 0.0
		return true
	return false

## Fraction of the decay window remaining (for HUD bars).
func remaining01() -> float:
	if multiplier <= 1.0:
		return 0.0
	return maxf(0.0, _timer / Tuning.COMBO_DECAY_MS)

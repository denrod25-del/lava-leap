class_name FlowMeter
extends RefCounted
## Dash-Flow: momentum-as-a-resource, ported 1:1 from src/core/FlowMeter.ts.
## `value` in [0,1] maps to four heat tiers. Builds while airborne/dashing and on
## chain beats (dash / mid-air coin / stomp / bounce), drains while camping on the
## ground past a short grace window. The scene feeds state each frame via update()
## and calls beat() on chain events.

var value := 0.0
var _ground_ms := 0.0

## Advance time. `airborne` = not touching the ground; `dashing` = air-dash active.
func update(dt_ms: float, airborne: bool, dashing: bool) -> void:
	var dt := dt_ms / 1000.0
	var warm: float = Tuning.FLOW_TIER_THRESHOLDS[0]
	if dashing:
		value += Tuning.FLOW_BUILD_DASHING_PER_SEC * dt
	elif airborne and value < warm:
		# Passive airtime only warms you up — it stalls at the WARM boundary, so
		# HOT/BLAZING must be earned with beats or dash-time. Already-hot flow HOLDS
		# while airborne (stay off the ground, stay hot).
		value = minf(warm, value + Tuning.FLOW_BUILD_AIRBORNE_PER_SEC * dt)

	if airborne:
		_ground_ms = 0.0
	else:
		_ground_ms += dt_ms
		# Brief touches are free; camping past the grace window drains.
		if _ground_ms > Tuning.FLOW_GROUND_GRACE_MS:
			value -= Tuning.FLOW_DRAIN_GROUND_PER_SEC * dt
	value = clampf(value, 0.0, 1.0)

## Chain beat: dash, mid-air coin, stomp, bounce pad.
func beat() -> void:
	value = minf(1.0, value + Tuning.FLOW_BEAT_BONUS)

func tier() -> int:
	var t := Tuning.FLOW_TIER_THRESHOLDS
	if value >= t[2]:
		return 3
	if value >= t[1]:
		return 2
	if value >= t[0]:
		return 1
	return 0

func tier_name() -> String:
	return Tuning.FLOW_TIER_NAMES[tier()]

func heat_multiplier() -> float:
	return Tuning.FLOW_HEAT_MULTIPLIERS[tier()]

func speed_nudge() -> float:
	return Tuning.FLOW_SPEED_NUDGE[tier()]

## Pickup-points multiplier: combo x heat, capped so the two systems can't
## double-explode ("Flow = how you climb, Combo = what you grab").
static func combined_multiplier(combo: float, heat: float) -> float:
	return minf(Tuning.FLOW_COMBINED_CAP, combo * heat)

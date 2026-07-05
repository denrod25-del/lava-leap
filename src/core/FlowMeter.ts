import { FLOW } from '../tuning';

/** Pure Dash-Flow model: momentum-as-a-resource. Framework-free — the scene feeds
 *  airborne/dashing state each frame and calls beat() on chain events. */
export class FlowMeter {
  /** 0..1. Public for tests/dev-tuning; gameplay mutates it only via update()/beat(). */
  value = 0;
  private groundMs = 0;

  /** Advance time. airborne = not touching the ground; dashing = air-dash active.
   *  The build and drain branches are intentionally independent (a grounded dash —
   *  impossible in-game — would build while also creeping toward the drain). */
  update(dtMs: number, airborne: boolean, dashing: boolean): void {
    const dt = dtMs / 1000;
    if (dashing) {
      this.value += FLOW.buildDashingPerSec * dt;
    } else if (airborne && this.value < FLOW.tierThresholds[0]) {
      // Passive airtime only warms you up — it stalls at the WARM boundary, so
      // HOT/BLAZING must be earned with chain beats or dash-time. Flow that's
      // already hot HOLDS while airborne (stay off the ground, stay hot).
      this.value = Math.min(FLOW.tierThresholds[0], this.value + FLOW.buildAirbornePerSec * dt);
    }

    if (airborne) {
      this.groundMs = 0;
    } else {
      this.groundMs += dtMs;
      // Brief touches are free; camping past the grace window drains. Drain is
      // frame-granular by design: the frame that crosses the grace boundary drains
      // its whole dt (negligible at ~16ms frames) — don't "fix" by pro-rating.
      if (this.groundMs > FLOW.groundGraceMs) this.value -= FLOW.drainGroundPerSec * dt;
    }
    this.value = Math.min(1, Math.max(0, this.value));
  }

  /** Chain beat: dash, dash-jump cancel, mid-air coin, stomp, bounce pad. */
  beat(): void {
    this.value = Math.min(1, this.value + FLOW.beatBonus);
  }

  get tier(): number {
    const t = FLOW.tierThresholds;
    if (this.value >= t[2]) return 3;
    if (this.value >= t[1]) return 2;
    if (this.value >= t[0]) return 1;
    return 0;
  }

  get tierName(): string { return FLOW.tierNames[this.tier]; }
  get heatMultiplier(): number { return FLOW.heatMultipliers[this.tier]; }
  get speedNudge(): number { return FLOW.speedNudge[this.tier]; }
}

/** Pickup-points multiplier: combo × heat, capped so the two systems can't
 *  double-explode ("Flow = how you climb, Combo = what you grab"). */
export function combinedMultiplier(combo: number, heat: number): number {
  return Math.min(FLOW.combinedCap, combo * heat);
}

import { COMBO } from '../tuning';

/** Tracks a score multiplier that grows with combo events and decays to 1 after a
 *  quiet window. Pure/framework-free — the scene feeds events and ticks update(). */
export class ComboTracker {
  multiplier = 1;
  private timer = 0;

  /** Register a combo action (stomp/coin/bounce/power-up). */
  bump(): void {
    this.multiplier = Math.min(COMBO.max, Math.round((this.multiplier + COMBO.step) * 100) / 100);
    this.timer = COMBO.decayMs;
  }

  /** Advance time. Returns true if the multiplier reset to 1 this tick. */
  update(dtMs: number): boolean {
    if (this.multiplier <= 1) return false;
    this.timer -= dtMs;
    if (this.timer <= 0) { this.multiplier = 1; this.timer = 0; return true; }
    return false;
  }

  /** Seconds-fraction of the decay window remaining (for HUD bars). */
  get remaining01(): number {
    return this.multiplier <= 1 ? 0 : Math.max(0, this.timer / COMBO.decayMs);
  }
}

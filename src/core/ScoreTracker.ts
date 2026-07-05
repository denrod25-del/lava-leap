export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class ScoreTracker {
  maxHeight = 0;
  coins = 0;        // count, for HUD + coin banking
  bonusScore = 0;   // accumulated, already-multiplied action points (coins/stomps/bounces)
  private heatAcc = 0; // fractional Flow heat bonus on height gained

  updateHeight(height: number): void {
    if (height > this.maxHeight) this.maxHeight = height;
  }

  addCoin(n = 1): void {
    this.coins += n;
  }

  /** Add already-multiplied action points to the run's bonus score. */
  addBonus(points: number): void {
    this.bonusScore += points;
  }

  /** Flow heat: height gained this frame earns (multiplier − 1) extra points.
   *  Accumulates floats so sub-point per-frame gains aren't lost to flooring. */
  addHeatBonus(gainedPx: number, multiplier: number): void {
    if (gainedPx > 0 && multiplier > 1) this.heatAcc += gainedPx * (multiplier - 1);
  }

  get score(): number {
    return Math.floor(this.maxHeight) + this.bonusScore + Math.floor(this.heatAcc);
  }
}

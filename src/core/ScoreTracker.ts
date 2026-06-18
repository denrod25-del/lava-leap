export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class ScoreTracker {
  maxHeight = 0;
  coins = 0;        // count, for HUD + coin banking
  bonusScore = 0;   // accumulated, already-multiplied action points (coins/stomps/bounces)

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

  get score(): number {
    return Math.floor(this.maxHeight) + this.bonusScore;
  }
}

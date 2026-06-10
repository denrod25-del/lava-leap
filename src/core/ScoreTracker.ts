export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class ScoreTracker {
  maxHeight = 0;
  coins = 0;

  updateHeight(height: number): void {
    if (height > this.maxHeight) this.maxHeight = height;
  }

  addCoin(n = 1): void {
    this.coins += n;
  }

  get score(): number {
    return Math.floor(this.maxHeight) + this.coins * 10;
  }
}

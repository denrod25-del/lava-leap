export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const HI_KEY = 'lavaleap.highscore';

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

export function loadHighScore(store: KeyValueStore): number {
  return Number(store.getItem(HI_KEY) ?? 0) || 0;
}

export function saveHighScore(score: number, store: KeyValueStore): void {
  if (score > loadHighScore(store)) store.setItem(HI_KEY, String(score));
}

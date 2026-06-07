import { describe, it, expect } from 'vitest';
import { ScoreTracker, loadHighScore, saveHighScore, type KeyValueStore } from '../src/core/ScoreTracker';

function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, v),
  };
}

describe('ScoreTracker', () => {
  it('tracks max height (never decreases)', () => {
    const s = new ScoreTracker();
    s.updateHeight(100);
    s.updateHeight(50);
    expect(s.maxHeight).toBe(100);
  });

  it('scores height + 10 per coin', () => {
    const s = new ScoreTracker();
    s.updateHeight(123.7);
    s.addCoin();
    s.addCoin();
    expect(s.score).toBe(123 + 20);
  });
});

describe('high score persistence', () => {
  it('returns 0 when unset', () => {
    expect(loadHighScore(fakeStore())).toBe(0);
  });
  it('saves only when greater', () => {
    const store = fakeStore();
    saveHighScore(500, store);
    saveHighScore(300, store);
    expect(loadHighScore(store)).toBe(500);
    saveHighScore(900, store);
    expect(loadHighScore(store)).toBe(900);
  });
});

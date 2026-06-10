import { describe, it, expect } from 'vitest';
import { ScoreTracker } from '../src/core/ScoreTracker';

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

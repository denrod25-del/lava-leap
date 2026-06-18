import { describe, it, expect } from 'vitest';
import { ScoreTracker } from '../src/core/ScoreTracker';

describe('ScoreTracker', () => {
  it('tracks max height (never decreases)', () => {
    const s = new ScoreTracker();
    s.updateHeight(100);
    s.updateHeight(50);
    expect(s.maxHeight).toBe(100);
  });

  it('scores height + 10 per coin (coin value flows through addBonus)', () => {
    const s = new ScoreTracker();
    s.updateHeight(123.7);
    s.addCoin();
    s.addCoin();
    s.addBonus(10);
    s.addBonus(10);
    expect(s.score).toBe(123 + 20);
  });

  it('score = floored height + accumulated bonus; coins still tracked as count', () => {
    const s = new ScoreTracker();
    s.updateHeight(250.7);
    s.addCoin();            // count only now
    s.addBonus(40);         // already-multiplied action points
    expect(s.coins).toBe(1);
    expect(s.score).toBe(250 + 40);
  });
});

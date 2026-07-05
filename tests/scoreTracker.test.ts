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

  it('heat bonus adds (multiplier − 1) × height gained to the score', () => {
    const s = new ScoreTracker();
    s.addHeatBonus(100, 2);  // +100 bonus
    s.updateHeight(100);     // +100 height
    expect(s.score).toBe(200);
  });

  it('heat bonus at ×1 adds nothing', () => {
    const s = new ScoreTracker();
    s.addHeatBonus(500, 1);
    s.updateHeight(100);
    expect(s.score).toBe(100);
  });

  it('heat bonus accumulates sub-point fractions across frames', () => {
    const s = new ScoreTracker();
    for (let i = 0; i < 50; i++) s.addHeatBonus(1, 1.25); // 50 × 0.25 = 12.5
    expect(s.score).toBe(12); // floor of the accumulated float
  });

  it('negative or zero gain never adds heat bonus', () => {
    const s = new ScoreTracker();
    s.addHeatBonus(0, 2);
    s.addHeatBonus(-10, 2);
    expect(s.score).toBe(0);
  });
});

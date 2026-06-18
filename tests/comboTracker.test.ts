import { describe, it, expect } from 'vitest';
import { ComboTracker } from '../src/core/ComboTracker';
import { COMBO } from '../src/tuning';

describe('ComboTracker', () => {
  it('starts at x1 and bumps by step up to the cap', () => {
    const c = new ComboTracker();
    expect(c.multiplier).toBe(1);
    c.bump(); expect(c.multiplier).toBeCloseTo(1 + COMBO.step);
    for (let i = 0; i < 50; i++) c.bump();
    expect(c.multiplier).toBe(COMBO.max);
  });

  it('decays to x1 only after the decay window elapses with no bump', () => {
    const c = new ComboTracker();
    c.bump();
    c.update(COMBO.decayMs - 1);   // not yet expired
    expect(c.multiplier).toBeGreaterThan(1);
    const reset = c.update(2);     // crosses the threshold
    expect(reset).toBe(true);
    expect(c.multiplier).toBe(1);
  });

  it('a bump refreshes the decay timer', () => {
    const c = new ComboTracker();
    c.bump(); c.update(COMBO.decayMs - 10);
    c.bump(); // refresh
    c.update(COMBO.decayMs - 10);
    expect(c.multiplier).toBeGreaterThan(1); // would have expired without the refresh
  });

  it('update at x1 never reports a change', () => {
    const c = new ComboTracker();
    expect(c.update(9999)).toBe(false);
  });
});

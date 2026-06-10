import { describe, it, expect } from 'vitest';
import { dailySeed, dateKey } from '../src/core/dailySeed';

describe('dailySeed', () => {
  it('same date -> same seed; different dates differ', () => {
    const a = new Date(2026, 5, 9), b = new Date(2026, 5, 9, 23, 59), c = new Date(2026, 5, 10);
    expect(dailySeed(a)).toBe(dailySeed(b));
    expect(dailySeed(a)).not.toBe(dailySeed(c));
  });
  it('dateKey formats as YYYY-MM-DD (local)', () => {
    expect(dateKey(new Date(2026, 5, 9))).toBe('2026-06-09');
    expect(dateKey(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
  it('seed is a positive 32-bit integer', () => {
    const s = dailySeed(new Date(2026, 5, 9));
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeGreaterThan(0);
  });
});

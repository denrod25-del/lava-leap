import { describe, it, expect } from 'vitest';
import { defaultAnalytics, recordRunStart, recordDeath, recordUnlock, recordBank } from '../src/core/analytics';

describe('analytics', () => {
  it('counts runs and daily plays', () => {
    const a = defaultAnalytics();
    recordRunStart(a, false);
    recordRunStart(a, true);
    expect(a.runs).toBe(2);
    expect(a.dailyPlays).toBe(1);
  });
  it('buckets deaths by 100px and by zone', () => {
    const a = defaultAnalytics();
    recordDeath(a, 437, 1);
    recordDeath(a, 455, 1);
    recordDeath(a, 1620, 2);
    expect(a.deathsByBucket['400']).toBe(2);
    expect(a.deathsByBucket['1600']).toBe(1);
    expect(a.deathsByZone['1']).toBe(2);
    expect(a.deathsByZone['2']).toBe(1);
  });
  it('counts unlocks and banked coins', () => {
    const a = defaultAnalytics();
    recordUnlock(a);
    recordBank(a, 35);
    recordBank(a, 5);
    expect(a.achievementsUnlocked).toBe(1);
    expect(a.coinsBanked).toBe(40);
  });
});

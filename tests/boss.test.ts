import { describe, it, expect } from 'vitest';
import { bossBoundaryCrossed, projectileSchedule, BOSS_BOUNDARIES } from '../src/core/boss';

describe('boss', () => {
  it('detects each boundary crossing exactly once', () => {
    expect(bossBoundaryCrossed(990, 1010)).toBe(0); // crossed 1000 -> zone-1 boss index 0
    expect(bossBoundaryCrossed(1010, 1200)).toBe(-1); // no crossing
    expect(bossBoundaryCrossed(1990, 2010)).toBe(1);
    expect(bossBoundaryCrossed(2990, 3010)).toBe(2);
    expect(bossBoundaryCrossed(500, 600)).toBe(-1);
  });

  it('exposes 3 boundaries at 1000/2000/3000', () => {
    expect(BOSS_BOUNDARIES).toEqual([1000, 2000, 3000]);
  });

  it('projectile schedule scales with boss index and is deterministic', () => {
    const a = projectileSchedule(0, 12345);
    const b = projectileSchedule(0, 12345);
    expect(a).toEqual(b);
    expect(projectileSchedule(2, 1).length).toBeGreaterThan(projectileSchedule(0, 1).length);
    for (const p of a) {
      expect(p.tMs).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeGreaterThanOrEqual(0);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { rollHazard, rollEnemy, rollPowerup } from '../src/core/hazardRules';
import { makeRng } from '../src/core/rng';
import { HAZARD } from '../src/tuning';

describe('hazardRules', () => {
  it('no hazards below grace height', () => {
    const rng = makeRng(1);
    for (let i = 0; i < 100; i++) {
      expect(rollHazard(rng, 0, HAZARD.graceHeight - 1).spikes).toBe(false);
    }
  });

  it('spike chance rises with difficulty', () => {
    const count = (t: number) => {
      const rng = makeRng(5); let n = 0;
      for (let i = 0; i < 5000; i++) if (rollHazard(rng, t, 1000).spikes) n++;
      return n;
    };
    expect(count(1)).toBeGreaterThan(count(0));
  });

  it('a platform never gets both spikes and bounce', () => {
    const rng = makeRng(9);
    for (let i = 0; i < 5000; i++) {
      const h = rollHazard(rng, 1, 1000);
      expect(h.spikes && h.bounce).toBe(false);
    }
  });

  it('rollEnemy returns crawler or drifter or null, deterministic', () => {
    const seq = (seed: number) => {
      const rng = makeRng(seed);
      return Array.from({ length: 20 }, () => rollEnemy(rng, 1, 1000));
    };
    expect(seq(3)).toEqual(seq(3));
    const kinds = new Set(seq(3).filter(Boolean));
    for (const k of kinds) expect(['crawler', 'drifter']).toContain(k);
  });

  it('rollPowerup yields a valid kind sometimes and null mostly', () => {
    const rng = makeRng(7); const kinds = new Set<string>(); let nulls = 0;
    for (let i = 0; i < 3000; i++) {
      const k = rollPowerup(rng);
      if (k === null) nulls++; else kinds.add(k);
    }
    expect(nulls).toBeGreaterThan(1500);
    for (const k of kinds) expect(['shield', 'rocket', 'magnet', 'slowlava']).toContain(k);
  });
});

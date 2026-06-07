import { describe, it, expect } from 'vitest';
import { LevelGenerator } from '../src/core/LevelGenerator';
import { TUNING, REACH } from '../src/tuning';

describe('LevelGenerator.first', () => {
  it('places a wide starting platform under the player spawn', () => {
    const gen = new LevelGenerator(42);
    const first = gen.first();
    expect(first.id).toBe(0);
    expect(first.y).toBe(TUNING.groundY);
    expect(first.type).toBe('static');
    expect(first.width).toBe(REACH.maxPlatformWidth);
    // spans the spawn x
    expect(first.x).toBeLessThanOrEqual(TUNING.playerStartX);
    expect(first.x + first.width).toBeGreaterThanOrEqual(TUNING.playerStartX);
  });
});

describe('LevelGenerator.next reachability', () => {
  it('always produces reachable, on-screen platforms across a long climb', () => {
    const gen = new LevelGenerator(99);
    let prev = gen.first();
    for (let i = 0; i < 2000; i++) {
      const p = gen.next();
      const vGap = prev.y - p.y; // climbing => positive
      expect(vGap).toBeGreaterThanOrEqual(REACH.minVerticalGap - 0.001);
      expect(vGap).toBeLessThanOrEqual(REACH.maxVerticalGap + 0.001);

      const edgeGap = horizontalEdgeGap(prev, p);
      expect(edgeGap).toBeLessThanOrEqual(REACH.maxHorizontalEdgeGap + 0.001);

      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + p.width).toBeLessThanOrEqual(TUNING.width);
      expect(p.width).toBeGreaterThanOrEqual(REACH.minPlatformWidth - 0.001);
      expect(p.width).toBeLessThanOrEqual(REACH.maxPlatformWidth + 0.001);
      expect(p.id).toBe(prev.id + 1);
      prev = p;
    }
  });
});

function horizontalEdgeGap(a: { x: number; width: number }, b: { x: number; width: number }): number {
  const aRight = a.x + a.width;
  const bRight = b.x + b.width;
  if (b.x > aRight) return b.x - aRight;     // b entirely right of a
  if (a.x > bRight) return a.x - bRight;     // b entirely left of a
  return 0;                                   // overlapping x-ranges
}

describe('LevelGenerator type mix', () => {
  function typeCounts(seed: number, climbTo: number) {
    const gen = new LevelGenerator(seed);
    gen.first();
    const counts: Record<string, number> = { static: 0, crumbling: 0, moving: 0 };
    let p = gen.next();
    let n = 0;
    while (TUNING.groundY - p.y < climbTo && n < 100000) {
      counts[p.type]++;
      p = gen.next();
      n++;
    }
    return counts;
  }

  it('is mostly static low down', () => {
    const low = typeCounts(5, 600);
    expect(low.static).toBeGreaterThan(low.crumbling + low.moving);
  });

  it('introduces more crumbling/moving higher up', () => {
    const gen = new LevelGenerator(5);
    gen.first();
    // climb to ~3500px then sample 400 platforms
    let p = gen.next();
    while (TUNING.groundY - p.y < 3500) p = gen.next();
    const counts: Record<string, number> = { static: 0, crumbling: 0, moving: 0 };
    for (let i = 0; i < 400; i++) { counts[p.type]++; p = gen.next(); }
    expect(counts.crumbling + counts.moving).toBeGreaterThan(0);
  });

  it('moving platforms carry a movement spec; others do not', () => {
    const gen = new LevelGenerator(11);
    gen.first();
    for (let i = 0; i < 2000; i++) {
      const p = gen.next();
      if (p.type === 'moving') {
        expect(p.movement).toBeDefined();
        expect(p.movement!.range).toBeGreaterThan(0);
      } else {
        expect(p.movement).toBeUndefined();
      }
    }
  });
});

describe('LevelGenerator moving platform bounds', () => {
  it('moving platforms never travel off-screen through their full range (3000 platforms, multiple seeds)', () => {
    for (const seed of [1, 7, 42, 99, 314]) {
      const gen = new LevelGenerator(seed);
      gen.first();
      for (let i = 0; i < 3000; i++) {
        const p = gen.next();
        if (p.type === 'moving') {
          expect(p.movement).toBeDefined();
          const range = p.movement!.range;
          expect(range).toBeGreaterThan(0);
          // Left travel must stay on-screen
          expect(p.x - range).toBeGreaterThanOrEqual(0);
          // Right travel must stay on-screen
          expect(p.x + p.width + range).toBeLessThanOrEqual(TUNING.width);
        }
      }
    }
  });
});

describe('LevelGenerator coins', () => {
  it('places coins on a minority of platforms, deterministically', () => {
    const count = (seed: number) => {
      const gen = new LevelGenerator(seed);
      gen.first();
      let c = 0;
      for (let i = 0; i < 1000; i++) if (gen.next().hasCoin) c++;
      return c;
    };
    const c1 = count(3);
    expect(c1).toBeGreaterThan(0);
    expect(c1).toBeLessThan(1000); // not on every platform
    expect(count(3)).toBe(c1);     // deterministic
  });

  it('never puts coins on crumbling platforms', () => {
    const gen = new LevelGenerator(8);
    gen.first();
    for (let i = 0; i < 3000; i++) {
      const p = gen.next();
      if (p.type === 'crumbling') expect(p.hasCoin).toBe(false);
    }
  });
});

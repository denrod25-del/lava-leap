import { describe, it, expect } from 'vitest';
import { LevelGenerator } from '../src/core/LevelGenerator';
import { TUNING, REACH, HAZARD } from '../src/tuning';

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
      // Hand-authored set-piece entry/landing platforms may be wider than the
      // parametric max (validateChunk allows up to maxPlatformWidth + 50).
      expect(p.width).toBeLessThanOrEqual(REACH.maxPlatformWidth + 50 + 0.001);
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

describe('set-piece injection', () => {
  it('injects chunks (chunk platform signatures appear) and stays fully reachable over 5000 platforms', () => {
    const gen = new LevelGenerator(123);
    let prev = gen.first();
    let sawChunkEntry = 0;
    for (let i = 0; i < 5000; i++) {
      const p = gen.next();
      const vGap = prev.y - p.y;
      expect(vGap).toBeGreaterThanOrEqual(REACH.minVerticalGap - 0.001);
      expect(vGap).toBeLessThanOrEqual(REACH.maxVerticalGap + 0.001);
      expect(horizontalEdgeGap(prev, p)).toBeLessThanOrEqual(REACH.maxHorizontalEdgeGap + 0.001);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + p.width).toBeLessThanOrEqual(TUNING.width);
      if (p.width === 200) sawChunkEntry++; // 200-wide entry/landing platforms are unique to chunks
      prev = p;
    }
    expect(sawChunkEntry).toBeGreaterThan(50); // ~5000/20 chunks, most have 1-2 such rows
  });

  it('is deterministic per seed with chunks enabled', () => {
    const run = (seed: number) => {
      const g = new LevelGenerator(seed);
      g.first();
      return Array.from({ length: 200 }, () => { const p = g.next(); return `${p.x},${p.y},${p.width},${p.type}`; }).join('|');
    };
    expect(run(55)).toBe(run(55));
    expect(run(55)).not.toBe(run(56));
  });
});

describe('zone type-mix bias', () => {
  it('produces more hazard platforms in Obsidian Crown than Magma Vault at equal ramp difficulty', () => {
    // Compare hazard share in zone 0 (0-1000) vs zone 3 (3000-4000): the ramp rises too,
    // but the bias must push zone 3 hazards above what the ramp alone would give at zone 0.
    const count = (lo: number, hi: number) => {
      const gen = new LevelGenerator(7);
      gen.first();
      let hazards = 0, total = 0;
      let p = gen.next();
      while (TUNING.groundY - p.y < hi) {
        const h = TUNING.groundY - p.y;
        if (h >= lo) { total++; if (p.type !== 'static') hazards++; }
        p = gen.next();
      }
      return hazards / Math.max(1, total);
    };
    expect(count(3000, 4000)).toBeGreaterThan(count(0, 1000));
  });

  it('pickType consults the zone bias table', () => {
    // With the ramp clamped (difficulty saturates at difficultySpan=4000), heights past
    // 4000 differ ONLY by zone bias staying applied. Zone 3 bias adds 0.22 hazard
    // probability over no-bias; sample far above the ramp cap and compare to the
    // theoretical no-bias ceiling at t=1: pCrumble+pMoving = 0.35+0.30 = 0.65.
    const gen = new LevelGenerator(11);
    gen.first();
    let p = gen.next();
    while (TUNING.groundY - p.y < 6000) p = gen.next();
    let hazards = 0;
    const N = 1500;
    for (let i = 0; i < N; i++) { p = gen.next(); if (p.type !== 'static') hazards++; }
    expect(hazards / N).toBeGreaterThan(0.70); // 0.65 ceiling without bias; ~0.87 with
  });
});

describe('bounce-pad attachment', () => {
  it('bounce pads only on static platforms, never below grace; some appear', () => {
    const gen = new LevelGenerator(321);
    gen.first();
    let bounces = 0;
    for (let i = 0; i < 4000; i++) {
      const p = gen.next();
      if (TUNING.groundY - p.y < HAZARD.graceHeight) expect(p.bounce).toBeUndefined();
      if (p.bounce) { expect(p.type).toBe('static'); bounces++; }
    }
    expect(bounces).toBeGreaterThan(0);
  });
});

describe('powerup attachment', () => {
  it('rarely attaches a valid power-up, only above grace, not on enemy/bounce platforms, deterministic', () => {
    const run = (seed: number) => {
      const gen = new LevelGenerator(seed);
      gen.first();
      let count = 0;
      for (let i = 0; i < 5000; i++) {
        const p = gen.next();
        if (p.powerup) {
          expect(['shield', 'rocket', 'magnet', 'slowlava']).toContain(p.powerup.kind);
          expect(p.enemy).toBeUndefined();
          expect(p.bounce).toBeUndefined();
          expect(TUNING.groundY - p.y).toBeGreaterThanOrEqual(HAZARD.graceHeight);
          count++;
        }
      }
      return count;
    };
    expect(run(8)).toBe(run(8));
    expect(run(8)).toBeGreaterThan(5);
  });
});

describe('enemy attachment', () => {
  it('enemies only appear on static platforms', () => {
    const gen = new LevelGenerator(777);
    gen.first();
    for (let i = 0; i < 4000; i++) {
      const p = gen.next();
      if (p.enemy) expect(p.type).toBe('static');
    }
  });

  it('enemies never appear below the grace height', () => {
    const gen = new LevelGenerator(888);
    gen.first();
    for (let i = 0; i < 4000; i++) {
      const p = gen.next();
      if (TUNING.groundY - p.y < HAZARD.graceHeight) expect(p.enemy).toBeUndefined();
    }
  });

  it('enemies never appear on bounce platforms', () => {
    const gen = new LevelGenerator(999);
    gen.first();
    for (let i = 0; i < 4000; i++) {
      const p = gen.next();
      if (p.bounce) expect(p.enemy).toBeUndefined();
      if (p.enemy) expect(p.bounce).toBeUndefined();
    }
  });

  it('enemy kinds are valid (crawler or drifter)', () => {
    const gen = new LevelGenerator(111);
    gen.first();
    for (let i = 0; i < 4000; i++) {
      const p = gen.next();
      if (p.enemy) {
        expect(['crawler', 'drifter']).toContain(p.enemy.kind);
      }
    }
  });

  it('some enemies appear over 3000 platforms', () => {
    const gen = new LevelGenerator(222);
    gen.first();
    let enemies = 0;
    for (let i = 0; i < 3000; i++) {
      if (gen.next().enemy) enemies++;
    }
    expect(enemies).toBeGreaterThan(0);
  });

  it('is deterministic per seed', () => {
    const run = (seed: number) => {
      const g = new LevelGenerator(seed);
      g.first();
      return Array.from({ length: 300 }, () => {
        const p = g.next();
        return `${p.id}:${p.enemy?.kind ?? 'none'}`;
      }).join('|');
    };
    const a = run(42);
    const b = run(42);
    expect(a).toBe(b);
    expect(run(42)).not.toBe(run(43));
  });
});

describe('rocket unlock height gate', () => {
  it('never attaches rocket below the unlock height', () => {
    const gen = new LevelGenerator(8, 0, 4000);
    gen.first();
    for (let i = 0; i < 5000; i++) {
      const p = gen.next();
      if (TUNING.groundY - p.y < 4000 && p.powerup) {
        expect(p.powerup.kind).not.toBe('rocket');
      }
    }
  });

  it('can attach rocket above the unlock height', () => {
    const gen = new LevelGenerator(8, 0, 4000);
    gen.first();
    let p = gen.next();
    while (TUNING.groundY - p.y < 4000) p = gen.next();
    let sawRocket = false;
    for (let i = 0; i < 5000; i++) {
      p = gen.next();
      if (p.powerup?.kind === 'rocket') sawRocket = true;
    }
    expect(sawRocket).toBe(true);
  });

  it('defaults to never-gated (Infinity) when the param is omitted, matching pre-v0.12.0 behavior', () => {
    const gen = new LevelGenerator(8);
    gen.first();
    let sawRocket = false;
    for (let i = 0; i < 5000; i++) {
      const p = gen.next();
      if (p.powerup?.kind === 'rocket') sawRocket = true;
    }
    expect(sawRocket).toBe(true);
  });

  it('converts gated rockets to shields — the gate never changes WHICH platforms get a power-up', () => {
    const collect = (rocketUnlockHeight: number) => {
      const gen = new LevelGenerator(8, 0, rocketUnlockHeight);
      gen.first();
      const byId = new Map<number, { kind: string; height: number }>();
      for (let i = 0; i < 5000; i++) {
        const p = gen.next();
        if (p.powerup) byId.set(p.id, { kind: p.powerup.kind, height: TUNING.groundY - p.y });
      }
      return byId;
    };
    const gated = collect(4000);
    const ungated = collect(Infinity);
    // Identical power-up placement: same platform ids, same count.
    expect([...gated.keys()]).toEqual([...ungated.keys()]);
    let conversions = 0;
    for (const [id, u] of ungated) {
      const g = gated.get(id)!;
      if (u.height < 4000 && u.kind === 'rocket') {
        expect(g.kind).toBe('shield'); // converted, not discarded
        conversions++;
      } else {
        expect(g.kind).toBe(u.kind); // everything else identical
      }
    }
    expect(conversions).toBeGreaterThan(0); // the conversion path was actually exercised
  });
});

import { describe, it, expect } from 'vitest';
import {
  MISSION_POOL, PAYOUTS, missionsForDate,
  freshState, ensureToday, bumpMetric, newlyCompleted,
} from '../src/core/missions';

describe('mission pool', () => {
  it('has 12 templates, 4 per tier, unique ids, positive targets', () => {
    expect(MISSION_POOL).toHaveLength(12);
    for (const tier of ['easy', 'medium', 'hard'] as const) {
      expect(MISSION_POOL.filter((m) => m.tier === tier)).toHaveLength(4);
    }
    expect(new Set(MISSION_POOL.map((m) => m.id)).size).toBe(12);
    expect(MISSION_POOL.every((m) => m.target > 0)).toBe(true);
  });
  it('every easy template is cumulative (add-mode metric) — e2e burst guarantee', () => {
    const singleRun = ['bestHeight', 'bestRunCoins'];
    expect(MISSION_POOL.filter((m) => m.tier === 'easy').every((m) => !singleRun.includes(m.metric))).toBe(true);
  });
  it('payouts are 30/50/80', () => {
    expect(PAYOUTS).toEqual({ easy: 30, medium: 50, hard: 80 });
  });
});

describe('rotation', () => {
  it('same date → identical triple, one per tier, in tier order', () => {
    const a = missionsForDate('2026-07-22');
    const b = missionsForDate('2026-07-22');
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
    expect(a.map((m) => m.tier)).toEqual(['easy', 'medium', 'hard']);
  });
  it('30 consecutive dates hit every template at least once and are not all identical', () => {
    const seen = new Set<string>();
    const triples = new Set<string>();
    for (let d = 1; d <= 30; d++) {
      const dk = `2026-08-${String(d).padStart(2, '0')}`;
      const ms = missionsForDate(dk);
      ms.forEach((m) => seen.add(m.id));
      triples.add(ms.map((m) => m.id).join('|'));
    }
    expect(seen.size).toBe(12);
    expect(triples.size).toBeGreaterThan(1);
  });
});

describe('state machine', () => {
  it('ensureToday keeps same-day state and resets on a new day', () => {
    const s = freshState('2026-07-22');
    s.metrics.coins = 10;
    expect(ensureToday(s, '2026-07-22')).toBe(s);
    const reset = ensureToday(s, '2026-07-23');
    expect(reset.dateKey).toBe('2026-07-23');
    expect(reset.metrics.coins).toBe(0);
    expect(reset.completed).toEqual([]);
  });
  it('bumpMetric: add accumulates, max keeps the peak', () => {
    const s = freshState('2026-07-22');
    bumpMetric(s, 'coins', 3, 'add');
    bumpMetric(s, 'coins', 2, 'add');
    expect(s.metrics.coins).toBe(5);
    bumpMetric(s, 'bestHeight', 1200, 'max');
    bumpMetric(s, 'bestHeight', 900, 'max');
    expect(s.metrics.bestHeight).toBe(1200);
  });
  it('newlyCompleted fires once per mission and only when the target is met', () => {
    const s = freshState('2026-07-22');
    const defs = MISSION_POOL.filter((m) => m.id === 'coins-25');
    bumpMetric(s, 'coins', 24, 'add');
    expect(newlyCompleted(s, defs)).toEqual([]);
    bumpMetric(s, 'coins', 1, 'add');
    const done = newlyCompleted(s, defs);
    expect(done.map((m) => m.id)).toEqual(['coins-25']);
    s.completed.push('coins-25');
    bumpMetric(s, 'coins', 100, 'add');
    expect(newlyCompleted(s, defs)).toEqual([]);
  });
});

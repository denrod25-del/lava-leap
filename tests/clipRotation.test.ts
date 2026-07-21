// tests/clipRotation.test.ts
import { describe, it, expect } from 'vitest';
import { SEGMENT_MS, initialState, advance, pickWinner, type RotationState } from '../src/core/clipRotation';

/** Run advance() at 100ms ticks from `from` to `to`, applying actions to a mock timeline. */
function runTo(to: number): { state: RotationState; log: string[] } {
  let state = initialState();
  const log: string[] = [];
  for (let t = 0; t <= to; t += 100) {
    const r = advance(state, t);
    state = r.state;
    r.actions.forEach((a) => log.push(`${t}:${a}`));
  }
  return { state, log };
}

describe('clipRotation', () => {
  it('starts A immediately and B one segment later', () => {
    const { log } = runTo(SEGMENT_MS);
    expect(log[0]).toBe('0:startA');
    expect(log[1]).toBe(`${SEGMENT_MS}:startB`);
    expect(log).toHaveLength(2);
  });

  it('restarts each recorder after two segments, staggered forever', () => {
    const { log } = runTo(SEGMENT_MS * 4); // 60s
    expect(log).toEqual([
      '0:startA',
      `${SEGMENT_MS}:startB`,
      `${SEGMENT_MS * 2}:stopA`, `${SEGMENT_MS * 2}:startA`,
      `${SEGMENT_MS * 3}:stopB`, `${SEGMENT_MS * 3}:startB`,
      `${SEGMENT_MS * 4}:stopA`, `${SEGMENT_MS * 4}:startA`,
    ]);
  });

  it('winner is the older running recorder (15-30s of footage once warmed up)', () => {
    const { state } = runTo(SEGMENT_MS * 2 + 1000); // t=31s: A restarted at 30s, B started at 15s
    expect(pickWinner(state, SEGMENT_MS * 2 + 1000)).toBe('b');
  });

  it('winner is A during the opening segment (short runs still get a clip)', () => {
    const { state } = runTo(5000);
    expect(pickWinner(state, 5000)).toBe('a');
  });

  it('winner is null before anything started', () => {
    expect(pickWinner(initialState(), 0)).toBe(null);
  });

  it('winner age never exceeds two segments and (after warmup) never drops below one', () => {
    let state = initialState();
    for (let t = 0; t <= SEGMENT_MS * 10; t += 100) {
      state = advance(state, t).state;
      if (t > SEGMENT_MS) {
        const w = pickWinner(state, t)!;
        const startedAt = w === 'a' ? state.aStartedAt! : state.bStartedAt!;
        const age = t - startedAt;
        expect(age).toBeGreaterThanOrEqual(SEGMENT_MS);
        expect(age).toBeLessThanOrEqual(SEGMENT_MS * 2);
      }
    }
  });
});

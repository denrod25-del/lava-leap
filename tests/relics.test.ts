import { describe, it, expect } from 'vitest';
import { RelicPlanner } from '../src/core/relics';
import type { PlatformDescriptor } from '../src/core/types';

const plat = (over: Partial<PlatformDescriptor> = {}): PlatformDescriptor => ({
  id: 1, x: 100, y: 400, width: 100, type: 'static', hasCoin: false, ...over,
});

describe('RelicPlanner', () => {
  it('places nothing below the first threshold', () => {
    const rp = new RelicPlanner(8);
    expect(rp.maybePlace(plat(), 100)).toBe(false);
  });
  it('places once past the threshold, then waits everyPx for the next', () => {
    const rp = new RelicPlanner(8); // firstAt 200, every 500 (RELIC defaults)
    expect(rp.maybePlace(plat(), 250)).toBe(true);
    expect(rp.maybePlace(plat({ id: 2 }), 400)).toBe(false); // next at 750
    expect(rp.maybePlace(plat({ id: 3 }), 800)).toBe(true);
  });
  it('skips non-static / bounce / enemy / powerup platforms without burning the slot', () => {
    const rp = new RelicPlanner(8);
    expect(rp.maybePlace(plat({ type: 'crumbling' }), 300)).toBe(false);
    expect(rp.maybePlace(plat({ bounce: true }), 320)).toBe(false);
    expect(rp.maybePlace(plat({ enemy: { kind: 'crawler' } }), 340)).toBe(false);
    expect(rp.maybePlace(plat({ powerup: { kind: 'rocket' } }), 360)).toBe(false);
    expect(rp.maybePlace(plat(), 380)).toBe(true); // slot still available
  });
  it('stops after `remaining` placements', () => {
    const rp = new RelicPlanner(2);
    expect(rp.maybePlace(plat(), 250)).toBe(true);
    expect(rp.maybePlace(plat({ id: 2 }), 800)).toBe(true);
    expect(rp.maybePlace(plat({ id: 3 }), 2000)).toBe(false); // exhausted
  });
  it('a zero-remaining planner never places', () => {
    const rp = new RelicPlanner(0);
    expect(rp.maybePlace(plat(), 999)).toBe(false);
  });
});

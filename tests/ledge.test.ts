import { describe, it, expect } from 'vitest';
import { findLedge } from '../src/core/ledge';
import { LEDGE } from '../src/tuning';

// Coordinate contract: x,y = TOP-LEFT of boxes (matches Arcade Body.x/.y).
const PLAYER = { x: 0, y: 0, width: 24, height: 32, vy: 100 };
const PLAT = { id: 7, x: 100, y: 10, width: 150, type: 'static' };

describe('findLedge', () => {
  it('grabs a static platform left edge when falling right toward it, hands in window', () => {
    // Player right edge at 100 - 4 (4px gap, within reachX); platform top (10)
    // inside [player top 0, player mid 16].
    const c = findLedge({ ...PLAYER, x: 100 - 24 - 4 }, 1, [PLAT]);
    expect(c).toEqual({ platformId: 7, snapX: 100 - 24, snapY: 10, side: 'left' });
  });

  it('grabs a right edge when steering left', () => {
    const c = findLedge({ ...PLAYER, x: 100 + 150 + 4 }, -1, [PLAT]);
    expect(c).toEqual({ platformId: 7, snapX: 250, snapY: 10, side: 'right' });
  });

  it('returns null when rising, not steering, or steering away', () => {
    expect(findLedge({ ...PLAYER, x: 72, vy: -50 }, 1, [PLAT])).toBeNull();
    expect(findLedge({ ...PLAYER, x: 72 }, 0, [PLAT])).toBeNull();
    expect(findLedge({ ...PLAYER, x: 72 }, -1, [PLAT])).toBeNull(); // platform is to the RIGHT
  });

  it('ignores non-static platforms', () => {
    expect(findLedge({ ...PLAYER, x: 72 }, 1, [{ ...PLAT, type: 'crumbling' }])).toBeNull();
    expect(findLedge({ ...PLAYER, x: 72 }, 1, [{ ...PLAT, type: 'moving' }])).toBeNull();
  });

  it('enforces the hands window: platform top must be between player top and mid-height', () => {
    expect(findLedge({ ...PLAYER, x: 72, y: 20 }, 1, [PLAT])).toBeNull();   // plat top above player top
    expect(findLedge({ ...PLAYER, x: 72, y: -30 }, 1, [PLAT])).toBeNull();  // plat top below player mid
    expect(findLedge({ ...PLAYER, x: 72, y: 10 }, 1, [PLAT])).not.toBeNull();  // exactly at top
    expect(findLedge({ ...PLAYER, x: 72, y: -6 }, 1, [PLAT])).not.toBeNull();  // top 10 == mid (=-6+16)
  });

  it('enforces horizontal reach', () => {
    expect(findLedge({ ...PLAYER, x: 100 - 24 - LEDGE.reachX - 1 }, 1, [PLAT])).toBeNull();
    expect(findLedge({ ...PLAYER, x: 100 - 24 - LEDGE.reachX }, 1, [PLAT])).not.toBeNull();
  });

  it('picks the first eligible platform and reports its id', () => {
    const other = { id: 9, x: 100, y: 12, width: 150, type: 'static' };
    const c = findLedge({ ...PLAYER, x: 72 }, 1, [PLAT, other]);
    expect(c!.platformId).toBe(7);
  });
});

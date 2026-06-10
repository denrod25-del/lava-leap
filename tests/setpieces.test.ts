import { describe, it, expect } from 'vitest';
import { SET_PIECES, validateChunk } from '../src/core/setpieces';
import { REACH, TUNING } from '../src/tuning';

describe('set-piece templates', () => {
  it('there are exactly 3 templates with unique ids', () => {
    expect(SET_PIECES).toHaveLength(3);
    expect(new Set(SET_PIECES.map((c) => c.id)).size).toBe(3);
  });

  it('every template passes validateChunk (no violations)', () => {
    for (const chunk of SET_PIECES) {
      expect(validateChunk(chunk), chunk.id).toEqual([]);
    }
  });

  it('validateChunk catches an unreachable hop', () => {
    const bad = {
      id: 'bad', platforms: [
        { x: 140, width: 200, type: 'static' as const, hasCoin: false, dyToNext: 300 }, // gap too tall
        { x: 140, width: 200, type: 'static' as const, hasCoin: false, dyToNext: 0 },
      ],
    };
    expect(validateChunk(bad).length).toBeGreaterThan(0);
  });

  it('entry platforms are reachable from any previous on-screen platform', () => {
    // First platform must come within maxHorizontalEdgeGap of BOTH screen extremes.
    for (const chunk of SET_PIECES) {
      const first = chunk.platforms[0];
      expect(first.x).toBeLessThanOrEqual(REACH.minPlatformWidth + REACH.maxHorizontalEdgeGap);
      expect(first.x + first.width).toBeGreaterThanOrEqual(
        TUNING.width - REACH.minPlatformWidth - REACH.maxHorizontalEdgeGap,
      );
    }
  });
});

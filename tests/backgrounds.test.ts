// tests/backgrounds.test.ts
import { describe, it, expect } from 'vitest';
import { BG_SCENE_SPAN, bgScene } from '../src/core/backgrounds';
import { ZONES, zoneForHeight } from '../src/core/zones';

describe('bgScene', () => {
  it('endless: key 0 / zone 0 at the start and negative heights', () => {
    expect(bgScene(0, false)).toEqual({ key: 0, zoneIndex: 0 });
    expect(bgScene(-50, false)).toEqual({ key: 0, zoneIndex: 0 });
  });
  it('endless: key advances every BG_SCENE_SPAN px', () => {
    expect(bgScene(BG_SCENE_SPAN - 1, false).key).toBe(0);
    expect(bgScene(BG_SCENE_SPAN, false).key).toBe(1);
    expect(bgScene(BG_SCENE_SPAN * 3, false).key).toBe(3);
  });
  it('endless: zone cycles forever through all zones', () => {
    const n = ZONES.length;
    expect(bgScene(BG_SCENE_SPAN * n, false).zoneIndex).toBe(0);       // wraps
    expect(bgScene(BG_SCENE_SPAN * (n + 1), false).zoneIndex).toBe(1);
    // key keeps growing even though zone wraps — a wrap still crossfades
    expect(bgScene(BG_SCENE_SPAN * n, false).key).toBe(n);
  });
  it('level mode: pins to the gameplay zone and ignores the scene cadence', () => {
    const h = 2500; // scene cadence would say key 1; zone says whatever zoneForHeight says
    const z = zoneForHeight(h);
    expect(bgScene(h, true)).toEqual({ key: z.index, zoneIndex: z.index });
  });
});

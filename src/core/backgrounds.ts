// src/core/backgrounds.ts
import { ZONES, zoneForHeight } from './zones';

/**
 * Height (px) each background "scene" spans in endless/daily before crossfading
 * to the next environment. Deliberately longer than a gameplay zone (1000px) so
 * the climb reads as a sequence of distinct places rather than flipping backdrops
 * constantly; scenes cycle through the environments endlessly. Tune here.
 */
export const BG_SCENE_SPAN = 2000;

/** Which backdrop to show at a height. `key` changes exactly when a crossfade is due. */
export function bgScene(height: number, isLevel: boolean): { key: number; zoneIndex: number } {
  if (isLevel) {
    const z = zoneForHeight(height);
    return { key: z.index, zoneIndex: z.index };
  }
  const sceneIdx = Math.floor(Math.max(0, height) / BG_SCENE_SPAN);
  return { key: sceneIdx, zoneIndex: sceneIdx % ZONES.length };
}

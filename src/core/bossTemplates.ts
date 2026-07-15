import { TUNING } from '../tuning';
import type { SetPiece, ChunkPlatform } from './setpieces';

// Boss gauntlets are tighter than the normal set-pieces: narrower platforms and
// near-maximal horizontal hops, kept reach-valid (edge gaps <= REACH.maxHorizontalEdgeGap,
// vertical gaps within REACH bounds) so they are always beatable. The wide `entry`
// anchor (200px, centered) opens and closes each gauntlet so it links cleanly to the
// procedural stream above and below. Authored and validated against TUNING.width (600).
const C = Math.round(TUNING.width / 2);

/** A wide static platform centered under the spawn lane — reachable from anywhere. */
const entry = (dyToNext: number): ChunkPlatform => ({
  x: C - 100, width: 200, type: 'static', hasCoin: false, dyToNext,
});

export const BOSS_TEMPLATES: SetPiece[] = [
  { id: 'titan-1', platforms: [
    entry(110),
    { x: 150, width: 100, type: 'static', hasCoin: false, dyToNext: 110 },
    { x: 350, width: 100, type: 'static', hasCoin: false, dyToNext: 110 },
    { x: 210, width: 120, type: 'static', hasCoin: false, dyToNext: 110 },
    entry(0),
  ]},
  { id: 'titan-2', platforms: [
    entry(120),
    { x: 130, width: 90, type: 'static', hasCoin: false, dyToNext: 120 },
    { x: 375, width: 90, type: 'static', hasCoin: false, dyToNext: 120 },
    { x: 130, width: 90, type: 'static', hasCoin: false, dyToNext: 120 },
    { x: 375, width: 90, type: 'static', hasCoin: false, dyToNext: 120 },
    entry(0),
  ]},
  { id: 'titan-3', platforms: [
    entry(125),
    { x: 140, width: 80, type: 'static', hasCoin: false, dyToNext: 125 },
    { x: 375, width: 80, type: 'static', hasCoin: false, dyToNext: 125 },
    { x: 260, width: 90, type: 'static', hasCoin: false, dyToNext: 125 },
    { x: 140, width: 80, type: 'static', hasCoin: false, dyToNext: 125 },
    entry(0),
  ]},
  { id: 'titan-4', platforms: [
    entry(135),
    { x: 130, width: 70, type: 'static', hasCoin: false, dyToNext: 135 },
    { x: 350, width: 70, type: 'static', hasCoin: false, dyToNext: 135 },
    { x: 190, width: 70, type: 'static', hasCoin: false, dyToNext: 135 },
    { x: 370, width: 70, type: 'static', hasCoin: false, dyToNext: 135 },
    entry(0),
  ]},
];

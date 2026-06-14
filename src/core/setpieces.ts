import { REACH, TUNING } from '../tuning';
import type { MovementSpec, PlatformType } from './types';

/** One platform inside a chunk template. x is absolute screen-space; dyToNext is the
 *  vertical gap UP to the next platform in the chunk (0 on the last platform). */
export interface ChunkPlatform {
  x: number;
  width: number;
  type: PlatformType;
  hasCoin: boolean;
  movement?: Pick<MovementSpec, 'range' | 'speed'>;
  dyToNext: number;
}

export interface SetPiece {
  id: string;
  platforms: ChunkPlatform[];
}

// Templates are authored against the original 480px design, then centered into the
// actual TUNING.width so they stay reach-valid (the reachable band is ~480px wide
// regardless of screen width — a wider canvas just adds margins, it can't let the
// player jump farther). `off` centers the band; entry/landing platforms are widened
// to 200 so they span both reach-zones at any supported width.
const W = TUNING.width;
const OFF = (W - 480) / 2;        // center the reachable band in the actual width
const CENTER = Math.round(W / 2); // entry/landing anchor

/** A wide static platform centered under the spawn lane — reachable from anywhere. */
const entry = (dyToNext: number, hasCoin = false): ChunkPlatform => ({
  x: CENTER - 100, width: 200, type: 'static', hasCoin, dyToNext,
});

export const SET_PIECES: SetPiece[] = [
  {
    id: 'staggered-shaft',
    platforms: [
      entry(115),
      { x: 60 + OFF, width: 110, type: 'static', hasCoin: false, dyToNext: 115 },
      { x: 310 + OFF, width: 110, type: 'static', hasCoin: false, dyToNext: 115 },
      { x: 60 + OFF, width: 110, type: 'crumbling', hasCoin: false, dyToNext: 115 },
      { x: 310 + OFF, width: 110, type: 'static', hasCoin: true, dyToNext: 0 },
    ],
  },
  {
    id: 'crumbling-staircase',
    platforms: [
      entry(95),
      // hasCoin forced false on crumbling platforms: v1 invariant "no coins on crumbling".
      { x: 50 + OFF, width: 80, type: 'crumbling', hasCoin: false, dyToNext: 95 },
      { x: 160 + OFF, width: 80, type: 'crumbling', hasCoin: false, dyToNext: 95 },
      { x: 270 + OFF, width: 80, type: 'crumbling', hasCoin: false, dyToNext: 95 },
      { x: 350 + OFF, width: 80, type: 'crumbling', hasCoin: false, dyToNext: 95 },
      { x: 200 + OFF, width: 140, type: 'static', hasCoin: false, dyToNext: 0 },
    ],
  },
  {
    id: 'coin-trail-crossing',
    platforms: [
      entry(120),
      { x: 20 + OFF, width: 90, type: 'static', hasCoin: true, dyToNext: 120 },
      { x: 185 + OFF, width: 110, type: 'moving', hasCoin: true, movement: { range: 80, speed: 60 }, dyToNext: 120 },
      { x: 370 + OFF, width: 90, type: 'static', hasCoin: true, dyToNext: 120 },
      entry(0),
    ],
  },
];

function edgeGap(a: ChunkPlatform, b: ChunkPlatform): number {
  const aR = a.x + a.width, bR = b.x + b.width;
  if (b.x > aR) return b.x - aR;
  if (a.x > bR) return a.x - bR;
  return 0;
}

/** Returns a list of human-readable violations; empty = valid. */
export function validateChunk(chunk: SetPiece): string[] {
  const v: string[] = [];
  const ps = chunk.platforms;
  if (ps.length < 2) v.push('chunk needs >= 2 platforms');
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    if (p.x < 0 || p.x + p.width > TUNING.width) v.push(`platform ${i} off-screen`);
    if (p.width < REACH.minPlatformWidth || p.width > REACH.maxPlatformWidth + 50)
      v.push(`platform ${i} width out of bounds`);
    const isLast = i === ps.length - 1;
    if (!isLast) {
      if (p.dyToNext < REACH.minVerticalGap || p.dyToNext > REACH.maxVerticalGap)
        v.push(`platform ${i} vertical gap ${p.dyToNext} outside [${REACH.minVerticalGap},${REACH.maxVerticalGap}]`);
      if (edgeGap(p, ps[i + 1]) > REACH.maxHorizontalEdgeGap)
        v.push(`platform ${i}->${i + 1} horizontal edge gap ${edgeGap(p, ps[i + 1])} > ${REACH.maxHorizontalEdgeGap}`);
    } else if (p.dyToNext !== 0) {
      v.push('last platform must have dyToNext 0');
    }
    if (p.type === 'moving' && p.movement) {
      const headroom = Math.min(p.x, TUNING.width - (p.x + p.width));
      if (p.movement.range > headroom) v.push(`platform ${i} moving range exceeds headroom`);
    }
    // Coins never spawn on crumbling platforms (v1 invariant) — guard template authors.
    if (p.type === 'crumbling' && p.hasCoin) v.push(`platform ${i} crumbling cannot have coin`);
  }
  return v;
}

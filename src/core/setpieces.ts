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

export const SET_PIECES: SetPiece[] = [
  {
    id: 'staggered-shaft',
    platforms: [
      { x: 140, width: 200, type: 'static', hasCoin: false, dyToNext: 115 },
      { x: 60, width: 110, type: 'static', hasCoin: false, dyToNext: 115 },
      { x: 310, width: 110, type: 'static', hasCoin: false, dyToNext: 115 },
      { x: 60, width: 110, type: 'crumbling', hasCoin: false, dyToNext: 115 },
      { x: 310, width: 110, type: 'static', hasCoin: true, dyToNext: 0 },
    ],
  },
  {
    id: 'crumbling-staircase',
    platforms: [
      { x: 140, width: 200, type: 'static', hasCoin: false, dyToNext: 95 },
      { x: 50, width: 80, type: 'crumbling', hasCoin: false, dyToNext: 95 },
      { x: 160, width: 80, type: 'crumbling', hasCoin: true, dyToNext: 95 },
      { x: 270, width: 80, type: 'crumbling', hasCoin: false, dyToNext: 95 },
      { x: 350, width: 80, type: 'crumbling', hasCoin: true, dyToNext: 95 },
      { x: 200, width: 140, type: 'static', hasCoin: false, dyToNext: 0 },
    ],
  },
  {
    id: 'coin-trail-crossing',
    platforms: [
      { x: 140, width: 200, type: 'static', hasCoin: false, dyToNext: 120 },
      { x: 20, width: 90, type: 'static', hasCoin: true, dyToNext: 120 },
      { x: 185, width: 110, type: 'moving', hasCoin: true, movement: { range: 80, speed: 60 }, dyToNext: 120 },
      { x: 370, width: 90, type: 'static', hasCoin: true, dyToNext: 120 },
      { x: 140, width: 200, type: 'static', hasCoin: false, dyToNext: 0 },
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
  }
  return v;
}

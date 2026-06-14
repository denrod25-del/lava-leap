import { TUNING } from '../tuning';
import { makeRng } from './rng';

export const BOSS_BOUNDARIES = [1000, 2000, 3000];
export const BOSS_DURATION_MS = 15000;

/** Returns the boss index (0-based) whose boundary was crossed between prevHeight and
 *  height, or -1 if none. */
export function bossBoundaryCrossed(prevHeight: number, height: number): number {
  for (let i = 0; i < BOSS_BOUNDARIES.length; i++) {
    const b = BOSS_BOUNDARIES[i];
    if (prevHeight < b && height >= b) return i;
  }
  return -1;
}

export interface Projectile { tMs: number; x: number; }

/** Telegraphed projectiles over the encounter. Higher boss index = more, faster. */
export function projectileSchedule(bossIndex: number, seed: number): Projectile[] {
  const rng = makeRng(seed + bossIndex * 7919);
  const count = 6 + bossIndex * 4;
  const out: Projectile[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      tMs: Math.round((i + 0.5) * (BOSS_DURATION_MS / count)),
      x: Math.round(rng() * (TUNING.width - 40)) + 20,
    });
  }
  return out;
}

import { HAZARD } from '../tuning';
import type { EnemyKind, PowerupKind } from './types';
import type { Rng } from './rng';

// Weighted kind mix — the rocket (orange boost) is deliberately the most common:
// play-testing found the boost is the "fun one," so it leads the distribution.
const POWERUP_WEIGHTS: ReadonlyArray<readonly [PowerupKind, number]> = [
  ['rocket', 0.4], ['shield', 0.2], ['magnet', 0.2], ['slowlava', 0.2],
];

/** Decide whether a platform is a bounce pad. Consumes exactly 1 rng draw. */
export function rollHazard(rng: Rng, _t: number, height: number): { bounce: boolean } {
  const bounceRoll = rng();
  if (height < HAZARD.graceHeight) return { bounce: false };
  return { bounce: bounceRoll < HAZARD.bounceChance };
}

/** Decide an enemy kind (or null). Consumes 2 rng draws. */
export function rollEnemy(rng: Rng, t: number, height: number): EnemyKind | null {
  if (height < HAZARD.graceHeight) { rng(); rng(); return null; }
  const has = rng() < HAZARD.enemyBaseChance + HAZARD.enemyChancePerT * t;
  const isDrifter = rng() < HAZARD.drifterShare;
  if (!has) return null;
  return isDrifter ? 'drifter' : 'crawler';
}

/** Decide a power-up kind (or null). Consumes 2 rng draws. */
export function rollPowerup(rng: Rng): PowerupKind | null {
  const has = rng() < HAZARD.powerupChance;
  const r = rng();
  let acc = 0;
  let pick: PowerupKind = POWERUP_WEIGHTS[POWERUP_WEIGHTS.length - 1][0];
  for (const [kind, weight] of POWERUP_WEIGHTS) {
    acc += weight;
    if (r < acc) { pick = kind; break; }
  }
  return has ? pick : null;
}

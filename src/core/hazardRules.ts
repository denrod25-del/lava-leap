import { HAZARD } from '../tuning';
import type { EnemyKind, PowerupKind } from './types';
import type { Rng } from './rng';

const POWERUPS: PowerupKind[] = ['shield', 'rocket', 'magnet', 'slowlava'];

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
  const pick = POWERUPS[Math.floor(rng() * POWERUPS.length)];
  return has ? pick : null;
}

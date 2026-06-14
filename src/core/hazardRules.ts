import { HAZARD } from '../tuning';
import type { EnemyKind, PowerupKind } from './types';
import type { Rng } from './rng';

const POWERUPS: PowerupKind[] = ['shield', 'rocket', 'magnet', 'slowlava'];

/** Decide spike/bounce flags for a platform. Consumes up to 2 rng draws (stable order). */
export function rollHazard(rng: Rng, t: number, height: number): { spikes: boolean; bounce: boolean } {
  if (height < HAZARD.graceHeight) { rng(); rng(); return { spikes: false, bounce: false }; }
  const spikes = rng() < HAZARD.spikeBaseChance + HAZARD.spikeChancePerT * t;
  // Mutually exclusive: only roll bounce if not spiked.
  const bounce = !spikes && rng() < HAZARD.bounceChance;
  return { spikes, bounce };
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

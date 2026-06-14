import { HAZARD } from '../tuning';
import type { EnemyKind, PowerupKind } from './types';
import type { Rng } from './rng';

const POWERUPS: PowerupKind[] = ['shield', 'rocket', 'magnet', 'slowlava'];

/** Decide spike/bounce flags for a platform. ALWAYS consumes exactly 2 rng draws so
 *  downstream rolls (enemy, power-up) sit at a fixed offset regardless of outcome. */
export function rollHazard(rng: Rng, t: number, height: number): { spikes: boolean; bounce: boolean } {
  const spikeRoll = rng();
  const bounceRoll = rng();
  if (height < HAZARD.graceHeight) return { spikes: false, bounce: false };
  const spikes = spikeRoll < HAZARD.spikeBaseChance + HAZARD.spikeChancePerT * t;
  // Mutually exclusive: bounce only when not spiked (both rolls already consumed).
  const bounce = !spikes && bounceRoll < HAZARD.bounceChance;
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

/** Levels mode: a 4-level campaign, one per existing zone, unlocked sequentially.
 *  Each level reuses the same procedural generator as endless mode (see
 *  GameScene's levelDef handling) — this file is pure content + the unlock rule. */

export interface LevelDef {
  id: string;
  title: string;
  zoneIndex: 0 | 1 | 2 | 3;
  /** The player spawns already this deep into the mountain. */
  startHeight: number;
  /** Height at which this level's boss encounter fires (level-mode-only —
   *  never added to src/core/boss.ts's BOSS_BOUNDARIES, so endless mode's
   *  boss triggering is untouched). */
  bossTriggerHeight: number;
  /** Matches a BOSS_TEMPLATES[].id. */
  bossTemplateId: string;
  /** Medal par times (v0.18.0) — initial estimates, tune freely. */
  parSilverMs: number;
  parGoldMs: number;
}

export const LEVELS: LevelDef[] = [
  { id: 'level-1', title: 'The Magma Vault', zoneIndex: 0, startHeight: 0,    bossTriggerHeight: 1000, bossTemplateId: 'titan-1', parSilverMs: 150_000, parGoldMs: 100_000 },
  { id: 'level-2', title: 'The Forge',       zoneIndex: 1, startHeight: 1000, bossTriggerHeight: 2000, bossTemplateId: 'titan-2', parSilverMs: 160_000, parGoldMs: 110_000 },
  { id: 'level-3', title: 'Ashfall',         zoneIndex: 2, startHeight: 2000, bossTriggerHeight: 3000, bossTemplateId: 'titan-3', parSilverMs: 170_000, parGoldMs: 120_000 },
  { id: 'level-4', title: 'Obsidian Crown',  zoneIndex: 3, startHeight: 3000, bossTriggerHeight: 4000, bossTemplateId: 'titan-4', parSilverMs: 180_000, parGoldMs: 130_000 },
];

/** Level 1 is always unlocked; level N unlocks once level N-1's id is in `clearedIds`. */
export function isLevelUnlocked(levelId: string, clearedIds: string[]): boolean {
  const idx = LEVELS.findIndex((l) => l.id === levelId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  return clearedIds.includes(LEVELS[idx - 1].id);
}

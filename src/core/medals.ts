// Medal rules for Levels mode (v0.18.0). Pure — scenes and GameScene consume.
import type { LevelDef } from './levels';
import type { SaveBlob } from './SaveData';

export type Medal = 'bronze' | 'silver' | 'gold';

const RANK: Record<Medal, number> = { bronze: 0, silver: 1, gold: 2 };

/** Strictly-under par earns the tier (clearMs < parGoldMs → gold). */
export function medalForClear(def: LevelDef, clearMs: number): Medal {
  if (clearMs < def.parGoldMs) return 'gold';
  if (clearMs < def.parSilverMs) return 'silver';
  return 'bronze';
}

export function betterMedal(a: Medal | undefined, b: Medal): Medal {
  return a !== undefined && RANK[a] >= RANK[b] ? a : b;
}

/** Stored medal, else retroactive bronze for pre-v0.18 clears, else null. */
export function effectiveMedal(levels: SaveBlob['levels'], id: string): Medal | null {
  return levels.medals[id] ?? (levels.cleared.includes(id) ? 'bronze' : null);
}

export const MEDAL_COLORS: Record<Medal, string> = {
  gold: '#ffd166', silver: '#c0c8d0', bronze: '#cd7f32',
};

/** 97400 → '1:37.4' */
export function formatMs(ms: number): string {
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60_000);
  const s = Math.floor((total % 60_000) / 1000);
  const d = Math.floor((total % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${d}`;
}

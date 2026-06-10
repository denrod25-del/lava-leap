import type { KeyValueStore } from './ScoreTracker';
import { defaultAnalytics, type AnalyticsState } from './analytics';

export interface Settings {
  musicVol: number;   // 0-10
  sfxVol: number;     // 0-10
  screenShake: boolean;
}

export const DEFAULT_SETTINGS: Settings = { musicVol: 7, sfxVol: 7, screenShake: true };

export interface SaveBlob {
  version: 2;
  highScore: number;
  coinBank: number;
  equippedCosmetic: string;
  ownedCosmetics: string[];
  /** achievement id -> unlock timestamp (epoch ms) */
  achievements: Record<string, number>;
  /** 'YYYY-MM-DD' -> best daily score (pruned to last 7) */
  dailyBest: Record<string, number>;
  settings: Settings;
  analytics: AnalyticsState;
}

const KEY = 'lavaleap.save.v2';
const V1_HIGHSCORE_KEY = 'lavaleap.highscore';

function defaults(): SaveBlob {
  return {
    version: 2,
    highScore: 0,
    coinBank: 0,
    equippedCosmetic: 'default',
    ownedCosmetics: ['default'],
    achievements: {},
    dailyBest: {},
    settings: { ...DEFAULT_SETTINGS },
    analytics: defaultAnalytics(),
  };
}

/**
 * Owns ALL persistence. Every read/write is guarded; on storage failure the
 * game keeps running against the in-memory copy.
 */
export class SaveData {
  private blob: SaveBlob;

  constructor(private store: KeyValueStore) {
    this.blob = this.load();
  }

  get(): SaveBlob {
    return this.blob;
  }

  /** Mutate the blob and persist (best-effort). */
  update(fn: (blob: SaveBlob) => void): void {
    fn(this.blob);
    this.pruneDaily();
    try {
      this.store.setItem(KEY, JSON.stringify(this.blob));
    } catch {
      /* storage unavailable — in-memory copy stays authoritative */
    }
  }

  private pruneDaily(): void {
    const keys = Object.keys(this.blob.dailyBest).sort(); // ISO dates sort chronologically
    while (keys.length > 7) {
      const oldest = keys.shift()!;
      delete this.blob.dailyBest[oldest];
    }
  }

  private load(): SaveBlob {
    try {
      const raw = this.store.getItem(KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as SaveBlob;
        if (parsed && parsed.version === 2) {
          // Backfill any fields added after a save was written.
          return { ...defaults(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
        }
      }
    } catch {
      /* corrupted or unreadable — fall through to defaults/migration */
    }
    const blob = defaults();
    try {
      const v1 = this.store.getItem(V1_HIGHSCORE_KEY);
      if (v1 !== null) blob.highScore = Number(v1) || 0;
    } catch {
      /* ignore */
    }
    return blob;
  }
}

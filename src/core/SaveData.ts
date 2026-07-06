import type { KeyValueStore } from './ScoreTracker';
import { defaultAnalytics, type AnalyticsState } from './analytics';

export interface Settings {
  musicVol: number;   // 0-10
  sfxVol: number;     // 0-10
  screenShake: boolean;
  /** Accessibility: skip camera shake and the death slow-mo when true. */
  reducedMotion: boolean;
  /** Mobile control scheme: 'auto' (steer + tap-dash, jumping automatic — default)
   *  or 'manual' (two-thumb: run joystick + tap-jump + DASH button). */
  controlScheme: 'auto' | 'manual';
}

export const DEFAULT_SETTINGS: Settings = { musicVol: 7, sfxVol: 7, screenShake: true, reducedMotion: false, controlScheme: 'auto' };

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
  upgrades: { powerupDuration: number; startShield: number; revive: number };
  /** True once the first-run tutorial has been completed (Settings can reset it). */
  tutorialDone: boolean;
  /** Last app version whose "What's New" screen was shown; drives the once-per-version auto-show. */
  lastSeenVersion: string;
  /** Account-free persistent identity for the online leaderboard. */
  identity: { playerId: string; name: string };
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
    upgrades: { powerupDuration: 0, startShield: 0, revive: 0 },
    tutorialDone: false,
    lastSeenVersion: '',
    identity: { playerId: '', name: '' },
  };
}

/**
 * Owns ALL persistence. Every read/write is guarded; on storage failure the
 * game keeps running against the in-memory copy.
 */
export class SaveData {
  private blob: SaveBlob;

  constructor(private store: KeyValueStore, private idGen: () => string = () =>
    (crypto.randomUUID?.() ?? '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,
      (c) => (Number(c) ^ (Math.floor(Math.random() * 256) & (15 >> (Number(c) / 4)))).toString(16)))) {
    this.blob = this.load();
    if (!this.blob.identity.playerId) {
      this.blob.identity.playerId = this.idGen();
      try { this.store.setItem(KEY, JSON.stringify(this.blob)); } catch { /* storage unavailable */ }
    }
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
          // Backfill any fields added after a save was written. Both `settings`
          // and `analytics` are deep-merged so sub-fields introduced in a later
          // version (e.g. v3's analytics.deathsBySource) exist on old saves —
          // otherwise recordDeath/recordStomp would touch undefined and crash.
          return {
            ...defaults(),
            ...parsed,
            settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
            analytics: { ...defaultAnalytics(), ...parsed.analytics },
            upgrades: { ...defaults().upgrades, ...parsed.upgrades },
            identity: { ...defaults().identity, ...parsed.identity },
          };
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

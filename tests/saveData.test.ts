import { describe, it, expect } from 'vitest';
import { SaveData, DEFAULT_SETTINGS } from '../src/core/SaveData';
import type { KeyValueStore } from '../src/core/ScoreTracker';

function fakeStore(initial: Record<string, string> = {}): KeyValueStore & { map: Map<string, string> } {
  const map = new Map(Object.entries(initial));
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
}

describe('SaveData', () => {
  it('starts with defaults on an empty store', () => {
    const s = new SaveData(fakeStore());
    expect(s.get().highScore).toBe(0);
    expect(s.get().coinBank).toBe(0);
    expect(s.get().settings).toEqual(DEFAULT_SETTINGS);
    expect(s.get().equippedCosmetic).toBe('default');
    expect(s.get().ownedCosmetics).toContain('default');
    expect(s.get().leaderboardPrompted).toBe(false);
  });

  it('persists updates and reloads them', () => {
    const store = fakeStore();
    const a = new SaveData(store);
    a.update((b) => { b.coinBank = 120; b.highScore = 999; });
    const reloaded = new SaveData(store);
    expect(reloaded.get().coinBank).toBe(120);
    expect(reloaded.get().highScore).toBe(999);
  });

  it('migrates the v1 high-score key', () => {
    const store = fakeStore({ 'lavaleap.highscore': '740' });
    const s = new SaveData(store);
    expect(s.get().highScore).toBe(740);
  });

  it('falls back to defaults on corrupted JSON', () => {
    const store = fakeStore({ 'lavaleap.save.v2': '{not json!!' });
    const s = new SaveData(store);
    expect(s.get().highScore).toBe(0);
  });

  it('keeps working in-memory when the store throws', () => {
    const broken: KeyValueStore = {
      getItem: () => { throw new Error('quota'); },
      setItem: () => { throw new Error('quota'); },
    };
    const s = new SaveData(broken);
    s.update((b) => { b.coinBank = 5; });
    expect(s.get().coinBank).toBe(5); // survives in memory
  });

  it('backfills analytics sub-fields added after an old save was written', () => {
    // A v2-era save whose analytics predates the v3 fields (deathsBySource, etc.).
    const legacy = {
      version: 2, highScore: 500, coinBank: 30, equippedCosmetic: 'default',
      ownedCosmetics: ['default'], achievements: {}, dailyBest: {},
      settings: { musicVol: 5, sfxVol: 5, screenShake: true },
      analytics: { runs: 4, dailyPlays: 1, achievementsUnlocked: 2, coinsBanked: 30, deathsByBucket: {}, deathsByZone: {} },
    };
    const store = fakeStore({ 'lavaleap.save.v2': JSON.stringify(legacy) });
    const s = new SaveData(store);
    const a = s.get().analytics;
    // Old fields preserved...
    expect(a.runs).toBe(4);
    // ...new v3 fields backfilled so recordDeath/recordStomp can't crash.
    expect(a.deathsBySource).toEqual({});
    expect(a.enemiesStomped).toBe(0);
    expect(a.powerupsUsed).toBe(0);
    expect(a.bossClears).toBe(0);
  });

  it('defaults upgrades to zero levels and backfills them on an old save', () => {
    const fresh = new SaveData(fakeStore());
    expect(fresh.get().upgrades).toEqual({ powerupDuration: 0, startShield: 0, revive: 0 });

    const legacy = {
      version: 2, highScore: 0, coinBank: 999, equippedCosmetic: 'default', ownedCosmetics: ['default'],
      achievements: {}, dailyBest: {}, settings: { musicVol: 7, sfxVol: 7, screenShake: true },
      analytics: { runs: 0, dailyPlays: 0, achievementsUnlocked: 0, coinsBanked: 0, deathsByBucket: {}, deathsByZone: {},
                   enemiesStomped: 0, powerupsUsed: 0, bossClears: 0, deathsBySource: {} },
      // no `upgrades` key
    };
    const s = new SaveData(fakeStore({ 'lavaleap.save.v2': JSON.stringify(legacy) }));
    expect(s.get().upgrades).toEqual({ powerupDuration: 0, startShield: 0, revive: 0 });
    expect(s.get().coinBank).toBe(999);
  });

  it('defaults tutorialDone to false and backfills it on an old save', () => {
    expect(new SaveData(fakeStore()).get().tutorialDone).toBe(false);
    const legacy = {
      version: 2, highScore: 5, coinBank: 1, equippedCosmetic: 'default', ownedCosmetics: ['default'],
      achievements: {}, dailyBest: {}, settings: { musicVol: 7, sfxVol: 7, screenShake: true },
      analytics: { runs: 0, dailyPlays: 0, achievementsUnlocked: 0, coinsBanked: 0, deathsByBucket: {}, deathsByZone: {},
                   enemiesStomped: 0, powerupsUsed: 0, bossClears: 0, deathsBySource: {} },
      upgrades: { powerupDuration: 0, startShield: 0, revive: 0 },
      // no `tutorialDone` key
    };
    const s = new SaveData(fakeStore({ 'lavaleap.save.v2': JSON.stringify(legacy) }));
    expect(s.get().tutorialDone).toBe(false);
    expect(s.get().highScore).toBe(5);
  });

  it('defaults settings.reducedMotion to false and backfills it on an old save', () => {
    expect(new SaveData(fakeStore()).get().settings.reducedMotion).toBe(false);
    const legacy = {
      version: 2, highScore: 5, coinBank: 1, equippedCosmetic: 'default', ownedCosmetics: ['default'],
      achievements: {}, dailyBest: {},
      settings: { musicVol: 4, sfxVol: 9, screenShake: false }, // pre-reducedMotion settings
      analytics: { runs: 0, dailyPlays: 0, achievementsUnlocked: 0, coinsBanked: 0, deathsByBucket: {}, deathsByZone: {},
                   enemiesStomped: 0, powerupsUsed: 0, bossClears: 0, deathsBySource: {} },
      upgrades: { powerupDuration: 0, startShield: 0, revive: 0 },
      tutorialDone: true,
    };
    const s = new SaveData(fakeStore({ 'lavaleap.save.v2': JSON.stringify(legacy) }));
    expect(s.get().settings.reducedMotion).toBe(false);
    // Existing nested settings preserved by the deep-merge.
    expect(s.get().settings.musicVol).toBe(4);
    expect(s.get().settings.screenShake).toBe(false);
  });

  it('defaults lastSeenVersion to empty and backfills it on an old save', () => {
    expect(new SaveData(fakeStore()).get().lastSeenVersion).toBe('');
    const legacy = {
      version: 2, highScore: 0, coinBank: 0, equippedCosmetic: 'default', ownedCosmetics: ['default'],
      achievements: {}, dailyBest: {}, settings: { musicVol: 7, sfxVol: 7, screenShake: true },
      analytics: { runs: 0, dailyPlays: 0, achievementsUnlocked: 0, coinsBanked: 0, deathsByBucket: {}, deathsByZone: {},
                   enemiesStomped: 0, powerupsUsed: 0, bossClears: 0, deathsBySource: {} },
      upgrades: { powerupDuration: 0, startShield: 0, revive: 0 }, tutorialDone: true,
      // no lastSeenVersion
    };
    const s = new SaveData(fakeStore({ 'lavaleap.save.v2': JSON.stringify(legacy) }));
    expect(s.get().lastSeenVersion).toBe('');
    expect(s.get().tutorialDone).toBe(true);
  });

  it('prunes dailyBest to the most recent 7 dates', () => {
    const s = new SaveData(fakeStore());
    s.update((b) => {
      for (let d = 1; d <= 10; d++) b.dailyBest[`2026-06-${String(d).padStart(2, '0')}`] = d;
    });
    expect(Object.keys(s.get().dailyBest)).toHaveLength(7);
    expect(s.get().dailyBest['2026-06-10']).toBe(10);
    expect(s.get().dailyBest['2026-06-01']).toBeUndefined();
  });

  it('defaults settings.controlScheme to auto and backfills it on an old save', () => {
    expect(new SaveData(fakeStore()).get().settings.controlScheme).toBe('auto');
    const legacy = {
      version: 2, highScore: 9, coinBank: 2, equippedCosmetic: 'default', ownedCosmetics: ['default'],
      achievements: {}, dailyBest: {},
      settings: { musicVol: 3, sfxVol: 8, screenShake: true, reducedMotion: true }, // pre-controlScheme
      analytics: { runs: 0, dailyPlays: 0, achievementsUnlocked: 0, coinsBanked: 0, deathsByBucket: {}, deathsByZone: {},
                   enemiesStomped: 0, powerupsUsed: 0, bossClears: 0, deathsBySource: {} },
      upgrades: { powerupDuration: 0, startShield: 0, revive: 0 }, tutorialDone: true, lastSeenVersion: '0.6.0',
    };
    const s = new SaveData(fakeStore({ 'lavaleap.save.v2': JSON.stringify(legacy) }));
    expect(s.get().settings.controlScheme).toBe('auto'); // backfilled by the deep-merge
    expect(s.get().settings.musicVol).toBe(3);           // existing nested values preserved
    expect(s.get().settings.reducedMotion).toBe(true);
  });

  it('generates a playerId on first construction and persists it', () => {
    const store = fakeStore();
    const s = new SaveData(store, () => 'fixed-uuid-1');
    expect(s.get().identity.playerId).toBe('fixed-uuid-1');
    // persisted, so a reload keeps the same id (real generator not called again)
    const again = new SaveData(store, () => 'DIFFERENT');
    expect(again.get().identity.playerId).toBe('fixed-uuid-1');
  });

  it('defaults identity.name to empty (name assigned later by the name flow)', () => {
    expect(new SaveData(fakeStore(), () => 'id').get().identity.name).toBe('');
  });

  it('backfills identity on a legacy save without it (and mints a playerId)', () => {
    const legacy = {
      version: 2, highScore: 7, coinBank: 3, equippedCosmetic: 'default', ownedCosmetics: ['default'],
      achievements: {}, dailyBest: {},
      settings: { musicVol: 7, sfxVol: 7, screenShake: true, reducedMotion: false, controlScheme: 'auto' },
      analytics: { runs: 0, dailyPlays: 0, achievementsUnlocked: 0, coinsBanked: 0, deathsByBucket: {}, deathsByZone: {},
                   enemiesStomped: 0, powerupsUsed: 0, bossClears: 0, deathsBySource: {} },
      upgrades: { powerupDuration: 0, startShield: 0, revive: 0 }, tutorialDone: true, lastSeenVersion: '0.7.0',
      // no identity
    };
    const s = new SaveData(fakeStore({ 'lavaleap.save.v2': JSON.stringify(legacy) }), () => 'legacy-id');
    expect(s.get().identity).toEqual({ playerId: 'legacy-id', name: '' });
    expect(s.get().highScore).toBe(7); // existing data preserved
  });
});

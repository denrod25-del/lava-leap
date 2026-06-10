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

  it('prunes dailyBest to the most recent 7 dates', () => {
    const s = new SaveData(fakeStore());
    s.update((b) => {
      for (let d = 1; d <= 10; d++) b.dailyBest[`2026-06-${String(d).padStart(2, '0')}`] = d;
    });
    expect(Object.keys(s.get().dailyBest)).toHaveLength(7);
    expect(s.get().dailyBest['2026-06-10']).toBe(10);
    expect(s.get().dailyBest['2026-06-01']).toBeUndefined();
  });
});

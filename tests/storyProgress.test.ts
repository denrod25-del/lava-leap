import { describe, it, expect } from 'vitest';
import { SaveData } from '../src/core/SaveData';
import { StoryProgress } from '../src/core/StoryProgress';
import { STORY_PAGES, RELIC_PAGE_IDS } from '../src/core/story';
import type { KeyValueStore } from '../src/core/ScoreTracker';

function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}
const fresh = () => new StoryProgress(new SaveData(fakeStore()));

describe('StoryProgress unlocks', () => {
  it('vignette unlocks the oath page once (idempotent)', () => {
    const sp = fresh();
    expect(sp.onVignetteSeen().map((p) => p.id)).toEqual(['oath']);
    expect(sp.onVignetteSeen()).toEqual([]); // second call: nothing new
    expect(sp.isUnlocked('oath')).toBe(true);
  });
  it('height unlocks pages at their thresholds, never twice', () => {
    const sp = fresh();
    expect(sp.onHeight(100)).toEqual([]);
    expect(sp.onHeight(300).map((p) => p.id)).toEqual(['first-climb']);
    expect(sp.onHeight(800).map((p) => p.id)).toEqual(['chosen']);
    expect(sp.onHeight(9999)).toEqual([]);
  });
  it('relics unlock relic pages in STORY_PAGES order and stop when exhausted', () => {
    const sp = fresh();
    const got: string[] = [];
    for (let i = 0; i < 10; i++) got.push(...sp.onRelic().map((p) => p.id));
    expect(got).toEqual(RELIC_PAGE_IDS); // 8 pages, in order, then nothing
    expect(sp.relicPagesRemaining()).toBe(0);
  });
  it('titan reach/defeat unlock their pages; defeat grants cole + counts defeats', () => {
    const sp = fresh();
    expect(sp.onTitanReach().map((p) => p.id)).toEqual(['titan']);
    const pages = sp.onTitanDefeat();
    expect(pages.map((p) => p.id)).toEqual(['freed']);
    expect(sp.save.get().ownedCharacters).toContain('cole');
    expect(sp.save.get().story.titanDefeats).toBe(1);
    sp.onTitanDefeat(); // again: no new pages, but the counter still climbs
    expect(sp.save.get().story.titanDefeats).toBe(2);
    expect(sp.save.get().ownedCharacters.filter((c) => c === 'cole')).toHaveLength(1);
  });
  it('unlocking everything cascades the finale page', () => {
    const sp = fresh();
    sp.onVignetteSeen();
    sp.onHeight(9999);
    for (let i = 0; i < 8; i++) sp.onRelic();
    sp.onTitanReach();
    const last = sp.onTitanDefeat();
    expect(last.map((p) => p.id)).toEqual(['freed', 'summit']); // freed + cascaded finale
    expect(sp.save.get().story.unlockedPages).toHaveLength(STORY_PAGES.length);
  });
});

describe('StoryProgress stage', () => {
  it('walks newKeeper → climbing → titanSeen → freed → complete', () => {
    const sp = fresh();
    expect(sp.stage()).toBe('newKeeper');
    sp.onHeight(300);
    expect(sp.stage()).toBe('climbing');
    sp.onTitanReach();
    expect(sp.stage()).toBe('titanSeen');
    sp.onTitanDefeat();
    expect(sp.stage()).toBe('freed');
    sp.onVignetteSeen(); sp.onHeight(9999); for (let i = 0; i < 8; i++) sp.onRelic();
    expect(sp.stage()).toBe('complete');
  });
});

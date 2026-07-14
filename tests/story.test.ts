import { describe, it, expect } from 'vitest';
import { STORY_PAGES, RELIC_PAGE_IDS, BEATS, VIGNETTE, RELIC, COLE_PAGE_ID } from '../src/core/story';

describe('story content validation', () => {
  it('has 14 pages with unique non-empty ids/titles/text/hints', () => {
    expect(STORY_PAGES).toHaveLength(14);
    const ids = STORY_PAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(14);
    for (const p of STORY_PAGES) {
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.text.length).toBeGreaterThan(0);
      expect(p.hint.length).toBeGreaterThan(0);
    }
  });
  it('has exactly one start/titanReach/titanDefeat/allPages page and 8 relic pages', () => {
    const byType = (t: string) => STORY_PAGES.filter((p) => p.unlock.type === t);
    expect(byType('start')).toHaveLength(1);
    expect(byType('titanReach')).toHaveLength(1);
    expect(byType('titanDefeat')).toHaveLength(1);
    expect(byType('allPages')).toHaveLength(1);
    expect(byType('relic')).toHaveLength(8);
    expect(byType('height')).toHaveLength(2);
    expect(RELIC_PAGE_IDS).toHaveLength(8);
  });
  it('height pages carry ascending numeric values', () => {
    const hs = STORY_PAGES.filter((p) => p.unlock.type === 'height').map((p) => p.unlock.value!);
    expect(hs).toEqual([250, 750]);
  });
  it('relic pages each have a whisper line', () => {
    for (const p of STORY_PAGES.filter((x) => x.unlock.type === 'relic')) {
      expect(p.whisper && p.whisper.length > 0).toBe(true);
    }
  });
  it('exposes beats for every stage, vignette beats, relic cadence, cole page id', () => {
    for (const k of ['newKeeper', 'climbing', 'titanSeen', 'freed', 'complete'] as const) {
      expect(BEATS[k].length).toBeGreaterThan(0);
    }
    expect(VIGNETTE.length).toBe(3);
    expect(RELIC.firstAtHeight).toBeGreaterThan(0);
    expect(RELIC.everyPx).toBeGreaterThan(0);
    expect(STORY_PAGES.some((p) => p.id === COLE_PAGE_ID && p.unlock.type === 'titanDefeat')).toBe(true);
  });
});

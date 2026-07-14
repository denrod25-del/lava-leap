import { describe, it, expect } from 'vitest';
import { CUTSCENES, cutsceneForPage, ACTOR_KEYS, type CutsceneDef } from '../src/core/cutscenes';
import { STORY_PAGES } from '../src/core/story';

const KNOWN_SFX = new Set([
  'sfx-jump', 'sfx-coin', 'sfx-death', 'sfx-music-menu', 'sfx-rumble', 'sfx-scrape',
  'sfx-crack', 'sfx-swell', 'sfx-ding', 'sfx-kaching', 'sfx-ui-move', 'sfx-ui-select',
  'sfx-stomp', 'sfx-hit', 'sfx-pickup', 'sfx-expire', 'sfx-boss-roar', 'sfx-projectile',
  'sfx-music-game',
]);

function totalMs(def: CutsceneDef): number {
  return def.shots.reduce((sum, s) => sum + s.holdMs, 0);
}

describe('cutscenes content validation', () => {
  it('has exactly the 4 planned cutscenes with unique ids', () => {
    expect(CUTSCENES.map((c) => c.id).sort()).toEqual(['freed', 'keeper-rises', 'opening', 'summit']);
    expect(new Set(CUTSCENES.map((c) => c.id)).size).toBe(4);
  });

  it('every cutscene links to a real story page', () => {
    const pageIds = new Set(STORY_PAGES.map((p) => p.id));
    for (const c of CUTSCENES) expect(pageIds.has(c.pageId), `${c.id} -> unknown page ${c.pageId}`).toBe(true);
  });

  it('every cutscene has at least one shot, sane hold durations, and a sane total length', () => {
    for (const c of CUTSCENES) {
      expect(c.shots.length).toBeGreaterThan(0);
      for (const s of c.shots) {
        expect(s.holdMs, `${c.id}: holdMs too short`).toBeGreaterThanOrEqual(300);
        expect(s.holdMs, `${c.id}: holdMs too long`).toBeLessThanOrEqual(15000);
      }
      const total = totalMs(c);
      expect(total, `${c.id}: total too short (${total}ms)`).toBeGreaterThanOrEqual(5000);
      expect(total, `${c.id}: total too long (${total}ms)`).toBeLessThanOrEqual(30000);
    }
  });

  it('every actor key is in the known whitelist', () => {
    for (const c of CUTSCENES) {
      for (const s of c.shots) {
        for (const a of s.actors ?? []) {
          expect(ACTOR_KEYS as readonly string[], `${c.id}: unknown actor key ${a.key}`).toContain(a.key);
        }
      }
    }
  });

  it('every sfx key is a real loaded sound', () => {
    for (const c of CUTSCENES) {
      for (const s of c.shots) {
        for (const key of s.sfx ?? []) {
          expect(KNOWN_SFX.has(key), `${c.id}: unknown sfx ${key}`).toBe(true);
        }
      }
    }
  });

  it('bgZone values are valid zone indices', () => {
    for (const c of CUTSCENES) {
      for (const s of c.shots) {
        if (s.bgZone !== undefined) expect([0, 1, 2, 3]).toContain(s.bgZone);
      }
    }
  });
});

describe('cutsceneForPage', () => {
  it('maps story pages to their linked cutscene', () => {
    expect(cutsceneForPage('oath')?.id).toBe('opening');
    expect(cutsceneForPage('titan')?.id).toBe('keeper-rises');
    expect(cutsceneForPage('freed')?.id).toBe('freed');
    expect(cutsceneForPage('summit')?.id).toBe('summit');
  });
  it('returns null for pages with no linked cutscene', () => {
    expect(cutsceneForPage('first-climb')).toBeNull();
    expect(cutsceneForPage('vault-1')).toBeNull();
    expect(cutsceneForPage('nope')).toBeNull();
  });
});

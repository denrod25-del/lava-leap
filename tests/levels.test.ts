import { describe, it, expect } from 'vitest';
import { LEVELS, isLevelUnlocked } from '../src/core/levels';
import { BOSS_TEMPLATES } from '../src/core/bossTemplates';

describe('LEVELS content', () => {
  it('has exactly 4 levels with unique ids, ascending zoneIndex/startHeight/bossTriggerHeight', () => {
    expect(LEVELS).toHaveLength(4);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(4);
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].zoneIndex).toBeGreaterThan(LEVELS[i - 1].zoneIndex);
      expect(LEVELS[i].startHeight).toBeGreaterThan(LEVELS[i - 1].startHeight);
      expect(LEVELS[i].bossTriggerHeight).toBeGreaterThan(LEVELS[i - 1].bossTriggerHeight);
    }
  });
  it('each level spans exactly 1000px from startHeight to bossTriggerHeight', () => {
    for (const l of LEVELS) expect(l.bossTriggerHeight - l.startHeight).toBe(1000);
  });
  it('every bossTemplateId resolves to a real BOSS_TEMPLATES entry', () => {
    const ids = new Set(BOSS_TEMPLATES.map((t) => t.id));
    for (const l of LEVELS) expect(ids.has(l.bossTemplateId), l.id).toBe(true);
  });
  it('levels 1-3 reuse the existing endless boss boundaries; level 4 uses a new one', () => {
    expect(LEVELS.map((l) => l.bossTriggerHeight)).toEqual([1000, 2000, 3000, 4000]);
  });
});

describe('isLevelUnlocked', () => {
  it('level 1 is always unlocked', () => {
    expect(isLevelUnlocked('level-1', [])).toBe(true);
  });
  it('level N is locked until level N-1 is cleared', () => {
    expect(isLevelUnlocked('level-2', [])).toBe(false);
    expect(isLevelUnlocked('level-2', ['level-1'])).toBe(true);
    expect(isLevelUnlocked('level-3', ['level-1'])).toBe(false);
    expect(isLevelUnlocked('level-3', ['level-1', 'level-2'])).toBe(true);
    expect(isLevelUnlocked('level-4', ['level-1', 'level-2', 'level-3'])).toBe(true);
  });
  it('is unaffected by unrelated ids in the cleared list', () => {
    expect(isLevelUnlocked('level-2', ['some-other-id', 'level-1'])).toBe(true);
  });
  it('an unknown level id is never unlocked', () => {
    expect(isLevelUnlocked('nope', ['level-1', 'level-2', 'level-3', 'level-4'])).toBe(false);
  });
});

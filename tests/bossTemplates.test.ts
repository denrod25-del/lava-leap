import { describe, it, expect } from 'vitest';
import { BOSS_TEMPLATES } from '../src/core/bossTemplates';
import { validateChunk } from '../src/core/setpieces';

describe('boss gauntlet templates', () => {
  it('one template per boundary, all reach-valid', () => {
    expect(BOSS_TEMPLATES).toHaveLength(3);
    for (const t of BOSS_TEMPLATES) expect(validateChunk(t), t.id).toEqual([]);
  });
});

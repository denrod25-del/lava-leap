import { describe, it, expect } from 'vitest';
import {
  CHARACTERS, DEFAULT_CHARACTER, FRAME_NAMES,
  staticKey, frameKey, animKey, isCharacter,
  DEFAULT_MOVEMENT, KIKO_MOVEMENT, resolveMovement,
} from '../src/core/characters';
import { characterAnims } from '../src/animManifest';
import { TUNING } from '../src/tuning';

describe('characters roster', () => {
  it('has ember (default), classic, and cole — all price 0', () => {
    expect(DEFAULT_CHARACTER).toBe('ember');
    expect(CHARACTERS.map((c) => c.id)).toEqual(['ember', 'classic', 'cole']);
    expect(CHARACTERS.every((c) => c.price === 0)).toBe(true);
  });
  it('isCharacter recognizes roster ids only', () => {
    expect(isCharacter('ember')).toBe(true);
    expect(isCharacter('classic')).toBe(true);
    expect(isCharacter('nope')).toBe(false);
    expect(isCharacter('')).toBe(false);
  });
});

describe('key helpers', () => {
  it('build prefixed texture/anim keys', () => {
    expect(staticKey('ember')).toBe('ember-static');
    expect(frameKey('classic', 'run-3')).toBe('classic-run-3');
    expect(animKey('ember', 'jump')).toBe('ember-jump');
  });
});

describe('FRAME_NAMES', () => {
  it('lists the 15 per-character frame files', () => {
    expect(FRAME_NAMES).toHaveLength(15);
    expect(FRAME_NAMES).toContain('run-0');
    expect(FRAME_NAMES).toContain('run-5');
    expect(FRAME_NAMES).toContain('jump-1');
    expect(FRAME_NAMES).toContain('jump-5');
    expect(FRAME_NAMES).toContain('idle-0');
    expect(FRAME_NAMES).toContain('idle-3');
    expect(FRAME_NAMES).not.toContain('jump-0'); // jump frames are 1..5
    expect(FRAME_NAMES).not.toContain('player'); // static is separate
  });
});

describe('animManifest ↔ FRAME_NAMES consistency', () => {
  it('every anim frame file is a known FRAME_NAME (prefixed per character)', () => {
    for (const def of characterAnims('ember')) {
      for (const f of def.frames) {
        expect(f.startsWith('ember-')).toBe(true);
        expect(FRAME_NAMES).toContain(f.slice('ember-'.length));
      }
    }
  });
});

describe('cole (v0.9.0)', () => {
  it('is in the roster, free, and gated behind titanDefeat', () => {
    const cole = CHARACTERS.find((c) => c.id === 'cole')!;
    expect(cole).toBeTruthy();
    expect(cole.price).toBe(0);
    expect(cole.unlock).toBe('titanDefeat');
    expect(isCharacter('cole')).toBe(true);
  });
  it('ember and classic remain un-gated', () => {
    expect(CHARACTERS.find((c) => c.id === 'ember')!.unlock).toBeUndefined();
    expect(CHARACTERS.find((c) => c.id === 'classic')!.unlock).toBeUndefined();
  });
});

describe('movement profiles (v0.13.0)', () => {
  it('DEFAULT_MOVEMENT is byte-equal to the standard TUNING kit', () => {
    expect(DEFAULT_MOVEMENT.jumpVelocity).toBe(TUNING.jumpVelocity);
    expect(DEFAULT_MOVEMENT.airJumpVelocity).toBe(TUNING.doubleJumpVelocity);
    expect(DEFAULT_MOVEMENT.maxJumps).toBe(2);
    expect(DEFAULT_MOVEMENT.ledgeGrab).toBe(false);
  });

  it('every existing roster character resolves to the default (physics provably unchanged)', () => {
    for (const id of ['ember', 'classic', 'cole']) {
      expect(resolveMovement(id)).toEqual(DEFAULT_MOVEMENT);
    }
    expect(resolveMovement('nonsense-id')).toEqual(DEFAULT_MOVEMENT);
  });

  it("Kiko's kit: springy triple jump + ledge grab", () => {
    expect(KIKO_MOVEMENT.maxJumps).toBe(3);
    expect(KIKO_MOVEMENT.jumpVelocity).toBeLessThan(TUNING.jumpVelocity);
    expect(KIKO_MOVEMENT.airJumpVelocity).toBeLessThan(TUNING.doubleJumpVelocity);
    expect(KIKO_MOVEMENT.ledgeGrab).toBe(true);
  });
});

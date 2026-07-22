import { describe, it, expect } from 'vitest';
import {
  CHARACTERS, DEFAULT_CHARACTER, FRAME_NAMES,
  staticKey, frameKey, animKey, isCharacter,
  DEFAULT_MOVEMENT, KIKO_MOVEMENT, CLIMBER_CHARACTER, resolveMovement,
} from '../src/core/characters';
import { characterAnims } from '../src/animManifest';
import { TUNING, REACH } from '../src/tuning';

describe('characters roster', () => {
  it('has ember, classic, cole, kiko and the production Climber', () => {
    expect(DEFAULT_CHARACTER).toBe('ember');
    expect(CHARACTERS.map((c) => c.id)).toEqual(['ember', 'classic', 'cole', 'kiko', 'climber']);
    expect(CHARACTERS.filter((c) => c.id !== 'kiko').every((c) => c.price === 0)).toBe(true);
    const kiko = CHARACTERS.find((c) => c.id === 'kiko')!;
    expect(kiko.price).toBe(750);
    expect(kiko.unlock).toBeUndefined();
    expect(kiko.movement).toEqual(KIKO_MOVEMENT);
    expect(CHARACTERS.find((c) => c.id === CLIMBER_CHARACTER)?.name).toBe('Climber');
  });
  it('isCharacter recognizes roster ids only', () => {
    expect(isCharacter('ember')).toBe(true);
    expect(isCharacter('classic')).toBe(true);
    expect(isCharacter('climber')).toBe(true);
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
  it('lists the 19 legacy per-character frame files', () => {
    expect(FRAME_NAMES).toHaveLength(19);
    expect(FRAME_NAMES).toContain('run-0');
    expect(FRAME_NAMES).toContain('run-5');
    expect(FRAME_NAMES).toContain('jump-1');
    expect(FRAME_NAMES).toContain('jump-5');
    expect(FRAME_NAMES).toContain('idle-0');
    expect(FRAME_NAMES).toContain('idle-3');
    expect(FRAME_NAMES).not.toContain('jump-0');
    expect(FRAME_NAMES).not.toContain('player');
  });
});

describe('animManifest ↔ FRAME_NAMES consistency', () => {
  it('every legacy anim frame file is a known FRAME_NAME', () => {
    for (const def of characterAnims('ember')) {
      for (const f of def.frames) {
        expect(typeof f).toBe('string');
        expect(String(f).startsWith('ember-')).toBe(true);
        expect(FRAME_NAMES).toContain(String(f).slice('ember-'.length));
      }
    }
  });

  it('Climber maps its production spritesheet action states (idle anchored to frame 0)', () => {
    const defs = characterAnims(CLIMBER_CHARACTER);
    expect(defs).toHaveLength(13);
    expect(defs.every((d) => d.sheetKey === 'climber-sheet')).toBe(true);
    const unique = new Set(defs.flatMap((d) => d.frames.map(Number)));
    // 51 frames referenced 0..50: the idle def deliberately anchors to [0] alone
    // (prevents cosmetic vertical bob), leaving source idle frames 1-5 unused.
    expect(unique.size).toBe(46);
    expect(Math.min(...unique)).toBe(0);
    expect(Math.max(...unique)).toBe(50);
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

  it('every standard roster character resolves to the default movement kit', () => {
    for (const id of ['ember', 'classic', 'cole', 'climber']) {
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

describe('death animation roster contract (v0.15.0)', () => {
  it('FRAME_NAMES includes the 4 death frames (19 total)', () => {
    expect(FRAME_NAMES).toContain('death-0');
    expect(FRAME_NAMES).toContain('death-3');
    expect(FRAME_NAMES).toHaveLength(19);
  });
  it('every character has a one-shot 4-frame death anim def', () => {
    for (const c of CHARACTERS) {
      const def = characterAnims(c.id).find((d) => d.key === `${c.id}-death`);
      expect(def, c.id).toBeDefined();
      expect(def!.frames, c.id).toHaveLength(4);
      expect(def!.repeat, c.id).toBe(0);
      if (def!.sheetKey) {
        // Atlas characters (Climber) use numeric spritesheet frames at their own rate.
        expect(def!.frames.every((f) => typeof f === 'number'), c.id).toBe(true);
      } else {
        expect(def!.frames).toEqual(['death-0', 'death-1', 'death-2', 'death-3'].map((f) => `${c.id}-${f}`));
        expect(def!.frameRate).toBe(8);
      }
    }
  });
});

describe('Kiko reach validity (spec §7 — definition of done, not optional)', () => {
  const apex = (v: number) => (v * v) / (2 * TUNING.gravityY);

  it('two of three jumps clear the max generated vertical gap with margin; the third is spare', () => {
    const twoJump = apex(KIKO_MOVEMENT.jumpVelocity) + apex(KIKO_MOVEMENT.airJumpVelocity);
    expect(twoJump).toBeGreaterThanOrEqual(REACH.maxVerticalGap + 10);
    const kikoTotal = twoJump + apex(KIKO_MOVEMENT.airJumpVelocity);
    const standardTotal = apex(TUNING.jumpVelocity) + apex(TUNING.doubleJumpVelocity);
    expect(kikoTotal).toBeGreaterThanOrEqual(standardTotal);
  });
});

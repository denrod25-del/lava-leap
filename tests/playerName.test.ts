import { describe, it, expect } from 'vitest';
import { validateName, generateHandle } from '../src/core/playerName';

describe('validateName', () => {
  it('accepts a clean name and trims it', () => {
    expect(validateName('  Claw_99 ')).toEqual({ ok: true, name: 'Claw_99' });
  });
  it('rejects empty / whitespace', () => {
    expect(validateName('   ').ok).toBe(false);
  });
  it('rejects > 12 chars', () => {
    expect(validateName('ABCDEFGHIJKLM').ok).toBe(false); // 13
  });
  it('accepts exactly 12 chars', () => {
    expect(validateName('ABCDEFGHIJKL')).toEqual({ ok: true, name: 'ABCDEFGHIJKL' });
  });
  it('rejects disallowed characters', () => {
    expect(validateName('bad<name>').ok).toBe(false);
    expect(validateName('emoji😀').ok).toBe(false);
  });
  it('allows letters, digits, space, underscore, hyphen', () => {
    expect(validateName('a-b_c 1').ok).toBe(true);
  });
  it('rejects a profanity even with leet spelling', () => {
    expect(validateName('sh1t').ok).toBe(false);
    expect(validateName('  FUCK ').ok).toBe(false);
  });
});

describe('generateHandle', () => {
  it('is CLAW- plus 4 uppercase hex from the injected rng, and is valid', () => {
    const h = generateHandle(() => 0); // 0 → '0000'
    expect(h).toBe('CLAW-0000');
    expect(validateName(h).ok).toBe(true);
  });
  it('varies with the rng', () => {
    expect(generateHandle(() => 0.999999)).not.toBe(generateHandle(() => 0));
  });
});

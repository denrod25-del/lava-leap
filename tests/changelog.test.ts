import { describe, it, expect } from 'vitest';
import { CHANGELOG } from '../src/core/changelog';

describe('changelog', () => {
  it('is non-empty and each entry has version/date/notes', () => {
    expect(CHANGELOG.length).toBeGreaterThan(0);
    for (const e of CHANGELOG) {
      expect(typeof e.version).toBe('string');
      expect(typeof e.date).toBe('string');
      expect(Array.isArray(e.notes)).toBe(true);
      expect(e.notes.length).toBeGreaterThan(0);
    }
  });
  it('is ordered newest-first (semver-descending on the leading entry)', () => {
    expect(CHANGELOG[0].version).toBe('0.5.1');
  });
});

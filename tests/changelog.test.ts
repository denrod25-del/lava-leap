import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
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
    expect(CHANGELOG[0].version).toBe('0.14.0');
  });
  it("leading entry matches package.json version (What's New auto-pop keys off it)", () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    expect(CHANGELOG[0].version).toBe(pkg.version);
  });
});

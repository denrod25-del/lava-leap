import { describe, it, expect } from 'vitest';
import { REACH } from '../src/tuning';

describe('toolchain', () => {
  it('loads tuning constants', () => {
    expect(REACH.maxVerticalGap).toBeGreaterThan(REACH.minVerticalGap);
  });
});

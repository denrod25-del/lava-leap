import { describe, it, expect } from 'vitest';
import { medalForClear, betterMedal, effectiveMedal, formatMs } from '../src/core/medals';
import { LEVELS } from '../src/core/levels';

const L1 = LEVELS[0]; // parSilverMs 150000, parGoldMs 100000

describe('medalForClear thresholds', () => {
  it('under gold par → gold; exactly gold par → silver', () => {
    expect(medalForClear(L1, L1.parGoldMs - 1)).toBe('gold');
    expect(medalForClear(L1, L1.parGoldMs)).toBe('silver');
  });
  it('under silver par → silver; exactly silver par → bronze', () => {
    expect(medalForClear(L1, L1.parSilverMs - 1)).toBe('silver');
    expect(medalForClear(L1, L1.parSilverMs)).toBe('bronze');
  });
  it('any slower clear → bronze', () => {
    expect(medalForClear(L1, 999_999)).toBe('bronze');
  });
});

describe('betterMedal', () => {
  it('never downgrades', () => {
    expect(betterMedal('gold', 'bronze')).toBe('gold');
    expect(betterMedal('silver', 'gold')).toBe('gold');
    expect(betterMedal(undefined, 'bronze')).toBe('bronze');
  });
});

describe('effectiveMedal (retro bronze)', () => {
  it('stored medal wins; legacy cleared reads bronze; uncleared reads null', () => {
    const levels = { cleared: ['level-1', 'level-2'], medals: { 'level-2': 'gold' as const }, bestTimes: {} };
    expect(effectiveMedal(levels, 'level-2')).toBe('gold');
    expect(effectiveMedal(levels, 'level-1')).toBe('bronze');
    expect(effectiveMedal(levels, 'level-3')).toBe(null);
  });
});

describe('formatMs', () => {
  it('m:ss.d', () => {
    expect(formatMs(97_400)).toBe('1:37.4');
    expect(formatMs(60_000)).toBe('1:00.0');
    expect(formatMs(5_050)).toBe('0:05.0');
  });
});

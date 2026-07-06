import { describe, it, expect } from 'vitest';
import { steerAxis } from '../src/core/autoSteer';

describe('steerAxis', () => {
  it('is 0 inside the deadzone (including exactly at it)', () => {
    expect(steerAxis(300, 300, 140, 12)).toBe(0);
    expect(steerAxis(312, 300, 140, 12)).toBe(0);
    expect(steerAxis(288, 300, 140, 12)).toBe(0);
  });

  it('points toward the finger', () => {
    expect(steerAxis(380, 300, 140, 12)).toBeGreaterThan(0); // finger right
    expect(steerAxis(220, 300, 140, 12)).toBeLessThan(0);    // finger left
  });

  it('is linear in between', () => {
    expect(steerAxis(370, 300, 140, 12)).toBeCloseTo(70 / 140, 5);
    expect(steerAxis(230, 300, 140, 12)).toBeCloseTo(-70 / 140, 5);
  });

  it('clamps to ±1 beyond the range', () => {
    expect(steerAxis(600, 300, 140, 12)).toBe(1);
    expect(steerAxis(0, 300, 140, 12)).toBe(-1);
  });
});

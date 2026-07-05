import { describe, it, expect } from 'vitest';
import { FlowMeter, combinedMultiplier } from '../src/core/FlowMeter';
import { FLOW } from '../src/tuning';

describe('FlowMeter', () => {
  it('starts cold: value 0, tier 0, ×1, no speed nudge', () => {
    const f = new FlowMeter();
    expect(f.value).toBe(0);
    expect(f.tier).toBe(0);
    expect(f.tierName).toBe('COOL');
    expect(f.heatMultiplier).toBe(1);
    expect(f.speedNudge).toBe(0);
  });

  it('builds while airborne', () => {
    const f = new FlowMeter();
    f.update(1000, true, false); // 1s airborne, not dashing
    expect(f.value).toBeCloseTo(FLOW.buildAirbornePerSec, 5);
  });

  it('builds much faster while dashing', () => {
    const f = new FlowMeter();
    f.update(1000, true, true); // 1s dashing
    expect(f.value).toBeCloseTo(FLOW.buildDashingPerSec, 5);
  });

  it('passive airborne build stalls at the WARM boundary — beats required beyond', () => {
    const f = new FlowMeter();
    f.update(60_000, true, false); // a full minute airborne, never dashing
    expect(f.value).toBe(FLOW.tierThresholds[0]);
    expect(f.tier).toBe(1); // WARM, never HOT from passive airtime alone
  });

  it('hot flow HOLDS (no passive gain, no drain) while airborne without dashing', () => {
    const f = new FlowMeter();
    f.value = 0.7;
    f.update(5000, true, false);
    expect(f.value).toBe(0.7);
  });

  it('dashing still builds past the WARM boundary', () => {
    const f = new FlowMeter();
    f.value = FLOW.tierThresholds[0];
    f.update(1000, true, true);
    expect(f.value).toBeCloseTo(FLOW.tierThresholds[0] + FLOW.buildDashingPerSec, 5);
  });

  it('beat() adds a burst and clamps at 1', () => {
    const f = new FlowMeter();
    f.beat();
    expect(f.value).toBeCloseTo(FLOW.beatBonus, 5);
    for (let i = 0; i < 20; i++) f.beat();
    expect(f.value).toBe(1);
  });

  it('does not drain during the ground grace window', () => {
    const f = new FlowMeter();
    f.beat(); // 0.12
    const before = f.value;
    f.update(FLOW.groundGraceMs, false, false); // grounded, within grace
    expect(f.value).toBe(before);
  });

  it('drains on the ground after the grace window', () => {
    const f = new FlowMeter();
    for (let i = 0; i < 5; i++) f.beat(); // 0.6
    f.update(FLOW.groundGraceMs, false, false);  // uses up the grace
    f.update(1000, false, false);                // 1s grounded past grace
    expect(f.value).toBeCloseTo(0.6 - FLOW.drainGroundPerSec, 5);
  });

  it('going airborne resets the ground grace', () => {
    const f = new FlowMeter();
    for (let i = 0; i < 5; i++) f.beat(); // 0.6
    f.update(FLOW.groundGraceMs, false, false); // grace consumed
    f.update(16, true, false);                  // one airborne frame resets it
    const v = f.value;
    f.update(FLOW.groundGraceMs, false, false); // fresh grace → no drain
    expect(f.value).toBe(v);
  });

  it('never goes below 0', () => {
    const f = new FlowMeter();
    f.update(60_000, false, false);
    expect(f.value).toBe(0);
  });

  it('never exceeds 1', () => {
    const f = new FlowMeter();
    f.update(60_000, true, true);
    expect(f.value).toBe(1);
  });

  it('maps value to tiers at the thresholds (inclusive lower bound)', () => {
    const f = new FlowMeter();
    f.value = FLOW.tierThresholds[0]; // 0.25 → WARM
    expect(f.tier).toBe(1);
    expect(f.tierName).toBe('WARM');
    expect(f.heatMultiplier).toBe(FLOW.heatMultipliers[1]);
    f.value = FLOW.tierThresholds[1]; // 0.55 → HOT
    expect(f.tier).toBe(2);
    f.value = FLOW.tierThresholds[2]; // 0.85 → BLAZING
    expect(f.tier).toBe(3);
    expect(f.heatMultiplier).toBe(FLOW.heatMultipliers[3]);
    f.value = FLOW.tierThresholds[0] - 0.001; // just under → COOL
    expect(f.tier).toBe(0);
  });

  it('speed nudge grows with tier', () => {
    const f = new FlowMeter();
    f.value = 1;
    expect(f.speedNudge).toBe(FLOW.speedNudge[3]);
    expect(f.speedNudge).toBeGreaterThan(0);
  });
});

describe('combinedMultiplier', () => {
  it('multiplies combo × heat', () => {
    expect(combinedMultiplier(2, 1.6)).toBeCloseTo(3.2, 5);
  });
  it('caps at FLOW.combinedCap', () => {
    expect(combinedMultiplier(5, 2)).toBe(FLOW.combinedCap); // 10 → 8
  });
  it('is ×1 when both are cold', () => {
    expect(combinedMultiplier(1, 1)).toBe(1);
  });
});

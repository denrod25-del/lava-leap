import { describe, it, expect } from 'vitest';
import { AUTOPILOT } from '../src/tuning';

// Mobile jumping is now fully manual (same moveset as keyboard, which the generator's
// REACH budget already guarantees is clearable). Touch only adds follow-finger steering,
// so the meaningful invariant here is that the steer tuning is sane.
describe('touch steering tuning', () => {
  it('has a positive steer gain and speed cap', () => {
    expect(AUTOPILOT.steerGain).toBeGreaterThan(0);
    expect(AUTOPILOT.steerMaxSpeed).toBeGreaterThan(0);
  });
});

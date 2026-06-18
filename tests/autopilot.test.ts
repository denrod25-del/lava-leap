import { describe, it, expect } from 'vitest';
import { AUTOPILOT, TUNING, REACH } from '../src/tuning';

describe('autopilot reachability', () => {
  it('auto-bounce apex clears the generator max vertical gap with margin', () => {
    const apex = (AUTOPILOT.bounceVelocity * AUTOPILOT.bounceVelocity) / (2 * TUNING.gravityY);
    expect(apex).toBeGreaterThan(REACH.maxVerticalGap + 30);
  });
});

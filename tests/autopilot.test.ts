import { describe, it, expect } from 'vitest';
import { TOUCH } from '../src/tuning';

// Mobile horizontal movement is the touch run-joystick → runAxis, fed into the same
// manual moveset as the keyboard. The meaningful invariant here is sane joystick tuning.
describe('touch run-joystick tuning', () => {
  it('has a positive range and a smaller, non-negative deadzone', () => {
    expect(TOUCH.joystickRange).toBeGreaterThan(0);
    expect(TOUCH.joystickDeadzone).toBeGreaterThanOrEqual(0);
    expect(TOUCH.joystickDeadzone).toBeLessThan(TOUCH.joystickRange);
  });
});

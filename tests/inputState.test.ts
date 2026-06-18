import { describe, it, expect } from 'vitest';
import { emptyInput } from '../src/core/InputState';

describe('InputState', () => {
  it('emptyInput is all-false', () => {
    const i = emptyInput();
    expect(i).toEqual({ left: false, right: false, jumpHeld: false, jumpPressed: false, dashPressed: false, pausePressed: false, steerX: null });
  });

  it('is a fresh object each call (no shared mutation)', () => {
    const a = emptyInput(); a.left = true;
    expect(emptyInput().left).toBe(false);
  });

  it('emptyInput includes a null steer target', () => {
    expect(emptyInput().steerX).toBeNull();
  });
});

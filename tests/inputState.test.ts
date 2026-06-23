import { describe, it, expect } from 'vitest';
import { emptyInput } from '../src/core/InputState';

describe('InputState', () => {
  it('emptyInput is all-false with a zero run axis', () => {
    const i = emptyInput();
    expect(i).toEqual({ left: false, right: false, jumpHeld: false, jumpPressed: false, dashPressed: false, pausePressed: false, runAxis: 0 });
  });

  it('is a fresh object each call (no shared mutation)', () => {
    const a = emptyInput(); a.left = true;
    expect(emptyInput().left).toBe(false);
  });

  it('emptyInput has a neutral (0) run axis', () => {
    expect(emptyInput().runAxis).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import { LevelGenerator } from '../src/core/LevelGenerator';
import { TUNING, REACH } from '../src/tuning';

describe('LevelGenerator.first', () => {
  it('places a wide starting platform under the player spawn', () => {
    const gen = new LevelGenerator(42);
    const first = gen.first();
    expect(first.id).toBe(0);
    expect(first.y).toBe(TUNING.groundY);
    expect(first.type).toBe('static');
    expect(first.width).toBe(REACH.maxPlatformWidth);
    // spans the spawn x
    expect(first.x).toBeLessThanOrEqual(TUNING.playerStartX);
    expect(first.x + first.width).toBeGreaterThanOrEqual(TUNING.playerStartX);
  });
});

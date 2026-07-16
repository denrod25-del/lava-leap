import { describe, it, expect } from 'vitest';
import { LevelStream } from '../src/core/LevelStream';
import { TUNING } from '../src/tuning';

describe('LevelStream', () => {
  it('starts with the first platform active', () => {
    const s = new LevelStream(1);
    expect(s.active.length).toBe(1);
    expect(s.active[0].y).toBe(TUNING.groundY);
  });

  it('generates platforms above the camera as it rises', () => {
    const s = new LevelStream(1);
    // camera top moves up (y decreases). Ask to ensure coverage above cameraTop.
    const added1 = s.update(TUNING.groundY - 400, TUNING.groundY + 80);
    expect(added1.added.length).toBeGreaterThan(0);
    // topmost active platform should be above (smaller y than) cameraTop - buffer margin
    const topY = Math.min(...s.active.map((p) => p.y));
    expect(topY).toBeLessThan(TUNING.groundY - 400);
  });

  it('prunes platforms below the prune line and reports them', () => {
    const s = new LevelStream(1);
    s.update(TUNING.groundY - 800, TUNING.groundY + 80); // generate a tall stack
    const before = s.active.length;
    // Move prune line up past several platforms.
    const removed = s.update(TUNING.groundY - 1600, TUNING.groundY - 600);
    expect(removed.removed.length).toBeGreaterThan(0);
    // No active platform remains below the prune line.
    for (const p of s.active) expect(p.y).toBeLessThan(TUNING.groundY - 600);
    expect(s.active.length).toBeLessThanOrEqual(before + removed.added.length);
  });

  it('threads rocketUnlockHeight through to the generator', () => {
    const s = new LevelStream(8, 0, 4000);
    let cameraTop = TUNING.groundY;
    let sawBelowRocket = false;
    for (let i = 0; i < 60; i++) {
      cameraTop -= 100;
      const { added } = s.update(cameraTop, TUNING.groundY + 80);
      for (const p of added) {
        if (TUNING.groundY - p.y < 4000 && p.powerup?.kind === 'rocket') sawBelowRocket = true;
      }
    }
    expect(sawBelowRocket).toBe(false);
  });
});

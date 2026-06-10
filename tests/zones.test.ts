import { describe, it, expect } from 'vitest';
import { ZONES, zoneForHeight } from '../src/core/zones';

describe('zones', () => {
  it('covers heights from 0 with ascending, gapless boundaries', () => {
    expect(ZONES[0].fromHeight).toBe(0);
    for (let i = 1; i < ZONES.length; i++) {
      expect(ZONES[i].fromHeight).toBeGreaterThan(ZONES[i - 1].fromHeight);
    }
  });

  it('looks up the right zone at boundaries', () => {
    expect(zoneForHeight(0).name).toBe('Magma Vault');
    expect(zoneForHeight(999).index).toBe(0);
    expect(zoneForHeight(1000).name).toBe('The Forge');
    expect(zoneForHeight(2500).name).toBe('Ashfall');
    expect(zoneForHeight(3000).name).toBe('Obsidian Crown');
    expect(zoneForHeight(99999).index).toBe(3); // last zone is open-ended
  });

  it('lava speed multipliers rise monotonically', () => {
    for (let i = 1; i < ZONES.length; i++) {
      expect(ZONES[i].lavaSpeedMultiplier).toBeGreaterThan(ZONES[i - 1].lavaSpeedMultiplier);
    }
  });

  it('every zone defines tints for all three platform types', () => {
    for (const z of ZONES) {
      expect(z.platformTints.static).toBeGreaterThan(0);
      expect(z.platformTints.crumbling).toBeGreaterThan(0);
      expect(z.platformTints.moving).toBeGreaterThan(0);
    }
  });
});

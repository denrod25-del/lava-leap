import type { SaveBlob } from './SaveData';

export interface RunCounters {
  maxHeight: number;
  coins: number;
  wallJumps: number;
  zoneIndex: number;
  /** Height when a crumbling platform last crumbled underfoot (0 = never). */
  heightAtLastCrumble: number;
  /** Per-airtime ability flags (reset on land). */
  airDash: boolean;
  airDouble: boolean;
  airWall: boolean;
  /** Latched true the moment all three air flags coincide. */
  acrobatDone: boolean;
}

export function freshRunCounters(): RunCounters {
  return {
    maxHeight: 0, coins: 0, wallJumps: 0, zoneIndex: 0,
    heightAtLastCrumble: 0, airDash: false, airDouble: false, airWall: false, acrobatDone: false,
  };
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  check(run: RunCounters, save: SaveBlob): boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-steps', name: 'First Steps', description: 'Climb 100m', check: (r) => r.maxHeight >= 100 },
  { id: 'out-of-the-vault', name: 'Out of the Vault', description: 'Reach The Forge', check: (r) => r.zoneIndex >= 1 },
  { id: 'forge-proof', name: 'Forge-Proof', description: 'Reach Ashfall', check: (r) => r.zoneIndex >= 2 },
  { id: 'obsidian-crown', name: 'Obsidian Crown', description: 'Reach the Obsidian Crown', check: (r) => r.zoneIndex >= 3 },
  { id: 'halfway-to-hell', name: 'Halfway to Hell', description: 'Climb 2000m in one run', check: (r) => r.maxHeight >= 2000 },
  { id: 'magpie', name: 'Magpie', description: 'Collect 25 coins in one run', check: (r) => r.coins >= 25 },
  { id: 'wall-rat', name: 'Wall Rat', description: '10 wall jumps in one run', check: (r) => r.wallJumps >= 10 },
  { id: 'acrobat', name: 'Acrobat', description: 'Dash, double jump and wall jump in a single airtime', check: (r) => r.acrobatDone },
  { id: 'untouchable', name: 'Untouchable', description: 'Climb 1000m without crumbling a platform', check: (r) => r.maxHeight - r.heightAtLastCrumble >= 1000 },
  { id: 'hoarder', name: 'Hoarder', description: 'Bank 500 coins', check: (_r, s) => s.coinBank >= 500 },
  { id: 'daily-devotee', name: 'Daily Devotee', description: 'Play 3 daily challenges', check: (_r, s) => s.analytics.dailyPlays >= 3 },
  { id: 'veteran', name: 'Veteran', description: 'Play 25 runs', check: (_r, s) => s.analytics.runs >= 25 },
];

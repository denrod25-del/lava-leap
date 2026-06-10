import { ACHIEVEMENTS, freshRunCounters, type AchievementDef, type RunCounters } from './achievements';
import { recordUnlock } from './analytics';
import type { GameEvents } from './events';
import type { SaveData } from './SaveData';

/** Listens to the event spine, maintains per-run counters, unlocks achievements. */
export class AchievementTracker {
  readonly run: RunCounters = freshRunCounters();
  /** ids unlocked during the current run (for the game-over screen). */
  readonly earnedThisRun: string[] = [];

  constructor(
    events: GameEvents,
    private save: SaveData,
    private onUnlock: (a: AchievementDef) => void,
  ) {
    events.on('wallJump', () => { this.run.wallJumps++; this.air('airWall'); });
    events.on('doubleJump', () => this.air('airDouble'));
    events.on('dash', () => this.air('airDash'));
    events.on('land', () => { this.run.airDash = false; this.run.airDouble = false; this.run.airWall = false; });
    events.on('coinCollected', () => { this.run.coins++; this.evaluate(); });
    events.on('platformCrumble', () => { this.run.heightAtLastCrumble = this.run.maxHeight; });
  }

  private air(flag: 'airDash' | 'airDouble' | 'airWall'): void {
    this.run[flag] = true;
    if (this.run.airDash && this.run.airDouble && this.run.airWall) this.run.acrobatDone = true;
    this.evaluate();
  }

  /** Call every frame (or on height change) from the scene. */
  updateHeight(height: number, zoneIndex: number): void {
    if (height > this.run.maxHeight) this.run.maxHeight = height;
    if (zoneIndex > this.run.zoneIndex) this.run.zoneIndex = zoneIndex;
    this.evaluate();
  }

  private evaluate(): void {
    const blob = this.save.get();
    for (const def of ACHIEVEMENTS) {
      if (blob.achievements[def.id]) continue;
      if (def.check(this.run, blob)) {
        this.save.update((b) => {
          b.achievements[def.id] = Date.now();
          recordUnlock(b.analytics);
        });
        this.earnedThisRun.push(def.id);
        this.onUnlock(def);
      }
    }
  }
}

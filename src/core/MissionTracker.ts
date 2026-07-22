import { dateKey } from './dailySeed';
import {
  missionsForDate, ensureToday, bumpMetric, newlyCompleted, PAYOUTS,
  type MissionDef, type MissionsState, type MetricId,
} from './missions';
import type { GameEvents } from './events';
import type { SaveData } from './SaveData';

/** Listens to the event spine, advances today's mission metrics, auto-claims
 *  payouts the moment a mission completes. Persists on completion and at run
 *  end (flushRunEnd) — not per event. */
export class MissionTracker {
  private state: MissionsState;
  private todays: MissionDef[];
  private runCoins = 0;

  constructor(
    events: GameEvents,
    private save: SaveData,
    private onComplete: (def: MissionDef, payout: number) => void,
  ) {
    const dk = dateKey(new Date());
    const stored = save.get().missions;
    this.state = ensureToday(stored, dk);
    this.todays = missionsForDate(dk);
    if (this.state !== stored) this.persist(); // day rolled over — store the reset

    events.on('coinCollected', () => { this.runCoins++; this.bump('coins', 1, 'add'); });
    events.on('dash', () => this.bump('dashes', 1, 'add'));
    events.on('powerupCollected', () => this.bump('powerups', 1, 'add'));
    events.on('jump', () => this.bump('jumps', 1, 'add'));
    events.on('doubleJump', () => this.bump('jumps', 1, 'add'));
    events.on('wallJump', () => this.bump('jumps', 1, 'add'));
    events.on('enemyStomped', () => this.bump('stomps', 1, 'add'));
    // 'end' only fires when the encounter completes (survival) — a mid-boss death
    // never reaches it, matching Cole's unlock semantics.
    events.on('bossPhase', ({ phase }) => { if (phase === 'end') this.bump('titanSurvives', 1, 'add'); });
    events.on('flowTier', ({ tier }) => { if (tier === 3) this.bump('blazing', 1, 'add'); });
  }

  /** Call on height change from the scene (alongside AchievementTracker.updateHeight). */
  updateHeight(height: number): void {
    this.bump('bestHeight', height, 'max');
  }

  /** Call from GameScene.completeLevel(). */
  levelCleared(): void {
    this.bump('levelClears', 1, 'add');
  }

  /** Call once at run end (endRunBookkeeping) — flushes single-run peaks + persists. */
  flushRunEnd(): void {
    this.bump('bestRunCoins', this.runCoins, 'max');
    this.runCoins = 0;
    this.persist();
  }

  /** Completed count for menu badges. */
  completedToday(): number {
    return this.state.completed.length;
  }

  private bump(metric: MetricId, amount: number, mode: 'add' | 'max'): void {
    bumpMetric(this.state, metric, amount, mode);
    const done = newlyCompleted(this.state, this.todays);
    for (const def of done) {
      this.state.completed.push(def.id);
      const pay = PAYOUTS[def.tier];
      this.save.update((b) => { b.coinBank += pay; b.missions = this.state; });
      this.onComplete(def, pay);
    }
  }

  private persist(): void {
    this.save.update((b) => { b.missions = this.state; });
  }
}

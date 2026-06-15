import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, freshRunCounters } from '../src/core/achievements';
import { AchievementTracker } from '../src/core/AchievementTracker';
import { GameEvents } from '../src/core/events';
import { SaveData } from '../src/core/SaveData';
import type { KeyValueStore } from '../src/core/ScoreTracker';

function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}

function setup() {
  const events = new GameEvents();
  const save = new SaveData(fakeStore());
  const unlocked: string[] = [];
  const tracker = new AchievementTracker(events, save, (a) => unlocked.push(a.id));
  return { events, save, tracker, unlocked };
}

describe('achievements', () => {
  it('has 16 unique ids', () => {
    expect(ACHIEVEMENTS).toHaveLength(16);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(16);
  });

  it('first-steps unlocks at 100 height, not before', () => {
    const { tracker, unlocked } = setup();
    tracker.updateHeight(99, 0);
    expect(unlocked).not.toContain('first-steps');
    tracker.updateHeight(100, 0);
    expect(unlocked).toContain('first-steps');
  });

  it('wall-rat counts 10 wall jumps in one run', () => {
    const { events, tracker, unlocked } = setup();
    for (let i = 0; i < 9; i++) events.emit('wallJump', {});
    tracker.updateHeight(10, 0);
    expect(unlocked).not.toContain('wall-rat');
    events.emit('wallJump', {});
    tracker.updateHeight(10, 0);
    expect(unlocked).toContain('wall-rat');
  });

  it('acrobat needs dash + double jump + wall jump within ONE airtime', () => {
    const { events, tracker, unlocked } = setup();
    events.emit('dash', {});
    events.emit('land', { impactVy: 100 });   // airtime ends — resets the set
    events.emit('doubleJump', {});
    events.emit('wallJump', {});
    tracker.updateHeight(10, 0);
    expect(unlocked).not.toContain('acrobat');
    events.emit('dash', {});                   // all three in this airtime
    tracker.updateHeight(10, 0);
    expect(unlocked).toContain('acrobat');
  });

  it('untouchable: 1000 height climbed without a crumble underfoot', () => {
    const { events, tracker, unlocked } = setup();
    tracker.updateHeight(900, 0);
    events.emit('platformCrumble', { x: 0, y: 0 }); // resets the clean streak
    tracker.updateHeight(1500, 1);
    expect(unlocked).not.toContain('untouchable');  // only 600 clean
    tracker.updateHeight(1900, 1);
    expect(unlocked).toContain('untouchable');      // 1000 past the crumble
  });

  it('unlocks persist and never re-fire', () => {
    const { tracker, save, unlocked } = setup();
    tracker.updateHeight(150, 0);
    tracker.updateHeight(160, 0);
    expect(unlocked.filter((id) => id === 'first-steps')).toHaveLength(1);
    expect(save.get().achievements['first-steps']).toBeGreaterThan(0);
  });

  it('hoarder reads the coin bank from the save', () => {
    const { tracker, save, unlocked } = setup();
    save.update((b) => { b.coinBank = 500; });
    tracker.updateHeight(1, 0);
    expect(unlocked).toContain('hoarder');
  });
});

function def(id: string) {
  const d = ACHIEVEMENTS.find((a) => a.id === id);
  if (!d) throw new Error(`no achievement ${id}`);
  return d;
}

describe('v3 achievement checks (pure over RunCounters)', () => {
  it('stomper: 10 stomps in a run', () => {
    const r = freshRunCounters();
    r.stomps = 9;
    expect(def('stomper').check(r, {} as never)).toBe(false);
    r.stomps = 10;
    expect(def('stomper').check(r, {} as never)).toBe(true);
  });

  it('rocket-man: used a rocket', () => {
    const r = freshRunCounters();
    expect(def('rocket-man').check(r, {} as never)).toBe(false);
    r.usedRocket = true;
    expect(def('rocket-man').check(r, {} as never)).toBe(true);
  });

  it('pacifist: reach zone 2 with 0 stomps', () => {
    const r = freshRunCounters();
    r.zoneIndex = 2;
    r.stomps = 0;
    expect(def('pacifist').check(r, {} as never)).toBe(true);
    r.stomps = 1;
    expect(def('pacifist').check(r, {} as never)).toBe(false);
    r.stomps = 0;
    r.zoneIndex = 1;
    expect(def('pacifist').check(r, {} as never)).toBe(false);
  });

  it('untouchable-ii: boss cleared with no shield', () => {
    const r = freshRunCounters();
    expect(def('untouchable-ii').check(r, {} as never)).toBe(false);
    r.bossClearedNoShield = true;
    expect(def('untouchable-ii').check(r, {} as never)).toBe(true);
  });
});

describe('v3 achievement tracker wiring', () => {
  it('stomper unlocks after 10 enemyStomped events', () => {
    const { events, tracker, unlocked } = setup();
    for (let i = 0; i < 9; i++) events.emit('enemyStomped', { x: 0, y: 0 });
    expect(unlocked).not.toContain('stomper');
    events.emit('enemyStomped', { x: 0, y: 0 });
    expect(unlocked).toContain('stomper');
    void tracker;
  });

  it('rocket-man unlocks on a rocket powerupCollected', () => {
    const { events, unlocked } = setup();
    events.emit('powerupCollected', { kind: 'shield' });
    expect(unlocked).not.toContain('rocket-man');
    events.emit('powerupCollected', { kind: 'rocket' });
    expect(unlocked).toContain('rocket-man');
  });

  it('untouchable-ii unlocks when the boss ends with no shield used', () => {
    const { events, unlocked } = setup();
    events.emit('bossPhase', { zoneIndex: 1, phase: 'start' });
    events.emit('bossPhase', { zoneIndex: 1, phase: 'end' });
    expect(unlocked).toContain('untouchable-ii');
  });

  it('untouchable-ii does NOT unlock if a shield expired during the boss', () => {
    const { events, unlocked } = setup();
    events.emit('bossPhase', { zoneIndex: 1, phase: 'start' });
    events.emit('powerupExpired', { kind: 'shield' });
    events.emit('bossPhase', { zoneIndex: 1, phase: 'end' });
    expect(unlocked).not.toContain('untouchable-ii');
  });
});

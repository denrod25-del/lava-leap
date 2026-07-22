/** Daily missions: 3 per day (one per tier), same for every player (date-seeded),
 *  auto-claimed mid-run. Pure content + state — MissionTracker applies events. */

export type MissionTier = 'easy' | 'medium' | 'hard';
export type MetricId =
  | 'coins' | 'dashes' | 'powerups' | 'jumps' | 'stomps'
  | 'titanSurvives' | 'blazing' | 'levelClears'
  | 'bestHeight' | 'bestRunCoins';

export interface MissionDef {
  /** Stable forever — keys progress storage. */
  id: string;
  tier: MissionTier;
  metric: MetricId;
  target: number;
  text: string;
}

export const PAYOUTS: Record<MissionTier, number> = { easy: 30, medium: 50, hard: 80 };

export const MISSION_POOL: MissionDef[] = [
  { id: 'coins-25',     tier: 'easy',   metric: 'coins',        target: 25,   text: 'Collect 25 coins' },
  { id: 'dash-30',      tier: 'easy',   metric: 'dashes',       target: 30,   text: 'Dash 30 times' },
  { id: 'powerups-3',   tier: 'easy',   metric: 'powerups',     target: 3,    text: 'Grab 3 power-ups' },
  { id: 'jumps-150',    tier: 'easy',   metric: 'jumps',        target: 150,  text: 'Jump 150 times' },
  { id: 'stomp-5',      tier: 'medium', metric: 'stomps',       target: 5,    text: 'Stomp 5 enemies' },
  { id: 'height-3000',  tier: 'medium', metric: 'bestHeight',   target: 3000, text: 'Reach 3000 in one run' },
  { id: 'coins-run-15', tier: 'medium', metric: 'bestRunCoins', target: 15,   text: 'Grab 15 coins in a single run' },
  { id: 'titan-survive',tier: 'medium', metric: 'titanSurvives',target: 1,    text: 'Survive a Titan encounter' },
  { id: 'height-5000',  tier: 'hard',   metric: 'bestHeight',   target: 5000, text: 'Reach 5000 in one run' },
  { id: 'blazing',      tier: 'hard',   metric: 'blazing',      target: 1,    text: 'Reach BLAZING flow' },
  { id: 'level-clear',  tier: 'hard',   metric: 'levelClears',  target: 1,    text: 'Clear a campaign level' },
  { id: 'stomp-10',     tier: 'hard',   metric: 'stomps',       target: 10,   text: 'Stomp 10 enemies' },
];

/** FNV-1a — same hash family as dailySeed, salted per tier. */
function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (const ch of s) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The day's 3 missions, one per tier, deterministic and identical for everyone. */
export function missionsForDate(dk: string): MissionDef[] {
  return (['easy', 'medium', 'hard'] as MissionTier[]).map((tier) => {
    const pool = MISSION_POOL.filter((m) => m.tier === tier);
    return pool[fnv(`${dk}:${tier}`) % pool.length];
  });
}

export interface MissionsState {
  dateKey: string;
  metrics: Record<MetricId, number>;
  completed: string[];
}

export function defaultMetrics(): Record<MetricId, number> {
  return {
    coins: 0, dashes: 0, powerups: 0, jumps: 0, stomps: 0,
    titanSurvives: 0, blazing: 0, levelClears: 0,
    bestHeight: 0, bestRunCoins: 0,
  };
}

export function freshState(dateKey: string): MissionsState {
  return { dateKey, metrics: defaultMetrics(), completed: [] };
}

/** Same-day: returns the given state unchanged. New day: a fresh state (the daily reset). */
export function ensureToday(s: MissionsState, dk: string): MissionsState {
  return s.dateKey === dk ? s : freshState(dk);
}

export function bumpMetric(s: MissionsState, metric: MetricId, amount: number, mode: 'add' | 'max'): void {
  s.metrics[metric] = mode === 'add' ? (s.metrics[metric] ?? 0) + amount : Math.max(s.metrics[metric] ?? 0, amount);
}

/** Missions from `defs` whose target is now met and that are not yet completed. */
export function newlyCompleted(s: MissionsState, defs: MissionDef[]): MissionDef[] {
  return defs.filter((d) => !s.completed.includes(d.id) && (s.metrics[d.metric] ?? 0) >= d.target);
}

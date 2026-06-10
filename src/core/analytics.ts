export interface AnalyticsState {
  runs: number;
  dailyPlays: number;
  achievementsUnlocked: number;
  coinsBanked: number;
  /** Death counts keyed by 100px height bucket, e.g. "300" = died at 300-399. */
  deathsByBucket: Record<string, number>;
  /** Death counts keyed by zone index as string. */
  deathsByZone: Record<string, number>;
}

export function defaultAnalytics(): AnalyticsState {
  return {
    runs: 0,
    dailyPlays: 0,
    achievementsUnlocked: 0,
    coinsBanked: 0,
    deathsByBucket: {},
    deathsByZone: {},
  };
}

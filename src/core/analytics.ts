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

export function recordRunStart(a: AnalyticsState, daily: boolean): void {
  a.runs++;
  if (daily) a.dailyPlays++;
}

export function recordDeath(a: AnalyticsState, height: number, zoneIndex: number): void {
  const bucket = String(Math.floor(height / 100) * 100);
  a.deathsByBucket[bucket] = (a.deathsByBucket[bucket] ?? 0) + 1;
  a.deathsByZone[String(zoneIndex)] = (a.deathsByZone[String(zoneIndex)] ?? 0) + 1;
}

export function recordUnlock(a: AnalyticsState): void {
  a.achievementsUnlocked++;
}

export function recordBank(a: AnalyticsState, coins: number): void {
  a.coinsBanked += coins;
}

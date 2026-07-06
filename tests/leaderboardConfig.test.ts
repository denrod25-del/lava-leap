import { describe, it, expect } from 'vitest';
import { leaderboardEnabled } from '../src/core/leaderboardConfig';

describe('leaderboardEnabled', () => {
  it('is false when either credential is missing or blank', () => {
    expect(leaderboardEnabled(undefined, undefined)).toBe(false);
    expect(leaderboardEnabled('https://x.supabase.co', undefined)).toBe(false);
    expect(leaderboardEnabled(undefined, 'key')).toBe(false);
    expect(leaderboardEnabled('', 'key')).toBe(false);
    expect(leaderboardEnabled('https://x.supabase.co', '   ')).toBe(false);
  });
  it('is true when both are present and non-blank', () => {
    expect(leaderboardEnabled('https://x.supabase.co', 'anon-key')).toBe(true);
  });
});

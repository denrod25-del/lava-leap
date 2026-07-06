/** True when both public Supabase credentials are configured. */
export function leaderboardEnabled(url: string | undefined, anonKey: string | undefined): boolean {
  return !!(url && url.trim() && anonKey && anonKey.trim());
}

/** Public, safe-to-ship credentials from Vite env (undefined under vitest → disabled). */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

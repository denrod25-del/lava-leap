import { dateKey } from './dailySeed';
import { leaderboardEnabled } from './leaderboardConfig';

export interface LeaderboardEntry { rank: number; playerId: string; name: string; score: number; height: number; }
export interface SubmitPayload {
  playerId: string; name: string; board: string;
  score: number; height: number; durationMs: number; coins: number;
}
export interface LeaderboardClient {
  readonly enabled: boolean;
  submit(p: SubmitPayload): Promise<void>;
  top(board: string, limit?: number): Promise<LeaderboardEntry[]>;
  rankOf(board: string, playerId: string): Promise<{ rank: number; score: number } | null>;
}

export function allTimeBoard(): string { return 'alltime'; }
export function dailyBoard(d: Date): string { return `daily:${dateKey(d)}`; }

interface TopScoreRow { rank: number; player_id: string; name: string; score: number; height: number; }
interface PlayerRankRow { rank: number; score: number; }

interface Cfg { url?: string; anonKey?: string; fetchImpl: typeof fetch; timeoutMs?: number; }

export function createLeaderboard(cfg: Cfg): LeaderboardClient {
  const enabled = leaderboardEnabled(cfg.url, cfg.anonKey);
  const base = (cfg.url ?? '').replace(/\/$/, '');
  const timeoutMs = cfg.timeoutMs ?? 6000;

  async function rpc(fn: string, body: unknown): Promise<unknown> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await cfg.fetchImpl(`${base}/rest/v1/rpc/${fn}`, {
        method: 'POST', signal: ctrl.signal,
        headers: {
          apikey: cfg.anonKey as string,
          Authorization: `Bearer ${cfg.anonKey as string}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) return undefined;
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  }

  return {
    enabled,
    async submit(p) {
      if (!enabled) return;
      try {
        await rpc('submit_score', {
          p_player_id: p.playerId, p_name: p.name, p_board: p.board,
          p_score: p.score, p_height: p.height, p_duration_ms: p.durationMs, p_coins: p.coins,
        });
      } catch { /* fire-and-forget: offline/aborted is fine */ }
    },
    async top(board, limit = 50) {
      if (!enabled) return [];
      try {
        const rows = await rpc('top_scores', { p_board: board, p_limit: limit });
        if (!Array.isArray(rows)) return [];
        return (rows as TopScoreRow[]).map((r) => ({
          rank: r.rank, playerId: r.player_id, name: r.name, score: r.score, height: r.height,
        }));
      } catch { return []; }
    },
    async rankOf(board, playerId) {
      if (!enabled) return null;
      try {
        const rows = await rpc('player_rank', { p_board: board, p_player_id: playerId });
        if (!Array.isArray(rows) || rows.length === 0) return null;
        const row = (rows as PlayerRankRow[])[0];
        return { rank: row.rank, score: row.score };
      } catch { return null; }
    },
  };
}

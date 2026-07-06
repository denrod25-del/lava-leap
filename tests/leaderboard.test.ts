import { describe, it, expect, vi } from 'vitest';
import { createLeaderboard, allTimeBoard, dailyBoard } from '../src/core/leaderboard';

const okJson = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);

describe('board keys', () => {
  it('builds all-time and daily keys', () => {
    expect(allTimeBoard()).toBe('alltime');
    expect(dailyBoard(new Date('2026-07-06T10:00:00'))).toBe('daily:2026-07-06');
  });
});

describe('createLeaderboard — disabled', () => {
  it('is disabled with no creds and never calls fetch', async () => {
    const fetchImpl = vi.fn();
    const lb = createLeaderboard({ url: undefined, anonKey: undefined, fetchImpl });
    expect(lb.enabled).toBe(false);
    await lb.submit({ playerId: 'p', name: 'N', board: 'alltime', score: 1, height: 1, durationMs: 1000, coins: 0 });
    expect(await lb.top('alltime')).toEqual([]);
    expect(await lb.rankOf('alltime', 'p')).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('createLeaderboard — enabled', () => {
  const cfg = { url: 'https://x.supabase.co', anonKey: 'anon-key' };

  it('submit POSTs to the rpc with apikey + auth headers and a JSON body', async () => {
    const fetchImpl = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => okJson(null));
    const lb = createLeaderboard({ ...cfg, fetchImpl });
    await lb.submit({ playerId: 'p1', name: 'Neo', board: 'alltime', score: 1200, height: 1180, durationMs: 60000, coins: 5 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://x.supabase.co/rest/v1/rpc/submit_score');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>).apikey).toBe('anon-key');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer anon-key');
    expect(JSON.parse(init?.body as string)).toEqual({
      p_player_id: 'p1', p_name: 'Neo', p_board: 'alltime',
      p_score: 1200, p_height: 1180, p_duration_ms: 60000, p_coins: 5,
    });
  });

  it('submit swallows network errors (never rejects)', async () => {
    const lb = createLeaderboard({ ...cfg, fetchImpl: vi.fn(() => Promise.reject(new Error('offline'))) });
    await expect(lb.submit({ playerId: 'p', name: 'N', board: 'alltime', score: 1, height: 1, durationMs: 1000, coins: 0 }))
      .resolves.toBeUndefined();
  });

  it('top parses the rows into entries', async () => {
    const rows = [{ rank: 1, player_id: 'a', name: 'Ann', score: 900, height: 880 }];
    const lb = createLeaderboard({ ...cfg, fetchImpl: vi.fn(() => okJson(rows)) });
    expect(await lb.top('alltime', 10)).toEqual([{ rank: 1, playerId: 'a', name: 'Ann', score: 900, height: 880 }]);
  });

  it('top returns [] on a failed response', async () => {
    const lb = createLeaderboard({ ...cfg, fetchImpl: vi.fn(() => Promise.resolve({ ok: false } as Response)) });
    expect(await lb.top('alltime')).toEqual([]);
  });

  it('rankOf returns the first row or null', async () => {
    const lb = createLeaderboard({ ...cfg, fetchImpl: vi.fn(() => okJson([{ rank: 3, score: 500 }])) });
    expect(await lb.rankOf('alltime', 'p')).toEqual({ rank: 3, score: 500 });
    const empty = createLeaderboard({ ...cfg, fetchImpl: vi.fn(() => okJson([])) });
    expect(await empty.rankOf('alltime', 'p')).toBeNull();
  });

  it('aborts a hung request after timeoutMs and fails soft', async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi.fn((_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_res, rej) => {
          init?.signal?.addEventListener('abort', () => rej(new DOMException('Aborted', 'AbortError')));
        }));
      const lb = createLeaderboard({ ...cfg, fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 100 });
      const p = lb.top('alltime');
      vi.advanceTimersByTime(101);
      expect(await p).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('filters malformed rows missing a numeric score', async () => {
    const rows = [{ rank: 1, player_id: 'a', name: 'Ann', score: 900, height: 880 }, { rank: 2, player_id: 'b', name: 'Bad' }];
    const lb = createLeaderboard({ ...cfg, fetchImpl: vi.fn(() => okJson(rows)) });
    expect((await lb.top('alltime')).length).toBe(1);
  });
});

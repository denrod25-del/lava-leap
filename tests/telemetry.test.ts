import { describe, it, expect, vi, afterEach } from 'vitest';
import { createTelemetry, TELEMETRY_EVENTS } from '../src/core/telemetry';

const cfg = (fetchImpl: typeof fetch) => ({
  url: 'https://x.supabase.co', anonKey: 'anon-key', fetchImpl,
  appVersion: '0.19.0', playerId: () => 'a4f955b1-6db8-4b01-9c1e-000000000001',
});
const okFetch = () => vi.fn(() => Promise.resolve({ ok: true } as Response));

afterEach(() => { vi.useRealTimers(); });

describe('whitelist', () => {
  it('locks the low-volume event set', () => {
    expect([...TELEMETRY_EVENTS].sort()).toEqual([
      'boss_clear', 'boss_start', 'clip_error', 'clip_ready', 'clip_share',
      'death', 'level_clear', 'mission_complete', 'start_game',
    ]);
  });
  it('non-whitelisted events never buffer or send', () => {
    const f = okFetch();
    const t = createTelemetry(cfg(f as unknown as typeof fetch));
    for (let i = 0; i < 30; i++) t.push('jump', {});
    t.flush();
    expect(f).not.toHaveBeenCalled();
  });
});

describe('disabled mode', () => {
  it('no env -> enabled false, zero fetches', () => {
    const f = okFetch();
    const t = createTelemetry({ url: undefined, anonKey: undefined, fetchImpl: f as unknown as typeof fetch, appVersion: 'x', playerId: () => null });
    expect(t.enabled).toBe(false);
    t.push('death', { height: 1 });
    t.flush();
    expect(f).not.toHaveBeenCalled();
  });
});

describe('batching + payload', () => {
  it('sends on the 10th buffered event with the RPC payload shape', () => {
    const f = okFetch();
    const t = createTelemetry(cfg(f as unknown as typeof fetch));
    for (let i = 0; i < 10; i++) t.push('death', { n: i });
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://x.supabase.co/rest/v1/rpc/log_events');
    expect((init.headers as Record<string, string>).apikey).toBe('anon-key');
    expect(init.keepalive).toBe(true);
    const body = JSON.parse(String(init.body));
    expect(body.p_player_id).toBe('a4f955b1-6db8-4b01-9c1e-000000000001');
    expect(body.p_app_version).toBe('0.19.0');
    expect(body.p_events).toHaveLength(10);
    expect(body.p_events[0]).toEqual({ event: 'death', props: { n: 0 } });
  });
  it('flushes after 15s via the timer', () => {
    vi.useFakeTimers();
    const f = okFetch();
    const t = createTelemetry(cfg(f as unknown as typeof fetch));
    t.push('death', {});
    expect(f).not.toHaveBeenCalled();
    vi.advanceTimersByTime(15_000);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('explicit flush() sends the partial buffer and is a no-op when empty', () => {
    const f = okFetch();
    const t = createTelemetry(cfg(f as unknown as typeof fetch));
    t.push('death', {});
    t.flush();
    expect(f).toHaveBeenCalledTimes(1);
    t.flush();
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('caps at 20 batches per session and never throws on fetch failure', () => {
    const f = vi.fn(() => Promise.reject(new Error('offline')));
    const t = createTelemetry(cfg(f as unknown as typeof fetch));
    for (let b = 0; b < 25; b++) {
      for (let i = 0; i < 10; i++) t.push('death', {});
    }
    expect(f).toHaveBeenCalledTimes(20);
  });
});

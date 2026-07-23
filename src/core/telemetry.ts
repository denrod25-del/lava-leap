/** Write-only production telemetry: whitelisted low-volume events, batched,
 *  fire-and-forget to the log_events RPC. Mirrors leaderboard.ts's raw-fetch,
 *  env-gated, graceful-disable shape. Telemetry must NEVER affect the game:
 *  every failure path drops silently. */

export const TELEMETRY_EVENTS = [
  'clip_ready', 'clip_share', 'clip_error', 'death', 'level_clear',
  'mission_complete', 'start_game', 'boss_start', 'boss_clear',
] as const;

const BATCH_SIZE = 10;
const FLUSH_MS = 15_000;
const MAX_BATCHES_PER_SESSION = 20;
const RPC_EVENT_CAP = 20; // server-enforced too

export interface Telemetry {
  readonly enabled: boolean;
  push(event: string, props: Record<string, unknown>): void;
  flush(): void;
}

interface Cfg {
  url?: string; anonKey?: string; fetchImpl: typeof fetch;
  appVersion: string; playerId: () => string | null;
}

export function createTelemetry(cfg: Cfg): Telemetry {
  const enabled = Boolean(cfg.url && cfg.anonKey);
  const base = (cfg.url ?? '').replace(/\/$/, '');
  let buf: Array<{ event: string; props: Record<string, unknown> }> = [];
  let batches = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function send(): void {
    if (timer) { clearTimeout(timer); timer = null; }
    if (buf.length === 0) return;
    if (batches >= MAX_BATCHES_PER_SESSION) { buf = []; return; }
    const events = buf.slice(0, RPC_EVENT_CAP);
    buf = [];
    batches++;
    try {
      void cfg.fetchImpl(`${base}/rest/v1/rpc/log_events`, {
        method: 'POST',
        keepalive: true, // survives tab hide/close for the visibility flush
        headers: {
          apikey: cfg.anonKey as string,
          Authorization: `Bearer ${cfg.anonKey as string}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_player_id: cfg.playerId(),
          p_app_version: cfg.appVersion,
          p_events: events,
        }),
      }).catch(() => { /* offline/rejected: drop */ });
    } catch { /* fetch threw synchronously: drop */ }
  }

  return {
    enabled,
    push(event, props) {
      if (!enabled) return;
      if (!(TELEMETRY_EVENTS as readonly string[]).includes(event)) return;
      buf.push({ event, props });
      if (buf.length >= BATCH_SIZE) { send(); return; }
      if (!timer) timer = setTimeout(send, FLUSH_MS);
    },
    flush: send,
  };
}

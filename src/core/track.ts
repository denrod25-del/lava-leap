/** Analytics event hooks. Client-side only, no network calls, no PII. Phaser-free.
 *  Delivery order: injected sink (tests/native shells) → global `dataLayer` array
 *  (GTM-style, if the page defines one) → console.debug in dev → silent no-op. */
export interface TrackSink { push(e: Record<string, unknown>): void }

let sink: TrackSink | null = null;

/** Inject a delivery target (tests, or a native bridge later). Pass null to clear. */
export function setTrackSink(s: TrackSink | null): void { sink = s; }

export function track(event: string, props: Record<string, unknown> = {}): void {
  const payload = { event, ...props, ts: Date.now() };
  if (sink) { sink.push(payload); return; }
  const g = globalThis as { dataLayer?: Record<string, unknown>[] };
  if (Array.isArray(g.dataLayer)) { g.dataLayer.push(payload); return; }
  if (import.meta.env?.DEV) console.debug('[track]', payload);
}

/** Monetization placeholder: call sites exist, no ad SDK is wired. Replace the body
 *  when/if an ad network is integrated; the event keeps analytics parity meanwhile. */
export function adShown(placement: string): void {
  track('ad_shown', { placement });
}

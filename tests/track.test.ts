import { describe, it, expect, afterEach } from 'vitest';
import { track, adShown, setTrackSink, setTrackFanout } from '../src/core/track';

afterEach(() => setTrackSink(null));

describe('track', () => {
  it('delivers event + props to an injected sink', () => {
    const got: Record<string, unknown>[] = [];
    setTrackSink({ push: (e) => got.push(e) });
    track('start_game', { daily: false, control_type: 'touch' });
    expect(got).toHaveLength(1);
    expect(got[0].event).toBe('start_game');
    expect(got[0].control_type).toBe('touch');
    expect(typeof got[0].ts).toBe('number');
  });

  it('falls back to a global dataLayer array when present', () => {
    const g = globalThis as { dataLayer?: Record<string, unknown>[] };
    g.dataLayer = [];
    track('death', { height: 120 });
    expect(g.dataLayer).toHaveLength(1);
    expect(g.dataLayer[0].event).toBe('death');
    delete g.dataLayer;
  });

  it('adShown is a safe no-op hook that records via track', () => {
    const got: Record<string, unknown>[] = [];
    setTrackSink({ push: (e) => got.push(e) });
    adShown('interstitial_gameover');
    expect(got[0].event).toBe('ad_shown');
    expect(got[0].placement).toBe('interstitial_gameover');
  });

  it('never throws with no sink and no dataLayer', () => {
    expect(() => track('restart')).not.toThrow();
  });
});

describe('fanout (v0.19.0)', () => {
  it('fanout receives every event IN ADDITION to the sink', () => {
    const seenSink: Record<string, unknown>[] = [];
    const seenFan: Record<string, unknown>[] = [];
    setTrackSink({ push: (e) => seenSink.push(e) });
    setTrackFanout((e) => seenFan.push(e));
    track('death', { height: 5 });
    expect(seenSink).toHaveLength(1);
    expect(seenFan).toHaveLength(1);
    expect(seenFan[0].event).toBe('death');
    setTrackSink(null);
    setTrackFanout(null);
  });
  it('a throwing fanout never breaks track()', () => {
    setTrackFanout(() => { throw new Error('boom'); });
    expect(() => track('death', {})).not.toThrow();
    setTrackFanout(null);
  });
});

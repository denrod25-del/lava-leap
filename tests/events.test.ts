import { describe, it, expect } from 'vitest';
import { GameEvents } from '../src/core/events';

describe('GameEvents', () => {
  it('delivers payloads to subscribers', () => {
    const ev = new GameEvents();
    const got: number[] = [];
    ev.on('land', (p) => got.push(p.impactVy));
    ev.emit('land', { impactVy: 432 });
    expect(got).toEqual([432]);
  });

  it('supports multiple listeners and unsubscribe', () => {
    const ev = new GameEvents();
    let a = 0, b = 0;
    const offA = ev.on('jump', () => a++);
    ev.on('jump', () => b++);
    ev.emit('jump', {});
    offA();
    ev.emit('jump', {});
    expect(a).toBe(1);
    expect(b).toBe(2);
  });

  it('clear() removes everything', () => {
    const ev = new GameEvents();
    let n = 0;
    ev.on('death', () => n++);
    ev.clear();
    ev.emit('death', { height: 10, zoneIndex: 0 });
    expect(n).toBe(0);
  });

  it('delivers dashJumpCancel and flowTier events', () => {
    const ev = new GameEvents();
    let cancels = 0;
    let lastTier: { tier: number; name: string } | null = null;
    ev.on('dashJumpCancel', () => { cancels += 1; });
    ev.on('flowTier', (p) => { lastTier = p; });
    ev.emit('dashJumpCancel', {});
    ev.emit('flowTier', { tier: 2, name: 'HOT' });
    expect(cancels).toBe(1);
    expect(lastTier).toEqual({ tier: 2, name: 'HOT' });
  });
});

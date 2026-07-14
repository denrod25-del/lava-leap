import { RELIC } from './story';
import type { PlatformDescriptor } from './types';

/** Decides which streamed platforms carry a story relic. Cadence-based and
 *  deterministic: first relic past `firstAtHeight`, then one per `everyPx`
 *  climbed, only on plain static platforms, capped by locked relic pages. */
export class RelicPlanner {
  private nextAt: number;

  constructor(private remaining: number,
              firstAt: number = RELIC.firstAtHeight,
              private everyPx: number = RELIC.everyPx) {
    this.nextAt = firstAt;
  }

  /** `height` = TUNING.groundY - desc.y (how high this platform sits). */
  maybePlace(desc: PlatformDescriptor, height: number): boolean {
    if (this.remaining <= 0) return false;
    if (height < this.nextAt) return false;
    if (desc.type !== 'static' || desc.bounce || desc.enemy || desc.powerup) return false;
    this.nextAt = height + this.everyPx;
    this.remaining -= 1;
    return true;
  }
}

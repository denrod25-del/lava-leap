import { TUNING, REACH, SETPIECE, HAZARD } from '../tuning';
import { makeRng, randRange, type Rng } from './rng';
import type { PlatformDescriptor, PlatformType } from './types';
import { zoneForHeight } from './zones';
import { SET_PIECES, type SetPiece } from './setpieces';
import { rollHazard, rollEnemy, rollPowerup } from './hazardRules';

export class LevelGenerator {
  private rng: Rng;
  private nextId = 0;
  private last!: PlatformDescriptor;
  private pendingChunk: PlatformDescriptor[] = [];
  private untilChunk: number;

  constructor(seed: number, private startHeightOffset = 0) {
    this.rng = makeRng(seed);
    this.untilChunk = this.chunkInterval();
  }

  /** The starting platform — wide, static, centered under the spawn. */
  first(): PlatformDescriptor {
    const width = REACH.maxPlatformWidth;
    const x = Math.round(TUNING.playerStartX - width / 2);
    const p: PlatformDescriptor = {
      id: this.nextId++,
      x,
      y: TUNING.groundY - this.startHeightOffset,
      width,
      type: 'static',
      hasCoin: false,
    };
    this.last = p;
    return p;
  }

  /** Normalized difficulty 0..1 from the height climbed so far. */
  private difficulty(): number {
    const height = TUNING.groundY - this.last.y;
    return Math.max(0, Math.min(1, height / REACH.difficultySpan));
  }

  private pickType(t: number, height: number): PlatformType {
    // Probabilities ramp with difficulty; static stays dominant but shrinks.
    const bias = zoneForHeight(height).typeMixBias;
    const pCrumble = Math.min(0.45, 0.05 + 0.30 * t + bias.crumble);
    const pMoving = Math.min(0.45, 0.05 + 0.25 * t + bias.moving);
    const r = this.rng();
    if (r < pCrumble) return 'crumbling';
    if (r < pCrumble + pMoving) return 'moving';
    return 'static';
  }

  private chunkInterval(): number {
    return SETPIECE.minInterval +
      Math.floor(this.rng() * (SETPIECE.maxInterval - SETPIECE.minInterval + 1));
  }

  private queueChunk(): void {
    const tpl = SET_PIECES[Math.floor(this.rng() * SET_PIECES.length)];
    const entryGap = randRange(this.rng, REACH.minVerticalGap, REACH.maxVerticalGap);
    let y = this.last.y - entryGap;
    for (const cp of tpl.platforms) {
      const desc: PlatformDescriptor = {
        id: this.nextId++, x: cp.x, y: Math.round(y), width: cp.width,
        type: cp.type, hasCoin: cp.hasCoin,
      };
      if (cp.type === 'moving' && cp.movement) {
        const headroom = Math.max(0, Math.min(desc.x, TUNING.width - (desc.x + desc.width)));
        const range = Math.min(cp.movement.range, headroom);
        if (range > 0) desc.movement = { axis: 'horizontal', range, speed: cp.movement.speed };
        else desc.type = 'static';
      }
      this.pendingChunk.push(desc);
      y -= cp.dyToNext;
    }
    this.untilChunk = this.chunkInterval();
  }

  /**
   * Force a specific template (boss gauntlet) to surface next, mirroring queueChunk's
   * translation. Platforms are appended to pendingChunk so the normal stream `added`
   * path emits them; next() updates this.last as it shifts each off. Does NOT mutate
   * this.last directly. Uses a fixed entry gap so the gauntlet links reach-validly.
   */
  injectChunk(tpl: SetPiece): void {
    let y = this.last.y - 100;
    for (const cp of tpl.platforms) {
      const desc: PlatformDescriptor = {
        id: this.nextId++, x: cp.x, y: Math.round(y), width: cp.width,
        type: cp.type, hasCoin: cp.hasCoin,
      };
      if (cp.type === 'moving' && cp.movement) {
        const headroom = Math.max(0, Math.min(desc.x, TUNING.width - (desc.x + desc.width)));
        const range = Math.min(cp.movement.range, headroom);
        if (range > 0) desc.movement = { axis: 'horizontal', range, speed: cp.movement.speed };
        else desc.type = 'static';
      }
      this.pendingChunk.push(desc);
      y -= cp.dyToNext;
    }
  }

  next(): PlatformDescriptor {
    if (this.pendingChunk.length > 0) {
      const p = this.pendingChunk.shift()!;
      this.last = p;
      return p;
    }
    if (this.untilChunk <= 0) {
      this.queueChunk();
      return this.next();
    }
    this.untilChunk--;

    const t = this.difficulty();

    // Type picked first (consumes one rng value).
    const type = this.pickType(t, TUNING.groundY - this.last.y);

    // Vertical gap widens with difficulty.
    const vGap = randRange(
      this.rng,
      REACH.minVerticalGap,
      REACH.minVerticalGap + (REACH.maxVerticalGap - REACH.minVerticalGap) * t,
    );
    const y = this.last.y - vGap;

    // Width shrinks with difficulty.
    const width = randRange(
      this.rng,
      REACH.maxPlatformWidth - (REACH.maxPlatformWidth - REACH.minPlatformWidth) * t,
      REACH.maxPlatformWidth,
    );

    // Horizontal placement within reach of the previous platform AND on-screen.
    const prevCenter = this.last.x + this.last.width / 2;
    // Allowed center range so edge gap <= maxHorizontalEdgeGap.
    const reach = REACH.maxHorizontalEdgeGap + this.last.width / 2 + width / 2;
    let minCenter = Math.max(width / 2, prevCenter - reach);
    let maxCenter = Math.min(TUNING.width - width / 2, prevCenter + reach);
    if (minCenter > maxCenter) {
      // Degenerate (very wide platforms) — fall back to on-screen clamp.
      minCenter = width / 2;
      maxCenter = TUNING.width - width / 2;
    }
    const center = randRange(this.rng, minCenter, maxCenter);

    // Fix 2: round width once, then clamp x after rounding to guarantee p.x + p.width <= TUNING.width.
    const w = Math.round(width);
    const x = Math.max(0, Math.min(TUNING.width - w, Math.round(center - width / 2)));

    const p: PlatformDescriptor = {
      id: this.nextId++,
      x,
      y: Math.round(y),
      width: w,
      type,
      hasCoin: false,
    };
    if (type === 'moving') {
      // Fix 1: derive travel headroom from this platform's actual on-screen position,
      // not a centered assumption, so edge platforms never slide off-screen.
      const leftRoom = p.x;
      const rightRoom = TUNING.width - (p.x + p.width);
      const headroom = Math.max(0, Math.min(leftRoom, rightRoom));
      const desiredRange = REACH.movingRangeBase + Math.round(REACH.movingRangeSpan * t);
      const range = Math.min(desiredRange, headroom);
      if (range > 0) {
        p.movement = {
          axis: 'horizontal',
          range,
          speed: REACH.movingSpeedBase + Math.round(REACH.movingSpeedSpan * t),
        };
      } else {
        // Platform spans almost the full width — demote to static so the invariant
        // "type==='moving' ⇒ movement defined with range>0" always holds.
        p.type = 'static';
      }
    }
    // Fix 4: coin assignment consumes one RNG draw ONLY for non-crumbling platforms,
    // so reordering or changing this rule reshuffles all downstream generation (determinism caveat).
    p.hasCoin = p.type !== 'crumbling' && this.rng() < REACH.coinChance;

    // Bounce-pad and enemy attachment: static platforms only.
    const height = TUNING.groundY - p.y;
    if (p.type === 'static') {
      if (rollHazard(this.rng, t, height).bounce) p.bounce = true;
      const ek = rollEnemy(this.rng, t, height);
      if (ek && !p.bounce) p.enemy = { kind: ek };
      // Power-up: only on platforms with no bounce pad and no enemy, above grace.
      // Always roll (consumes 2 rng draws) so the per-seed stream is stable.
      const pk = rollPowerup(this.rng);
      if (pk && !p.bounce && !p.enemy && height >= HAZARD.graceHeight) {
        p.powerup = { kind: pk };
      }
    }

    this.last = p;
    return p;
  }
}

import { TUNING, REACH } from '../tuning';
import { makeRng, randRange, type Rng } from './rng';
import type { PlatformDescriptor, PlatformType } from './types';

export class LevelGenerator {
  private rng: Rng;
  private nextId = 0;
  private last!: PlatformDescriptor;

  constructor(seed: number) {
    this.rng = makeRng(seed);
  }

  /** The starting platform — wide, static, centered under the spawn. */
  first(): PlatformDescriptor {
    const width = REACH.maxPlatformWidth;
    const x = Math.round(TUNING.playerStartX - width / 2);
    const p: PlatformDescriptor = {
      id: this.nextId++,
      x,
      y: TUNING.groundY,
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

  private pickType(t: number): PlatformType {
    // Probabilities ramp with difficulty; static stays dominant but shrinks.
    const pCrumble = 0.05 + 0.30 * t;
    const pMoving = 0.05 + 0.25 * t;
    const r = this.rng();
    if (r < pCrumble) return 'crumbling';
    if (r < pCrumble + pMoving) return 'moving';
    return 'static';
  }

  next(): PlatformDescriptor {
    const t = this.difficulty();

    // Type picked first (consumes one rng value).
    const type = this.pickType(t);

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
    const x = Math.round(center - width / 2);

    const p: PlatformDescriptor = {
      id: this.nextId++,
      x,
      y: Math.round(y),
      width: Math.round(width),
      type,
      hasCoin: false,
    };
    if (type === 'moving') {
      const maxRange = Math.max(0, Math.floor((TUNING.width - width) / 2) - 4);
      p.movement = {
        axis: 'horizontal',
        range: Math.min(60 + Math.round(60 * t), maxRange || 1),
        speed: 40 + Math.round(50 * t),
      };
    }
    p.hasCoin = p.type !== 'crumbling' && this.rng() < REACH.coinChance;
    this.last = p;
    return p;
  }
}

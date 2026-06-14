import { LevelGenerator } from './LevelGenerator';
import { STREAM } from '../tuning';
import type { PlatformDescriptor } from './types';
import type { SetPiece } from './setpieces';

export class LevelStream {
  readonly active: PlatformDescriptor[] = [];
  private gen: LevelGenerator;
  private topY: number; // y of the highest generated platform

  constructor(seed: number) {
    this.gen = new LevelGenerator(seed);
    const first = this.gen.first();
    this.active.push(first);
    this.topY = first.y;
  }

  /** Force a boss gauntlet template to surface next via the normal `added` path. */
  injectChunk(tpl: SetPiece): void {
    this.gen.injectChunk(tpl);
  }

  /**
   * Ensure platforms exist up to `cameraTopY - GENERATE_MARGIN` (smaller y = higher),
   * and remove platforms below `pruneBelowY` (larger y = lower).
   * Returns the descriptors added and removed this tick so the renderer can sync.
   */
  update(cameraTopY: number, pruneBelowY: number): { added: PlatformDescriptor[]; removed: PlatformDescriptor[] } {
    const added: PlatformDescriptor[] = [];
    while (this.topY > cameraTopY - STREAM.generateMargin) {
      const p = this.gen.next();
      this.active.push(p);
      this.topY = p.y;
      added.push(p);
    }

    const removed: PlatformDescriptor[] = [];
    for (let i = this.active.length - 1; i >= 0; i--) {
      if (this.active[i].y > pruneBelowY) {
        removed.push(this.active[i]);
        this.active.splice(i, 1);
      }
    }
    return { added, removed };
  }
}

import { LevelGenerator } from './LevelGenerator';
import type { PlatformDescriptor } from './types';

const GENERATE_MARGIN = 200; // generate this far above the requested cameraTop

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

  /**
   * Ensure platforms exist up to `cameraTopY - GENERATE_MARGIN` (smaller y = higher),
   * and remove platforms below `pruneBelowY` (larger y = lower).
   * Returns the descriptors added and removed this tick so the renderer can sync.
   */
  update(cameraTopY: number, pruneBelowY: number): { added: PlatformDescriptor[]; removed: PlatformDescriptor[] } {
    const added: PlatformDescriptor[] = [];
    while (this.topY > cameraTopY - GENERATE_MARGIN) {
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

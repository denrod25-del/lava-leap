import Phaser from 'phaser';
import type { SaveData } from '../core/SaveData';
import { Letterbox } from './Letterbox';

/** The ≤3s in-run cinematic beat when the Titan first rises: letterbox bars +
 *  a brief slow-mo + an eye flash. Gameplay never stops — input stays live,
 *  the lava keeps rising (slowed along with everything else). Fires once ever
 *  per profile; the caller checks/sets save.story.stingSeen. Reduced Motion:
 *  bars only, no slow-mo/flash. */
export class StingController {
  private box?: Letterbox;

  constructor(private scene: Phaser.Scene, private save: SaveData) {}

  play(x: number, y: number): void {
    this.box = new Letterbox(this.scene);
    this.box.show(200);
    const reduced = this.save.get().settings.reducedMotion;
    const flash = this.scene.add.circle(x, y, 10, 0xffe066, 0).setDepth(91);
    if (reduced) {
      this.scene.time.delayedCall(600, () => this.finish(flash));
      return;
    }
    const world = (this.scene.physics as Phaser.Physics.Arcade.ArcadePhysics).world;
    world.timeScale = 3;
    this.scene.tweens.add({ targets: flash, alpha: 0.9, duration: 200, yoyo: true });
    this.scene.time.delayedCall(800, () => {
      world.timeScale = 1;
      this.finish(flash);
    });
  }

  private finish(flash: Phaser.GameObjects.Arc): void {
    flash.destroy();
    this.box?.hide(200, () => { this.box?.destroy(); this.box = undefined; });
  }
}

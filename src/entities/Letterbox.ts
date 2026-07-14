import Phaser from 'phaser';
import { TUNING } from '../tuning';

/** Two black bars that slide in from top/bottom to frame a cinematic beat, and
 *  slide back out on dismiss. Shared by CutsceneScene (full scenes) and
 *  StingController (the in-run Titan sting). */
export class Letterbox {
  private readonly barH = 64;
  private top: Phaser.GameObjects.Rectangle;
  private bottom: Phaser.GameObjects.Rectangle;

  constructor(private scene: Phaser.Scene) {
    this.top = scene.add.rectangle(0, -this.barH, TUNING.width, this.barH, 0x000000, 1)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(90);
    this.bottom = scene.add.rectangle(0, TUNING.height, TUNING.width, this.barH, 0x000000, 1)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(90);
  }

  show(durationMs = 260): void {
    this.scene.tweens.add({ targets: this.top, y: 0, duration: durationMs, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this.bottom, y: TUNING.height - this.barH, duration: durationMs, ease: 'Quad.easeOut' });
  }

  hide(durationMs = 260, onComplete?: () => void): void {
    this.scene.tweens.add({ targets: this.top, y: -this.barH, duration: durationMs, ease: 'Quad.easeIn' });
    this.scene.tweens.add({ targets: this.bottom, y: TUNING.height, duration: durationMs, ease: 'Quad.easeIn', onComplete });
  }

  destroy(): void {
    this.top.destroy();
    this.bottom.destroy();
  }
}

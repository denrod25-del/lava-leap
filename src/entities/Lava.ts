import Phaser from 'phaser';
import { TUNING } from '../tuning';

const BASE_SPEED = 55;        // px/s upward (y decreases)
const SPEED_PER_HEIGHT = 0.012; // extra px/s per px climbed

export class Lava {
  readonly rect: Phaser.GameObjects.TileSprite;
  /** World y of the lava surface (top). Smaller = higher. */
  surfaceY: number;

  constructor(scene: Phaser.Scene) {
    this.surfaceY = TUNING.groundY + 260; // starts below the screen
    this.rect = scene.add.tileSprite(TUNING.width / 2, this.surfaceY, TUNING.width, 4000, 'lava')
      .setOrigin(0.5, 0);
    this.rect.setDepth(5);
  }

  update(dtMs: number, heightClimbed: number): void {
    const speed = BASE_SPEED + heightClimbed * SPEED_PER_HEIGHT;
    this.surfaceY -= (speed * dtMs) / 1000;
    this.rect.y = this.surfaceY;
  }

  /** True if the player's feet are at/below the lava surface. */
  catches(playerY: number): boolean {
    return playerY + 16 >= this.surfaceY;
  }
}

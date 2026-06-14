import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { zoneForHeight } from '../core/zones';

const BASE_SPEED = 55;        // px/s upward (y decreases)
const SPEED_PER_HEIGHT = 0.012; // extra px/s per px climbed

export class Lava {
  readonly rect: Phaser.GameObjects.TileSprite;
  /** World y of the lava surface (top). Smaller = higher. */
  surfaceY: number;
  /** Multiplier on rise speed; the slow-lava power-up sets this below 1. */
  private speedFactor = 1;

  /** Scale the lava's rise rate (1 = normal). Slow-lava power-up uses < 1. */
  setSpeedFactor(f: number): void { this.speedFactor = f; }

  constructor(scene: Phaser.Scene) {
    this.surfaceY = TUNING.groundY + 260; // starts below the screen
    this.rect = scene.add.tileSprite(TUNING.width / 2, this.surfaceY, TUNING.width, 4000, 'lava')
      .setOrigin(0.5, 0);
    this.rect.setDepth(5);
  }

  update(dtMs: number, heightClimbed: number): void {
    const speed = (BASE_SPEED + heightClimbed * SPEED_PER_HEIGHT)
      * zoneForHeight(heightClimbed).lavaSpeedMultiplier * this.speedFactor;
    this.surfaceY -= (speed * dtMs) / 1000;
    this.rect.y = this.surfaceY;
  }

  /** True if the player's feet are at/below the lava surface. */
  catches(playerY: number): boolean {
    return playerY + 16 >= this.surfaceY;
  }
}

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
  private bubbles: Phaser.GameObjects.Particles.ParticleEmitter;

  /** Scale the lava's rise rate (1 = normal). Slow-lava power-up uses < 1. */
  setSpeedFactor(f: number): void { this.speedFactor = f; }

  constructor(scene: Phaser.Scene) {
    this.surfaceY = TUNING.groundY + 260; // starts below the screen
    this.rect = scene.add.tileSprite(TUNING.width / 2, this.surfaceY, TUNING.width, 4000, 'lava')
      .setOrigin(0.5, 0);
    this.rect.setDepth(5);
    if (!scene.textures.exists('px4')) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4);
      g.generateTexture('px4', 4, 4);
      g.destroy();
    }
    this.bubbles = scene.add.particles(0, this.surfaceY, 'px4', {
      x: { min: 0, max: TUNING.width },
      speedY: { min: -45, max: -15 }, lifespan: 800,
      scale: { start: 1.3, end: 0 }, alpha: { start: 0.85, end: 0 },
      tint: [0xffd166, 0xff8a3d], frequency: 130,
    }).setDepth(6);
  }

  update(dtMs: number, heightClimbed: number): void {
    const speed = (BASE_SPEED + heightClimbed * SPEED_PER_HEIGHT)
      * zoneForHeight(heightClimbed).lavaSpeedMultiplier * this.speedFactor;
    this.surfaceY -= (speed * dtMs) / 1000;
    this.rect.y = this.surfaceY;
    this.bubbles.y = this.surfaceY;
  }

  /** True if the player's feet are at/below the lava surface. */
  catches(playerY: number): boolean {
    return playerY + 16 >= this.surfaceY;
  }
}

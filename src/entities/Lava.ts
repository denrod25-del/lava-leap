import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { zoneForHeight } from '../core/zones';

const BASE_SPEED = 44;        // px/s upward (y decreases) — was 55; ~20% slower per play-testing
const SPEED_PER_HEIGHT = 0.010; // extra px/s per px climbed — was 0.012, same slowdown on the ramp

const GLOW_HEIGHT = 90; // px of gradient glow above the lava surface

export class Lava {
  readonly rect: Phaser.GameObjects.TileSprite;
  /** World y of the lava surface (top). Smaller = higher. */
  surfaceY: number;
  /** Multiplier on rise speed; the slow-lava power-up sets this below 1. */
  private speedFactor = 1;
  private bubbles: Phaser.GameObjects.Particles.ParticleEmitter;
  private glow: Phaser.GameObjects.Image;

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

    // Heat glow rising off the surface: a vertical orange→transparent gradient,
    // additive-blended, sitting just above the lava and tracking it upward.
    if (!scene.textures.exists('lava-glow')) {
      const canvas = scene.textures.createCanvas('lava-glow', 4, GLOW_HEIGHT)!;
      const ctx = canvas.getContext();
      const grad = ctx.createLinearGradient(0, 0, 0, GLOW_HEIGHT);
      grad.addColorStop(0, 'rgba(255, 77, 0, 0)');
      grad.addColorStop(1, 'rgba(255, 122, 30, 0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 4, GLOW_HEIGHT);
      canvas.refresh();
    }
    this.glow = scene.add.image(TUNING.width / 2, this.surfaceY, 'lava-glow')
      .setOrigin(0.5, 1)                    // bottom edge rides the surface
      .setDisplaySize(TUNING.width, GLOW_HEIGHT)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(5);
  }

  update(dtMs: number, heightClimbed: number): void {
    const speed = (BASE_SPEED + heightClimbed * SPEED_PER_HEIGHT)
      * zoneForHeight(heightClimbed).lavaSpeedMultiplier * this.speedFactor;
    this.surfaceY -= (speed * dtMs) / 1000;
    this.rect.y = this.surfaceY;
    this.bubbles.y = this.surfaceY;
    this.glow.y = this.surfaceY;
  }

  /** True if the player's feet are at/below the lava surface. */
  catches(playerY: number): boolean {
    return playerY + 16 >= this.surfaceY;
  }
}

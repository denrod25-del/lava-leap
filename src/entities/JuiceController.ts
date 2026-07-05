import Phaser from 'phaser';
import { TUNING, JUICE } from '../tuning';
import { GameEvents } from '../core/events';
import type { SaveData } from '../core/SaveData';
import type { Lava } from './Lava';

/** Listens to gameplay events and renders feel: tweens, particles, shake, popups. */
export class JuiceController {
  private emberEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trailEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private edgeGlow: Phaser.GameObjects.Rectangle[] = [];
  private lastFlowTier = 0;

  constructor(
    private scene: Phaser.Scene,
    events: GameEvents,
    private save: SaveData,
    private player: Phaser.GameObjects.Sprite,
    private lava: Lava,
  ) {
    this.ensureParticleTexture();

    this.dustEmitter = scene.add.particles(0, 0, 'px4', {
      speed: { min: 20, max: 70 }, angle: { min: 200, max: 340 },
      lifespan: 350, scale: { start: 1.4, end: 0 }, tint: 0xc9b9a3, emitting: false,
    }).setDepth(6);

    this.sparkEmitter = scene.add.particles(0, 0, 'px4', {
      speed: { min: 40, max: 120 }, lifespan: 420,
      scale: { start: 1.2, end: 0 }, tint: 0xffd166, emitting: false,
    }).setDepth(6);

    this.emberEmitter = scene.add.particles(0, 0, 'px4', {
      x: { min: 0, max: TUNING.width },
      speedY: { min: -70, max: -30 }, speedX: { min: -10, max: 10 },
      lifespan: 1600, scale: { start: 1, end: 0 },
      tint: [0xff8a3d, 0xff4d00, 0xffd166], alpha: { start: 0.9, end: 0 },
      frequency: 1000 / JUICE.emberRatePerSec,
    }).setDepth(6);

    // Dash trail: follows the player, emits only while dashing; density/tint scale
    // with the Flow tier (updateFlow).
    this.trailEmitter = scene.add.particles(0, 0, 'px4', {
      speed: { min: 10, max: 40 }, lifespan: 300,
      scale: { start: 1.6, end: 0 }, alpha: { start: 0.9, end: 0 },
      frequency: 24, emitting: false, follow: this.player,
    }).setDepth(7);

    // Screen-edge heat glow (fades in from HOT; disabled by Reduce Motion).
    const mkEdge = (x: number, y: number, w: number, h: number) =>
      scene.add.rectangle(x, y, w, h, 0xff4d00, 1)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(45).setAlpha(0);
    this.edgeGlow = [
      mkEdge(0, 0, 18, TUNING.height),
      mkEdge(TUNING.width - 18, 0, 18, TUNING.height),
      mkEdge(0, 0, TUNING.width, 12),
      mkEdge(0, TUNING.height - 12, TUNING.width, 12),
    ];

    events.on('jump', () => this.squash(JUICE.jumpSquashX, JUICE.jumpStretchY));
    events.on('doubleJump', () => this.squash(JUICE.jumpSquashX, JUICE.jumpStretchY));
    events.on('wallJump', () => this.squash(JUICE.jumpSquashX, JUICE.jumpStretchY));
    events.on('dash', () => this.dustAt(this.player.x, this.player.y + 12, 6));
    events.on('land', ({ impactVy }) => {
      const k = Phaser.Math.Clamp(impactVy / 900, 0.4, 1);
      this.squash(1 + (JUICE.landSquashX - 1) * k, 1 - (1 - JUICE.landSquashY) * k);
      this.dustAt(this.player.x, this.player.y + 16, Math.round(8 * k));
    });
    events.on('coinCollected', ({ x, y }) => {
      this.sparkEmitter.explode(10, x, y);
      this.popup(x, y, '+10');
    });
    events.on('platformCrumble', ({ x, y }) => {
      this.dustAt(x, y, 10);
      this.shake(JUICE.shakeSmall.duration, JUICE.shakeSmall.intensity);
    });
    events.on('death', () => this.deathSequence());
    events.on('enemyStomped', ({ x, y }) => {
      this.dustAt(x, y, 12);
      this.popup(x, y - 8, '+25');
    });
    events.on('playerHit', () => {
      this.shake(JUICE.shakeBig.duration, JUICE.shakeBig.intensity);
    });
    events.on('bouncePad', ({ x, y }) => {
      this.dustAt(x, y, 8);
    });
    events.on('powerupCollected', () => {
      this.sparkEmitter.explode(16, this.player.x, this.player.y);
    });
    events.on('powerupExpired', ({ kind }) => {
      // Shield break: a quick white screen flash so the loss of protection reads.
      if (kind === 'shield') this.flash(0xffffff, 0.35, 220);
    });
    events.on('playerRevived', ({ x, y }) => {
      // Revive: cyan flash + burst so the second chance reads clearly.
      this.flash(0x66ddff, 0.4, 320);
      this.sparkEmitter.explode(20, x, y);
    });
    events.on('bossPhase', ({ phase }) => {
      // The Lava Titan surfacing: big screen shake to sell its arrival.
      if (phase === 'start') this.shake(JUICE.shakeBig.duration, JUICE.shakeBig.intensity);
    });
    events.on('projectileLaunched', ({ x }) => {
      // Small muzzle flash + ember puff at the lava surface where the fireball erupts.
      const y = this.lava.surfaceY;
      this.sparkEmitter.explode(6, x, y);
      this.dustAt(x, y, 5);
    });
    events.on('dashJumpCancel', () => {
      // The signature move: stretch + a spark kick so the launch reads.
      this.squash(JUICE.jumpSquashX, JUICE.jumpStretchY);
      this.sparkEmitter.explode(8, this.player.x, this.player.y);
    });
    events.on('flowTier', ({ tier, name }) => {
      if (tier > this.lastFlowTier) {
        // Tier-up: name popup + spark burst; Blazing gets an ignition flash.
        this.popup(this.player.x, this.player.y - 20, name);
        this.sparkEmitter.explode(8 + tier * 4, this.player.x, this.player.y);
        if (tier === 3 && !this.save.get().settings.reducedMotion) {
          this.flash(0xff4d00, 0.25, 300);
        }
      }
      this.lastFlowTier = tier;
    });
  }

  private magnetSparkleAcc = 0;

  /** Call each frame so embers track the lava surface. `magnetActive` drives a light
   *  periodic sparkle drifting toward the player while the magnet power-up is up. */
  update(magnetActive = false, dtMs = 0): void {
    this.emberEmitter.y = this.lava.surfaceY;
    if (magnetActive) {
      this.magnetSparkleAcc += dtMs;
      if (this.magnetSparkleAcc >= 120) {
        this.magnetSparkleAcc = 0;
        const a = Math.random() * Math.PI * 2;
        const r = 40 + Math.random() * 30;
        this.sparkEmitter.explode(1, this.player.x + Math.cos(a) * r, this.player.y + Math.sin(a) * r);
      }
    } else {
      this.magnetSparkleAcc = 0;
    }
  }

  /** Call each frame with the Flow tier + dash state. Scales the dash trail and
   *  the screen-edge heat glow; Reduce Motion keeps the trail plain and glow off. */
  updateFlow(tier: number, dashing: boolean): void {
    const reduced = this.save.get().settings.reducedMotion;
    const tints = [0xffffff, 0xffd166, 0xff8a3d, 0xff4d00];
    this.trailEmitter.emitting = dashing;
    if (reduced) {
      this.trailEmitter.setFrequency(24);
      this.trailEmitter.particleTint = 0xffffff;
    } else {
      this.trailEmitter.setFrequency(24 - tier * 5); // denser (hotter) trail per tier
      this.trailEmitter.particleTint = tints[tier];
    }
    const target = reduced ? 0 : tier >= 3 ? 0.16 : tier === 2 ? 0.09 : 0;
    for (const r of this.edgeGlow) r.alpha += (target - r.alpha) * 0.08;
  }

  private ensureParticleTexture(): void {
    if (this.scene.textures.exists('px4')) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4);
    g.generateTexture('px4', 4, 4);
    g.destroy();
  }

  private squash(sx: number, sy: number): void {
    this.scene.tweens.killTweensOf(this.player);
    // Base scale = the player's DISPLAY size over the 48px source (not the hitbox).
    const baseX = TUNING.playerDisplayW / this.player.width, baseY = TUNING.playerDisplayH / this.player.height;
    this.player.setScale(baseX * sx * Math.sign(this.player.scaleX || 1), baseY * sy);
    this.scene.tweens.add({
      targets: this.player, scaleX: baseX * Math.sign(this.player.scaleX || 1), scaleY: baseY,
      duration: JUICE.squashMs, ease: 'Quad.easeOut',
    });
  }

  private dustAt(x: number, y: number, count: number): void {
    this.dustEmitter.explode(count, x, y);
  }

  private shake(duration: number, intensity: number): void {
    const s = this.save.get().settings;
    if (!s.screenShake || s.reducedMotion) return;
    this.scene.cameras.main.shake(duration, intensity);
  }

  private popup(x: number, y: number, text: string): void {
    const t = this.scene.add.text(x, y - 10, text, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffd166',
    }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({
      targets: t, y: y - 10 - JUICE.popupRise, alpha: 0,
      duration: JUICE.popupMs, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  /** Full-screen color flash that fades out. Reused by death + shield-break. */
  private flash(color: number, alpha: number, durationMs: number): void {
    const rect = this.scene.add.rectangle(0, 0, TUNING.width, TUNING.height, color, alpha)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(50);
    this.scene.tweens.add({ targets: rect, alpha: 0, duration: durationMs, onComplete: () => rect.destroy() });
  }

  private deathSequence(): void {
    this.shake(JUICE.shakeBig.duration, JUICE.shakeBig.intensity);
    this.flash(0xff2d2d, 0.45, 350);
    // Reduce motion: skip the slow-mo time warp (the flash still reads the death).
    if (this.save.get().settings.reducedMotion) return;
    const world = (this.scene.physics as Phaser.Physics.Arcade.ArcadePhysics).world;
    world.timeScale = JUICE.slowMoScale;
    this.scene.time.delayedCall(JUICE.slowMoMs, () => { world.timeScale = 1; });
  }
}

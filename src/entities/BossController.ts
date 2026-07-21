import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { GameEvents } from '../core/events';
import { BOSS_DURATION_MS, projectileSchedule, type Projectile } from '../core/boss';

/**
 * The Lava Titan boss. Rises from the lava at a zone boundary, lobs telegraphed
 * fireballs on a deterministic schedule, then submerges after BOSS_DURATION_MS.
 * Core logic (boundary detection, projectile schedule) lives in src/core/boss.ts;
 * this controller is the Phaser presentation/physics layer.
 */
export class BossController {
  private active = false;
  private titan?: Phaser.GameObjects.Sprite;
  private schedule: Projectile[] = [];
  private elapsed = 0;
  private fired = 0;
  private currentIndex = 0;
  readonly projectiles: Phaser.Physics.Arcade.Group;

  constructor(private scene: Phaser.Scene, private events: GameEvents) {
    this.projectiles = scene.physics.add.group({ allowGravity: false });
  }

  get isActive(): boolean { return this.active; }

  start(bossIndex: number, seed: number, lavaSurfaceY: number): void {
    this.active = true;
    this.elapsed = 0;
    this.fired = 0;
    this.currentIndex = bossIndex;
    this.schedule = projectileSchedule(bossIndex, seed);

    this.titan = this.scene.add
      .sprite(TUNING.width / 2, lavaSurfaceY + 8, 'boss-titan-sheet', 0)
      .setOrigin(0.5, 1)
      .setDisplaySize(220, 123)
      .setDepth(4);
    this.titan.play('boss-titan-idle');

    this.events.emit('bossPhase', { zoneIndex: bossIndex + 1, phase: 'start' });
  }

  update(dtMs: number, lavaSurfaceY: number): void {
    if (!this.active) return;
    this.elapsed += dtMs;
    if (this.titan) this.titan.y = lavaSurfaceY + 8;

    while (this.fired < this.schedule.length && this.elapsed >= this.schedule[this.fired].tMs) {
      this.playAttack();
      this.launch(this.schedule[this.fired].x, lavaSurfaceY);
      this.fired++;
    }

    if (this.elapsed >= BOSS_DURATION_MS) this.end();
  }

  private playAttack(): void {
    if (!this.titan) return;
    this.titan.play('boss-titan-attack', true);
    this.titan.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.active && this.titan?.active) this.titan.play('boss-titan-idle', true);
    });
  }

  private launch(x: number, fromY: number): void {
    const p = this.scene.physics.add
      .sprite(x, fromY - 8, 'boss-fireball-sheet', 0)
      .setDisplaySize(52, 12)
      .setRotation(-Math.PI / 2)
      .setDepth(5);

    p.play('boss-fireball-fly');
    const body = p.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityY(-260);
    body.setSize(22, 22, true);

    this.projectiles.add(p);
    this.events.emit('projectileLaunched', { x });
    this.scene.time.delayedCall(4000, () => p.destroy());
  }

  private end(): void {
    this.active = false;
    this.projectiles.clear(true, true);

    if (!this.titan) {
      this.events.emit('bossPhase', { zoneIndex: this.currentIndex + 1, phase: 'end' });
      return;
    }

    const titan = this.titan;
    titan.play('boss-titan-defeat', true);
    titan.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => titan.destroy());
    this.scene.time.delayedCall(900, () => {
      if (titan.active) titan.destroy();
    });
    this.titan = undefined;
    this.events.emit('bossPhase', { zoneIndex: this.currentIndex + 1, phase: 'end' });
  }

  registerPlayerOverlap(player: Phaser.Physics.Arcade.Sprite, onHit: () => void): void {
    this.scene.physics.add.overlap(player, this.projectiles, (_p, proj) => {
      (proj as Phaser.GameObjects.Sprite).destroy();
      onHit();
    });
  }
}

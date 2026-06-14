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
  private titan?: Phaser.GameObjects.Arc;
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
    this.titan = this.scene.add.circle(TUNING.width / 2, lavaSurfaceY, 70, 0x7a1020).setDepth(4);
    this.events.emit('bossPhase', { zoneIndex: bossIndex + 1, phase: 'start' });
  }

  update(dtMs: number, lavaSurfaceY: number): void {
    if (!this.active) return;
    this.elapsed += dtMs;
    if (this.titan) this.titan.y = lavaSurfaceY;
    while (this.fired < this.schedule.length && this.elapsed >= this.schedule[this.fired].tMs) {
      this.launch(this.schedule[this.fired].x, lavaSurfaceY);
      this.fired++;
    }
    if (this.elapsed >= BOSS_DURATION_MS) this.end();
  }

  private launch(x: number, fromY: number): void {
    const p = this.scene.add.circle(x, fromY, 8, 0xff7b00);
    this.scene.physics.add.existing(p);
    const body = p.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityY(-260);
    this.projectiles.add(p);
    this.scene.time.delayedCall(4000, () => p.destroy());
  }

  private end(): void {
    this.active = false;
    this.titan?.destroy();
    this.titan = undefined;
    this.projectiles.clear(true, true);
    this.events.emit('bossPhase', { zoneIndex: this.currentIndex + 1, phase: 'end' });
  }

  registerPlayerOverlap(player: Phaser.Physics.Arcade.Sprite, onHit: () => void): void {
    this.scene.physics.add.overlap(player, this.projectiles, (_p, proj) => {
      (proj as Phaser.GameObjects.Arc).destroy();
      onHit();
    });
  }
}

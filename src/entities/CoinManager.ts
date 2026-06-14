import Phaser from 'phaser';
import type { PlatformDescriptor } from '../core/types';

export class CoinManager {
  readonly group: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private byId = new Map<number, Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({ allowGravity: false, immovable: true });
  }

  spawn(desc: PlatformDescriptor): void {
    if (!desc.hasCoin) return;
    const cx = desc.x + desc.width / 2;
    const cy = desc.y - 18;
    const coin = this.scene.add.image(cx, cy, 'coin');
    coin.setDisplaySize(16, 16);
    this.scene.physics.add.existing(coin);
    const body = coin.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    // Keep the overlap footprint compact (~14px) regardless of source size.
    body.setCircle(coin.width / 2);
    coin.setData('platformId', desc.id);
    this.group.add(coin);
    this.byId.set(desc.id, coin);
  }

  despawn(desc: PlatformDescriptor): void {
    const c = this.byId.get(desc.id);
    if (c) { c.destroy(); this.byId.delete(desc.id); }
  }

  /** Magnet power-up: pull active coins within `radius` toward the player by
   *  `pull` px/s (scaled by the frame's `dtMs`). */
  attractTo(target: Phaser.GameObjects.Components.Transform, radius: number, pull: number, dtMs: number): void {
    const step = (pull * dtMs) / 1000;
    for (const coin of this.byId.values()) {
      const dx = target.x - coin.x;
      const dy = target.y - coin.y;
      const dist = Math.hypot(dx, dy);
      if (dist > radius || dist < 0.001) continue;
      const move = Math.min(step, dist);
      coin.x += (dx / dist) * move;
      coin.y += (dy / dist) * move;
      const body = coin.body as Phaser.Physics.Arcade.Body | null;
      if (body) body.updateFromGameObject();
    }
  }
}

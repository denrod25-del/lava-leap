import Phaser from 'phaser';
import type { PlatformDescriptor } from '../core/types';

export class CoinManager {
  readonly group: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private byId = new Map<number, Phaser.GameObjects.Arc>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({ allowGravity: false, immovable: true });
  }

  spawn(desc: PlatformDescriptor): void {
    if (!desc.hasCoin) return;
    const cx = desc.x + desc.width / 2;
    const cy = desc.y - 18;
    const coin = this.scene.add.circle(cx, cy, 7, 0xffd166);
    this.scene.physics.add.existing(coin);
    (coin.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    coin.setData('platformId', desc.id);
    this.group.add(coin);
    this.byId.set(desc.id, coin);
  }

  despawn(desc: PlatformDescriptor): void {
    const c = this.byId.get(desc.id);
    if (c) { c.destroy(); this.byId.delete(desc.id); }
  }
}

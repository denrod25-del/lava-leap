import Phaser from 'phaser';
import type { PlatformDescriptor } from '../core/types';

/** Story relic pickups: a small glowing shard floating over chosen platforms. */
export class RelicManager {
  readonly group: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private byId = new Map<number, Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({ allowGravity: false, immovable: true });
    if (!scene.textures.exists('relic')) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      // 14x14 diamond shard with a warm core.
      g.fillStyle(0xffd9a3, 1);
      g.fillPoints([{ x: 7, y: 0 }, { x: 14, y: 7 }, { x: 7, y: 14 }, { x: 0, y: 7 }] as Phaser.Types.Math.Vector2Like[], true);
      g.fillStyle(0xff8a3d, 1);
      g.fillPoints([{ x: 7, y: 3 }, { x: 11, y: 7 }, { x: 7, y: 11 }, { x: 3, y: 7 }] as Phaser.Types.Math.Vector2Like[], true);
      g.generateTexture('relic', 14, 14);
      g.destroy();
    }
  }

  spawnAt(desc: PlatformDescriptor): void {
    const cx = desc.x + desc.width / 2;
    const cy = desc.y - 26;
    const relic = this.scene.add.image(cx, cy, 'relic').setDepth(5);
    this.scene.physics.add.existing(relic);
    (relic.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    relic.setData('platformId', desc.id);
    this.scene.tweens.add({ targets: relic, y: cy - 6, alpha: 0.75, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.group.add(relic);
    this.byId.set(desc.id, relic);
  }

  despawn(desc: PlatformDescriptor): void {
    const r = this.byId.get(desc.id);
    if (r) { r.destroy(); this.byId.delete(desc.id); }
  }
}

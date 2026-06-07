import Phaser from 'phaser';
import type { PlatformDescriptor } from '../core/types';

const COLORS: Record<string, number> = {
  static: 0x6abe30,
  crumbling: 0xc98a3a,
  moving: 0x3aa0c9,
};
const PLATFORM_H = 16;

interface PlatformView {
  desc: PlatformDescriptor;
  rect: Phaser.GameObjects.Rectangle;
  originX: number;
  crumbleAt: number | null;
}

export class PlatformManager {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private scene: Phaser.Scene;
  private views = new Map<number, PlatformView>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.staticGroup();
  }

  spawn(desc: PlatformDescriptor): void {
    const cx = desc.x + desc.width / 2;
    const cy = desc.y + PLATFORM_H / 2;
    const rect = this.scene.add.rectangle(cx, cy, desc.width, PLATFORM_H, COLORS[desc.type]);
    this.scene.physics.add.existing(rect, true);
    this.group.add(rect);
    this.views.set(desc.id, { desc, rect, originX: cx, crumbleAt: null });
  }

  despawn(desc: PlatformDescriptor): void {
    const v = this.views.get(desc.id);
    if (!v) return;
    v.rect.destroy();
    this.views.delete(desc.id);
  }

  /** Refresh the static body after moving a platform. */
  private syncBody(v: PlatformView): void {
    (v.rect.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
  }

  update(time: number): void {
    for (const v of this.views.values()) {
      if (v.desc.type === 'moving' && v.desc.movement) {
        const m = v.desc.movement;
        const offset = Math.sin((time / 1000) * (m.speed / Math.max(1, m.range))) * m.range;
        v.rect.x = v.originX + offset;
        this.syncBody(v);
      }
    }
  }
}

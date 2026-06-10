import Phaser from 'phaser';
import type { PlatformDescriptor } from '../core/types';
import { GameEvents } from '../core/events';
import { zoneForHeight } from '../core/zones';
import { TUNING } from '../tuning';

const PLATFORM_H = 16;
const CRUMBLE_DELAY_MS = 400;
const CRUMBLE_RESPAWN_MS = 2500;

interface PlatformView {
  desc: PlatformDescriptor;
  rect: Phaser.GameObjects.TileSprite;
  originX: number;
  crumbleAt: number | null;
}

export class PlatformManager {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private scene: Phaser.Scene;
  private views = new Map<number, PlatformView>();

  constructor(scene: Phaser.Scene, private events: GameEvents) {
    this.scene = scene;
    this.group = scene.physics.add.staticGroup();
  }

  spawn(desc: PlatformDescriptor): void {
    const cx = desc.x + desc.width / 2;
    const cy = desc.y + PLATFORM_H / 2;
    const rect = this.scene.add.tileSprite(cx, cy, desc.width, PLATFORM_H, 'platform');
    const zone = zoneForHeight(TUNING.groundY - desc.y);
    rect.setTint(zone.platformTints[desc.type]);
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

  /** Call when the player is standing on a platform; starts the crumble timer. */
  touch(id: number, time: number): void {
    const v = this.views.get(id);
    if (!v || v.desc.type !== 'crumbling' || v.crumbleAt !== null) return;
    v.crumbleAt = time + CRUMBLE_DELAY_MS;
  }

  /** Find the platform id the player is currently resting on, if any. */
  platformUnder(sprite: Phaser.GameObjects.Sprite): number | null {
    for (const v of this.views.values()) {
      const b = v.rect;
      const halfW = (b.width as number) / 2;
      const top = b.y - 8;
      if (
        sprite.x >= b.x - halfW && sprite.x <= b.x + halfW &&
        Math.abs((sprite.y + 16) - top) < 6
      ) return v.desc.id;
    }
    return null;
  }

  update(time: number): void {
    for (const v of this.views.values()) {
      if (v.desc.type === 'moving' && v.desc.movement) {
        const m = v.desc.movement;
        const offset = Math.sin((time / 1000) * (m.speed / Math.max(1, m.range))) * m.range;
        v.rect.x = v.originX + offset;
        this.syncBody(v);
      }
      if (v.desc.type === 'crumbling') {
        if (v.crumbleAt !== null && v.rect.visible && time >= v.crumbleAt) {
          this.events.emit('platformCrumble', { x: v.rect.x, y: v.rect.y });
          v.rect.setVisible(false);
          (v.rect.body as Phaser.Physics.Arcade.StaticBody).enable = false;
          v.crumbleAt = time + CRUMBLE_RESPAWN_MS; // reuse field as respawn time
        } else if (!v.rect.visible && v.crumbleAt !== null && time >= v.crumbleAt) {
          v.rect.setVisible(true);
          (v.rect.body as Phaser.Physics.Arcade.StaticBody).enable = true;
          v.crumbleAt = null;
        }
      }
    }
  }
}

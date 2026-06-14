import Phaser from 'phaser';
import type { PlatformDescriptor } from '../core/types';
import { GameEvents } from '../core/events';
import { ENEMY } from '../tuning';

interface EnemyView {
  desc: PlatformDescriptor;
  sprite: Phaser.GameObjects.Image; // the textured enemy IS the hit target
  platLeft: number;
  platRight: number;
  platTopY: number;
  dir: 1 | -1;     // crawler patrol direction
  phase: number;   // drifter sine-bob phase offset
}

/** Spawns/despawns crawler + drifter enemies from platform descriptors, drives their
 *  motion, and resolves player contact (stomp / dash-kill / lethal). Emits enemyStomped
 *  on every kill so juice/audio/achievements hook in via the event spine. */
export class EnemyManager {
  private views = new Map<number, EnemyView>();

  constructor(private scene: Phaser.Scene, private events: GameEvents) {
    this.ensureTextures();
  }

  private ensureTextures(): void {
    if (!this.scene.textures.exists('enemy-crawler')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xe63946, 1).fillRect(0, 0, ENEMY.bodyW, ENEMY.bodyH);
      g.fillStyle(0xffd166, 1).fillRect(3, 4, 4, 4).fillRect(13, 4, 4, 4);
      g.fillStyle(0x1a1a2e, 1).fillRect(5, 6, 2, 2).fillRect(15, 6, 2, 2);
      g.generateTexture('enemy-crawler', ENEMY.bodyW, ENEMY.bodyH);
      g.destroy();
    }
    if (!this.scene.textures.exists('enemy-drifter')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x7b2d8b, 1).fillEllipse(ENEMY.bodyW / 2, ENEMY.bodyH / 2, ENEMY.bodyW, ENEMY.bodyH);
      g.fillStyle(0xe0aaff, 1).fillCircle(7, 7, 3).fillCircle(13, 7, 3);
      g.fillStyle(0x1a1a2e, 1).fillCircle(7, 7, 1.5).fillCircle(13, 7, 1.5);
      g.generateTexture('enemy-drifter', ENEMY.bodyW, ENEMY.bodyH);
      g.destroy();
    }
  }

  spawn(desc: PlatformDescriptor): void {
    if (!desc.enemy || this.views.has(desc.id)) return;
    const platLeft = desc.x;
    const platRight = desc.x + desc.width;
    const platTopY = desc.y;
    const isCrawler = desc.enemy.kind === 'crawler';
    const startX = (platLeft + platRight) / 2;
    const y = isCrawler ? platTopY - ENEMY.bodyH / 2 : platTopY - ENEMY.drifterHoverH;

    const sprite = this.scene.add.image(startX, y, isCrawler ? 'enemy-crawler' : 'enemy-drifter').setDepth(5);
    this.views.set(desc.id, {
      desc, sprite, platLeft, platRight, platTopY, dir: 1,
      phase: (desc.id % 8) / 8 * Math.PI * 2, // deterministic per-platform phase, no Math.random
    });
  }

  despawn(desc: PlatformDescriptor): void {
    const v = this.views.get(desc.id);
    if (!v) return;
    v.sprite.destroy();
    this.views.delete(desc.id);
  }

  update(time: number, dtMs: number): void {
    const dt = dtMs / 1000;
    for (const v of this.views.values()) {
      if (v.desc.enemy!.kind === 'crawler') {
        const minX = v.platLeft + ENEMY.bodyW / 2;
        const maxX = v.platRight - ENEMY.bodyW / 2;
        v.sprite.x += v.dir * ENEMY.crawlerSpeed * dt;
        if (v.sprite.x <= minX) { v.sprite.x = minX; v.dir = 1; }
        else if (v.sprite.x >= maxX) { v.sprite.x = maxX; v.dir = -1; }
        v.sprite.setFlipX(v.dir < 0);
        v.sprite.y = v.platTopY - ENEMY.bodyH / 2;
      } else {
        v.sprite.x = (v.platLeft + v.platRight) / 2;
        v.sprite.y = v.platTopY - ENEMY.drifterHoverH
          + Math.sin(time / 1000 * ENEMY.drifterFreq * Math.PI * 2 + v.phase) * ENEMY.drifterAmplitude;
      }
    }
  }

  /**
   * Resolve player↔enemy contact for this frame. Call once per frame after update().
   * Stomp (descending + feet near enemy top) → kill + onStompBounce.
   * Dash → kill. Otherwise → onHit.
   */
  resolveContact(player: Phaser.Physics.Arcade.Sprite, isDashing: () => boolean, onHit: () => void, onStompBounce: () => void): void {
    const b = player.body as Phaser.Physics.Arcade.Body;
    const px = b.x + b.width / 2, py = b.y + b.height / 2, phw = b.width / 2, phh = b.height / 2;
    for (const v of this.views.values()) {
      const ehw = ENEMY.bodyW / 2, ehh = ENEMY.bodyH / 2;
      if (Math.abs(px - v.sprite.x) >= ehw + phw) continue;
      if (Math.abs(py - v.sprite.y) >= ehh + phh) continue;
      const feetY = b.y + b.height;
      const enemyTopY = v.sprite.y - ehh;
      const feetBelowTop = feetY - enemyTopY;
      // Stomp only when descending AND feet are at/just-below the enemy top (not above it,
      // which would let a side-approach falling past a tall enemy steal a free stomp).
      if (b.velocity.y > 0 && feetBelowTop >= 0 && feetBelowTop < ENEMY.stompWindow * 2) {
        this.kill(v.desc.id); onStompBounce();
      } else if (isDashing()) {
        this.kill(v.desc.id);
      } else {
        onHit();
      }
    }
  }

  private kill(id: number): void {
    const v = this.views.get(id);
    if (!v) return;
    this.events.emit('enemyStomped', { x: v.sprite.x, y: v.sprite.y });
    v.sprite.destroy();
    this.views.delete(id);
  }

  destroy(): void {
    for (const v of this.views.values()) v.sprite.destroy();
    this.views.clear();
  }
}

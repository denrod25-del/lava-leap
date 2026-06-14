import Phaser from 'phaser';
import type { PlatformDescriptor } from '../core/types';
import { ENEMY } from '../tuning';

interface EnemyView {
  desc: PlatformDescriptor;
  sprite: Phaser.GameObjects.Rectangle;
  /** x of left edge of platform */
  platLeft: number;
  /** x of right edge of platform */
  platRight: number;
  /** y of platform top surface */
  platTopY: number;
  dir: 1 | -1;  // crawler patrol direction
  phase: number; // drifter sine phase offset
}

/** Manages crawler and drifter enemies. Pure Phaser — no game-core imports. */
export class EnemyManager {
  /** Rectangle group used for overlap detection. */
  readonly group: Phaser.GameObjects.Group;
  private scene: Phaser.Scene;
  private views = new Map<number, EnemyView>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.add.group();
  }

  private ensureTextures(): void {
    if (!this.scene.textures.exists('enemy-crawler')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      // Crawler: solid red-orange square body with eye dots
      g.fillStyle(0xe63946, 1).fillRect(0, 0, ENEMY.bodyW, ENEMY.bodyH);
      g.fillStyle(0xffd166, 1).fillRect(3, 4, 4, 4).fillRect(13, 4, 4, 4);
      g.fillStyle(0x1a1a2e, 1).fillRect(5, 6, 2, 2).fillRect(15, 6, 2, 2);
      // legs
      g.fillStyle(0xe63946, 1)
        .fillRect(0, ENEMY.bodyH, 3, 5)
        .fillRect(5, ENEMY.bodyH, 3, 4)
        .fillRect(12, ENEMY.bodyH, 3, 4)
        .fillRect(17, ENEMY.bodyH, 3, 5);
      g.generateTexture('enemy-crawler', ENEMY.bodyW, ENEMY.bodyH + 5);
      g.destroy();
    }
    if (!this.scene.textures.exists('enemy-drifter')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      // Drifter: purple ghost-like oval body
      g.fillStyle(0x7b2d8b, 1).fillEllipse(ENEMY.bodyW / 2, ENEMY.bodyH / 2, ENEMY.bodyW, ENEMY.bodyH);
      g.fillStyle(0xe0aaff, 1).fillCircle(7, 7, 3).fillCircle(13, 7, 3);
      g.fillStyle(0x1a1a2e, 1).fillCircle(7, 7, 1.5).fillCircle(13, 7, 1.5);
      // wispy tendrils at bottom
      g.fillStyle(0x7b2d8b, 0.7)
        .fillRect(3, ENEMY.bodyH - 2, 4, 6)
        .fillRect(9, ENEMY.bodyH, 4, 8)
        .fillRect(15, ENEMY.bodyH - 2, 4, 6);
      g.generateTexture('enemy-drifter', ENEMY.bodyW, ENEMY.bodyH + 8);
      g.destroy();
    }
  }

  spawn(desc: PlatformDescriptor): void {
    if (!desc.enemy) return;
    if (this.views.has(desc.id)) return;

    this.ensureTextures();

    const platLeft = desc.x;
    const platRight = desc.x + desc.width;
    const platTopY = desc.y;

    const startX = (platLeft + platRight) / 2;
    const isCrawler = desc.enemy.kind === 'crawler';

    const y = isCrawler
      ? platTopY - (ENEMY.bodyH + 5) / 2  // sits on platform
      : platTopY - ENEMY.drifterHoverH;   // floats above

    const textureKey = isCrawler ? 'enemy-crawler' : 'enemy-drifter';
    // Use a Rectangle as physics overlap target (invisible hit rect), plus an image for visuals
    const sprite = this.scene.add.rectangle(startX, y, ENEMY.bodyW, ENEMY.bodyH, 0xff0000, 0)
      .setDepth(5);

    // Attach visible image at same position
    const img = this.scene.add.image(startX, y, textureKey).setDepth(5);
    (sprite as unknown as { _img: Phaser.GameObjects.Image })._img = img;

    this.group.add(sprite);

    this.views.set(desc.id, {
      desc,
      sprite: sprite as Phaser.GameObjects.Rectangle,
      platLeft,
      platRight,
      platTopY,
      dir: 1,
      phase: Math.random() * Math.PI * 2,
    });
  }

  despawn(desc: PlatformDescriptor): void {
    const v = this.views.get(desc.id);
    if (!v) return;
    const img = (v.sprite as unknown as { _img?: Phaser.GameObjects.Image })._img;
    img?.destroy();
    v.sprite.destroy();
    this.views.delete(desc.id);
  }

  /** Call each game frame. */
  update(time: number, _delta: number): void {
    for (const v of this.views.values()) {
      const kind = v.desc.enemy!.kind;
      if (kind === 'crawler') {
        // Patrol between platform edges
        const speed = ENEMY.crawlerSpeed / 1000; // px/ms — multiply by delta later
        // Use time-based oscillation for determinism: bounce within platform
        const range = Math.max(0, (v.platRight - v.platLeft) / 2 - ENEMY.bodyW / 2);
        const period = range > 0 ? (range * 2) / (ENEMY.crawlerSpeed / 1000 * 16) : 1;
        const cx = (v.platLeft + v.platRight) / 2;
        const offset = range > 0 ? Math.sin((time / 1000) * (Math.PI / (range / ENEMY.crawlerSpeed))) * range : 0;
        v.sprite.x = cx + offset;
        v.sprite.y = v.platTopY - (ENEMY.bodyH + 5) / 2;
        void speed; void period;
      } else {
        // Drifter: sine bob vertically
        const baseY = v.platTopY - ENEMY.drifterHoverH;
        v.sprite.x = (v.platLeft + v.platRight) / 2;
        v.sprite.y = baseY + Math.sin(time / 1000 * ENEMY.drifterFreq * Math.PI * 2 + v.phase) * ENEMY.drifterAmplitude;
      }
      // Sync visual image
      const img = (v.sprite as unknown as { _img?: Phaser.GameObjects.Image })._img;
      if (img) { img.x = v.sprite.x; img.y = v.sprite.y; }
    }
  }

  /**
   * Register player-enemy overlap resolution each frame.
   * Must be called once per frame (in GameScene.update) after update().
   *
   * Stomp: player descending AND player feet are above enemy top -> kill + stompBounce
   * Dash:  player is dashing -> kill
   * else:  onHit
   */
  registerPlayerOverlap(
    playerSprite: Phaser.Physics.Arcade.Sprite,
    isDashing: () => boolean,
    onHit: () => void,
    onStompBounce: () => void,
  ): void {
    const playerBody = playerSprite.body as Phaser.Physics.Arcade.Body;

    for (const v of this.views.values()) {
      const ex = v.sprite.x;
      const ey = v.sprite.y;
      const hw = ENEMY.bodyW / 2;
      const hh = ENEMY.bodyH / 2;

      // AABB overlap between player body and enemy hitbox
      const px = playerBody.x + playerBody.width / 2;
      const py = playerBody.y + playerBody.height / 2;
      const phw = playerBody.width / 2;
      const phh = playerBody.height / 2;

      const overlapX = Math.abs(px - ex) < hw + phw;
      const overlapY = Math.abs(py - ey) < hh + phh;

      if (!overlapX || !overlapY) continue;

      // Stomp check: descending and player feet above enemy top
      const playerFeetY = playerBody.y + playerBody.height;
      const enemyTopY = ey - hh;
      const descending = playerBody.velocity.y > 0;

      if (descending && playerFeetY - enemyTopY < ENEMY.stompWindow * 2) {
        // stomp
        this.kill(v.desc.id);
        onStompBounce();
      } else if (isDashing()) {
        // dash kill
        this.kill(v.desc.id);
      } else {
        // lethal contact
        onHit();
      }
    }
  }

  private kill(id: number): void {
    const v = this.views.get(id);
    if (!v) return;
    // Emit stomp event via desc reference (GameScene will listen via gameEvents)
    const x = v.sprite.x, y = v.sprite.y;
    const img = (v.sprite as unknown as { _img?: Phaser.GameObjects.Image })._img;
    img?.destroy();
    v.sprite.destroy();
    this.views.delete(id);
    // Store kill position for juice — use a custom property on the group (simple approach)
    (this.group as unknown as { _lastKill?: { x: number; y: number } })._lastKill = { x, y };
  }

  /** Returns and clears the most recent kill position, or null if none. */
  consumeLastKill(): { x: number; y: number } | null {
    const lk = (this.group as unknown as { _lastKill?: { x: number; y: number } })._lastKill ?? null;
    if (lk) delete (this.group as unknown as { _lastKill?: { x: number; y: number } })._lastKill;
    return lk;
  }

  destroy(): void {
    for (const v of this.views.values()) {
      const img = (v.sprite as unknown as { _img?: Phaser.GameObjects.Image })._img;
      img?.destroy();
      v.sprite.destroy();
    }
    this.views.clear();
    this.group.destroy(true);
  }
}

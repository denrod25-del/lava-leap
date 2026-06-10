import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { GameEvents } from '../core/events';
import { save } from '../main';
import { COSMETICS } from '../scenes/ShopScene';

type Body = Phaser.Physics.Arcade.Body;

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyDash!: Phaser.Input.Keyboard.Key;
  private keyDashAlt!: Phaser.Input.Keyboard.Key;
  private jumpHeldLast = false;
  private jumpsUsed = 0;
  private coyoteTimer = 0;
  private bufferTimer = 0;
  private dashTimer = 0;
  private dashAvailable = true;
  private dashDir = 1;
  private wasOnGround = true;
  private _wallSliding = false;

  get wallSliding(): boolean { return this._wallSliding; }

  constructor(scene: Phaser.Scene, x: number, y: number, private events: GameEvents) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(false);
    // Source art is 48x48; display it at the gameplay footprint (~24x32).
    this.sprite.setDisplaySize(24, 32);
    // Arcade body size is in source pixels and is scaled by the sprite, so a full
    // 48x48 source body becomes 24x32 in world space — matching the old placeholder.
    const body = this.sprite.body as Body;
    body.setSize(48, 48);
    body.setOffset(0, 0);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keyA = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyDash = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyDashAlt = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    // Apply equipped cosmetic tint.
    const equipped = COSMETICS.find((c) => c.id === save.get().equippedCosmetic);
    if (equipped && equipped.id !== 'default') this.sprite.setTint(equipped.tint);
  }

  update(): void {
    const dt = this.scene.game.loop.delta; // ms
    const body = this.sprite.body as Body;

    // Visual squash/stretch tweens (JuiceController) change the sprite scale, and
    // Arcade derives the world body from source-size x scale. Re-derive the source
    // size from the live scale each frame so the world body stays exactly 24x32
    // no matter what the visuals do.
    const sx = Math.abs(this.sprite.scaleX) || 1;
    const sy = Math.abs(this.sprite.scaleY) || 1;
    body.setSize(24 / sx, 32 / sy);
    body.setOffset((this.sprite.width - 24 / sx) / 2, this.sprite.height - 32 / sy);

    // Capture velocity BEFORE any changes this frame (used for land impactVy).
    const vyAtFrameStart = body.velocity.y;

    // Reset wall-sliding flag before the dash early-return so it's always cleared.
    this._wallSliding = false;

    const left = this.cursors.left!.isDown || this.keyA.isDown;
    const right = this.cursors.right!.isDown || this.keyD.isDown;
    const jumpDown = this.cursors.up!.isDown || this.cursors.space!.isDown;
    const onGround = body.blocked.down || body.touching.down;

    // Land detection: airborne last frame, grounded this frame.
    if (onGround && !this.wasOnGround) this.events.emit('land', { impactVy: vyAtFrameStart });
    this.wasOnGround = onGround;

    const onWallLeft = body.blocked.left || body.touching.left;
    const onWallRight = body.blocked.right || body.touching.right;
    const onWall = (onWallLeft || onWallRight) && !onGround;

    if (onGround || onWall) this.dashAvailable = true;

    // Maintain an active dash (overrides normal horizontal movement & gravity).
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.sprite.setVelocityX(this.dashDir * TUNING.dashSpeed);
      this.sprite.setVelocityY(0);
      (body as Body).setAllowGravity(false);
      this.jumpHeldLast = jumpDown;
      return; // skip the rest while dashing
    }
    (body as Body).setAllowGravity(true);

    // Horizontal movement (track facing for dash direction fallback).
    if (left && !right) {
      this.sprite.setVelocityX(-TUNING.moveSpeed);
      this.sprite.setFlipX(true);
    } else if (right && !left) {
      this.sprite.setVelocityX(TUNING.moveSpeed);
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
    }

    // Wall slide: cap downward speed when pressing into a wall.
    const pressingIntoWall = (onWallLeft && left) || (onWallRight && right);
    this._wallSliding = onWall && pressingIntoWall;
    if (this._wallSliding && body.velocity.y > TUNING.wallSlideMax) {
      this.sprite.setVelocityY(TUNING.wallSlideMax);
    }

    // Dash trigger (airborne only, once per airtime).
    const dashPressed = Phaser.Input.Keyboard.JustDown(this.keyDash) || Phaser.Input.Keyboard.JustDown(this.keyDashAlt);
    if (dashPressed && this.dashAvailable && !onGround) {
      this.dashDir = right ? 1 : left ? -1 : this.sprite.flipX ? -1 : 1;
      this.dashTimer = TUNING.dashDurationMs;
      this.dashAvailable = false;
      this.events.emit('dash', {});
    }

    if (onGround) {
      this.jumpsUsed = 0;
      this.coyoteTimer = TUNING.coyoteMs;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (jumpDown && !this.jumpHeldLast) this.bufferTimer = TUNING.jumpBufferMs;
    else this.bufferTimer = Math.max(0, this.bufferTimer - dt);

    const canGroundJump = this.coyoteTimer > 0 && this.jumpsUsed === 0;
    if (this.bufferTimer > 0) {
      if (canGroundJump) {
        this.sprite.setVelocityY(-TUNING.jumpVelocity);
        this.jumpsUsed = 1;
        this.bufferTimer = 0;
        this.coyoteTimer = 0;
        this.events.emit('jump', {});
      } else if (onWall) {
        const dir = onWallLeft ? 1 : -1; // push away from wall
        this.sprite.setVelocityX(dir * TUNING.wallJumpX);
        this.sprite.setVelocityY(-TUNING.wallJumpY);
        this.jumpsUsed = 1; // allow one air jump after a wall jump
        this.bufferTimer = 0;
        this.events.emit('wallJump', {});
      } else if (!onGround && this.jumpsUsed < 2 && this.jumpsUsed > 0) {
        this.sprite.setVelocityY(-TUNING.doubleJumpVelocity);
        this.jumpsUsed = 2;
        this.bufferTimer = 0;
        this.events.emit('doubleJump', {});
      }
    }
    // Variable height: cut upward velocity on release.
    if (!jumpDown && this.jumpHeldLast && body.velocity.y < 0) {
      this.sprite.setVelocityY(body.velocity.y * TUNING.jumpCutMultiplier);
    }
    this.jumpHeldLast = jumpDown;

    this.pickAnimation(onGround, left || right, body.velocity.y);
  }

  private pickAnimation(onGround: boolean, moving: boolean, vy: number): void {
    if (!this.scene.anims.exists('player-run')) return; // no frames generated — static fallback
    let key: string;
    if (!onGround) key = vy < 0 ? 'player-jump' : 'player-fall';
    else if (moving) key = 'player-run';
    else key = 'player-idle';
    if (this.scene.anims.exists(key) && this.sprite.anims.getName() !== key) {
      this.sprite.anims.play(key, true);
    }
  }
}

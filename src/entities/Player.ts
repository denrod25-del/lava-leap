import Phaser from 'phaser';
import { TUNING } from '../tuning';

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

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    // Placeholder texture: a 24x32 rectangle generated at runtime.
    const key = 'player-rect';
    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffec27, 1).fillRect(0, 0, 24, 32);
      g.generateTexture(key, 24, 32);
      g.destroy();
    }
    this.sprite = scene.physics.add.sprite(x, y, key);
    this.sprite.setCollideWorldBounds(false);
    (this.sprite.body as Body).setSize(24, 32);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keyA = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyDash = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyDashAlt = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  }

  update(): void {
    const dt = this.scene.game.loop.delta; // ms
    const body = this.sprite.body as Body;
    const left = this.cursors.left!.isDown || this.keyA.isDown;
    const right = this.cursors.right!.isDown || this.keyD.isDown;
    const jumpDown = this.cursors.up!.isDown || this.cursors.space!.isDown;
    const onGround = body.blocked.down || body.touching.down;

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
    if (onWall && pressingIntoWall && body.velocity.y > TUNING.wallSlideMax) {
      this.sprite.setVelocityY(TUNING.wallSlideMax);
    }

    // Dash trigger (airborne only, once per airtime).
    const dashPressed = Phaser.Input.Keyboard.JustDown(this.keyDash) || Phaser.Input.Keyboard.JustDown(this.keyDashAlt);
    if (dashPressed && this.dashAvailable && !onGround) {
      this.dashDir = right ? 1 : left ? -1 : this.sprite.flipX ? -1 : 1;
      this.dashTimer = TUNING.dashDurationMs;
      this.dashAvailable = false;
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
      } else if (onWall) {
        const dir = onWallLeft ? 1 : -1; // push away from wall
        this.sprite.setVelocityX(dir * TUNING.wallJumpX);
        this.sprite.setVelocityY(-TUNING.wallJumpY);
        this.jumpsUsed = 1; // allow one air jump after a wall jump
        this.bufferTimer = 0;
      } else if (!onGround && this.jumpsUsed < 2 && this.jumpsUsed > 0) {
        this.sprite.setVelocityY(-TUNING.doubleJumpVelocity);
        this.jumpsUsed = 2;
        this.bufferTimer = 0;
      }
    }
    // Variable height: cut upward velocity on release.
    if (!jumpDown && this.jumpHeldLast && body.velocity.y < 0) {
      this.sprite.setVelocityY(body.velocity.y * TUNING.jumpCutMultiplier);
    }
    this.jumpHeldLast = jumpDown;
  }
}

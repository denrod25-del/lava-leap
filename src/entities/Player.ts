import Phaser from 'phaser';
import { TUNING } from '../tuning';

type Body = Phaser.Physics.Arcade.Body;

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private jumpHeldLast = false;
  private jumpsUsed = 0;
  private coyoteTimer = 0;
  private bufferTimer = 0;

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
  }

  update(): void {
    const dt = this.scene.game.loop.delta; // ms
    const body = this.sprite.body as Body;
    const left = this.cursors.left!.isDown || this.keyA.isDown;
    const right = this.cursors.right!.isDown || this.keyD.isDown;

    if (left && !right) this.sprite.setVelocityX(-TUNING.moveSpeed);
    else if (right && !left) this.sprite.setVelocityX(TUNING.moveSpeed);
    else this.sprite.setVelocityX(0);

    const jumpDown = this.cursors.up!.isDown || this.cursors.space!.isDown;
    const onGround = body.blocked.down || body.touching.down;

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

import Phaser from 'phaser';
import { TUNING, POWERUP } from '../tuning';
import { GameEvents } from '../core/events';
import { save } from '../main';
import { COSMETICS } from '../scenes/ShopScene';
import type { InputState } from '../core/InputState';
import { animKey, staticKey, isCharacter, DEFAULT_CHARACTER, type PlayerState } from '../core/characters';

type Body = Phaser.Physics.Arcade.Body;

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  private jumpHeldLast = false;
  private jumpsUsed = 0;
  private coyoteTimer = 0;
  private bufferTimer = 0;
  private dashTimer = 0;
  private dashAvailable = true;
  private dashDir = 1;
  private wasOnGround = true;
  private _wallSliding = false;
  /** Max jumps before landing (ground + air). 2 = double (keyboard); GameScene sets
   *  3 on touch devices for the triple jump (mobile is harder to climb). */
  maxJumps = 2;
  /** Fractional moveSpeed bonus from the Flow tier (GameScene wires this per-frame; stays 0 until then). */
  flowSpeedNudge = 0;
  /** AUTO control scheme: bounce off the ground automatically each landing. */
  autoJump = false;
  private charId = DEFAULT_CHARACTER;

  get wallSliding(): boolean { return this._wallSliding; }

  /** True while an air-dash is in progress. */
  get dashing(): boolean { return this.dashTimer > 0; }

  /** Dash i-frames: untouchable by enemies/boss projectiles while dashing.
   *  Lava is exempt — GameScene's lava check never consults this. */
  get invulnerable(): boolean { return this.dashTimer > 0; }

  /** Refresh the air-dash mid-air (coin grabs; stomp/bounce already refresh). */
  refreshDash(): void { this.dashAvailable = true; }

  /** Tiny upward kick on successful stomp, refreshes air abilities. */
  stompBounce(): void {
    this.sprite.setVelocityY(-TUNING.stompBounceVelocity);
    this.jumpsUsed = 0;
    this.refreshDash();
  }

  constructor(scene: Phaser.Scene, x: number, y: number, private events: GameEvents) {
    this.scene = scene;
    const charId = isCharacter(save.get().character) ? save.get().character : DEFAULT_CHARACTER;
    this.charId = charId;
    this.sprite = scene.physics.add.sprite(x, y, staticKey(charId));
    this.sprite.setCollideWorldBounds(false);
    // Source art is 48x48; display it a touch larger than the hitbox for presence.
    // The hitbox (playerBody*) is locked every frame in update so gameplay is unchanged.
    this.sprite.setDisplaySize(TUNING.playerDisplayW, TUNING.playerDisplayH);
    // Arcade body size is in source pixels and is scaled by the sprite, so a full
    // 48x48 source body becomes 24x32 in world space — matching the old placeholder.
    const body = this.sprite.body as Body;
    body.setSize(48, 48);
    body.setOffset(0, 0);

    // Apply equipped cosmetic tint.
    const equipped = COSMETICS.find((c) => c.id === save.get().equippedCosmetic);
    if (equipped && equipped.id !== 'default') this.sprite.setTint(equipped.tint);
  }

  update(input: InputState): void {
    const dt = this.scene.game.loop.delta; // ms
    const body = this.sprite.body as Body;

    // Visual squash/stretch tweens (JuiceController) change the sprite scale, and
    // Arcade derives the world body from source-size x scale. Re-derive the source
    // size from the live scale each frame so the world body stays exactly 24x32
    // no matter what the visuals do.
    const sx = Math.abs(this.sprite.scaleX) || 1;
    const sy = Math.abs(this.sprite.scaleY) || 1;
    const bw = TUNING.playerBodyW / sx, bh = TUNING.playerBodyH / sy;
    body.setSize(bw, bh);
    body.setOffset((this.sprite.width - bw) / 2, this.sprite.height - bh);

    // Capture velocity BEFORE any changes this frame (used for land impactVy).
    const vyAtFrameStart = body.velocity.y;

    // Reset wall-sliding flag before the dash early-return so it's always cleared.
    this._wallSliding = false;

    // Horizontal intent is a single run axis [-1,1]: keyboard sets ±1 from left/right,
    // the touch run-joystick sets analog values. Derive left/right booleans from its
    // sign so wall-slide, dash direction, and facing work the same for both sources.
    const runAxis = Phaser.Math.Clamp(input.runAxis, -1, 1);
    const left = runAxis < -0.2;
    const right = runAxis > 0.2;
    const jumpDown = input.jumpHeld;
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
      // Dash-jump cancel (the signature move): tapping jump mid-dash ends the dash
      // and converts it into a full-strength jump that KEEPS the dash's horizontal
      // speed. Consumes one jump from the air budget.
      // Full jumpVelocity (not the weaker doubleJumpVelocity) by design — the payoff of the move.
      const jumpEdge = (jumpDown && !this.jumpHeldLast) || input.jumpPressed;
      if (jumpEdge && this.jumpsUsed < this.maxJumps) {
        this.dashTimer = 0;
        body.setAllowGravity(true);
        this.sprite.setVelocityX(this.dashDir * TUNING.dashSpeed); // momentum carries (wall contact clamps it next physics step)
        this.sprite.setVelocityY(-TUNING.jumpVelocity);
        this.jumpsUsed = Math.min(this.maxJumps, this.jumpsUsed + 1);
        this.jumpHeldLast = jumpDown;
        this.events.emit('dashJumpCancel', {});
        return;
      } else if (jumpEdge) {
        // No jump slots left to cancel with — still arm the buffer so the press
        // lands after the dash ends (wall touch or landing frees a jump).
        this.bufferTimer = TUNING.jumpBufferMs;
      }
      this.dashTimer -= dt;
      this.sprite.setVelocityX(this.dashDir * TUNING.dashSpeed);
      this.sprite.setVelocityY(0);
      body.setAllowGravity(false);
      this.jumpHeldLast = jumpDown;
      return; // skip the rest while dashing
    }
    (body as Body).setAllowGravity(true);

    // Horizontal movement: run at runAxis × moveSpeed (analog on touch, ±1 on keyboard).
    // Facing tracks travel direction.
    this.sprite.setVelocityX(runAxis * TUNING.moveSpeed * (1 + this.flowSpeedNudge));
    if (runAxis < -0.05) this.sprite.setFlipX(true);
    else if (runAxis > 0.05) this.sprite.setFlipX(false);

    // Wall slide: cap downward speed when pressing into a wall.
    const pressingIntoWall = (onWallLeft && left) || (onWallRight && right);
    this._wallSliding = onWall && pressingIntoWall;
    if (this._wallSliding && body.velocity.y > TUNING.wallSlideMax) {
      this.sprite.setVelocityY(TUNING.wallSlideMax);
    }

    // Fast fall: dive while airborne and already descending. Wall-slide wins (its
    // speed cap runs above and the guard here skips while sliding).
    if (input.fastFall && !onGround && !this._wallSliding
        && body.velocity.y > 0 && body.velocity.y < TUNING.fastFallSpeed) {
      this.sprite.setVelocityY(TUNING.fastFallSpeed);
    }

    // Dash trigger (airborne only, once per airtime).
    const dashPressed = input.dashPressed;
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

    // Buffer a jump on a held rising-edge OR an explicit press pulse (touch taps send
    // jumpPressed without a sustained hold). Both are edge-triggered, so holding never
    // auto-repeats jumps.
    if ((jumpDown && !this.jumpHeldLast) || input.jumpPressed) this.bufferTimer = TUNING.jumpBufferMs;
    else this.bufferTimer = Math.max(0, this.bufferTimer - dt);

    // AUTO mode: bounce off the ground automatically. Full height by design —
    // there is no held key, so no variable-height cut applies. Emits 'jump' so
    // juice/audio/tutorial react exactly like a manual jump. Runs AFTER the
    // buffer-arm line above and zeroes the buffer, so a same-frame tap pulse
    // (e.g. a late dash-cancel tap) can't re-arm it into a free air jump next
    // frame — one tap, one action.
    if (this.autoJump && onGround) {
      this.sprite.setVelocityY(-TUNING.jumpVelocity);
      this.jumpsUsed = 1;
      this.coyoteTimer = 0;
      this.bufferTimer = 0;
      this.events.emit('jump', {});
    }

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
      } else if (!onGround && this.jumpsUsed >= 1 && this.jumpsUsed < this.maxJumps) {
        // Air jump(s): one for double (keyboard), two for triple (touch, maxJumps=3).
        this.sprite.setVelocityY(-TUNING.doubleJumpVelocity);
        this.jumpsUsed += 1;
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

  /** Rocket power-up: sustained upward boost each frame it's active, air abilities refreshed. */
  applyRocket(): void {
    this.sprite.setVelocityY(-POWERUP.rocketVelocity);
    this.jumpsUsed = 0;
    this.refreshDash();
  }

  /** Launch off a bounce pad: stronger than a jump, refreshes air abilities. */
  bounce(): void {
    this.sprite.setVelocityY(-TUNING.bouncePadVelocity);
    this.jumpsUsed = 0;
    this.refreshDash();
  }

  private pickAnimation(onGround: boolean, moving: boolean, vy: number): void {
    if (!this.scene.anims.exists(animKey(this.charId, 'run'))) return; // frames not built — static fallback
    let state: PlayerState;
    if (!onGround) state = vy < 0 ? 'jump' : 'fall';
    else if (moving) state = 'run';
    else state = 'idle';
    const key = animKey(this.charId, state);
    if (this.scene.anims.exists(key) && this.sprite.anims.getName() !== key) {
      this.sprite.anims.play(key, true);
    }
  }
}

import Phaser from 'phaser';
import { TUNING, POWERUP, LEDGE } from '../tuning';
import { GameEvents } from '../core/events';
import { save } from '../main';
import { COSMETICS } from '../scenes/ShopScene';
import type { InputState } from '../core/InputState';
import { findLedge, type LedgePlatform } from '../core/ledge';
import { animKey, staticKey, frameKey, isCharacter, CLIMBER_CHARACTER, DEFAULT_CHARACTER, DEFAULT_MOVEMENT, type MovementProfile, type PlayerState } from '../core/characters';

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
  private hanging = false;
  private hangTimer = 0;
  private hangSide: 'left' | 'right' = 'left';
  private regrabTimer = 0;
  private actionAnimUntil = 0;
  private actionAnimState: PlayerState | null = null;
  maxJumps = 2;
  flowSpeedNudge = 0;
  autoJump = false;
  private charId = DEFAULT_CHARACTER;

  get wallSliding(): boolean { return this._wallSliding; }
  get dashing(): boolean { return this.dashTimer > 0; }
  get invulnerable(): boolean { return this.dashTimer > 0; }
  refreshDash(): void { this.dashAvailable = true; }

  clearHang(): void {
    if (!this.hanging) return;
    this.hanging = false;
    this.regrabTimer = LEDGE.regrabCooldownMs;
    (this.sprite.body as Body).setAllowGravity(true);
  }

  stompBounce(): void {
    this.sprite.setVelocityY(-TUNING.stompBounceVelocity);
    this.jumpsUsed = 0;
    this.refreshDash();
  }

  constructor(scene: Phaser.Scene, x: number, y: number, private events: GameEvents,
              private profile: Readonly<MovementProfile> = DEFAULT_MOVEMENT) {
    this.maxJumps = this.profile.maxJumps;
    this.scene = scene;
    const charId = isCharacter(save.get().character) ? save.get().character : DEFAULT_CHARACTER;
    this.charId = charId;
    this.sprite = charId === CLIMBER_CHARACTER
      ? scene.physics.add.sprite(x, y, 'climber-sheet', 0)
      : scene.physics.add.sprite(x, y, staticKey(charId));
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setDisplaySize(TUNING.playerDisplayW, TUNING.playerDisplayH);
    const body = this.sprite.body as Body;
    const sx = Math.abs(this.sprite.scaleX) || 1;
    const sy = Math.abs(this.sprite.scaleY) || 1;
    const bw = TUNING.playerBodyW / sx, bh = TUNING.playerBodyH / sy;
    body.setSize(bw, bh);
    body.setOffset((this.sprite.width - bw) / 2, this.sprite.height - bh);

    const equipped = COSMETICS.find((c) => c.id === save.get().equippedCosmetic);
    if (equipped && equipped.id !== 'default') this.sprite.setTint(equipped.tint);
  }

  update(input: InputState, platforms: ReadonlyArray<LedgePlatform> = []): void {
    const dt = this.scene.game.loop.delta;
    const body = this.sprite.body as Body;

    const sx = Math.abs(this.sprite.scaleX) || 1;
    const sy = Math.abs(this.sprite.scaleY) || 1;
    const bw = TUNING.playerBodyW / sx, bh = TUNING.playerBodyH / sy;
    body.setSize(bw, bh);
    body.setOffset((this.sprite.width - bw) / 2, this.sprite.height - bh);

    const vyAtFrameStart = body.velocity.y;
    this._wallSliding = false;

    const runAxis = Phaser.Math.Clamp(input.runAxis, -1, 1);
    const left = runAxis < -0.2;
    const right = runAxis > 0.2;
    const jumpDown = input.jumpHeld;
    const onGround = body.blocked.down || body.touching.down;

    if (onGround && !this.wasOnGround) {
      this.events.emit('land', { impactVy: vyAtFrameStart });
      this.playTransient('land', 260);
    }
    this.wasOnGround = onGround;

    const onWallLeft = body.blocked.left || body.touching.left;
    const onWallRight = body.blocked.right || body.touching.right;
    const onWall = (onWallLeft || onWallRight) && !onGround;

    if (onGround || onWall) this.dashAvailable = true;

    if (this.hanging) {
      this.hangTimer -= dt;
      const jumpEdge = (jumpDown && !this.jumpHeldLast) || input.jumpPressed;
      const steerAway = (this.hangSide === 'left' && left) || (this.hangSide === 'right' && right);
      const autoVault = this.autoJump && this.hangTimer <= LEDGE.hangMaxMs - LEDGE.autoVaultDelayMs;
      if (jumpEdge || autoVault) {
        this.hanging = false;
        this.regrabTimer = LEDGE.regrabCooldownMs;
        body.setAllowGravity(true);
        this.sprite.setVelocityY(-LEDGE.vaultVelocity);
        this.jumpsUsed = 0;
        this.events.emit('ledgeVault', { x: this.sprite.x, y: this.sprite.y });
      } else if (steerAway || input.fastFall || this.hangTimer <= 0) {
        this.hanging = false;
        this.regrabTimer = LEDGE.regrabCooldownMs;
        body.setAllowGravity(true);
      } else {
        body.setVelocity(0, 0);
        this.playState('climb');
      }
      this.jumpHeldLast = jumpDown;
      return;
    }
    this.regrabTimer = Math.max(0, this.regrabTimer - dt);

    if (this.dashTimer > 0) {
      this.playState('dash');
      const jumpEdge = (jumpDown && !this.jumpHeldLast) || input.jumpPressed;
      if (jumpEdge && this.jumpsUsed < this.maxJumps) {
        this.dashTimer = 0;
        body.setAllowGravity(true);
        this.sprite.setVelocityX(this.dashDir * TUNING.dashSpeed);
        this.sprite.setVelocityY(-this.profile.jumpVelocity);
        this.jumpsUsed = Math.min(this.maxJumps, this.jumpsUsed + 1);
        this.jumpHeldLast = jumpDown;
        this.events.emit('dashJumpCancel', {});
        this.playTransient('jump', 220);
        return;
      } else if (jumpEdge) {
        this.bufferTimer = TUNING.jumpBufferMs;
      }
      this.dashTimer -= dt;
      this.sprite.setVelocityX(this.dashDir * TUNING.dashSpeed);
      this.sprite.setVelocityY(0);
      body.setAllowGravity(false);
      this.jumpHeldLast = jumpDown;
      return;
    }
    body.setAllowGravity(true);

    this.sprite.setVelocityX(runAxis * TUNING.moveSpeed * (1 + this.flowSpeedNudge));
    if (runAxis < -0.05) this.sprite.setFlipX(true);
    else if (runAxis > 0.05) this.sprite.setFlipX(false);

    const pressingIntoWall = (onWallLeft && left) || (onWallRight && right);
    this._wallSliding = onWall && pressingIntoWall;
    if (this._wallSliding && body.velocity.y > TUNING.wallSlideMax) {
      this.sprite.setVelocityY(TUNING.wallSlideMax);
    }

    if (input.fastFall && !onGround && !this._wallSliding
        && body.velocity.y > 0 && body.velocity.y < TUNING.fastFallSpeed) {
      this.sprite.setVelocityY(TUNING.fastFallSpeed);
    }

    if (this.profile.ledgeGrab && !onGround && !this._wallSliding
        && body.velocity.y > 0 && this.regrabTimer <= 0) {
      const steer: -1 | 0 | 1 = right ? 1 : left ? -1 : 0;
      const cand = steer === 0 ? null : findLedge(
        { x: body.x, y: body.y, width: body.width, height: body.height, vy: body.velocity.y },
        steer, platforms,
      );
      if (cand) {
        this.hanging = true;
        this.hangSide = cand.side;
        this.hangTimer = LEDGE.hangMaxMs;
        body.reset(
          cand.snapX + TUNING.playerBodyW / 2,
          cand.snapY + TUNING.playerBodyH - TUNING.playerDisplayH / 2,
        );
        body.setVelocity(0, 0);
        body.setAllowGravity(false);
        this.sprite.setFlipX(cand.side === 'right');
        this.sprite.anims.stop();
        if (this.charId === CLIMBER_CHARACTER) this.sprite.setTexture('climber-sheet', 38);
        else this.sprite.setTexture(frameKey(this.charId, 'jump-2'));
        this.events.emit('ledgeGrab', { x: this.sprite.x, y: this.sprite.y });
        this.jumpHeldLast = jumpDown;
        return;
      }
    }

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

    if ((jumpDown && !this.jumpHeldLast) || input.jumpPressed) this.bufferTimer = TUNING.jumpBufferMs;
    else this.bufferTimer = Math.max(0, this.bufferTimer - dt);

    if (this.autoJump && onGround) {
      this.sprite.setVelocityY(-this.profile.jumpVelocity);
      this.jumpsUsed = 1;
      this.coyoteTimer = 0;
      this.bufferTimer = 0;
      this.events.emit('jump', {});
    }

    const canGroundJump = this.coyoteTimer > 0 && this.jumpsUsed === 0;
    if (this.bufferTimer > 0) {
      if (canGroundJump) {
        this.sprite.setVelocityY(-this.profile.jumpVelocity);
        this.jumpsUsed = 1;
        this.bufferTimer = 0;
        this.coyoteTimer = 0;
        this.events.emit('jump', {});
      } else if (onWall) {
        const dir = onWallLeft ? 1 : -1;
        this.sprite.setVelocityX(dir * TUNING.wallJumpX);
        this.sprite.setVelocityY(-TUNING.wallJumpY);
        this.jumpsUsed = 1;
        this.bufferTimer = 0;
        this.events.emit('wallJump', {});
        this.playTransient('wall_jump', 360);
      } else if (!onGround && this.jumpsUsed >= 1 && this.jumpsUsed < this.maxJumps) {
        this.sprite.setVelocityY(-this.profile.airJumpVelocity);
        this.jumpsUsed += 1;
        this.bufferTimer = 0;
        this.events.emit('doubleJump', {});
        this.playTransient('double_jump', 360);
      }
    }
    if (!jumpDown && this.jumpHeldLast && body.velocity.y < 0) {
      this.sprite.setVelocityY(body.velocity.y * TUNING.jumpCutMultiplier);
    }
    this.jumpHeldLast = jumpDown;

    this.pickAnimation(onGround, left || right, body.velocity.y);
  }

  applyRocket(): void {
    this.sprite.setVelocityY(-POWERUP.rocketVelocity);
    this.jumpsUsed = 0;
    this.refreshDash();
  }

  bounce(): void {
    this.sprite.setVelocityY(-TUNING.bouncePadVelocity);
    this.jumpsUsed = 0;
    this.refreshDash();
  }

  private playTransient(state: PlayerState, durationMs: number): void {
    if (this.charId !== CLIMBER_CHARACTER || !this.scene.anims.exists(animKey(this.charId, state))) return;
    this.actionAnimState = state;
    this.actionAnimUntil = this.scene.time.now + durationMs;
    this.playState(state);
  }

  private playState(state: PlayerState): void {
    const key = animKey(this.charId, state);
    if (this.scene.anims.exists(key)
        && (this.sprite.anims.getName() !== key || !this.sprite.anims.isPlaying)) {
      this.sprite.anims.play(key, true);
    }
  }

  private pickAnimation(onGround: boolean, moving: boolean, vy: number): void {
    if (!this.scene.anims.exists(animKey(this.charId, 'run'))) return;
    if (this.charId === CLIMBER_CHARACTER) {
      if (this.actionAnimState && this.scene.time.now < this.actionAnimUntil) {
        this.playState(this.actionAnimState);
        return;
      }
      this.actionAnimState = null;
      if (this._wallSliding) {
        this.playState('wall_slide');
        return;
      }
    }
    let state: PlayerState;
    if (!onGround) state = vy < 0 ? 'jump' : 'fall';
    else if (moving) state = 'run';
    else state = 'idle';
    this.playState(state);
  }
}

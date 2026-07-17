import Phaser from 'phaser';
import { TUNING, POWERUP, LEDGE } from '../tuning';
import { GameEvents } from '../core/events';
import { save } from '../main';
import { COSMETICS } from '../scenes/ShopScene';
import type { InputState } from '../core/InputState';
import { findLedge, type LedgePlatform } from '../core/ledge';
import { animKey, staticKey, frameKey, isCharacter, DEFAULT_CHARACTER, DEFAULT_MOVEMENT, type MovementProfile, type PlayerState } from '../core/characters';

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
  /** Max jumps before landing (ground + air). Seeded from the movement profile
   *  (2 = double for the standard kit). GameScene then raises it to 3 on touch
   *  devices for the triple jump (mobile is harder to climb) — a movement profile
   *  can also set it higher (e.g. Kiko's 3 everywhere). */
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

  /** Abort any ledge hang (e.g. the revive teleport): restore gravity so the
   *  player can't stay frozen mid-air at the revive point. */
  clearHang(): void {
    if (!this.hanging) return;
    this.hanging = false;
    this.regrabTimer = LEDGE.regrabCooldownMs;
    (this.sprite.body as Body).setAllowGravity(true);
  }

  /** Tiny upward kick on successful stomp, refreshes air abilities. */
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

  update(input: InputState, platforms: ReadonlyArray<LedgePlatform> = []): void {
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

    // Ledge hang (movement-profile characters): frozen on a platform edge.
    // Mirrors the dash block's early-return pattern.
    if (this.hanging) {
      this.hangTimer -= dt;
      const jumpEdge = (jumpDown && !this.jumpHeldLast) || input.jumpPressed;
      const steerAway = (this.hangSide === 'left' && left) || (this.hangSide === 'right' && right);
      const autoVault = this.autoJump && this.hangTimer <= LEDGE.hangMaxMs - LEDGE.autoVaultDelayMs;
      if (jumpEdge || autoVault) {
        // Vault: the headline move — strong upward impulse and a FULL air-jump refund.
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
      }
      this.jumpHeldLast = jumpDown;
      return;
    }
    this.regrabTimer = Math.max(0, this.regrabTimer - dt);

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
        this.sprite.setVelocityY(-this.profile.jumpVelocity);
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

    // Ledge grab entry (profile-gated): catch a static platform's top corner while
    // falling toward it. Skipped while wall-sliding (that mechanic wins on contact).
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
        // body.reset takes the GAME OBJECT position (sprite center). The body is
        // horizontally centered and bottom-anchored on the sprite, so:
        //   spriteCenterX = bodyTopLeftX + bodyW/2
        //   spriteCenterY = bodyTopLeftY + bodyH - displayH/2
        body.reset(
          cand.snapX + TUNING.playerBodyW / 2,
          cand.snapY + TUNING.playerBodyH - TUNING.playerDisplayH / 2,
        );
        body.setVelocity(0, 0);
        body.setAllowGravity(false);
        this.sprite.setFlipX(cand.side === 'right'); // face the platform
        this.sprite.anims.stop();
        this.sprite.setTexture(frameKey(this.charId, 'jump-2')); // hang pose = mid-air frame
        this.events.emit('ledgeGrab', { x: this.sprite.x, y: this.sprite.y });
        this.jumpHeldLast = jumpDown;
        return;
      }
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
        const dir = onWallLeft ? 1 : -1; // push away from wall
        this.sprite.setVelocityX(dir * TUNING.wallJumpX);
        this.sprite.setVelocityY(-TUNING.wallJumpY);
        this.jumpsUsed = 1; // allow one air jump after a wall jump
        this.bufferTimer = 0;
        this.events.emit('wallJump', {});
      } else if (!onGround && this.jumpsUsed >= 1 && this.jumpsUsed < this.maxJumps) {
        // Air jump(s): one for double (keyboard), two for triple (touch, maxJumps=3).
        this.sprite.setVelocityY(-this.profile.airJumpVelocity);
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
    // Also re-play when nothing is running: a ledge hang stops anims but leaves
    // currentAnim set, so the name check alone would leave the static hang pose
    // stuck through a post-drop fall.
    if (this.scene.anims.exists(key)
        && (this.sprite.anims.getName() !== key || !this.sprite.anims.isPlaying)) {
      this.sprite.anims.play(key, true);
    }
  }
}

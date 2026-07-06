import Phaser from 'phaser';
import type { InputSource, InputState } from '../../core/InputState';
import { emptyInput } from '../../core/InputState';
import { TUNING, AUTO } from '../../tuning';
import { steerAxis } from '../../core/autoSteer';

/**
 * One-handed AUTO mobile controls. Jumping is automatic (Player.autoJump). Hold
 * anywhere to steer toward your finger; a quick TAP (short press, little drift)
 * air-dashes — or, if released mid-dash, converts into the dash-jump launch.
 * The first held pointer is the steer pointer; ANY pointer that ends as a tap
 * queues the action, so you can hold-steer with one thumb and tap with the other.
 * Taps resolve on pointerUP: pointerdown is ambiguous (every steer-hold starts
 * with one), so a down-triggered dash would fire on every steer touch.
 */
export class AutoTouchInput implements InputSource {
  private steerPointerId: number | null = null;
  private steerX = 0;         // latest finger x while steering
  private steering = false;
  private dashQueued = false;
  private jumpQueued = false; // mid-dash cancel taps route here
  private pauseQueued = false;
  private downAt = new Map<number, { t: number; x: number; y: number }>();

  constructor(
    scene: Phaser.Scene,
    private getPlayerX: () => number,
    private isDashing: () => boolean,
  ) {
    const w = TUNING.width;

    // Phaser tracks one touch pointer by default; allow steer-hold + taps together.
    scene.input.addPointer(3);

    // Pause button (top-right) — same placement as the manual scheme. No DASH
    // button and no joystick graphics in auto mode: the whole screen is the control.
    const pause = scene.add.rectangle(w - 44, 8, 36, 36, 0xffffff, 0.12)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(62).setInteractive();
    scene.add.text(w - 26, 26, '⏸', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(63);
    pause.on('pointerdown', () => { this.pauseQueued = true; });

    scene.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.includes(pause)) return;
      this.downAt.set(p.id, { t: p.downTime, x: p.x, y: p.y });
      if (this.steerPointerId === null) {
        this.steerPointerId = p.id;
        this.steering = true;
        this.steerX = p.x;
      }
    });

    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id === this.steerPointerId) this.steerX = p.x;
    });

    const release = (p: Phaser.Input.Pointer): void => {
      const d = this.downAt.get(p.id);
      this.downAt.delete(p.id);
      if (p.id === this.steerPointerId) {
        this.steerPointerId = null;
        this.steering = false;
      }
      // Tap = short press with little drift → dash, or the launch if mid-dash.
      if (d && (p.upTime - d.t) <= AUTO.tapMaxMs
          && Phaser.Math.Distance.Between(d.x, d.y, p.x, p.y) <= AUTO.tapMaxDrift) {
        if (this.isDashing()) this.jumpQueued = true;
        else this.dashQueued = true;
      }
    };
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', release);
  }

  sample(): InputState {
    const s: InputState = {
      ...emptyInput(),
      runAxis: this.steering
        ? steerAxis(this.steerX, this.getPlayerX(), AUTO.steerRange, AUTO.steerDeadzone)
        : 0,
      jumpPressed: this.jumpQueued,
      dashPressed: this.dashQueued,
      pausePressed: this.pauseQueued,
    };
    this.jumpQueued = false; this.dashQueued = false; this.pauseQueued = false;
    return s;
  }
}

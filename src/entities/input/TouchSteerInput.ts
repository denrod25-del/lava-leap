import Phaser from 'phaser';
import type { InputSource, InputState } from '../../core/InputState';
import { emptyInput } from '../../core/InputState';
import { TUNING, TOUCH } from '../../tuning';

/**
 * Two-thumb mobile controls. LEFT half = a floating run joystick: press and hold to
 * spawn it under your thumb, slide left/right to set runAxis (analog). RIGHT half = tap
 * to jump (hold = higher, repeat taps in the air = double/triple). DASH (bottom-right)
 * and ⏸ (top-right) are separate buttons. Run and jump use independent pointers, so you
 * can run and jump at the same time.
 */
export class TouchSteerInput implements InputSource {
  private runAxis = 0;
  private runPointerId: number | null = null;
  private originX = 0;
  private jumpHeld = false;
  private jumpPointerId: number | null = null;
  private jumpQueued = false;
  private dashQueued = false;
  private pauseQueued = false;
  private base: Phaser.GameObjects.Arc;
  private knob: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene) {
    const w = TUNING.width, h = TUNING.height;

    // DASH button (bottom-right) + pause (top-right) — created first so they sit on top.
    const dash = scene.add.rectangle(w - 84, h - 84, 72, 72, 0x66ddff, 0.18)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(62).setInteractive();
    scene.add.text(w - 48, h - 48, 'DASH', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(63).setAlpha(0.6);
    dash.on('pointerdown', () => { this.dashQueued = true; });

    const pause = scene.add.rectangle(w - 44, 8, 36, 36, 0xffffff, 0.12)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(62).setInteractive();
    scene.add.text(w - 26, 26, '⏸', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(63);
    pause.on('pointerdown', () => { this.pauseQueued = true; });

    // Floating joystick graphics (hidden until the left side is touched).
    this.base = scene.add.circle(0, 0, 40, 0xffffff, 0.10).setScrollFactor(0).setDepth(60).setVisible(false);
    this.knob = scene.add.circle(0, 0, 18, 0x16e0e0, 0.40).setScrollFactor(0).setDepth(61).setVisible(false);

    const onButton = (over: Phaser.GameObjects.GameObject[]): boolean => over.includes(dash) || over.includes(pause);

    scene.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (onButton(over)) return;
      if (p.x < w / 2) {
        // Left half: spawn / anchor the run joystick (first finger only).
        if (this.runPointerId === null) {
          this.runPointerId = p.id;
          this.originX = p.x;
          this.runAxis = 0;
          this.base.setPosition(p.x, p.y).setVisible(true);
          this.knob.setPosition(p.x, p.y).setVisible(true);
        }
      } else {
        // Right half: jump (and double/triple via repeat taps).
        this.jumpQueued = true;
        if (this.jumpPointerId === null) { this.jumpPointerId = p.id; this.jumpHeld = true; }
      }
    });

    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id !== this.runPointerId) return;
      const dx = Phaser.Math.Clamp(p.x - this.originX, -TOUCH.joystickRange, TOUCH.joystickRange);
      this.runAxis = Math.abs(dx) < TOUCH.joystickDeadzone ? 0 : dx / TOUCH.joystickRange;
      this.knob.setPosition(this.originX + dx, this.base.y);
    });

    const release = (p: Phaser.Input.Pointer): void => {
      if (p.id === this.runPointerId) {
        this.runPointerId = null;
        this.runAxis = 0;
        this.base.setVisible(false);
        this.knob.setVisible(false);
      }
      if (p.id === this.jumpPointerId) {
        this.jumpPointerId = null;
        this.jumpHeld = false;
      }
    };
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', release);
  }

  sample(): InputState {
    const s: InputState = {
      ...emptyInput(),
      runAxis: this.runAxis,
      jumpHeld: this.jumpHeld,
      jumpPressed: this.jumpQueued,
      dashPressed: this.dashQueued,
      pausePressed: this.pauseQueued,
    };
    this.jumpQueued = false; this.dashQueued = false; this.pauseQueued = false;
    return s;
  }
}

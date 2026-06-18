import Phaser from 'phaser';
import type { InputSource, InputState } from '../../core/InputState';
import { emptyInput } from '../../core/InputState';
import { TUNING } from '../../tuning';

/** Mobile autopilot input: drag anywhere to steer (player follows finger x); a DASH
 *  button (bottom-right) and a ⏸ pause button (top-right). Replaces the v3 d-pad. */
export class TouchSteerInput implements InputSource {
  private steerX: number | null = null;
  private steerPointerId: number | null = null;
  private dashQueued = false;
  private pauseQueued = false;

  constructor(scene: Phaser.Scene) {
    const w = TUNING.width, h = TUNING.height;

    // DASH button (bottom-right) — created first so it sits on top of the steer surface.
    const dash = scene.add.rectangle(w - 84, h - 84, 72, 72, 0x66ddff, 0.18)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(62).setInteractive();
    scene.add.text(w - 48, h - 48, 'DASH', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(63).setAlpha(0.6);
    dash.on('pointerdown', () => { this.dashQueued = true; });

    // Pause button (top-right).
    const pause = scene.add.rectangle(w - 44, 8, 36, 36, 0xffffff, 0.12)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(62).setInteractive();
    scene.add.text(w - 26, 26, '⏸', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(63);
    pause.on('pointerdown', () => { this.pauseQueued = true; });

    // Steer surface: the whole canvas. Track the first pointer that ISN'T on a button.
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.includes(dash) || over.includes(pause)) return;
      if (this.steerPointerId === null) { this.steerPointerId = p.id; this.steerX = p.worldX; }
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id === this.steerPointerId) this.steerX = p.worldX;
    });
    const release = (p: Phaser.Input.Pointer): void => {
      if (p.id === this.steerPointerId) { this.steerPointerId = null; this.steerX = null; }
    };
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', release);
  }

  sample(): InputState {
    const s: InputState = { ...emptyInput(), steerX: this.steerX, dashPressed: this.dashQueued, pausePressed: this.pauseQueued };
    this.dashQueued = false; this.pauseQueued = false;
    return s;
  }
}

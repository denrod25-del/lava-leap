import Phaser from 'phaser';
import type { InputSource, InputState } from '../../core/InputState';
import { emptyInput } from '../../core/InputState';
import { TUNING } from '../../tuning';

/** Mobile input: TAP ANYWHERE to jump, DRAG to steer (player follows finger x). Hold a
 *  tap for a higher jump; a second tap in the air double-jumps. A DASH button (bottom-
 *  right) and a ⏸ pause button (top-right) sit on top of the play surface. */
export class TouchSteerInput implements InputSource {
  private steerX: number | null = null;
  private steerPointerId: number | null = null;
  private jumpHeld = false;
  private jumpQueued = false;
  private dashQueued = false;
  private pauseQueued = false;

  constructor(scene: Phaser.Scene) {
    const w = TUNING.width, h = TUNING.height;

    // DASH button (bottom-right) — created first so it sits above the play surface.
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

    // Play surface: the whole canvas (minus the buttons). Every touch jumps; the first
    // active touch also steers (player eases toward its x) and holding it = higher jump.
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.includes(dash) || over.includes(pause)) return;
      this.jumpQueued = true;                 // tap -> jump (and double-jump in the air)
      if (this.steerPointerId === null) {
        this.steerPointerId = p.id;
        this.steerX = p.worldX;
        this.jumpHeld = true;                  // held -> full jump height + steering
      }
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id === this.steerPointerId) this.steerX = p.worldX;
    });
    const release = (p: Phaser.Input.Pointer): void => {
      if (p.id === this.steerPointerId) {
        this.steerPointerId = null;
        this.steerX = null;
        this.jumpHeld = false;                 // release -> cut height (short hop), stop steering
      }
    };
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', release);
  }

  sample(): InputState {
    const s: InputState = {
      ...emptyInput(),
      steerX: this.steerX,
      jumpHeld: this.jumpHeld,
      jumpPressed: this.jumpQueued,
      dashPressed: this.dashQueued,
      pausePressed: this.pauseQueued,
    };
    this.jumpQueued = false; this.dashQueued = false; this.pauseQueued = false;
    return s;
  }
}

import Phaser from 'phaser';
import type { InputSource, InputState } from '../../core/InputState';

/** Reads the keyboard into an InputState. Arrow/WASD move, Up/Space jump,
 *  Shift/X dash, P pause. Edge-triggered actions use Phaser's JustDown. */
export class KeyboardInput implements InputSource {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyDash: Phaser.Input.Keyboard.Key;
  private keyDashAlt: Phaser.Input.Keyboard.Key;
  private keyP: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyDash = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyDashAlt = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyP = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);
  }

  sample(): InputState {
    const left = this.cursors.left!.isDown || this.keyA.isDown;
    const right = this.cursors.right!.isDown || this.keyD.isDown;
    const jumpHeld = this.cursors.up!.isDown || this.cursors.space!.isDown;
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up!) || Phaser.Input.Keyboard.JustDown(this.cursors.space!);
    const dashPressed =
      Phaser.Input.Keyboard.JustDown(this.keyDash) || Phaser.Input.Keyboard.JustDown(this.keyDashAlt);
    const pausePressed = Phaser.Input.Keyboard.JustDown(this.keyP);
    const runAxis = (right ? 1 : 0) - (left ? 1 : 0);
    return { left, right, jumpHeld, jumpPressed, dashPressed, pausePressed, runAxis };
  }
}

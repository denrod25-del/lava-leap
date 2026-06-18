import Phaser from 'phaser';
import type { InputSource, InputState } from '../../core/InputState';
import { emptyInput } from '../../core/InputState';
import { TUNING } from '../../tuning';

/** On-screen touch controls: hold left/right thirds to move, tap center to jump,
 *  dash button (bottom-right), pause button (top-right). Renders into the scene. */
export class TouchInput implements InputSource {
  private state: InputState = emptyInput();
  private jumpQueued = false;
  private dashQueued = false;
  private pauseQueued = false;

  /** Draw a translucent labelled button rectangle and return its interactive zone. */
  private button(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    fontSize = 12,
  ): Phaser.GameObjects.Rectangle {
    const rect = scene.add.rectangle(x, y, w, h, color, 0.15)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(62).setInteractive();
    scene.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: 'monospace', fontSize: `${fontSize}px`, color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(63).setAlpha(0.6);
    return rect;
  }

  constructor(scene: Phaser.Scene) {
    const w = TUNING.width, h = TUNING.height;

    // Move zones (lower half, left & right thirds); jump zone is the center third.
    const moveY = h * 0.55, moveH = h * 0.45;
    const leftZone = scene.add.rectangle(0, moveY, w / 3, moveH, 0xffffff, 0.06)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(60).setInteractive();
    const rightZone = scene.add.rectangle((2 * w) / 3, moveY, w / 3, moveH, 0xffffff, 0.06)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(60).setInteractive();
    const jumpZone = scene.add.rectangle(w / 3, moveY, w / 3, moveH, 0xffffff, 0.04)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(60).setInteractive();

    leftZone.on('pointerdown', () => { this.state.left = true; });
    leftZone.on('pointerup', () => { this.state.left = false; });
    leftZone.on('pointerout', () => { this.state.left = false; });
    rightZone.on('pointerdown', () => { this.state.right = true; });
    rightZone.on('pointerup', () => { this.state.right = false; });
    rightZone.on('pointerout', () => { this.state.right = false; });
    jumpZone.on('pointerdown', () => { this.state.jumpHeld = true; this.jumpQueued = true; });
    jumpZone.on('pointerup', () => { this.state.jumpHeld = false; });
    jumpZone.on('pointerout', () => { this.state.jumpHeld = false; });

    // Faint hint labels on the move/jump zones.
    scene.add.text(w / 6, moveY + moveH / 2, '◀', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61).setAlpha(0.25);
    scene.add.text((5 * w) / 6, moveY + moveH / 2, '▶', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61).setAlpha(0.25);
    scene.add.text(w / 2, moveY + moveH / 2, 'JUMP', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61).setAlpha(0.25);

    // Dash button (bottom-right).
    const dashBtn = this.button(scene, w - 84, h - 84, 72, 72, 'DASH', 0x66ddff);
    dashBtn.on('pointerdown', () => { this.dashQueued = true; });

    // Pause button (top-right).
    const pauseBtn = this.button(scene, w - 44, 8, 36, 36, '⏸', 0xffffff, 16);
    pauseBtn.on('pointerdown', () => { this.pauseQueued = true; });
  }

  sample(): InputState {
    const s: InputState = {
      left: this.state.left, right: this.state.right, jumpHeld: this.state.jumpHeld,
      jumpPressed: this.jumpQueued, dashPressed: this.dashQueued, pausePressed: this.pauseQueued,
      steerX: null,
    };
    this.jumpQueued = false; this.dashQueued = false; this.pauseQueued = false;
    return s;
  }
}

import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { GameEvents } from '../core/events';
import type { InputState } from '../core/InputState';

interface Step { text: string; done: () => boolean; holdMs: number }

/** First-run hint sequence. Non-blocking: each hint dismisses when its action is
 *  performed OR after holdMs (never traps the player). Calls onDone after the last
 *  hint fades so the caller can persist tutorialDone. */
export class TutorialOverlay {
  private label: Phaser.GameObjects.Text;
  private steps: Step[];
  private idx = 0;
  private elapsed = 0;
  private finished = false;
  private jumped = false;
  private airJumped = false;
  private moved = false;
  private dashed = false;
  private cancelled = false;
  private offs: Array<() => void> = [];

  constructor(private scene: Phaser.Scene, events: GameEvents, isTouch: boolean, private onDone: () => void) {
    this.offs.push(events.on('jump', () => { this.jumped = true; }));
    this.offs.push(events.on('doubleJump', () => { this.airJumped = true; }));
    this.offs.push(events.on('dash', () => { this.dashed = true; }));
    this.offs.push(events.on('dashJumpCancel', () => { this.cancelled = true; }));

    this.steps = isTouch ? [
      { text: 'HOLD THE LEFT SIDE — slide to run', done: () => this.moved, holdMs: 6000 },
      { text: 'TAP THE RIGHT SIDE to jump', done: () => this.jumped, holdMs: 6000 },
      { text: 'TAP AGAIN IN THE AIR — double & triple jump!', done: () => this.airJumped, holdMs: 6000 },
      { text: 'TAP DASH in the air — dash through enemies!', done: () => this.dashed, holdMs: 6000 },
      { text: 'TAP JUMP mid-dash to LAUNCH — build your FLOW!', done: () => this.cancelled, holdMs: 6000 },
      { text: '⚠ THE LAVA RISES — CLIMB!', done: () => false, holdMs: 4000 },
    ] : [
      { text: '←/→ or A/D to run', done: () => this.moved, holdMs: 6000 },
      { text: 'SPACE or ↑ to jump (hold = higher)', done: () => this.jumped, holdMs: 6000 },
      { text: 'JUMP AGAIN IN THE AIR — double jump!', done: () => this.airJumped, holdMs: 6000 },
      { text: 'SHIFT or X in the air — DASH through enemies!', done: () => this.dashed, holdMs: 6000 },
      { text: 'JUMP mid-dash to LAUNCH — build your FLOW!', done: () => this.cancelled, holdMs: 6000 },
      { text: '⚠ THE LAVA RISES — CLIMB!', done: () => false, holdMs: 4000 },
    ];

    this.label = scene.add.text(TUNING.width / 2, 120, this.steps[0].text, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
      backgroundColor: '#1a0906', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(70).setAlpha(0);
    scene.tweens.add({ targets: this.label, alpha: 1, duration: 250 });
  }

  /** Call each frame with the sampled input. */
  update(input: InputState, dtMs: number): void {
    if (this.finished) return;
    if (input.runAxis !== 0) this.moved = true;
    const step = this.steps[this.idx];
    this.elapsed += dtMs;
    if (step.done() || this.elapsed >= step.holdMs) this.advance();
  }

  private advance(): void {
    this.idx += 1;
    this.elapsed = 0;
    if (this.idx >= this.steps.length) {
      this.finished = true;
      this.scene.tweens.add({
        targets: this.label, alpha: 0, duration: 400,
        onComplete: () => this.label.destroy(),
      });
      for (const off of this.offs) off();
      this.onDone();
      return;
    }
    this.label.setText(this.steps[this.idx].text);
    this.label.setAlpha(0);
    this.scene.tweens.add({ targets: this.label, alpha: 1, duration: 250 });
  }
}

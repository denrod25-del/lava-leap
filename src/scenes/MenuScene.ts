import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { loadHighScore } from '../core/ScoreTracker';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create(): void {
    const cx = TUNING.width / 2;
    this.add.text(cx, 180, 'LAVA LEAP', { fontFamily: 'monospace', fontSize: '48px', color: '#ff7b00' }).setOrigin(0.5);
    const hi = loadHighScore(window.localStorage);
    this.add.text(cx, 260, `High Score: ${hi}`, { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(cx, 420, 'Press SPACE to climb', { fontFamily: 'monospace', fontSize: '22px', color: '#16e0e0' }).setOrigin(0.5);
    this.input.keyboard!.once('keydown-SPACE', () => this.scene.start('Game'));
  }
}

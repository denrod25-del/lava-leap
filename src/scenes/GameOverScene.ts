import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  create(data: { score: number }): void {
    const cx = TUNING.width / 2;
    this.add.text(cx, 200, 'YOU MELTED', { fontFamily: 'monospace', fontSize: '40px', color: '#ff2d6b' }).setOrigin(0.5);
    this.add.text(cx, 280, `Score: ${data.score ?? 0}`, { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(cx, 320, `Best: ${save.get().highScore}`, { fontFamily: 'monospace', fontSize: '20px', color: '#ffd166' }).setOrigin(0.5);
    this.add.text(cx, 460, 'Press SPACE to retry', { fontFamily: 'monospace', fontSize: '20px', color: '#16e0e0' }).setOrigin(0.5);
    this.input.keyboard!.once('keydown-SPACE', () => this.scene.start('Game'));
  }
}

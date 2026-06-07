import Phaser from 'phaser';
import { TUNING } from '../tuning';

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }
  create(): void {
    this.add.text(TUNING.width / 2, TUNING.height / 2, 'Game scene', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5);
  }
}

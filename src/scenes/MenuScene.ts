import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create(): void {
    this.sound.stopAll();
    this.sound.play('sfx-music-menu', { loop: true, volume: (save.get().settings.musicVol / 10) * 0.6 });
    const cx = TUNING.width / 2;
    this.add.text(cx, 180, 'LAVA LEAP', { fontFamily: 'monospace', fontSize: '48px', color: '#ff7b00' }).setOrigin(0.5);
    const hi = save.get().highScore;
    this.add.text(cx, 260, `High Score: ${hi}`, { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(cx, 290, `Bank: ${save.get().coinBank} coins`, { fontFamily: 'monospace', fontSize: '16px', color: '#ffd166' }).setOrigin(0.5);

    const items = [
      'SPACE  Climb',
      'D      Daily challenge',
      'C      Shop',
      'A      Achievements',
    ];
    items.forEach((line, i) => this.add.text(cx, 380 + i * 30, line, {
      fontFamily: 'monospace', fontSize: '18px', color: '#16e0e0',
    }).setOrigin(0.5));

    const kb = this.input.keyboard!;
    kb.once('keydown-SPACE', () => this.scene.start('Game', { daily: false }));
    kb.once('keydown-D', () => this.scene.start('Game', { daily: true }));
    kb.once('keydown-C', () => this.scene.start('Shop'));
    kb.once('keydown-A', () => this.scene.start('Achievements'));
  }
}

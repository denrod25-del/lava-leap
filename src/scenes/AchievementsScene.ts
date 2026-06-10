import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { ACHIEVEMENTS } from '../core/achievements';
import { save } from '../main';

export class AchievementsScene extends Phaser.Scene {
  constructor() { super('Achievements'); }

  create(): void {
    const cx = TUNING.width / 2;
    const unlocked = save.get().achievements;
    const count = Object.keys(unlocked).length;
    this.add.text(cx, 50, 'ACHIEVEMENTS', { fontFamily: 'monospace', fontSize: '26px', color: '#ffb066' }).setOrigin(0.5);
    this.add.text(cx, 84, `${count} / ${ACHIEVEMENTS.length}`, { fontFamily: 'monospace', fontSize: '15px', color: '#888888' }).setOrigin(0.5);
    ACHIEVEMENTS.forEach((a, i) => {
      const got = Boolean(unlocked[a.id]);
      this.add.text(40, 120 + i * 40, `${got ? '★' : '☆'} ${a.name}`, {
        fontFamily: 'monospace', fontSize: '16px', color: got ? '#ffd166' : '#666666',
      });
      this.add.text(40, 138 + i * 40, `   ${a.description}`, {
        fontFamily: 'monospace', fontSize: '12px', color: got ? '#bbbbbb' : '#555555',
      });
    });
    this.add.text(cx, 660, 'ESC back', { fontFamily: 'monospace', fontSize: '13px', color: '#888888' }).setOrigin(0.5);
    this.input.keyboard!.on('keydown-ESC', () => this.scene.start('Menu'));
  }
}

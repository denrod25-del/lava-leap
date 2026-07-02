import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';
import { CHANGELOG } from '../core/changelog';
import { APP_NAME } from '../core/buildInfo';

export class ChangelogScene extends Phaser.Scene {
  constructor() { super('Changelog'); }

  create(): void {
    const cx = TUNING.width / 2;
    this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x0e0e1a, 0.98).setOrigin(0, 0);
    this.add.text(cx, 60, "WHAT'S NEW", { fontFamily: 'monospace', fontSize: '30px', color: '#ffb066' }).setOrigin(0.5);
    this.add.text(cx, 96, APP_NAME, { fontFamily: 'monospace', fontSize: '14px', color: '#888888' }).setOrigin(0.5);

    let y = 150;
    for (const e of CHANGELOG.slice(0, 3)) {
      this.add.text(40, y, `v${e.version}`, { fontFamily: 'monospace', fontSize: '18px', color: '#16e0e0' });
      this.add.text(TUNING.width - 40, y + 3, e.date, { fontFamily: 'monospace', fontSize: '12px', color: '#666666' }).setOrigin(1, 0);
      y += 30;
      for (const note of e.notes) {
        const t = this.add.text(52, y, `• ${note}`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#cfd8e3', wordWrap: { width: TUNING.width - 92 },
        });
        y += t.height + 6;
      }
      y += 14;
    }

    const back = () => {
      this.sound.play('sfx-ui-select', { volume: 0.35 * (save.get().settings.sfxVol / 10) });
      this.scene.start('Menu'); // scene.start STOPS this scene — required, or black screen
    };
    this.add.text(cx, TUNING.height - 40, '[ CLOSE ]', { fontFamily: 'monospace', fontSize: '22px', color: '#16e0e0' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', back);
    this.input.keyboard!.once('keydown-ESC', back);
    this.input.keyboard!.once('keydown-SPACE', back);
  }
}

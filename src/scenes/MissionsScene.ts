import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';
import { dateKey } from '../core/dailySeed';
import { missionsForDate, ensureToday, PAYOUTS } from '../core/missions';

export class MissionsScene extends Phaser.Scene {
  constructor() { super('Missions'); }

  create(): void {
    const cx = TUNING.width / 2;
    this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x000000, 0.7).setOrigin(0, 0);
    this.add.text(cx, 170, 'DAILY MISSIONS', { fontFamily: 'monospace', fontSize: '30px', color: '#ffb066' }).setOrigin(0.5);
    this.add.text(cx, 210, 'Same for everyone · resets at midnight', {
      fontFamily: 'monospace', fontSize: '13px', color: '#8a93a3',
    }).setOrigin(0.5);

    const dk = dateKey(new Date());
    const state = ensureToday(save.get().missions, dk);
    const defs = missionsForDate(dk);
    defs.forEach((d, i) => {
      const done = state.completed.includes(d.id);
      const prog = Math.min(state.metrics[d.metric] ?? 0, d.target);
      const line = `${done ? '✓' : '·'} ${d.text.padEnd(30)} ${prog}/${d.target}  +${PAYOUTS[d.tier]}c`;
      this.add.text(cx, 280 + i * 52, line, {
        fontFamily: 'monospace', fontSize: '15px', color: done ? '#ffd166' : '#ffffff',
      }).setOrigin(0.5);
    });

    const doneCount = defs.filter((d) => state.completed.includes(d.id)).length;
    this.add.text(cx, 460, `${doneCount}/3 complete today`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#16e0e0',
    }).setOrigin(0.5);

    this.add.text(cx, 540, 'ESC / tap — back', { fontFamily: 'monospace', fontSize: '14px', color: '#888888' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.back());
    this.input.keyboard!.once('keydown-ESC', () => this.back());
  }

  private back(): void {
    // scene.start STOPS this scene and boots Menu (the Settings back-nav idiom).
    this.scene.start('Menu');
  }
}

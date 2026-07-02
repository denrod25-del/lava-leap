import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';
import { track } from '../core/track';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  create(data: { score: number; banked?: number; bankTotal?: number; daily?: boolean; dailyBest?: number; earned?: string[] }): void {
    this.sound.stopAll();
    const cx = TUNING.width / 2;
    this.add.text(cx, 200, 'YOU MELTED', { fontFamily: 'monospace', fontSize: '40px', color: '#ff2d6b' }).setOrigin(0.5);
    this.add.text(cx, 280, `Score: ${data.score ?? 0}`, { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(cx, 320, `Best: ${save.get().highScore}`, { fontFamily: 'monospace', fontSize: '20px', color: '#ffd166' }).setOrigin(0.5);
    this.add.text(cx, 352, `Banked +${data.banked ?? 0} → ${data.bankTotal ?? 0} coins`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffd166',
    }).setOrigin(0.5);
    if (data.daily) {
      this.add.text(cx, 380, `Daily best: ${data.dailyBest ?? 0}`, {
        fontFamily: 'monospace', fontSize: '16px', color: '#7ad9e8',
      }).setOrigin(0.5);
    }
    (data.earned ?? []).slice(0, 3).forEach((id, i) => {
      this.add.text(cx, 408 + i * 22, `★ ${id}`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffb066',
      }).setOrigin(0.5);
    });
    const retry = () => {
      this.sound.play('sfx-ui-select', { volume: 0.35 * (save.get().settings.sfxVol / 10) });
      track('restart', { from: 'gameover' });
      this.scene.start('Game', { daily: data.daily ?? false });
    };
    this.add.text(cx, 500, 'Press SPACE / tap to retry', { fontFamily: 'monospace', fontSize: '20px', color: '#16e0e0' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', retry);
    this.input.keyboard!.once('keydown-SPACE', retry);
  }
}

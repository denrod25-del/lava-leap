import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save, leaderboard } from '../main';
import { track } from '../core/track';
import { allTimeBoard, dailyBoard } from '../core/leaderboard';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  create(data: { score: number; banked?: number; bankTotal?: number; daily?: boolean; dailyBest?: number; earned?: string[]; playerId?: string; submitDone?: Promise<unknown> }): void {
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

    // Online ranks (async, non-blocking). Absent/offline → nothing shows. Waits for
    // this run's submit to settle first so the shown rank includes THIS run.
    if (leaderboard.enabled && data.playerId) {
      const playerId = data.playerId;
      const afterSubmit = data.submitDone ?? Promise.resolve();
      const rankText = this.add.text(cx, 440, '', { fontFamily: 'monospace', fontSize: '16px', color: '#7ad9e8' }).setOrigin(0.5);
      void afterSubmit.then(() => leaderboard.rankOf(allTimeBoard(), playerId)).then((r) => {
        if (r && rankText.active) rankText.setText(`GLOBAL #${r.rank}`);
      });
      if (data.daily) {
        const dRank = this.add.text(cx, 462, '', { fontFamily: 'monospace', fontSize: '14px', color: '#7ad9e8' }).setOrigin(0.5);
        void afterSubmit.then(() => leaderboard.rankOf(dailyBoard(new Date()), playerId)).then((r) => {
          if (r && dRank.active) dRank.setText(`DAILY #${r.rank}`);
        });
      }
    }
  }
}

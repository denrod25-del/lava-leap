import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save, leaderboard } from '../main';
import { track } from '../core/track';
import { allTimeBoard, dailyBoard } from '../core/leaderboard';
import { BEATS, type StoryStage } from '../core/story';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  create(data: { score: number; banked?: number; bankTotal?: number; daily?: boolean; dailyBest?: number; earned?: string[]; playerId?: string; submitDone?: Promise<unknown>; storyStage?: StoryStage; journalUnlocks?: number; result?: 'cleared' | 'died'; levelId?: string; nextLevelId?: string }): void {
    this.sound.stopAll();
    const cx = TUNING.width / 2;
    const cleared = data.result === 'cleared';
    // Result art: victory sunburst on a clear, the Titan's glare on a death.
    // Dimmed with a dark scrim so the score readout stays readable.
    const bgKey = cleared ? 'bg-victory' : 'bg-gameover';
    if (this.textures.exists(bgKey)) {
      this.add.image(0, 0, bgKey).setOrigin(0, 0)
        .setDisplaySize(TUNING.width, TUNING.height).setDepth(-10).setAlpha(0.6);
      this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x0a0508, 0.4)
        .setOrigin(0, 0).setDepth(-9);
    }
    this.add.text(cx, 200, cleared ? 'LEVEL CLEAR' : 'YOU MELTED', {
      fontFamily: 'monospace', fontSize: '40px', color: cleared ? '#16e0e0' : '#ff2d6b',
    }).setOrigin(0.5);
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
    // Story beat: one deterministic line per stage, quiet color, below the ranks.
    const beat = BEATS[data.storyStage ?? 'newKeeper'];
    this.add.text(cx, 540, `“${beat}”`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#b8865a', align: 'center',
      wordWrap: { width: 520 },
    }).setOrigin(0.5);
    if ((data.journalUnlocks ?? 0) > 0) {
      this.add.text(cx, 564, `Journal updated — ${data.journalUnlocks} new page${data.journalUnlocks === 1 ? '' : 's'}`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffb066',
      }).setOrigin(0.5);
    }
    if (cleared) {
      const sfxMult = save.get().settings.sfxVol / 10;
      const goNext = () => {
        this.sound.play('sfx-ui-select', { volume: 0.35 * sfxMult });
        track('level_next', { from: data.levelId });
        this.scene.start('Game', { levelId: data.nextLevelId });
      };
      const goSelect = () => {
        this.sound.play('sfx-ui-select', { volume: 0.35 * sfxMult });
        this.scene.start('LevelSelect');
      };
      if (data.nextLevelId) {
        this.add.text(cx, 470, 'Press SPACE for the next level', { fontFamily: 'monospace', fontSize: '18px', color: '#16e0e0' })
          .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', goNext);
        this.input.keyboard!.once('keydown-SPACE', goNext);
      }
      this.add.text(cx, 500, 'ESC — Level Select', { fontFamily: 'monospace', fontSize: '16px', color: '#8a93a3' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', goSelect);
      this.input.keyboard!.once('keydown-ESC', goSelect);
    } else {
      const retry = () => {
        this.sound.play('sfx-ui-select', { volume: 0.35 * (save.get().settings.sfxVol / 10) });
        track('restart', { from: 'gameover' });
        this.scene.start('Game', { daily: data.daily ?? false, levelId: data.levelId });
      };
      this.add.text(cx, 500, 'Press SPACE / tap to retry', { fontFamily: 'monospace', fontSize: '20px', color: '#16e0e0' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', retry);
      this.input.keyboard!.once('keydown-SPACE', retry);
    }

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

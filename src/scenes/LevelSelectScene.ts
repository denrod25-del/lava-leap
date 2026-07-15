import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';
import { LEVELS, isLevelUnlocked } from '../core/levels';
import { track } from '../core/track';

/** Level Select: a vertical list (same idiom as Journal/Shop) — one row per
 *  LEVELS entry, showing CLEARED/PLAY/LOCKED status from save.levels.cleared. */
export class LevelSelectScene extends Phaser.Scene {
  private idx = 0;
  private rows: Phaser.GameObjects.Text[] = [];

  constructor() { super('LevelSelect'); }

  create(): void {
    this.idx = 0;
    const cx = TUNING.width / 2;
    this.add.text(cx, 60, 'LEVELS', { fontFamily: 'monospace', fontSize: '32px', color: '#ffd166' }).setOrigin(0.5);
    this.add.text(cx, 96, 'The Last Ember — Campaign', { fontFamily: 'monospace', fontSize: '14px', color: '#8a93a3' }).setOrigin(0.5);

    this.rows = LEVELS.map((_lvl, i) =>
      this.add.text(cx, 160 + i * 40, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.idx = i; this.render(); this.play(); }),
    );
    this.add.text(cx, 620, '↑/↓ select · ENTER play · ESC back', {
      fontFamily: 'monospace', fontSize: '13px', color: '#888888',
    }).setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => { this.idx = (this.idx + LEVELS.length - 1) % LEVELS.length; this.render(); });
    kb.on('keydown-DOWN', () => { this.idx = (this.idx + 1) % LEVELS.length; this.render(); });
    kb.on('keydown-ENTER', () => this.play());
    kb.on('keydown-ESC', () => this.scene.start('Menu'));

    track('level_select_open', {});
    this.render();
  }

  private play(): void {
    const lvl = LEVELS[this.idx];
    if (!isLevelUnlocked(lvl.id, save.get().levels.cleared)) return; // locked: no-op
    this.scene.start('Game', { levelId: lvl.id });
  }

  private render(): void {
    const clearedIds = save.get().levels.cleared;
    LEVELS.forEach((lvl, i) => {
      const cursor = i === this.idx ? '> ' : '  ';
      const isCleared = clearedIds.includes(lvl.id);
      const unlocked = isLevelUnlocked(lvl.id, clearedIds);
      const status = isCleared ? '[CLEARED ★]' : unlocked ? '[PLAY]' : '[LOCKED 🔒]';
      this.rows[i].setText(`${cursor}${i + 1}. ${lvl.title.padEnd(18)} ${status}`)
        .setColor(unlocked ? '#e8e2d8' : '#555555').setAlpha(unlocked ? 1 : 0.6);
    });
  }
}

import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';
import { LEVELS, isLevelUnlocked } from '../core/levels';
import { track } from '../core/track';
import { effectiveMedal, formatMs, MEDAL_COLORS } from '../core/medals';

/** Level Select: a vertical list (same idiom as Journal/Shop) — one row per
 *  LEVELS entry, showing medal/best-time (or PLAY/LOCKED) from save.levels. */
export class LevelSelectScene extends Phaser.Scene {
  private idx = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private parText?: Phaser.GameObjects.Text;

  constructor() { super('LevelSelect'); }

  create(): void {
    this.idx = 0;
    this.parText = undefined; // scene instances are reused; last visit's text is destroyed
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
    const levels = save.get().levels;
    LEVELS.forEach((lvl, i) => {
      const cursor = i === this.idx ? '> ' : '  ';
      const unlocked = isLevelUnlocked(lvl.id, levels.cleared);
      const medal = effectiveMedal(levels, lvl.id);
      const best = levels.bestTimes[lvl.id];
      const status = medal
        ? `[${medal.toUpperCase()}${best !== undefined ? ' ' + formatMs(best) : ''}]`
        : unlocked ? '[PLAY]' : '[LOCKED 🔒]';
      this.rows[i].setText(`${cursor}${i + 1}. ${lvl.title.padEnd(18)} ${status}`)
        .setColor(medal ? MEDAL_COLORS[medal] : unlocked ? '#e8e2d8' : '#555555')
        .setAlpha(unlocked ? 1 : 0.6);
    });
    const sel = LEVELS[this.idx];
    const parLine = `Silver under ${formatMs(sel.parSilverMs)} · Gold under ${formatMs(sel.parGoldMs)}`;
    if (!this.parText) {
      this.parText = this.add.text(TUNING.width / 2, 340, parLine, {
        fontFamily: 'monospace', fontSize: '13px', color: '#8a93a3',
      }).setOrigin(0.5);
    } else {
      this.parText.setText(parLine);
    }
  }
}

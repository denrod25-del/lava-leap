import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';
import { STORY_PAGES } from '../core/story';
import { StoryProgress } from '../core/StoryProgress';
import { track } from '../core/track';

/** The Keeper's Journal: list of story pages (unlocked = readable, locked =
 *  silhouette + earn-hint) + a replay-the-opening row. List ↔ detail modes. */
export class JournalScene extends Phaser.Scene {
  private idx = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private detail?: Phaser.GameObjects.Container;
  private story!: StoryProgress;

  constructor() { super('Journal'); }

  /** STORY_PAGES rows + one trailing "replay the opening" row. */
  private listLength(): number { return STORY_PAGES.length + 1; }

  create(): void {
    this.story = new StoryProgress(save);
    this.idx = 0;
    this.detail = undefined;
    const cx = TUNING.width / 2;
    this.add.text(cx, 48, "KEEPER'S JOURNAL", { fontFamily: 'monospace', fontSize: '28px', color: '#ffb066' }).setOrigin(0.5);
    const unlocked = this.story.unlockedIds().length;
    this.add.text(cx, 80, `${unlocked} / ${STORY_PAGES.length} pages`, { fontFamily: 'monospace', fontSize: '14px', color: '#8a93a3' }).setOrigin(0.5);

    this.rows = [];
    for (let i = 0; i < this.listLength(); i++) {
      const row = this.add.text(40, 112 + i * 26, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' })
        .setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.idx = i; this.render(); this.open(); });
      this.rows.push(row);
    }
    this.add.text(cx, 690, '↑/↓ select · ENTER read · ESC back', {
      fontFamily: 'monospace', fontSize: '13px', color: '#888888',
    }).setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => { if (this.detail) return; this.idx = (this.idx + this.listLength() - 1) % this.listLength(); this.render(); });
    kb.on('keydown-DOWN', () => { if (this.detail) return; this.idx = (this.idx + 1) % this.listLength(); this.render(); });
    kb.on('keydown-ENTER', () => { if (this.detail) this.closeDetail(); else this.open(); });
    kb.on('keydown-ESC', () => { if (this.detail) this.closeDetail(); else this.scene.start('Menu'); });

    track('journal_open', { unlocked });
    this.render();
  }

  private open(): void {
    if (this.idx === STORY_PAGES.length) { // replay row
      this.scene.start('Vignette', { from: 'Journal' });
      return;
    }
    const page = STORY_PAGES[this.idx];
    if (!this.story.isUnlocked(page.id)) return; // locked: nothing to read
    const cx = TUNING.width / 2;
    const bg = this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x10101a, 0.96).setOrigin(0, 0)
      .setInteractive().on('pointerdown', () => this.closeDetail());
    const title = this.add.text(cx, 140, page.title, { fontFamily: 'monospace', fontSize: '24px', color: '#ffb066' }).setOrigin(0.5);
    const body = this.add.text(cx, 320, page.text, {
      fontFamily: 'monospace', fontSize: '16px', color: '#e8e2d8', lineSpacing: 8,
      wordWrap: { width: 500 }, align: 'center',
    }).setOrigin(0.5);
    const hintFoot = this.add.text(cx, 600, 'ENTER / ESC / tap — back', { fontFamily: 'monospace', fontSize: '12px', color: '#888888' }).setOrigin(0.5);
    this.detail = this.add.container(0, 0, [bg, title, body, hintFoot]).setDepth(50);
    track('journal_read', { id: page.id });
  }

  private closeDetail(): void {
    this.detail?.destroy();
    this.detail = undefined;
  }

  private render(): void {
    STORY_PAGES.forEach((p, i) => {
      const cursor = i === this.idx ? '> ' : '  ';
      if (this.story.isUnlocked(p.id)) {
        this.rows[i].setText(`${cursor}${p.title}`).setColor('#e8e2d8').setAlpha(1);
      } else {
        this.rows[i].setText(`${cursor}??? — ${p.hint}`).setColor('#6a7280').setAlpha(0.8);
      }
    });
    const i = STORY_PAGES.length;
    this.rows[i].setText(`${i === this.idx ? '> ' : '  '}[ Replay the opening ]`).setColor('#16e0e0');
  }
}

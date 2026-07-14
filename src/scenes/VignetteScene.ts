import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';
import { VIGNETTE } from '../core/story';
import { StoryProgress } from '../core/StoryProgress';
import { staticKey, DEFAULT_CHARACTER } from '../core/characters';
import { track } from '../core/track';

/** The 15-second opening: three text beats over a dark mountain-foot scene.
 *  Any input advances; SKIP ends it. Watching (or skipping) marks vignetteSeen
 *  and unlocks the oath page. Runs on first fresh boot, or replayed from the Journal. */
export class VignetteScene extends Phaser.Scene {
  private beatIdx = 0;
  private beatText!: Phaser.GameObjects.Text;
  private from: 'Boot' | 'Journal' = 'Boot';
  private finished = false;

  constructor() { super('Vignette'); }

  init(data: { from?: 'Journal' }): void {
    this.from = data?.from === 'Journal' ? 'Journal' : 'Boot';
    this.beatIdx = 0;
    this.finished = false;
  }

  create(): void {
    const cx = TUNING.width / 2;
    this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x140a05).setOrigin(0, 0);
    // Ember stands at the mountain's foot; slow rising embers set the scene.
    if (!this.textures.exists('px4')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4);
      g.generateTexture('px4', 4, 4);
      g.destroy();
    }
    this.add.particles(0, TUNING.height, 'px4', {
      x: { min: 0, max: TUNING.width }, speedY: { min: -40, max: -15 }, speedX: { min: -6, max: 6 },
      lifespan: 3000, scale: { start: 0.8, end: 0 }, alpha: { start: 0.5, end: 0 },
      tint: [0xff8a3d, 0xff4d00, 0xffd166], frequency: 160,
    });
    if (this.textures.exists(staticKey(DEFAULT_CHARACTER))) {
      this.add.image(cx, 520, staticKey(DEFAULT_CHARACTER)).setScale(3);
    }
    this.beatText = this.add.text(cx, 260, VIGNETTE[0].text, {
      fontFamily: 'monospace', fontSize: '17px', color: '#e8e2d8', align: 'center', lineSpacing: 10,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: this.beatText, alpha: 1, duration: 700 });

    this.add.text(TUNING.width - 14, 20, 'SKIP ▸', { fontFamily: 'monospace', fontSize: '14px', color: '#888888' })
      .setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.finish(true));

    // Any tap/key advances; each beat also auto-advances after 4.5s.
    this.input.on('pointerdown', () => this.advance());
    this.input.keyboard!.on('keydown', () => this.advance());
    this.time.addEvent({ delay: 4500, repeat: VIGNETTE.length - 1, callback: () => this.advance() });
  }

  private advance(): void {
    if (this.finished) return;
    this.beatIdx += 1;
    if (this.beatIdx >= VIGNETTE.length) { this.finish(false); return; }
    const t = this.beatText;
    this.tweens.add({ targets: t, alpha: 0, duration: 250, onComplete: () => {
      t.setText(VIGNETTE[this.beatIdx].text);
      this.tweens.add({ targets: t, alpha: 1, duration: 600 });
    }});
  }

  private finish(skipped: boolean): void {
    if (this.finished) return;
    this.finished = true;
    new StoryProgress(save).onVignetteSeen();
    track('vignette', { skipped, from: this.from });
    this.scene.start(this.from === 'Journal' ? 'Journal' : 'Menu');
  }
}

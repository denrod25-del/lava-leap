import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';
import { APP_NAME, APP_VERSION, BUILD_ID, BUILD_DATE } from '../core/buildInfo';

const ROWS = ['Music volume', 'SFX volume', 'Screen shake', 'Replay tutorial'] as const;

export class SettingsScene extends Phaser.Scene {
  private idx = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private from = 'Menu';

  constructor() { super('Settings'); }

  init(data: { from?: string }): void {
    this.from = data?.from ?? 'Menu';
  }

  create(): void {
    const cx = TUNING.width / 2;
    this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x000000, 0.7).setOrigin(0, 0);
    this.add.text(cx, 180, 'SETTINGS', { fontFamily: 'monospace', fontSize: '30px', color: '#ffb066' }).setOrigin(0.5);
    this.rows = ROWS.map((_r, i) =>
      this.add.text(cx, 270 + i * 44, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' })
        .setOrigin(0.5)
        // Tap a row to select it.
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.idx = i; this.render(); }),
    );
    this.add.text(cx, 460, '←/→ adjust · ↑/↓ select · ESC back', {
      fontFamily: 'monospace', fontSize: '13px', color: '#888888',
    }).setOrigin(0.5);

    // On-screen tap targets for touch devices (same handlers as the keyboard).
    const tapBtn = (x: number, label: string, fn: () => void): void => {
      this.add.text(x, 510, label, { fontFamily: 'monospace', fontSize: '24px', color: '#16e0e0' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.sound.play('sfx-ui-select', { volume: 0.35 * (save.get().settings.sfxVol / 10) });
          fn();
        });
    };
    tapBtn(cx - 130, '▲', () => { this.idx = (this.idx + ROWS.length - 1) % ROWS.length; this.render(); });
    tapBtn(cx - 70, '▼', () => { this.idx = (this.idx + 1) % ROWS.length; this.render(); });
    tapBtn(cx - 10, '◀', () => this.adjust(-1));
    tapBtn(cx + 50, '▶', () => this.adjust(1));
    tapBtn(cx + 130, 'BACK', () => this.back());

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => { this.idx = (this.idx + ROWS.length - 1) % ROWS.length; this.render(); });
    kb.on('keydown-DOWN', () => { this.idx = (this.idx + 1) % ROWS.length; this.render(); });
    kb.on('keydown-LEFT', () => this.adjust(-1));
    kb.on('keydown-RIGHT', () => this.adjust(1));
    kb.on('keydown-ESC', () => this.back());

    // Non-interactive build footer.
    this.add.text(cx, 600,
      `${APP_NAME}\nVersion v${APP_VERSION}\nBuild ${BUILD_DATE}\nBuild ID ${BUILD_ID}`,
      { fontFamily: 'monospace', fontSize: '12px', color: '#5a6472', align: 'center', lineSpacing: 4 },
    ).setOrigin(0.5);

    this.render();
  }

  private adjust(d: number): void {
    save.update((b) => {
      if (this.idx === 0) b.settings.musicVol = Phaser.Math.Clamp(b.settings.musicVol + d, 0, 10);
      else if (this.idx === 1) b.settings.sfxVol = Phaser.Math.Clamp(b.settings.sfxVol + d, 0, 10);
      else if (this.idx === 3) b.tutorialDone = false;
      else b.settings.screenShake = d > 0;
    });
    this.sound.play('sfx-ui-move', { volume: 0.3 * (save.get().settings.sfxVol / 10) });
    this.render();
  }

  private render(): void {
    const blob = save.get();
    const s = blob.settings;
    const vals = [
      `${'#'.repeat(s.musicVol)}${'.'.repeat(10 - s.musicVol)} ${s.musicVol}`,
      `${'#'.repeat(s.sfxVol)}${'.'.repeat(10 - s.sfxVol)} ${s.sfxVol}`,
      s.screenShake ? 'ON ' : 'OFF',
      blob.tutorialDone ? 'DONE — ◀/▶ to re-arm' : 'ON NEXT RUN',
    ];
    this.rows.forEach((r, i) => r.setText(`${i === this.idx ? '> ' : '  '}${ROWS[i].padEnd(13)} ${vals[i]}`)
      .setColor(i === this.idx ? '#16e0e0' : '#ffffff'));
  }

  private back(): void {
    this.scene.stop();
    if (this.from === 'Pause') this.scene.resume('Pause');
    // From Menu, the Menu scene was STOPPED by scene.start('Settings') — it must
    // be restarted, or no scene is left active (black screen).
    else this.scene.start('Menu');
  }
}

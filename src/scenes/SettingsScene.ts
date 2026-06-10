import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';

const ROWS = ['Music volume', 'SFX volume', 'Screen shake'] as const;

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
      this.add.text(cx, 270 + i * 44, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5),
    );
    this.add.text(cx, 460, '←/→ adjust · ↑/↓ select · ESC back', {
      fontFamily: 'monospace', fontSize: '13px', color: '#888888',
    }).setOrigin(0.5);
    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => { this.idx = (this.idx + ROWS.length - 1) % ROWS.length; this.render(); });
    kb.on('keydown-DOWN', () => { this.idx = (this.idx + 1) % ROWS.length; this.render(); });
    kb.on('keydown-LEFT', () => this.adjust(-1));
    kb.on('keydown-RIGHT', () => this.adjust(1));
    kb.on('keydown-ESC', () => this.back());
    this.render();
  }

  private adjust(d: number): void {
    save.update((b) => {
      if (this.idx === 0) b.settings.musicVol = Phaser.Math.Clamp(b.settings.musicVol + d, 0, 10);
      else if (this.idx === 1) b.settings.sfxVol = Phaser.Math.Clamp(b.settings.sfxVol + d, 0, 10);
      else b.settings.screenShake = d > 0;
    });
    this.sound.play('sfx-ui-move', { volume: 0.3 * (save.get().settings.sfxVol / 10) });
    this.render();
  }

  private render(): void {
    const s = save.get().settings;
    const vals = [
      `${'#'.repeat(s.musicVol)}${'.'.repeat(10 - s.musicVol)} ${s.musicVol}`,
      `${'#'.repeat(s.sfxVol)}${'.'.repeat(10 - s.sfxVol)} ${s.sfxVol}`,
      s.screenShake ? 'ON ' : 'OFF',
    ];
    this.rows.forEach((r, i) => r.setText(`${i === this.idx ? '> ' : '  '}${ROWS[i].padEnd(13)} ${vals[i]}`)
      .setColor(i === this.idx ? '#16e0e0' : '#ffffff'));
  }

  private back(): void {
    this.scene.stop();
    if (this.from === 'Pause') this.scene.resume('Pause');
    // from Menu: Menu was never paused; nothing to resume.
  }
}

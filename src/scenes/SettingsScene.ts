import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save, leaderboard } from '../main';
import { APP_NAME, APP_VERSION, BUILD_ID, BUILD_DATE } from '../core/buildInfo';
import { promptName } from '../entities/NameEntry';
import { addUiBackdrop } from './uiBackdrop';
import { ClipRecorder } from '../entities/ClipRecorder';

type RowKey = 'music' | 'sfx' | 'shake' | 'motion' | 'controls' | 'clips' | 'tutorial' | 'name';
const ROW_DEFS: Array<{ key: RowKey; label: string }> = [
  { key: 'music', label: 'Music volume' },
  { key: 'sfx', label: 'SFX volume' },
  { key: 'shake', label: 'Screen shake' },
  { key: 'motion', label: 'Reduce motion' },
  { key: 'controls', label: 'Controls' },
  { key: 'clips', label: 'Rec clips' },
  { key: 'tutorial', label: 'Replay tutorial' },
  { key: 'name', label: 'Name' },
];

export class SettingsScene extends Phaser.Scene {
  private idx = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private defs: Array<{ key: RowKey; label: string }> = ROW_DEFS;
  private from = 'Menu';

  constructor() { super('Settings'); }

  init(data: { from?: string }): void {
    this.from = data?.from ?? 'Menu';
  }

  create(): void {
    this.defs = ROW_DEFS.filter((d) => d.key !== 'clips' || ClipRecorder.supported());
    const cx = TUNING.width / 2;
    addUiBackdrop(this);
    this.add.text(cx, 180, 'SETTINGS', { fontFamily: 'monospace', fontSize: '30px', color: '#ffb066' }).setOrigin(0.5);
    this.rows = this.defs.map((_r, i) =>
      this.add.text(cx, 250 + i * 40, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' })
        .setOrigin(0.5)
        // Tap a row to select it.
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.idx = i; this.render(); if (this.defs[i].key === 'name') this.editName(); }),
    );
    this.add.text(cx, 575, '←/→ adjust · ↑/↓ select · ESC back', {
      fontFamily: 'monospace', fontSize: '13px', color: '#888888',
    }).setOrigin(0.5);

    // On-screen tap targets for touch devices (same handlers as the keyboard).
    const tapBtn = (x: number, label: string, fn: () => void): void => {
      this.add.text(x, 545, label, { fontFamily: 'monospace', fontSize: '24px', color: '#16e0e0' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.sound.play('sfx-ui-select', { volume: 0.35 * (save.get().settings.sfxVol / 10) });
          fn();
        });
    };
    tapBtn(cx - 130, '▲', () => { this.idx = (this.idx + this.defs.length - 1) % this.defs.length; this.render(); });
    tapBtn(cx - 70, '▼', () => { this.idx = (this.idx + 1) % this.defs.length; this.render(); });
    tapBtn(cx - 10, '◀', () => this.adjust(-1));
    tapBtn(cx + 50, '▶', () => this.adjust(1));
    tapBtn(cx + 130, 'BACK', () => this.back());

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => { this.idx = (this.idx + this.defs.length - 1) % this.defs.length; this.render(); });
    kb.on('keydown-DOWN', () => { this.idx = (this.idx + 1) % this.defs.length; this.render(); });
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
    const key = this.defs[this.idx].key;
    if (key === 'name') { this.editName(); return; }
    save.update((b) => {
      if (key === 'music') b.settings.musicVol = Phaser.Math.Clamp(b.settings.musicVol + d, 0, 10);
      else if (key === 'sfx') b.settings.sfxVol = Phaser.Math.Clamp(b.settings.sfxVol + d, 0, 10);
      else if (key === 'shake') b.settings.screenShake = d > 0;
      else if (key === 'motion') b.settings.reducedMotion = d > 0;
      else if (key === 'controls') b.settings.controlScheme = d > 0 ? 'manual' : 'auto';
      else if (key === 'clips') b.settings.recordClips = d > 0;
      else b.tutorialDone = false;
    });
    this.sound.play('sfx-ui-move', { volume: 0.3 * (save.get().settings.sfxVol / 10) });
    this.render();
  }

  private editName(): void {
    if (!leaderboard.enabled) return;
    void promptName(save.get().identity.name).then((name) => {
      if (name !== null) { save.update((b) => { b.identity.name = name; }); this.render(); }
    });
  }

  private render(): void {
    const blob = save.get();
    const s = blob.settings;
    const val = (key: RowKey): string => {
      switch (key) {
        case 'music': return `${'#'.repeat(s.musicVol)}${'.'.repeat(10 - s.musicVol)} ${s.musicVol}`;
        case 'sfx': return `${'#'.repeat(s.sfxVol)}${'.'.repeat(10 - s.sfxVol)} ${s.sfxVol}`;
        case 'shake': return s.screenShake ? 'ON ' : 'OFF';
        case 'motion': return s.reducedMotion ? 'ON ' : 'OFF';
        case 'controls': return s.controlScheme === 'auto' ? 'AUTO (1-hand)' : 'MANUAL (2-thumb)';
        case 'clips': return s.recordClips ? 'ON ' : 'OFF';
        case 'tutorial': return blob.tutorialDone ? 'DONE — ◀/▶ to re-arm' : 'ON NEXT RUN';
        case 'name': return leaderboard.enabled ? (blob.identity.name || '(tap to set)') : 'offline';
      }
    };
    this.rows.forEach((r, i) => r.setText(`${i === this.idx ? '> ' : '  '}${this.defs[i].label.padEnd(15)} ${val(this.defs[i].key)}`)
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

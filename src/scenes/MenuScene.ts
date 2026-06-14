import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';
import { defaultAnalytics } from '../core/analytics';

export class MenuScene extends Phaser.Scene {
  private debugPanel: Phaser.GameObjects.Container | null = null;

  constructor() { super('Menu'); }

  private toggleDebug(): void {
    if (this.debugPanel) { this.debugPanel.destroy(); this.debugPanel = null; return; }
    const a = save.get().analytics;
    const lines = [
      'LOCAL STATS  (F9 close · J copy JSON · R reset)',
      `runs: ${a.runs}   daily plays: ${a.dailyPlays}`,
      `coins banked: ${a.coinsBanked}   unlocks: ${a.achievementsUnlocked}`,
      'deaths by height:',
      ...Object.entries(a.deathsByBucket).sort((x, y) => Number(x[0]) - Number(y[0]))
        .map(([b, n]) => `  ${b}-${Number(b) + 99}: ${'■'.repeat(Math.min(20, n))} ${n}`),
      'deaths by zone: ' + Object.entries(a.deathsByZone).map(([z, n]) => `z${z}:${n}`).join('  '),
    ];
    const bg = this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x000000, 0.85).setOrigin(0, 0);
    const text = this.add.text(16, 16, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '12px', color: '#9ef79e', lineSpacing: 5,
    });
    this.debugPanel = this.add.container(0, 0, [bg, text]).setDepth(100);
  }

  create(): void {
    this.sound.stopAll();
    this.sound.play('sfx-music-menu', { loop: true, volume: (save.get().settings.musicVol / 10) * 0.6 });
    const cx = TUNING.width / 2;
    this.add.text(cx, 180, 'LAVA LEAP', { fontFamily: 'monospace', fontSize: '48px', color: '#ff7b00' }).setOrigin(0.5);
    const hi = save.get().highScore;
    this.add.text(cx, 260, `High Score: ${hi}`, { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(cx, 290, `Bank: ${save.get().coinBank} coins`, { fontFamily: 'monospace', fontSize: '16px', color: '#ffd166' }).setOrigin(0.5);

    const items: Array<{ line: string; tap: () => void }> = [
      { line: 'SPACE  Climb', tap: () => this.scene.start('Game', { daily: false }) },
      { line: 'D      Daily challenge', tap: () => this.scene.start('Game', { daily: true }) },
      { line: 'C      Shop', tap: () => this.scene.start('Shop') },
      { line: 'A      Achievements', tap: () => this.scene.start('Achievements') },
      { line: 'S      Settings', tap: () => this.scene.start('Settings', { from: 'Menu' }) },
    ];
    items.forEach((item, i) => this.add.text(cx, 380 + i * 30, item.line, {
      fontFamily: 'monospace', fontSize: '18px', color: '#16e0e0',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', item.tap));

    const kb = this.input.keyboard!;
    kb.once('keydown-SPACE', () => this.scene.start('Game', { daily: false }));
    kb.once('keydown-D', () => this.scene.start('Game', { daily: true }));
    kb.once('keydown-C', () => this.scene.start('Shop'));
    kb.once('keydown-A', () => this.scene.start('Achievements'));
    kb.once('keydown-S', () => this.scene.start('Settings', { from: 'Menu' }));
    kb.on('keydown-F9', () => this.toggleDebug());
    // Panel hotkeys registered ONCE (not per toggle, which stacked stale once-listeners);
    // they no-op unless the panel is open.
    kb.on('keydown-J', () => {
      if (!this.debugPanel) return;
      void navigator.clipboard.writeText(JSON.stringify(save.get().analytics, null, 2));
    });
    kb.on('keydown-R', () => {
      if (!this.debugPanel) return;
      save.update((b) => { b.analytics = defaultAnalytics(); });
      this.toggleDebug(); this.toggleDebug(); // rebuild with fresh numbers
    });
  }
}

import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save, leaderboard } from '../main';
import { defaultAnalytics } from '../core/analytics';
import { APP_VERSION, BUILD_LABEL } from '../core/buildInfo';
import { DevOverlay } from '../entities/DevOverlay';
import { promptName } from '../entities/NameEntry';

export class MenuScene extends Phaser.Scene {
  private debugPanel: Phaser.GameObjects.Container | null = null;
  private lavaStrip!: Phaser.GameObjects.TileSprite;
  private devOverlay?: DevOverlay;

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
    if (this.textures.exists('bg-menu')) {
      this.add.image(0, 0, 'bg-menu').setOrigin(0, 0)
        .setDisplaySize(TUNING.width, TUNING.height).setDepth(-10).setAlpha(0.55);
      this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x0a0508, 0.35)
        .setOrigin(0, 0).setDepth(-9);
    }
    const cx = TUNING.width / 2;
    if (this.textures.exists('boss-titan')) {
      this.add.image(cx, 96, 'boss-titan').setDisplaySize(104, 104).setAlpha(0.95);
    }
    this.add.text(cx, 180, 'LAVA LEAP', { fontFamily: 'monospace', fontSize: '48px', color: '#ff7b00' }).setOrigin(0.5);
    this.add.text(cx, 212, 'Arcade Lava Climber', { fontFamily: 'monospace', fontSize: '15px', color: '#ffb066' }).setOrigin(0.5);
    this.add.text(cx, 233, "Jump fast. Climb higher. Don't let the lava catch you.", {
      fontFamily: 'monospace', fontSize: '11px', color: '#8a93a3',
    }).setOrigin(0.5);
    const hi = save.get().highScore;
    this.add.text(cx, 260, `High Score: ${hi}`, { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(cx, 290, `Bank: ${save.get().coinBank} coins`, { fontFamily: 'monospace', fontSize: '16px', color: '#ffd166' }).setOrigin(0.5);

    const items: Array<{ line: string; tap: () => void }> = [
      { line: 'SPACE  Climb', tap: () => this.scene.start('Game', { daily: false }) },
      { line: 'D      Daily challenge', tap: () => this.scene.start('Game', { daily: true }) },
      { line: 'C      Shop', tap: () => this.scene.start('Shop') },
      { line: 'J      Journal', tap: () => this.scene.start('Journal') },
      { line: 'K      Levels', tap: () => this.scene.start('LevelSelect') },
      { line: 'A      Achievements', tap: () => this.scene.start('Achievements') },
      { line: 'H      How to play', tap: () => this.scene.start('HowTo') },
      { line: "N      What's New", tap: () => this.scene.start('Changelog') },
      { line: 'S      Settings', tap: () => this.scene.start('Settings', { from: 'Menu' }) },
    ];
    if (leaderboard.enabled) {
      items.splice(2, 0, { line: 'L      Leaderboard', tap: () => this.scene.start('Leaderboard') });
    }
    const uiVol = () => 0.35 * (save.get().settings.sfxVol / 10);
    items.forEach((item, i) => this.add.text(cx, 380 + i * 30, item.line, {
      fontFamily: 'monospace', fontSize: '18px', color: '#16e0e0',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerover', function (this: Phaser.GameObjects.Text) { this.setColor('#ffffff'); })
      .on('pointerout', function (this: Phaser.GameObjects.Text) { this.setColor('#16e0e0'); })
      .on('pointerdown', () => { this.sound.play('sfx-ui-select', { volume: uiVol() }); item.tap(); }));

    // Big tap-to-start zone (mobile): a tap anywhere in the upper area starts a climb
    // instantly, so players don't have to hit the small "Climb" text. The secondary
    // option rows below (y >= 380) stay individually tappable.
    const tapText = this.add.text(cx, 340, '▶  TAP TO CLIMB  ◀', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffd166',
    }).setOrigin(0.5);
    this.tweens.add({ targets: tapText, scale: 1.07, alpha: 0.75, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.rectangle(0, 0, TUNING.width, 365, 0xffffff, 0).setOrigin(0, 0).setDepth(50)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('Game', { daily: false }));

    const kb = this.input.keyboard!;
    kb.once('keydown-SPACE', () => this.scene.start('Game', { daily: false }));
    kb.once('keydown-D', () => this.scene.start('Game', { daily: true }));
    kb.once('keydown-C', () => this.scene.start('Shop'));
    kb.once('keydown-K', () => this.scene.start('LevelSelect'));
    // NOT `once`: coexists with the debug-panel J handler below (copy JSON),
    // which no-ops when the panel is closed; this one no-ops while it's open.
    kb.on('keydown-J', () => {
      if (this.debugPanel) return; // F9 debug panel owns J (copy JSON) while open
      this.scene.start('Journal');
    });
    kb.once('keydown-A', () => this.scene.start('Achievements'));
    kb.once('keydown-H', () => this.scene.start('HowTo'));
    kb.once('keydown-N', () => this.scene.start('Changelog'));
    kb.once('keydown-S', () => this.scene.start('Settings', { from: 'Menu' }));
    if (leaderboard.enabled) kb.once('keydown-L', () => this.scene.start('Leaderboard'));
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

    // Animated lava strip along the bottom + rising embers.
    this.lavaStrip = this.add.tileSprite(cx, TUNING.height - 20, TUNING.width, 40, 'lava').setDepth(1);
    if (!this.textures.exists('px4')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4);
      g.generateTexture('px4', 4, 4);
      g.destroy();
    }
    this.add.particles(0, TUNING.height - 40, 'px4', {
      x: { min: 0, max: TUNING.width }, speedY: { min: -60, max: -25 }, speedX: { min: -8, max: 8 },
      lifespan: 1800, scale: { start: 1, end: 0 }, alpha: { start: 0.8, end: 0 },
      tint: [0xff8a3d, 0xff4d00, 0xffd166], frequency: 90,
    }).setDepth(2);

    // Tappable build label bottom-left; also opens the changelog.
    this.add.text(6, TUNING.height - 16, BUILD_LABEL, { fontFamily: 'monospace', fontSize: '11px', color: '#5a6472' })
      .setScrollFactor(0).setDepth(80).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('Changelog'));

    if (import.meta.env.DEV) this.devOverlay = new DevOverlay(this);

    // Auto-show What's New once after a version change (confirms a fresh deploy landed).
    // Set lastSeenVersion BEFORE starting so the return to Menu doesn't re-open (no loop).
    const autoShowingChangelog = save.get().lastSeenVersion !== APP_VERSION;
    if (autoShowingChangelog) {
      save.update((b) => { b.lastSeenVersion = APP_VERSION; });
      this.scene.start('Changelog');
    }

    // First-run leaderboard name prompt (once): only when online play is available and the
    // player hasn't set a name. Deferred past a What's-New boot (scene.start is queued, not
    // synchronous — execution would fall through here) so the overlay never stacks on the
    // Changelog scene; the flag stays unset when deferred, so it offers cleanly next boot.
    // Skipping keeps the generated handle at submit.
    if (leaderboard.enabled && !save.get().identity.name && !save.get().leaderboardPrompted
        && !autoShowingChangelog) {
      save.update((b) => { b.leaderboardPrompted = true; });
      void promptName('').then((name) => {
        if (name) save.update((b) => { b.identity.name = name; });
      });
    }
  }

  update(_time: number, delta: number): void {
    this.lavaStrip.tilePositionX += delta * 0.02;
    this.devOverlay?.update();
  }
}

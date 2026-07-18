import Phaser from 'phaser';
import { characterAnims } from '../animManifest';
import { CHARACTERS, FRAME_NAMES, staticKey, frameKey } from '../core/characters';
import { TUNING } from '../tuning';
import { VERSION_LABEL } from '../core/buildInfo';
import { save } from '../main';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload(): void {
    const cx = TUNING.width / 2, cy = TUNING.height / 2;
    this.add.text(cx, cy - 64, 'LAVA LEAP', { fontFamily: 'monospace', fontSize: '42px', color: '#ff7b00' }).setOrigin(0.5);
    this.add.rectangle(cx, cy, 322, 16, 0x2a2a3e).setOrigin(0.5);
    const bar = this.add.rectangle(cx - 159, cy, 0, 10, 0xff7b00).setOrigin(0, 0.5);
    const pct = this.add.text(cx, cy + 30, 'loading… 0%', { fontFamily: 'monospace', fontSize: '13px', color: '#888888' }).setOrigin(0.5);
    this.add.text(cx, cy + 56, 'Loading Lava Leap…', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9aa4b2' }).setOrigin(0.5);
    this.add.text(cx, cy + 76, `Build: ${VERSION_LABEL}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#5a6472' }).setOrigin(0.5);
    this.load.on('progress', (p: number) => {
      bar.width = Math.round(318 * p);
      pct.setText(`loading… ${Math.round(p * 100)}%`);
    });

    this.load.image('platform', 'assets/platform.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.image('lava', 'assets/lava-tile.png');
    this.load.image('enemy-crawler', 'assets/enemies/crawler.png');
    this.load.image('enemy-drifter', 'assets/enemies/drifter.png');
    this.load.image('boss-titan', 'assets/boss/titan.png');
    // Hand-painted zone environments (parallax far backdrop) + UI screen art.
    // Optional: GameScene / MenuScene / GameOverScene fall back to procedural
    // rendering when these textures aren't present.
    for (let z = 0; z < 4; z++) this.load.image(`bg-z${z}`, `assets/backgrounds/bg-z${z}.jpg`);
    this.load.image('bg-menu', 'assets/backgrounds/menu.jpg');
    this.load.image('bg-victory', 'assets/backgrounds/victory.jpg');
    this.load.image('bg-gameover', 'assets/backgrounds/gameover.jpg');
    // Pattern textures (UI backdrops, ambient overlays, menu accents).
    this.load.image('ui-plate', 'assets/ui-plate.png');
    this.load.image('ash', 'assets/ash.png');
    this.load.image('grid', 'assets/grid.png');
    this.load.image('ember', 'assets/ember.png');
    this.load.image('titan-emblem', 'assets/titan-emblem.png');
    for (const c of CHARACTERS) {
      this.load.image(staticKey(c.id), `assets/characters/${c.id}/player.png`);
      for (const name of FRAME_NAMES) {
        this.load.image(frameKey(c.id, name), `assets/characters/${c.id}/${name}.png`);
      }
    }
    this.load.audio('sfx-jump', 'assets/sfx/jump.wav');
    this.load.audio('sfx-coin', 'assets/sfx/coin.wav');
    this.load.audio('sfx-death', 'assets/sfx/death.wav');
    for (const k of ['music-menu', 'rumble', 'scrape', 'crack', 'swell', 'ding', 'kaching', 'ui-move', 'ui-select', 'stomp', 'hit', 'pickup', 'expire', 'boss-roar', 'projectile']) {
      this.load.audio(`sfx-${k}`, `assets/sfx/${k}.wav`);
    }
    // Custom gameplay track (user-supplied). OGG first, MP3 fallback for iOS/Safari.
    this.load.audio('sfx-music-game', ['assets/music/gameplay.ogg', 'assets/music/gameplay.mp3']);
  }

  create(): void {
    for (const c of CHARACTERS) {
      for (const def of characterAnims(c.id)) {
        if (this.anims.exists(def.key)) continue;
        this.anims.create({
          key: def.key,
          frames: def.frames.map((f) => ({ key: f })),
          frameRate: def.frameRate,
          repeat: def.repeat,
        });
      }
    }
    // First-ever boot (no runs yet, vignette never seen) opens on the story
    // opening cutscene; everyone else goes straight to the Menu (replay lives
    // in the Journal).
    const b = save.get();
    const freshPlayer = b.analytics.runs === 0 && !b.tutorialDone;
    if (!b.story.vignetteSeen && freshPlayer) {
      this.scene.start('Cutscene', { ids: ['opening'], then: { scene: 'Menu' } });
    } else {
      this.scene.start('Menu');
    }
  }
}

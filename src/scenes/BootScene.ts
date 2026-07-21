import Phaser from 'phaser';
import { characterAnims } from '../animManifest';
import { CHARACTERS, CLIMBER_CHARACTER, FRAME_NAMES, staticKey, frameKey } from '../core/characters';
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

    // Lava Titan production art. These are the two approved files uploaded to public/assets/boss.
    // IMG_0186.png = Titan-only atlas (6 columns, 253x141 cells).
    // IMG_0198.png = 3-frame fireball atlas (476x110 cells).
    this.load.spritesheet('boss-titan-sheet', 'assets/boss/IMG_0186.png?v=titan-production-1', {
      frameWidth: 253,
      frameHeight: 141,
    });
    this.load.spritesheet('boss-fireball-sheet', 'assets/boss/IMG_0198.png?v=titan-production-1', {
      frameWidth: 476,
      frameHeight: 110,
    });

    for (let z = 0; z < 4; z++) this.load.image(`bg-z${z}`, `assets/backgrounds/bg-z${z}.jpg`);
    this.load.image('bg-menu', 'assets/backgrounds/menu.jpg');
    this.load.image('bg-victory', 'assets/backgrounds/victory.jpg');
    this.load.image('bg-gameover', 'assets/backgrounds/gameover.jpg');
    this.load.image('ui-plate', 'assets/ui-plate.png');
    this.load.image('ash', 'assets/ash.png');
    this.load.image('grid', 'assets/grid.png');
    this.load.image('ember', 'assets/ember.png');
    this.load.image('titan-emblem', 'assets/titan-emblem.png');
    for (const c of CHARACTERS) {
      if (c.id === CLIMBER_CHARACTER) {
        // Cache-busted full master atlas. All Climber states now resolve from this one source.
        this.load.spritesheet('climber-sheet', 'assets/characters/climber/climber-full-master-production-atlas.png?v=full-master-51', {
          frameWidth: 422,
          frameHeight: 434,
        });
        continue;
      }
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
    this.load.audio('sfx-music-game', ['assets/music/gameplay.ogg', 'assets/music/gameplay.mp3']);
  }

  create(): void {
    for (const c of CHARACTERS) {
      for (const def of characterAnims(c.id)) {
        if (this.anims.exists(def.key)) this.anims.remove(def.key);
        const frames = def.sheetKey
          ? this.anims.generateFrameNumbers(def.sheetKey, { frames: def.frames as number[] })
          : def.frames.map((key) => ({ key: String(key) }));
        this.anims.create({
          key: def.key,
          frames,
          frameRate: def.frameRate,
          repeat: def.repeat,
        });
      }
    }

    // Production Lava Titan animation map from the uploaded atlas.
    const bossAnimations = [
      { key: 'boss-titan-idle', frames: [0, 1, 2, 3, 4, 5], frameRate: 5, repeat: -1 },
      { key: 'boss-titan-attack', frames: [6, 7, 8, 9, 10, 11], frameRate: 10, repeat: 0 },
      { key: 'boss-titan-fireball', frames: [12, 13, 14, 15, 16, 17], frameRate: 9, repeat: 0 },
      { key: 'boss-titan-stomp', frames: [18, 19, 20, 21, 22, 23], frameRate: 8, repeat: 0 },
      { key: 'boss-titan-defeat', frames: [24, 25, 26], frameRate: 5, repeat: 0 },
    ];
    for (const def of bossAnimations) {
      if (this.anims.exists(def.key)) this.anims.remove(def.key);
      this.anims.create({
        key: def.key,
        frames: this.anims.generateFrameNumbers('boss-titan-sheet', { frames: def.frames }),
        frameRate: def.frameRate,
        repeat: def.repeat,
      });
    }
    if (this.anims.exists('boss-fireball-fly')) this.anims.remove('boss-fireball-fly');
    this.anims.create({
      key: 'boss-fireball-fly',
      frames: this.anims.generateFrameNumbers('boss-fireball-sheet', { frames: [0, 1, 2] }),
      frameRate: 12,
      repeat: -1,
    });

    const b = save.get();
    const freshPlayer = b.analytics.runs === 0 && !b.tutorialDone;
    if (!b.story.vignetteSeen && freshPlayer) {
      this.scene.start('Cutscene', { ids: ['opening'], then: { scene: 'Menu' } });
    } else {
      this.scene.start('Menu');
    }
  }
}

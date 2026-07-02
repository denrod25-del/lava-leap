import Phaser from 'phaser';
import { ANIM_FRAME_KEYS, PLAYER_ANIMS } from '../animManifest';
import { TUNING } from '../tuning';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload(): void {
    const cx = TUNING.width / 2, cy = TUNING.height / 2;
    this.add.text(cx, cy - 64, 'LAVA LEAP', { fontFamily: 'monospace', fontSize: '42px', color: '#ff7b00' }).setOrigin(0.5);
    this.add.rectangle(cx, cy, 322, 16, 0x2a2a3e).setOrigin(0.5);
    const bar = this.add.rectangle(cx - 159, cy, 0, 10, 0xff7b00).setOrigin(0, 0.5);
    const pct = this.add.text(cx, cy + 30, 'loading… 0%', { fontFamily: 'monospace', fontSize: '13px', color: '#888888' }).setOrigin(0.5);
    this.load.on('progress', (p: number) => {
      bar.width = Math.round(318 * p);
      pct.setText(`loading… ${Math.round(p * 100)}%`);
    });

    this.load.image('player', 'assets/player.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.image('lava', 'assets/lava-tile.png');
    this.load.image('enemy-crawler', 'assets/enemies/crawler.png');
    this.load.image('enemy-drifter', 'assets/enemies/drifter.png');
    this.load.image('boss-titan', 'assets/boss/titan.png');
    for (const key of ANIM_FRAME_KEYS) this.load.image(key, `assets/anim/${key}.png`);
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
    for (const def of PLAYER_ANIMS) {
      if (this.anims.exists(def.key)) continue;
      this.anims.create({
        key: def.key,
        frames: def.frames.map((f) => ({ key: f })),
        frameRate: def.frameRate,
        repeat: def.repeat,
      });
    }
    this.scene.start('Menu');
  }
}

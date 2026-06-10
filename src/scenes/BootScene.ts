import Phaser from 'phaser';
import { ANIM_FRAME_KEYS, PLAYER_ANIMS } from '../animManifest';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload(): void {
    this.load.image('player', 'assets/player.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.image('lava', 'assets/lava-tile.png');
    for (const key of ANIM_FRAME_KEYS) this.load.image(key, `assets/anim/${key}.png`);
    this.load.audio('sfx-jump', 'assets/sfx/jump.wav');
    this.load.audio('sfx-coin', 'assets/sfx/coin.wav');
    this.load.audio('sfx-death', 'assets/sfx/death.wav');
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

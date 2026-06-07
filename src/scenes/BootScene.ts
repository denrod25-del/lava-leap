import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload(): void {
    this.load.image('player', 'assets/player.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.image('lava', 'assets/lava-tile.png');
    this.load.audio('sfx-jump', 'assets/sfx/jump.wav');
    this.load.audio('sfx-coin', 'assets/sfx/coin.wav');
    this.load.audio('sfx-death', 'assets/sfx/death.wav');
  }

  create(): void {
    this.scene.start('Menu');
  }
}

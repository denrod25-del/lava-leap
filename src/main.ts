import Phaser from 'phaser';
import { TUNING } from './tuning';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: TUNING.width,
  height: TUNING.height,
  backgroundColor: '#10101a',
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: TUNING.gravityY }, debug: false } },
  scene: [],
};

// eslint-disable-next-line @typescript-eslint/no-new
new Phaser.Game(config);

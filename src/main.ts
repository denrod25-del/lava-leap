import Phaser from 'phaser';
import { TUNING } from './tuning';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: TUNING.width,
  height: TUNING.height,
  backgroundColor: '#10101a',
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: TUNING.gravityY }, debug: false } },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
};

const game = new Phaser.Game(config);

// Dispose the game on HMR so editing source during development doesn't
// stack multiple Phaser.Game instances into #game.
if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy(true));
}

// Expose the game in dev for debugging/automated verification (stripped in prod build).
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}

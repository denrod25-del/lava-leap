import Phaser from 'phaser';
import { TUNING } from './tuning';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#10101a',
  pixelArt: true, // crisp upscaling of the pixel-art sprites
  scale: {
    mode: Phaser.Scale.FIT, // scale the 480x720 design space up to fill the window
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: TUNING.width,
    height: TUNING.height,
  },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: TUNING.gravityY }, debug: false } },
  scene: [BootScene, MenuScene, GameScene, HudScene, GameOverScene],
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

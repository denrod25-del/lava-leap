import Phaser from 'phaser';
import { TUNING } from './tuning';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ShopScene } from './scenes/ShopScene';
import { AchievementsScene } from './scenes/AchievementsScene';
import { HowToScene } from './scenes/HowToScene';
import { PauseScene } from './scenes/PauseScene';
import { SettingsScene } from './scenes/SettingsScene';
import { SaveData } from './core/SaveData';

/** Single shared save — all scenes import this. */
export const save = new SaveData(window.localStorage);

let crashShown = false;
function showCrashOverlay(message: string): void {
  if (crashShown) return;
  crashShown = true;
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;background:#10101a;color:#fff;display:flex;'
    + 'flex-direction:column;align-items:center;justify-content:center;z-index:9999;'
    + 'font-family:monospace;cursor:pointer;text-align:center;padding:20px';
  div.innerHTML = '<div style="font-size:28px;color:#ff7b00;margin-bottom:12px">Something went wrong</div>'
    + '<div style="font-size:16px;margin-bottom:20px">Click anywhere to reload the game.</div>'
    + `<div style="font-size:11px;color:#777;max-width:420px;word-break:break-all">${message}</div>`;
  div.addEventListener('click', () => location.reload());
  document.body.appendChild(div);
}

window.addEventListener('error', (e) => showCrashOverlay(e.message));
window.addEventListener('unhandledrejection', (e) => showCrashOverlay(String(e.reason)));

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#10101a',
  pixelArt: true, // crisp upscaling of the pixel-art sprites
  scale: {
    mode: Phaser.Scale.FIT, // scale the 480x720 design space up to fill the window
    // The #game flexbox centers the canvas. Phaser's autoCenter would ALSO add
    // centering margins on top of that, double-centering and pushing the canvas
    // off to the right — so we let flex own centering and disable Phaser's.
    autoCenter: Phaser.Scale.NO_CENTER,
    width: TUNING.width,
    height: TUNING.height,
  },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: TUNING.gravityY }, debug: false } },
  scene: [BootScene, MenuScene, GameScene, HudScene, GameOverScene, ShopScene, AchievementsScene, HowToScene, PauseScene, SettingsScene],
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

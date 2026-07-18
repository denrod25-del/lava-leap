import Phaser from 'phaser';
import { TUNING } from '../tuning';

/**
 * Forged-metal panel backdrop for the plain UI scenes (pause / shop / settings).
 * A tiled `ui-plate` texture under a dark scrim so light monospace text stays
 * legible. `plateAlpha < 1` lets a dimmed game peek through on overlay scenes
 * (Pause). Falls back to a plain dark rectangle if the texture isn't loaded.
 */
export function addUiBackdrop(scene: Phaser.Scene, plateAlpha = 1, scrim = 0.4): void {
  if (!scene.textures.exists('ui-plate')) {
    scene.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x000000, 0.7)
      .setOrigin(0, 0).setDepth(-20);
    return;
  }
  scene.add.tileSprite(0, 0, TUNING.width, TUNING.height, 'ui-plate')
    .setOrigin(0, 0).setDepth(-20).setAlpha(plateAlpha);
  scene.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x0a0508, scrim)
    .setOrigin(0, 0).setDepth(-19);
}

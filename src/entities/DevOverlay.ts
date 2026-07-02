import Phaser from 'phaser';
import { VERSION_LABEL, BUILD_DATE } from '../core/buildInfo';

/** Dev-only readout (top-left): active scene, FPS, version, build date. Created only
 *  under import.meta.env.DEV, so it is dead-code-eliminated from production builds. */
export class DevOverlay {
  private text: Phaser.GameObjects.Text;
  constructor(private scene: Phaser.Scene) {
    this.text = scene.add.text(6, 6, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#7ad9e8', backgroundColor: '#00000080', padding: { x: 4, y: 3 },
    }).setScrollFactor(0).setDepth(999);
  }
  update(): void {
    const fps = Math.round(this.scene.game.loop.actualFps);
    this.text.setText(`${this.scene.scene.key} · ${fps}fps · ${VERSION_LABEL} · ${BUILD_DATE}`);
  }
}

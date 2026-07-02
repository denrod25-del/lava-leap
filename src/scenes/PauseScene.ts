import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';
import { track } from '../core/track';

const OPTIONS = ['Resume', 'Restart', 'Settings', 'Quit to Menu'] as const;

export class PauseScene extends Phaser.Scene {
  private idx = 0;
  private rows: Phaser.GameObjects.Text[] = [];

  constructor() { super('Pause'); }

  create(): void {
    const cx = TUNING.width / 2;
    this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x000000, 0.6).setOrigin(0, 0);
    this.add.text(cx, 200, 'PAUSED', { fontFamily: 'monospace', fontSize: '36px', color: '#ffb066' }).setOrigin(0.5);
    this.rows = OPTIONS.map((o, i) =>
      this.add.text(cx, 290 + i * 40, o, { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.idx = i; this.render(); this.choose(); }),
    );
    const kb = this.input.keyboard!;
    const uiVol = () => 0.3 * (save.get().settings.sfxVol / 10);
    kb.on('keydown-UP', () => { this.idx = (this.idx + OPTIONS.length - 1) % OPTIONS.length; this.render(); this.sound.play('sfx-ui-move', { volume: uiVol() }); });
    kb.on('keydown-DOWN', () => { this.idx = (this.idx + 1) % OPTIONS.length; this.render(); this.sound.play('sfx-ui-move', { volume: uiVol() }); });
    kb.on('keydown-ESC', () => this.resume());
    kb.on('keydown-ENTER', () => this.choose());
    kb.on('keydown-SPACE', () => this.choose());
    this.render();
  }

  private render(): void {
    this.rows.forEach((r, i) => r.setText(`${i === this.idx ? '> ' : '  '}${OPTIONS[i]}`)
      .setColor(i === this.idx ? '#16e0e0' : '#ffffff'));
  }

  private resume(): void {
    this.scene.stop();
    this.scene.resume('Game');
  }

  private choose(): void {
    this.sound.play('sfx-ui-select', { volume: 0.35 * (save.get().settings.sfxVol / 10) });
    const pick = OPTIONS[this.idx];
    if (pick === 'Resume') this.resume();
    else if (pick === 'Settings') { this.scene.launch('Settings', { from: 'Pause' }); this.scene.pause(); }
    else if (pick === 'Restart') this.endRun('restart');
    else this.endRun('menu');
  }

  private endRun(target: 'restart' | 'menu'): void {
    track(target === 'restart' ? 'restart' : 'quit_run', {});
    type GS = Phaser.Scene & { endRunBookkeeping(h: number): unknown; daily: boolean };
    const gs = this.scene.get('Game') as GS;
    gs.endRunBookkeeping(0); // banks coins (spec: quit/restart banks silently)
    const daily = gs.daily;
    this.scene.stop('Hud');
    this.scene.stop('Game');
    this.scene.stop();
    if (target === 'restart') this.scene.start('Game', { daily });
    else this.scene.start('Menu');
  }
}

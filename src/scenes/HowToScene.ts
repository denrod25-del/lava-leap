import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';

export class HowToScene extends Phaser.Scene {
  constructor() { super('HowTo'); }

  create(): void {
    const cx = TUNING.width / 2;
    const touch = this.sys.game.device.input.touch || navigator.maxTouchPoints > 0;
    this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x0e0e1a, 1).setOrigin(0, 0);
    this.add.text(cx, 70, 'HOW TO PLAY', { fontFamily: 'monospace', fontSize: '30px', color: '#ffb066' }).setOrigin(0.5);
    this.add.text(cx, 120, 'Climb. Outrun the lava.\nChain stomps & coins for combo score.\nStay airborne & dash to build FLOW — hotter = bigger score.', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);

    const scheme = save.get().settings.controlScheme;
    const controls = !touch
      ? ['←/→ or A/D      run', '↓ or S          fast fall',
         'SPACE / ↑        jump (hold = higher, again = double)',
         'SHIFT / X        air dash — jump mid-dash to launch!', 'P / ESC          pause']
      : scheme === 'auto'
        ? ['HOLD ANYWHERE    steer toward your finger',
           'JUMPING          automatic — just steer!',
           'TAP              air dash (kills enemies)',
           'TAP MID-DASH     launch — keep your FLOW hot!',
           'Settings → CONTROLS to switch to MANUAL']
        : ['HOLD LEFT SIDE   run (slide = analog speed)',
           'PULL STICK DOWN  fast fall',
           'TAP RIGHT SIDE   jump / double / TRIPLE jump',
           'DASH BUTTON      air dash — jump mid-dash to launch!',
           'Settings → CONTROLS to switch to AUTO'];
    this.add.text(cx, 205, 'CONTROLS', { fontFamily: 'monospace', fontSize: '18px', color: '#16e0e0' }).setOrigin(0.5);
    this.add.text(cx, 240 + controls.length * 11, controls.join('\n'), {
      fontFamily: 'monospace', fontSize: '14px', color: '#cfd8e3', lineSpacing: 8,
    }).setOrigin(0.5);

    const legend = [
      ['#e63946', 'ENEMIES — stomp from above or dash through; touching them is lethal'],
      ['#66ddff', 'POWER-UPS — shield · rocket · magnet · slow-lava'],
      ['#6b5a44', 'BOUNCE PADS — launch you high, keep your combo alive'],
      ['#7a1020', 'THE LAVA TITAN — rises at 1000m · survive its fireballs'],
    ] as const;
    this.add.text(cx, 375, 'WATCH FOR', { fontFamily: 'monospace', fontSize: '18px', color: '#16e0e0' }).setOrigin(0.5);
    legend.forEach(([color, line], i) => {
      this.add.text(cx, 410 + i * 26, line, { fontFamily: 'monospace', fontSize: '12px', color }).setOrigin(0.5);
    });

    const back = () => {
      this.sound.play('sfx-ui-select', { volume: 0.35 * (save.get().settings.sfxVol / 10) });
      this.scene.start('Menu'); // scene.start STOPS this scene — required, or black screen
    };
    this.add.text(cx, 620, '[ BACK ]', { fontFamily: 'monospace', fontSize: '22px', color: '#16e0e0' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', back);
    this.input.keyboard!.once('keydown-ESC', back);
  }
}

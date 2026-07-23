import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';

/**
 * ShowcaseScene is the cinematic front door for the public-facing Lava Leap demo.
 * It deliberately reuses the real campaign gameplay instead of simulating a trailer.
 */
export class ShowcaseScene extends Phaser.Scene {
  private launched = false;

  constructor() { super('Showcase'); }

  create(): void {
    this.sound.stopAll();
    this.cameras.main.setBackgroundColor('#050203');

    const cx = TUNING.width / 2;

    if (this.textures.exists('bg-menu')) {
      this.add.image(0, 0, 'bg-menu')
        .setOrigin(0, 0)
        .setDisplaySize(TUNING.width, TUNING.height)
        .setAlpha(0)
        .setDepth(-10)
        .setName('showcase-bg');
    }

    const scrim = this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x050203, 1)
      .setOrigin(0, 0)
      .setDepth(-9);

    const eyebrow = this.add.text(cx, 205, 'INITIAL SHOWCASE DEMO', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffb066', letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0);

    const title = this.add.text(cx, 275, 'LAVA LEAP', {
      fontFamily: 'monospace', fontSize: '52px', color: '#ff7b00',
    }).setOrigin(0.5).setAlpha(0).setScale(0.86);

    const hook = this.add.text(cx, 345, 'THE LAVA NEVER STOPS RISING.', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', align: 'center',
      wordWrap: { width: 420 },
    }).setOrigin(0.5).setAlpha(0);

    const sub = this.add.text(cx, 405, 'Climb. Chain your movement. Survive the Titan.', {
      fontFamily: 'monospace', fontSize: '13px', color: '#aeb4c0', align: 'center',
      wordWrap: { width: 400 },
    }).setOrigin(0.5).setAlpha(0);

    const prompt = this.add.text(cx, 525, '▶  START THE SHOWCASE  ◀', {
      fontFamily: 'monospace', fontSize: '19px', color: '#ffd166',
    }).setOrigin(0.5).setAlpha(0);

    const skip = this.add.text(cx, 665, 'SPACE / TAP — enter demo     ESC — back', {
      fontFamily: 'monospace', fontSize: '11px', color: '#697180',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: scrim, alpha: 0.28, duration: 1100, ease: 'Sine.easeOut' });
    const bg = this.children.getByName('showcase-bg') as Phaser.GameObjects.Image | null;
    if (bg) this.tweens.add({ targets: bg, alpha: 0.5, duration: 1500, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: eyebrow, alpha: 1, y: 195, duration: 500, delay: 250 });
    this.tweens.add({ targets: title, alpha: 1, scale: 1, duration: 700, delay: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: hook, alpha: 1, duration: 600, delay: 950 });
    this.tweens.add({ targets: sub, alpha: 1, duration: 600, delay: 1250 });
    this.tweens.add({ targets: [prompt, skip], alpha: 1, duration: 500, delay: 1650 });
    this.tweens.add({ targets: prompt, scale: 1.06, duration: 650, yoyo: true, repeat: -1, delay: 2200 });

    const launch = (): void => {
      if (this.launched) return;
      this.launched = true;
      this.sound.play('sfx-ui-select', { volume: 0.4 * (save.get().settings.sfxVol / 10) });
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(360, () => {
        // The first campaign level already contains the complete real gameplay loop:
        // movement, enemies, power-ups, hazards, combo/flow and a Titan encounter.
        this.scene.start('Game', { levelId: 'level-1' });
      });
    };

    // Single full-width hit area handles taps/clicks; it covers the prompt text,
    // so the prompt itself carries no handler (it would never receive the event).
    this.add.rectangle(0, 0, TUNING.width, TUNING.height - 80, 0xffffff, 0)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', launch);

    const kb = this.input.keyboard!;
    kb.once('keydown-SPACE', launch);
    kb.once('keydown-ENTER', launch);
    kb.once('keydown-ESC', () => {
      if (this.launched) return;
      this.launched = true;
      this.scene.start('Menu');
    });
  }
}

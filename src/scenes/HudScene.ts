import Phaser from 'phaser';
import { TUNING } from '../tuning';

export class HudScene extends Phaser.Scene {
  private heightText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private puText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private comboBar?: Phaser.GameObjects.Rectangle;
  private flowTrack?: Phaser.GameObjects.Rectangle;
  private flowFill?: Phaser.GameObjects.Rectangle;
  private flowLabel?: Phaser.GameObjects.Text;
  private toastQueue: string[] = [];
  private toastShowing = false;

  constructor() { super('Hud'); }

  create(): void {
    this.toastQueue = [];
    this.toastShowing = false;

    // Brand watermark, bottom-left (the only HUD-free corner). It rides the same
    // canvas the ClipRecorder captures, so every shared clip carries the logo.
    this.add.image(12, TUNING.height - 12, 'watermark').setOrigin(0, 1).setDisplaySize(96, 82).setAlpha(0.45);

    this.heightText = this.add.text(12, 12, 'Height: 0', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' });
    this.coinText = this.add.text(12, 36, 'Coins: 0', { fontFamily: 'monospace', fontSize: '18px', color: '#ffd166' });

    this.registry.events.on('changedata-zoneBanner', (_p: unknown, name: string) => this.showBanner(name));
    this.registry.events.on('changedata-toast', (_p: unknown, text: string) => this.queueToast(text));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off('changedata-zoneBanner');
      this.registry.events.off('changedata-toast');
    });
  }

  update(): void {
    const h = this.registry.get('height') ?? 0;
    const c = this.registry.get('coins') ?? 0;
    this.heightText.setText(`Height: ${h}`);
    this.coinText.setText(`Coins: ${c}`);

    const pu = this.registry.get('powerup') as { kind: string | null; shield: boolean; remainMs: number } | undefined;
    this.puText?.destroy();
    this.puText = undefined;
    if (pu && (pu.kind || pu.shield)) {
      const label = pu.shield ? 'SHIELD' : `${pu.kind!.toUpperCase()} ${(pu.remainMs / 1000).toFixed(1)}s`;
      this.puText = this.add.text(TUNING.width - 12, 12, label, {
        fontFamily: 'monospace', fontSize: '14px', color: '#66ddff',
      }).setOrigin(1, 0);
    }

    const combo = this.registry.get('combo') as { multiplier: number; remaining01: number } | undefined;
    this.comboText?.destroy(); this.comboText = undefined;
    this.comboBar?.destroy(); this.comboBar = undefined;
    if (combo && combo.multiplier > 1) {
      const cx = TUNING.width / 2;
      this.comboText = this.add.text(cx, 36, `x${combo.multiplier.toFixed(1)}`, {
        fontFamily: 'monospace', fontSize: '22px', color: '#ffcf4d',
      }).setOrigin(0.5, 0).setDepth(25);
      this.comboBar = this.add.rectangle(cx - 40, 64, 80 * combo.remaining01, 4, 0xffcf4d)
        .setOrigin(0, 0).setDepth(25);
    }

    // Flow meter: slim vertical bar on the right edge (visual only — never interactive,
    // so it can't eat the right-half tap-to-jump zone on touch).
    const flow = this.registry.get('flow') as
      { value: number; tier: number; name: string; multiplier: number } | undefined;
    this.flowTrack?.destroy(); this.flowTrack = undefined;
    this.flowFill?.destroy(); this.flowFill = undefined;
    this.flowLabel?.destroy(); this.flowLabel = undefined;
    if (flow && flow.value > 0.02) {
      const colors = [0x9ad1ff, 0xffd166, 0xff8a3d, 0xff4d00];       // COOL→BLAZING
      const labelColors = ['#9ad1ff', '#ffd166', '#ff8a3d', '#ff4d00'];
      const x = TUNING.width - 18, top = 120, hMax = 160;
      this.flowTrack = this.add.rectangle(x, top, 8, hMax, 0x000000, 0.35)
        .setOrigin(0.5, 0).setDepth(25);
      const h = Math.max(2, Math.round(hMax * flow.value));
      this.flowFill = this.add.rectangle(x, top + hMax - h, 8, h, colors[flow.tier])
        .setOrigin(0.5, 0).setDepth(26);
      if (flow.tier > 0) {
        this.flowLabel = this.add.text(x + 4, top + hMax + 8, `${flow.name} ×${flow.multiplier}`, {
          fontFamily: 'monospace', fontSize: '11px', color: labelColors[flow.tier],
        }).setOrigin(1, 0).setDepth(26);
      }
    }
  }

  private showBanner(name: string): void {
    const t = this.add.text(TUNING.width / 2, 140, name, {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffb066',
    }).setOrigin(0.5).setAlpha(0).setDepth(30);
    this.tweens.add({
      targets: t, alpha: 1, duration: 300, yoyo: true, hold: 1400,
      onComplete: () => t.destroy(),
    });
  }

  private queueToast(text: string): void {
    this.toastQueue.push(text);
    if (!this.toastShowing) this.nextToast();
  }

  private nextToast(): void {
    const text = this.toastQueue.shift();
    if (!text) { this.toastShowing = false; return; }
    this.toastShowing = true;
    const t = this.add.text(TUNING.width / 2, 70, `★ ${text}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffd166',
      backgroundColor: '#1a0906', padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setAlpha(0).setDepth(40);
    this.tweens.add({
      targets: t, alpha: 1, duration: 250, yoyo: true, hold: 2000,
      onComplete: () => { t.destroy(); this.nextToast(); },
    });
  }
}

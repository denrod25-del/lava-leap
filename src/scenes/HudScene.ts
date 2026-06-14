import Phaser from 'phaser';
import { TUNING } from '../tuning';

export class HudScene extends Phaser.Scene {
  private heightText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private puText?: Phaser.GameObjects.Text;
  private toastQueue: string[] = [];
  private toastShowing = false;

  constructor() { super('Hud'); }

  create(): void {
    this.toastQueue = [];
    this.toastShowing = false;

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

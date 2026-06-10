import Phaser from 'phaser';

export class HudScene extends Phaser.Scene {
  private heightText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;

  constructor() { super('Hud'); }

  create(): void {
    this.heightText = this.add.text(12, 12, 'Height: 0', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' });
    this.coinText = this.add.text(12, 36, 'Coins: 0', { fontFamily: 'monospace', fontSize: '18px', color: '#ffd166' });

    this.registry.events.on('changedata-zoneBanner', (_p: unknown, name: string) => this.showBanner(name));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off('changedata-zoneBanner');
    });
  }

  update(): void {
    const h = this.registry.get('height') ?? 0;
    const c = this.registry.get('coins') ?? 0;
    this.heightText.setText(`Height: ${h}`);
    this.coinText.setText(`Coins: ${c}`);
  }

  private showBanner(name: string): void {
    const t = this.add.text(240, 140, name, {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffb066',
    }).setOrigin(0.5).setAlpha(0).setDepth(30);
    this.tweens.add({
      targets: t, alpha: 1, duration: 300, yoyo: true, hold: 1400,
      onComplete: () => t.destroy(),
    });
  }
}

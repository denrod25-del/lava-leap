import Phaser from 'phaser';

export class HudScene extends Phaser.Scene {
  private heightText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;

  constructor() { super('Hud'); }

  create(): void {
    this.heightText = this.add.text(12, 12, 'Height: 0', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' });
    this.coinText = this.add.text(12, 36, 'Coins: 0', { fontFamily: 'monospace', fontSize: '18px', color: '#ffd166' });
  }

  update(): void {
    const h = this.registry.get('height') ?? 0;
    const c = this.registry.get('coins') ?? 0;
    this.heightText.setText(`Height: ${h}`);
    this.coinText.setText(`Coins: ${c}`);
  }
}

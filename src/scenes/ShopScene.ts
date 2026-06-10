import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';

export interface CosmeticDef { id: string; name: string; tint: number; price: number }

export const COSMETICS: CosmeticDef[] = [
  { id: 'default', name: 'Default', tint: 0xffffff, price: 0 },
  { id: 'crimson', name: 'Crimson', tint: 0xff5a5a, price: 50 },
  { id: 'gold', name: 'Gold', tint: 0xffd166, price: 100 },
  { id: 'emerald', name: 'Emerald', tint: 0x5bd98a, price: 200 },
  { id: 'void', name: 'Void', tint: 0x8a7aff, price: 350 },
  { id: 'frost', name: 'Frost', tint: 0xa3e8ff, price: 500 },
];

export class ShopScene extends Phaser.Scene {
  private idx = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private bankText!: Phaser.GameObjects.Text;

  constructor() { super('Shop'); }

  create(): void {
    const cx = TUNING.width / 2;
    this.add.text(cx, 60, 'SHOP', { fontFamily: 'monospace', fontSize: '32px', color: '#ffd166' }).setOrigin(0.5);
    this.bankText = this.add.text(cx, 100, '', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    this.rows = COSMETICS.map((_c, i) =>
      this.add.text(cx, 160 + i * 36, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5),
    );
    this.add.text(cx, 620, '↑/↓ select · ENTER buy/equip · ESC back', {
      fontFamily: 'monospace', fontSize: '13px', color: '#888888',
    }).setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => { this.idx = (this.idx + COSMETICS.length - 1) % COSMETICS.length; this.render(); });
    kb.on('keydown-DOWN', () => { this.idx = (this.idx + 1) % COSMETICS.length; this.render(); });
    kb.on('keydown-ENTER', () => this.buyOrEquip());
    kb.on('keydown-ESC', () => this.scene.start('Menu'));
    this.render();
  }

  private buyOrEquip(): void {
    const c = COSMETICS[this.idx];
    const blob = save.get();
    if (blob.ownedCosmetics.includes(c.id)) {
      save.update((b) => { b.equippedCosmetic = c.id; });
      this.sound.play('sfx-coin', { volume: 0.4 });
    } else if (blob.coinBank >= c.price) {
      save.update((b) => { b.coinBank -= c.price; b.ownedCosmetics.push(c.id); b.equippedCosmetic = c.id; });
      this.sound.play('sfx-coin', { volume: 0.6 });
    }
    this.render();
  }

  private render(): void {
    const blob = save.get();
    this.bankText.setText(`Bank: ${blob.coinBank} coins`);
    COSMETICS.forEach((c, i) => {
      const owned = blob.ownedCosmetics.includes(c.id);
      const equipped = blob.equippedCosmetic === c.id;
      const status = equipped ? '[EQUIPPED]' : owned ? '[owned]' : `${c.price}c`;
      const cursor = i === this.idx ? '> ' : '  ';
      this.rows[i].setText(`${cursor}${c.name.padEnd(8)} ${status}`).setTint(c.tint)
        .setAlpha(owned || blob.coinBank >= c.price ? 1 : 0.45);
    });
  }
}

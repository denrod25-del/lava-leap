import Phaser from 'phaser';
import { TUNING, UPGRADES } from '../tuning';
import { save } from '../main';
import { CHARACTERS, frameKey } from '../core/characters';
import { track } from '../core/track';

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
  private tab: 'characters' | 'cosmetics' | 'upgrades' = 'characters';
  private rows: Phaser.GameObjects.Text[] = [];
  private bankText!: Phaser.GameObjects.Text;
  private tabBtn!: Phaser.GameObjects.Text;
  private preview?: Phaser.GameObjects.Image;

  constructor() { super('Shop'); }

  /** Number of selectable rows in the active tab. */
  private listLength(): number {
    if (this.tab === 'characters') return CHARACTERS.length;
    return this.tab === 'cosmetics' ? COSMETICS.length : UPGRADES.length;
  }

  create(): void {
    const cx = TUNING.width / 2;
    this.add.text(cx, 60, 'SHOP', { fontFamily: 'monospace', fontSize: '32px', color: '#ffd166' }).setOrigin(0.5);
    this.bankText = this.add.text(cx, 100, '', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    if (save.get().coinBank === 0) {
      this.add.text(cx, 595, 'Coins you grab mid-run bank automatically — spend them here.', {
        fontFamily: 'monospace', fontSize: '11px', color: '#7ad9e8',
      }).setOrigin(0.5);
    }

    this.tabBtn = this.add.text(cx, 128, '', { fontFamily: 'monospace', fontSize: '14px', color: '#16e0e0' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.sound.play('sfx-ui-select', { volume: 0.35 * (save.get().settings.sfxVol / 10) });
        this.switchTab();
      });

    this.rows = COSMETICS.map((_c, i) =>
      this.add.text(cx, 170 + i * 36, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' })
        .setOrigin(0.5)
        // Tap a row to select it, then buy/equip it directly.
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { if (i >= this.listLength()) return; this.idx = i; this.render(); this.buyOrEquip(); }),
    );
    this.add.text(cx, 620, '↑/↓ select · TAB switch · ENTER buy/equip · ESC back', {
      fontFamily: 'monospace', fontSize: '13px', color: '#888888',
    }).setOrigin(0.5);

    // On-screen tap targets for touch devices (same handlers as the keyboard).
    const tapBtn = (x: number, label: string, fn: () => void): void => {
      this.add.text(x, 660, label, { fontFamily: 'monospace', fontSize: '22px', color: '#16e0e0' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.sound.play('sfx-ui-select', { volume: 0.35 * (save.get().settings.sfxVol / 10) });
          fn();
        });
    };
    tapBtn(cx - 150, '▲', () => { this.idx = (this.idx + this.listLength() - 1) % this.listLength(); this.render(); });
    tapBtn(cx - 90, '▼', () => { this.idx = (this.idx + 1) % this.listLength(); this.render(); });
    tapBtn(cx - 20, 'TAB', () => this.switchTab());
    tapBtn(cx + 50, 'BUY', () => this.buyOrEquip());
    tapBtn(cx + 130, 'BACK', () => this.scene.start('Menu'));

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => { this.idx = (this.idx + this.listLength() - 1) % this.listLength(); this.render(); });
    kb.on('keydown-DOWN', () => { this.idx = (this.idx + 1) % this.listLength(); this.render(); });
    kb.on('keydown-TAB', (e: KeyboardEvent) => { e.preventDefault(); this.switchTab(); });
    kb.on('keydown-ENTER', () => this.buyOrEquip());
    kb.on('keydown-ESC', () => this.scene.start('Menu'));

    // Character preview (characters tab only): the highlighted hero's idle frame,
    // tinted with the equipped cosmetic so the player sees the exact combo.
    this.preview = this.add.image(cx + 150, 210, frameKey(CHARACTERS[0].id, 'idle-0'))
      .setScale(2.5).setVisible(false);

    this.render();
  }

  private switchTab(): void {
    this.tab = this.tab === 'characters' ? 'cosmetics'
             : this.tab === 'cosmetics' ? 'upgrades' : 'characters';
    this.idx = 0;
    this.render();
  }

  private buyOrEquip(): void {
    if (this.tab === 'characters') {
      const ch = CHARACTERS[this.idx];
      const blob = save.get();
      const sfxMult = blob.settings.sfxVol / 10;
      if (blob.ownedCharacters.includes(ch.id)) {
        save.update((b) => { b.character = ch.id; });
        track('character_equip', { id: ch.id });
        this.sound.play('sfx-ui-select', { volume: 0.4 * sfxMult });
      } else if (blob.coinBank >= ch.price) { // scaffold for future paid characters
        save.update((b) => { b.coinBank -= ch.price; b.ownedCharacters.push(ch.id); b.character = ch.id; });
        track('character_equip', { id: ch.id });
        this.sound.play('sfx-kaching', { volume: 0.6 * sfxMult });
      }
      this.render();
      return;
    }
    if (this.tab === 'upgrades') { this.buyUpgrade(); return; }
    const c = COSMETICS[this.idx];
    const blob = save.get();
    const sfxMult = blob.settings.sfxVol / 10;
    if (blob.ownedCosmetics.includes(c.id)) {
      save.update((b) => { b.equippedCosmetic = c.id; });
      this.sound.play('sfx-ui-select', { volume: 0.4 * sfxMult });
    } else if (blob.coinBank >= c.price) {
      save.update((b) => { b.coinBank -= c.price; b.ownedCosmetics.push(c.id); b.equippedCosmetic = c.id; });
      this.sound.play('sfx-kaching', { volume: 0.6 * sfxMult });
    }
    this.render();
  }

  private buyUpgrade(): void {
    const u = UPGRADES[this.idx];
    const blob = save.get();
    const lvl = blob.upgrades[u.id];
    const sfxMult = blob.settings.sfxVol / 10;
    if (lvl >= u.maxLevel) return;
    const cost = u.costs[lvl];
    if (blob.coinBank >= cost) {
      save.update((b) => { b.coinBank -= cost; b.upgrades[u.id] = lvl + 1; });
      this.sound.play('sfx-kaching', { volume: 0.6 * sfxMult });
    }
    this.render();
  }

  private render(): void {
    const blob = save.get();
    this.bankText.setText(`Bank: ${blob.coinBank} coins`);

    if (this.tab === 'characters') {
      this.tabBtn.setText('[ CHARACTERS | Cosmetics | Upgrades ]');
      const equippedTint = COSMETICS.find((c) => c.id === blob.equippedCosmetic)?.tint ?? 0xffffff;
      CHARACTERS.forEach((ch, i) => {
        const equipped = blob.character === ch.id;
        const owned = blob.ownedCharacters.includes(ch.id);
        const status = equipped ? '[EQUIPPED]' : owned ? '[owned]' : `${ch.price}c`;
        const cursor = i === this.idx ? '> ' : '  ';
        this.rows[i].setText(`${cursor}${ch.name.padEnd(8)} ${status}`).setTint(0xffffff).setAlpha(1);
      });
      for (let i = CHARACTERS.length; i < this.rows.length; i++) this.rows[i].setText('');
      if (this.preview) {
        this.preview.setTexture(frameKey(CHARACTERS[this.idx].id, 'idle-0'));
        this.preview.setTint(equippedTint);
        this.preview.setVisible(true);
      }
      return;
    }
    this.preview?.setVisible(false);

    if (this.tab === 'upgrades') {
      this.tabBtn.setText('[ Characters | Cosmetics | UPGRADES ]');
      this.rows.forEach((row, i) => {
        if (i >= UPGRADES.length) { row.setText('').setTint(0xffffff).setAlpha(1); return; }
        const u = UPGRADES[i];
        const lvl = blob.upgrades[u.id];
        const maxed = lvl >= u.maxLevel;
        const status = maxed ? '[MAX]' : `${u.costs[lvl]}c`;
        const cursor = i === this.idx ? '> ' : '  ';
        row.setText(`${cursor}${u.name.padEnd(13)} Lv${lvl}/${u.maxLevel} ${status}`)
          .setTint(0xffffff)
          .setAlpha(maxed || blob.coinBank >= u.costs[lvl] ? 1 : 0.45);
      });
      return;
    }

    this.tabBtn.setText('[ Characters | COSMETICS | Upgrades ]');
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

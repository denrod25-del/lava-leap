import Phaser from 'phaser';
import { POWERUP } from '../tuning';
import { GameEvents } from '../core/events';
import type { PlatformDescriptor, PowerupKind } from '../core/types';

const COLORS: Record<PowerupKind, number> = {
  shield: 0x66ddff, rocket: 0xff7b3d, magnet: 0xffd166, slowlava: 0x9a7aff,
};

/** Hand-drawn, blocky icon per kind so each pickup reads distinctly even
 *  before checking color — drawn in the container's local space (origin at
 *  its own center), matching the game's flat pixel-art look. */
function drawPowerupIcon(g: Phaser.GameObjects.Graphics, kind: PowerupKind): void {
  g.lineStyle(1.5, 0xffffff, 1);
  g.fillStyle(0xffffff, 1);
  switch (kind) {
    case 'shield':
      g.beginPath();
      g.moveTo(0, -6);
      g.lineTo(5, -3);
      g.lineTo(5, 2);
      g.lineTo(0, 6);
      g.lineTo(-5, 2);
      g.lineTo(-5, -3);
      g.closePath();
      g.strokePath();
      break;
    case 'rocket':
      g.beginPath();
      g.moveTo(0, -6);
      g.lineTo(5, 4);
      g.lineTo(0, 1);
      g.lineTo(-5, 4);
      g.closePath();
      g.fillPath();
      break;
    case 'magnet':
      g.beginPath();
      g.arc(0, -1, 5, Math.PI, 0, false);
      g.strokePath();
      g.fillRect(-5.5, -1, 2, 6);
      g.fillRect(3.5, -1, 2, 6);
      break;
    case 'slowlava':
      g.strokeCircle(0, 0, 5.5);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(0, -4);
      g.moveTo(0, 0);
      g.lineTo(3, 1);
      g.strokePath();
      break;
  }
}

/** Spawns/despawns floating power-up pickups from platform descriptors, resolves
 *  player overlap, tracks the active timed effect + shield charge, and reports the
 *  per-frame effects the scene should apply. Pure event spine for collect/expire. */
export class PowerupController {
  readonly group: Phaser.Physics.Arcade.Group;
  private byId = new Map<number, Phaser.GameObjects.Container>();
  private kindById = new Map<number, PowerupKind>();
  hasShield = false;
  activeKind: PowerupKind | null = null; // timed (rocket/magnet/slowlava)
  private remainMs = 0;
  private durationFactor = 1;

  /** Multiply timed power-up durations (e.g. by the Power-Up Time upgrade). */
  setDurationFactor(f: number): void { this.durationFactor = f; }

  constructor(private scene: Phaser.Scene, private events: GameEvents) {
    this.group = scene.physics.add.group({ allowGravity: false });
  }

  spawn(desc: PlatformDescriptor): void {
    if (!desc.powerup || this.byId.has(desc.id)) return;
    const cx = desc.x + desc.width / 2, cy = desc.y - 26;
    const kind = desc.powerup.kind;
    const circle = this.scene.add.circle(0, 0, POWERUP.pickupSize / 2, COLORS[kind]);
    const icon = this.scene.add.graphics();
    drawPowerupIcon(icon, kind);
    const container = this.scene.add.container(cx, cy, [circle, icon]).setDepth(6);
    this.scene.physics.add.existing(container);
    const body = container.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(POWERUP.pickupSize / 2, -POWERUP.pickupSize / 2, -POWERUP.pickupSize / 2);
    this.scene.tweens.add({
      targets: container, scale: 1.15, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.group.add(container);
    this.byId.set(desc.id, container);
    this.kindById.set(desc.id, kind);
  }

  despawn(desc: PlatformDescriptor): void {
    const c = this.byId.get(desc.id);
    if (c) { c.destroy(); this.byId.delete(desc.id); this.kindById.delete(desc.id); }
  }

  registerPlayerOverlap(player: Phaser.Physics.Arcade.Sprite): void {
    this.scene.physics.add.overlap(player, this.group, (_p, containerObj) => {
      const container = containerObj as Phaser.GameObjects.Container;
      for (const [id, c] of this.byId) {
        if (c === container) {
          this.collect(this.kindById.get(id)!);
          c.destroy();
          this.byId.delete(id);
          this.kindById.delete(id);
          return;
        }
      }
    });
  }

  private collect(kind: PowerupKind): void {
    this.events.emit('powerupCollected', { kind });
    if (kind === 'shield') { this.hasShield = true; return; }
    this.activeKind = kind;
    const base = kind === 'rocket' ? POWERUP.rocketMs : kind === 'magnet' ? POWERUP.magnetMs : POWERUP.slowLavaMs;
    this.remainMs = base * this.durationFactor;
  }

  /** True if a hit was absorbed by the shield. */
  absorbHit(): boolean {
    if (this.hasShield) { this.hasShield = false; this.events.emit('powerupExpired', { kind: 'shield' }); return true; }
    return false;
  }

  /** Returns current effects for the scene to apply this frame. */
  update(dtMs: number): { rocket: boolean; magnet: boolean; slowLava: boolean } {
    if (this.activeKind && this.remainMs > 0) {
      this.remainMs -= dtMs;
      if (this.remainMs <= 0) { const k = this.activeKind; this.activeKind = null; this.events.emit('powerupExpired', { kind: k }); }
    }
    return {
      rocket: this.activeKind === 'rocket',
      magnet: this.activeKind === 'magnet',
      slowLava: this.activeKind === 'slowlava',
    };
  }

  get hudState(): { kind: PowerupKind | null; shield: boolean; remainMs: number } {
    return { kind: this.activeKind, shield: this.hasShield, remainMs: Math.max(0, this.remainMs) };
  }

  destroy(): void {
    for (const c of this.byId.values()) c.destroy();
    this.byId.clear();
    this.kindById.clear();
  }
}

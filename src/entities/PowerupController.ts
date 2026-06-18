import Phaser from 'phaser';
import { POWERUP } from '../tuning';
import { GameEvents } from '../core/events';
import type { PlatformDescriptor, PowerupKind } from '../core/types';

const COLORS: Record<PowerupKind, number> = {
  shield: 0x66ddff, rocket: 0xff7b3d, magnet: 0xffd166, slowlava: 0x9a7aff,
};

/** Spawns/despawns floating power-up pickups from platform descriptors, resolves
 *  player overlap, tracks the active timed effect + shield charge, and reports the
 *  per-frame effects the scene should apply. Pure event spine for collect/expire. */
export class PowerupController {
  readonly group: Phaser.Physics.Arcade.Group;
  private byId = new Map<number, Phaser.GameObjects.Arc>();
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
    const arc = this.scene.add.circle(cx, cy, POWERUP.pickupSize / 2, COLORS[desc.powerup.kind]).setDepth(6);
    this.scene.physics.add.existing(arc);
    (arc.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.group.add(arc);
    this.byId.set(desc.id, arc);
    this.kindById.set(desc.id, desc.powerup.kind);
  }

  despawn(desc: PlatformDescriptor): void {
    const a = this.byId.get(desc.id);
    if (a) { a.destroy(); this.byId.delete(desc.id); this.kindById.delete(desc.id); }
  }

  registerPlayerOverlap(player: Phaser.Physics.Arcade.Sprite): void {
    this.scene.physics.add.overlap(player, this.group, (_p, arcObj) => {
      const arc = arcObj as Phaser.GameObjects.Arc;
      for (const [id, a] of this.byId) {
        if (a === arc) {
          this.collect(this.kindById.get(id)!);
          a.destroy();
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
    for (const a of this.byId.values()) a.destroy();
    this.byId.clear();
    this.kindById.clear();
  }
}

export type PlatformType = 'static' | 'crumbling' | 'moving';
export type EnemyKind = 'crawler' | 'drifter';
export type PowerupKind = 'shield' | 'rocket' | 'magnet' | 'slowlava';

export interface MovementSpec {
  axis: 'horizontal';
  range: number; // px of travel from origin to each extreme
  speed: number; // px/s
}

export interface PlatformDescriptor {
  id: number;
  x: number;      // left edge, world px
  y: number;      // top edge, world px (smaller = higher)
  width: number;
  type: PlatformType;
  hasCoin: boolean;
  movement?: MovementSpec;
  hazard?: 'spikes';          // spiked top — lethal on contact
  bounce?: boolean;           // bounce pad — launches the player up
  enemy?: { kind: EnemyKind }; // an enemy rides/patrols this platform
  powerup?: { kind: PowerupKind }; // a pickup floats above this platform
}

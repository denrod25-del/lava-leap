export type PlatformType = 'static' | 'crumbling' | 'moving';

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
}

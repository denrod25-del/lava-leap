/** Volcanic Throat zone table. Pure config — no Phaser. */
export interface ZoneDef {
  index: number;
  name: string;
  fromHeight: number; // px climbed; zone extends to the next zone's fromHeight (last: Infinity)
  bgTop: number;      // background gradient top color
  bgBottom: number;   // background gradient bottom color
  starTint: number;
  platformTints: { static: number; crumbling: number; moving: number };
  lavaSpeedMultiplier: number;
  /** Added to the base crumble/moving probabilities on top of the difficulty ramp. */
  typeMixBias: { crumble: number; moving: number };
}

export const ZONES: ZoneDef[] = [
  {
    index: 0, name: 'Magma Vault', fromHeight: 0,
    bgTop: 0x2b1208, bgBottom: 0x140a05, starTint: 0xff9a5c,
    platformTints: { static: 0xc9a07a, crumbling: 0xd96f3a, moving: 0x6fc7d9 },
    lavaSpeedMultiplier: 1.0, typeMixBias: { crumble: 0, moving: 0 },
  },
  {
    index: 1, name: 'The Forge', fromHeight: 1000,
    bgTop: 0x33160d, bgBottom: 0x1a0906, starTint: 0xffb066,
    platformTints: { static: 0xd98a3a, crumbling: 0xe8633a, moving: 0x66ddff },
    lavaSpeedMultiplier: 1.15, typeMixBias: { crumble: 0.05, moving: 0.05 },
  },
  {
    index: 2, name: 'Ashfall', fromHeight: 2000,
    bgTop: 0x241015, bgBottom: 0x120709, starTint: 0xc9c2c9,
    platformTints: { static: 0x9a9aa3, crumbling: 0xc97a5a, moving: 0x7ad9e8 },
    lavaSpeedMultiplier: 1.3, typeMixBias: { crumble: 0.08, moving: 0.08 },
  },
  {
    index: 3, name: 'Obsidian Crown', fromHeight: 3000,
    bgTop: 0x15090f, bgBottom: 0x070308, starTint: 0xb09aff,
    platformTints: { static: 0x6e5a8a, crumbling: 0xa05aa3, moving: 0x8a7aff },
    lavaSpeedMultiplier: 1.5, typeMixBias: { crumble: 0.10, moving: 0.12 },
  },
];

export function zoneForHeight(height: number): ZoneDef {
  for (let i = ZONES.length - 1; i >= 0; i--) {
    if (height >= ZONES[i].fromHeight) return ZONES[i];
  }
  return ZONES[0];
}

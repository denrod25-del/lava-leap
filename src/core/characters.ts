/** Playable characters. Cosmetic by default — a character with a `movement`
 *  profile (v0.13.0+) has genuinely different physics; everyone else resolves
 *  to DEFAULT_MOVEMENT, which is byte-equal to the standard TUNING kit.
 *  Framework-free; the single source of truth for the roster + texture/anim keys. */
export interface MovementProfile {
  jumpVelocity: number;     // ground-jump impulse (standard: TUNING.jumpVelocity)
  airJumpVelocity: number;  // air-jump impulse (standard: TUNING.doubleJumpVelocity)
  maxJumps: number;         // total jump slots, ground + air (standard: 2)
  ledgeGrab: boolean;       // arms the ledge grab→vault state machine
}

export interface CharacterDef {
  id: string; name: string; price: number;
  /** Story-gated characters: how they're earned (not coin-buyable). */
  unlock?: 'titanDefeat';
  /** Movement-differentiated characters (v0.13.0+). Omitted = standard kit. */
  movement?: MovementProfile;
}

export const CHARACTERS: CharacterDef[] = [
  { id: 'ember',   name: 'Ember',   price: 0 },
  { id: 'classic', name: 'Classic', price: 0 },
  { id: 'cole',    name: 'Cole',    price: 0, unlock: 'titanDefeat' },
];

export const DEFAULT_CHARACTER = 'ember';

export const DEFAULT_MOVEMENT: MovementProfile = {
  jumpVelocity: 650, airJumpVelocity: 560, maxJumps: 2, ledgeGrab: false,
};

/** Kiko's kit. Exported separately (not yet a roster entry) so mechanics and
 *  reach-validity tests land art-independently; the roster entry arrives with
 *  the art in one atomic commit (BootScene loads assets for every entry). */
export const KIKO_MOVEMENT: MovementProfile = {
  jumpVelocity: 560, airJumpVelocity: 500, maxJumps: 3, ledgeGrab: true,
};

export function resolveMovement(id: string): MovementProfile {
  return CHARACTERS.find((c) => c.id === id)?.movement ?? DEFAULT_MOVEMENT;
}

export type PlayerState = 'run' | 'jump' | 'fall' | 'idle';

/** The 15 per-character animation frame files (run-0..5, jump-1..5, idle-0..3).
 *  The static sprite (player.png → staticKey) is loaded separately. */
export const FRAME_NAMES: string[] = [
  'run-0', 'run-1', 'run-2', 'run-3', 'run-4', 'run-5',
  'jump-1', 'jump-2', 'jump-3', 'jump-4', 'jump-5',
  'idle-0', 'idle-1', 'idle-2', 'idle-3',
];

export function staticKey(id: string): string { return `${id}-static`; }
export function frameKey(id: string, frame: string): string { return `${id}-${frame}`; }
export function animKey(id: string, state: PlayerState): string { return `${id}-${state}`; }

export function isCharacter(id: string): boolean {
  return CHARACTERS.some((c) => c.id === id);
}

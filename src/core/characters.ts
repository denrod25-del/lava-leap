/** Playable characters. Purely cosmetic — identical hitbox/physics/moves.
 *  Framework-free; the single source of truth for the roster + texture/anim keys. */
export interface CharacterDef { id: string; name: string; price: number }

export const CHARACTERS: CharacterDef[] = [
  { id: 'ember',   name: 'Ember',   price: 0 },
  { id: 'classic', name: 'Classic', price: 0 },
];

export const DEFAULT_CHARACTER = 'ember';

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

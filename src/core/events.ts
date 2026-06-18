/** Typed game-event spine. Framework-free: do NOT import Phaser here. */
export interface GameEventMap {
  jump: Record<string, never>;
  doubleJump: Record<string, never>;
  wallJump: Record<string, never>;
  dash: Record<string, never>;
  land: { impactVy: number };
  coinCollected: { x: number; y: number };
  platformCrumble: { x: number; y: number };
  zoneEntered: { zoneIndex: number; name: string };
  death: { height: number; zoneIndex: number };
  enemyStomped: { x: number; y: number };
  playerHit: { source: 'enemy' | 'boss' };
  powerupCollected: { kind: import('./types').PowerupKind };
  powerupExpired: { kind: import('./types').PowerupKind };
  bouncePad: { x: number; y: number };
  bossPhase: { zoneIndex: number; phase: 'start' | 'end' };
  projectileLaunched: { x: number };
  comboChanged: { multiplier: number };
  /** The Revive upgrade saved the player from a lethal hit (juice/audio only —
   *  deliberately NOT a combo/power-up event so it doesn't inflate the multiplier). */
  playerRevived: { x: number; y: number };
}

export type GameEventName = keyof GameEventMap;
type Listener<K extends GameEventName> = (payload: GameEventMap[K]) => void;

export class GameEvents {
  private listeners = new Map<GameEventName, Set<Listener<GameEventName>>>();

  /** Subscribe. Returns an unsubscribe function. */
  on<K extends GameEventName>(name: K, fn: Listener<K>): () => void {
    let set = this.listeners.get(name);
    if (!set) {
      set = new Set();
      this.listeners.set(name, set);
    }
    set.add(fn as Listener<GameEventName>);
    return () => set!.delete(fn as Listener<GameEventName>);
  }

  emit<K extends GameEventName>(name: K, payload: GameEventMap[K]): void {
    const set = this.listeners.get(name);
    if (!set) return;
    for (const fn of set) (fn as Listener<K>)(payload);
  }

  clear(): void {
    this.listeners.clear();
  }
}

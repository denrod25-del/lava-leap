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
  playerHit: { source: 'enemy' | 'spike' | 'boss' };
  powerupCollected: { kind: import('./types').PowerupKind };
  powerupExpired: { kind: import('./types').PowerupKind };
  bouncePad: { x: number; y: number };
  bossPhase: { zoneIndex: number; phase: 'start' | 'end' };
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

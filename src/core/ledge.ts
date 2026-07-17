import { LEDGE } from '../tuning';

/** Coordinate contract: x,y are TOP-LEFT corners (matches Arcade Body.x/.y). */
export interface LedgePlayerBox { x: number; y: number; width: number; height: number; vy: number }
export interface LedgePlatform { id: number; x: number; y: number; width: number; type: string }
export interface LedgeCandidate { platformId: number; snapX: number; snapY: number; side: 'left' | 'right' }

/** Find a grabbable ledge: player must be FALLING and STEERING into a static
 *  platform's near top corner, with the platform top inside the "hands window"
 *  (player top edge down to vertical center) and the near edges within reachX.
 *  snapX/snapY position the player's body top-left hanging flush on the side. */
export function findLedge(
  player: LedgePlayerBox,
  steer: -1 | 0 | 1,
  platforms: ReadonlyArray<LedgePlatform>,
): LedgeCandidate | null {
  if (player.vy <= 0 || steer === 0) return null;
  const handsTop = player.y;
  const handsBottom = player.y + player.height / 2;
  for (const p of platforms) {
    if (p.type !== 'static') continue;
    if (p.y < handsTop || p.y > handsBottom) continue;
    if (steer > 0) {
      const gap = p.x - (player.x + player.width); // player approaching platform's LEFT edge
      if (gap >= -2 && gap <= LEDGE.reachX) {
        return { platformId: p.id, snapX: p.x - player.width, snapY: p.y, side: 'left' };
      }
    } else {
      const gap = player.x - (p.x + p.width);      // approaching platform's RIGHT edge
      if (gap >= -2 && gap <= LEDGE.reachX) {
        return { platformId: p.id, snapX: p.x + p.width, snapY: p.y, side: 'right' };
      }
    }
  }
  return null;
}

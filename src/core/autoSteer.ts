/** Pure steer math for the AUTO control scheme: convert a finger x and the player x
 *  into a runAxis ∈ [-1, 1]. Framework-free. The camera never scrolls horizontally,
 *  so pointer screen-x and player world-x share the same space. */
export function steerAxis(fingerX: number, playerX: number, range: number, deadzone: number): number {
  const dx = fingerX - playerX;
  if (Math.abs(dx) <= deadzone) return 0;
  return Math.max(-1, Math.min(1, dx / range));
}

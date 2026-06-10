/** Local-date based daily-challenge seed: same tower for everyone all day. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dailySeed(d: Date): number {
  // FNV-1a over the date key — stable, well-spread 32-bit seed.
  let h = 0x811c9dc5;
  for (const ch of dateKey(d)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) || 1; // never 0
}

export type Rng = () => number;

/** mulberry32 — small, fast, deterministic PRNG returning [0, 1). */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inclusive float range helper. */
export function randRange(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng();
}

const MAX = 12;
const ALLOWED = /^[A-Za-z0-9 _-]+$/;
// Small blocklist; leet-normalized before matching (1→i/l, 3→e, 0→o, 4→a, 5→s, @→a, $→s).
const BLOCK = ['fuck', 'shit', 'cunt', 'nigg', 'fag', 'rape', 'bitch', 'dick', 'cock', 'slut', 'whore'];

function leet(s: string): string {
  return s.toLowerCase()
    .replace(/1/g, 'i').replace(/3/g, 'e').replace(/0/g, 'o')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/@/g, 'a').replace(/\$/g, 's');
}

export type NameResult = { ok: true; name: string } | { ok: false; reason: string };

export function validateName(raw: string): NameResult {
  const name = raw.trim();
  if (name.length === 0) return { ok: false, reason: 'Enter a name' };
  if (name.length > MAX) return { ok: false, reason: `Max ${MAX} characters` };
  if (!ALLOWED.test(name)) return { ok: false, reason: 'Letters, numbers, space, _ or - only' };
  const norm = leet(name).replace(/[^a-z]/g, '');
  if (BLOCK.some((b) => norm.includes(b))) return { ok: false, reason: 'Please pick another name' };
  return { ok: true, name };
}

/** `CLAW-XXXX` with 4 uppercase hex from rand() ∈ [0,1). */
export function generateHandle(rand: () => number): string {
  const n = Math.floor(rand() * 0x10000) & 0xffff;
  return `CLAW-${n.toString(16).toUpperCase().padStart(4, '0')}`;
}

// Procedural chiptune loops -> public/assets/sfx/music-game.wav, music-menu.wav
// Zero dependencies: writes 16-bit PCM mono WAV directly.
import { writeFileSync, mkdirSync } from 'node:fs';

const RATE = 22050;

function writeWav(path, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  writeFileSync(path, buf);
}

const NOTE = (semis) => 220 * Math.pow(2, semis / 12); // A3 = 0

function square(f, t) { return Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.5; }
function triangle(f, t) { return Math.asin(Math.sin(2 * Math.PI * f * t)) * (2 / Math.PI); }
function noise() { return Math.random() * 2 - 1; }

/** Render a pattern: array of {lead, bass} semitone steps (null = rest), stepsPerBeat=2. */
function render(pattern, bpm, bars, vol) {
  const stepDur = 60 / bpm / 2; // 8th notes
  const steps = bars * 8;
  const out = new Float32Array(Math.round(steps * stepDur * RATE));
  for (let s = 0; s < steps; s++) {
    const cell = pattern[s % pattern.length];
    const start = Math.round(s * stepDur * RATE);
    const len = Math.round(stepDur * RATE);
    for (let i = 0; i < len && start + i < out.length; i++) {
      const t = i / RATE;
      const env = Math.min(1, (len - i) / (len * 0.35)) * Math.min(1, i / 80);
      let v = 0;
      if (cell.lead !== null) v += square(NOTE(cell.lead) * 2, t) * 0.32 * env;
      if (cell.bass !== null) v += triangle(NOTE(cell.bass) / 2, t) * 0.42;
      if (cell.hat) v += noise() * 0.07 * Math.max(0, 1 - i / (len * 0.2));
      out[start + i] += v * vol;
    }
  }
  return out;
}

// A-minor-ish driving loop (game): lead arpeggio over a I-VI-III-VII bass walk.
const L = (l, b, h = false) => ({ lead: l, bass: b, hat: h });
const GAME = [
  L(0, 0, true), L(3, null), L(7, 0), L(12, null), L(7, 0, true), L(3, null), L(0, 0), L(3, null),
  L(-4, -4, true), L(0, null), L(3, -4), L(8, null), L(3, -4, true), L(0, null), L(-4, -4), L(0, null),
  L(-9, -9, true), L(-5, null), L(-2, -9), L(3, null), L(-2, -9, true), L(-5, null), L(-9, -9), L(-5, null),
  L(-2, -2, true), L(2, null), L(5, -2), L(10, null), L(5, -2, true), L(2, null), L(-2, -2), L(2, null),
];
// Sparse menu variant: same harmony, half the notes.
const MENU = GAME.map((c, i) => (i % 2 === 0 ? { ...c, hat: false } : { lead: null, bass: c.bass, hat: false }));

mkdirSync('public/assets/sfx', { recursive: true });
writeWav('public/assets/sfx/music-game.wav', render(GAME, 112, 8, 0.55));
writeWav('public/assets/sfx/music-menu.wav', render(MENU, 84, 8, 0.45));
console.log('music written');

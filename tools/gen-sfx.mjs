// Synthesize three short 16-bit PCM mono WAV sound effects with no external deps.
// Run: node tools/gen-sfx.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22050;
const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'public', 'assets', 'sfx');
mkdirSync(outDir, { recursive: true });

/** Build a 44-byte RIFF/WAVE header + 16-bit PCM samples. */
function encodeWav(samples) {
  const dataLen = samples.length * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);        // PCM chunk size
  buf.writeUInt16LE(1, 20);         // audio format = PCM
  buf.writeUInt16LE(1, 22);         // channels = mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);         // block align
  buf.writeUInt16LE(16, 34);        // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataLen, 40);
  let off = 44;
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), off);
    off += 2;
  }
  return buf;
}

const TAU = Math.PI * 2;

// Short rising blip (~440 -> 760 Hz square-ish), low amplitude.
function jump() {
  const dur = 0.12;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = 440 + (760 - 440) * t;
    const phase = (i / SAMPLE_RATE) * freq;
    const sine = Math.sin(TAU * phase);
    const sq = sine >= 0 ? 1 : -1;
    const wave = sine * 0.6 + sq * 0.4; // soft square
    const env = Math.sin(Math.PI * t); // fade in/out
    out[i] = wave * env * 0.25;
  }
  return out;
}

// Two quick ascending tones (~880 then ~1320 Hz).
function coin() {
  const seg = 0.075;
  const n = Math.floor(SAMPLE_RATE * seg);
  const freqs = [880, 1320];
  const out = new Float32Array(n * freqs.length);
  let idx = 0;
  for (const f of freqs) {
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const env = Math.sin(Math.PI * t);
      out[idx++] = Math.sin(TAU * (i / SAMPLE_RATE) * f) * env * 0.25;
    }
  }
  return out;
}

// Descending tone (~400 -> 120 Hz) plus a little noise.
function death() {
  const dur = 0.4;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = 400 + (120 - 400) * t;
    const tone = Math.sin(TAU * (i / SAMPLE_RATE) * freq);
    const noise = (Math.random() * 2 - 1) * 0.3;
    const env = 1 - t; // linear decay
    out[i] = (tone * 0.8 + noise) * env * 0.25;
  }
  return out;
}

const files = {
  'jump.wav': jump(),
  'coin.wav': coin(),
  'death.wav': death(),
};

for (const [name, samples] of Object.entries(files)) {
  const path = resolve(outDir, name);
  writeFileSync(path, encodeWav(samples));
  console.log(`wrote ${path} (${samples.length} samples)`);
}

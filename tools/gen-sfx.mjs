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

// 1.0s loop: low noise + 46 Hz sine, clickless edge fades (200 samples each end).
function rumble() {
  const dur = 1.0;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(n);
  const fadeLen = 200;
  for (let i = 0; i < n; i++) {
    const noise = (Math.random() * 2 - 1) * 0.5;
    const tone = Math.sin(TAU * 46 * (i / SAMPLE_RATE)) * 0.5;
    let fade = 1;
    if (i < fadeLen) fade = i / fadeLen;
    else if (i >= n - fadeLen) fade = (n - 1 - i) / fadeLen;
    out[i] = (noise + tone) * 0.30 * fade;
  }
  return out;
}

// 0.5s loop: high-pass feel via noise differencing, clickless edge fades.
function scrape() {
  const dur = 0.5;
  const n = Math.floor(SAMPLE_RATE * dur);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = Math.random() * 2 - 1;
  const out = new Float32Array(n);
  const fadeLen = 200;
  for (let i = 1; i < n; i++) {
    let fade = 1;
    if (i < fadeLen) fade = i / fadeLen;
    else if (i >= n - fadeLen) fade = (n - 1 - i) / fadeLen;
    out[i] = (raw[i] - raw[i - 1]) * 0.5 * 0.18 * fade;
  }
  return out;
}

// 0.18s one-shot: noise burst 0.5→0 linear decay + 90 Hz sine thud for first 60 ms.
function crack() {
  const dur = 0.18;
  const n = Math.floor(SAMPLE_RATE * dur);
  const thudEnd = Math.floor(SAMPLE_RATE * 0.06);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const decay = 0.5 * (1 - t);
    const noiseSample = (Math.random() * 2 - 1) * decay;
    const thud = i < thudEnd ? Math.sin(TAU * 90 * (i / SAMPLE_RATE)) * 0.3 * (1 - i / thudEnd) : 0;
    out[i] = noiseSample + thud;
  }
  return out;
}

// 0.6s: sine sweep 220→440 Hz, amplitude ramp 0→0.35→0.
function swell() {
  const dur = 0.6;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = 220 + (440 - 220) * t;
    const amp = t < 0.5 ? t / 0.5 * 0.35 : (1 - t) / 0.5 * 0.35;
    out[i] = Math.sin(TAU * freq * (i / SAMPLE_RATE)) * amp;
  }
  return out;
}

// 0.35s: sine 880 Hz for 120 ms then 1760 Hz for 230 ms, 0.3 amp, exponential decay.
function ding() {
  const n1 = Math.floor(SAMPLE_RATE * 0.12);
  const n2 = Math.floor(SAMPLE_RATE * 0.23);
  const out = new Float32Array(n1 + n2);
  for (let i = 0; i < n1; i++) {
    const decay = Math.exp(-i / (SAMPLE_RATE * 0.08));
    out[i] = Math.sin(TAU * 880 * (i / SAMPLE_RATE)) * 0.3 * decay;
  }
  for (let i = 0; i < n2; i++) {
    const decay = Math.exp(-i / (SAMPLE_RATE * 0.15));
    out[n1 + i] = Math.sin(TAU * 1760 * (i / SAMPLE_RATE)) * 0.3 * decay;
  }
  return out;
}

// 0.3s: two quick sines 1320 Hz (80 ms) + 1760 Hz (220 ms), 0.32 amplitude.
function kaching() {
  const n1 = Math.floor(SAMPLE_RATE * 0.08);
  const n2 = Math.floor(SAMPLE_RATE * 0.22);
  const out = new Float32Array(n1 + n2);
  for (let i = 0; i < n1; i++) {
    const env = Math.sin(Math.PI * (i / n1));
    out[i] = Math.sin(TAU * 1320 * (i / SAMPLE_RATE)) * 0.32 * env;
  }
  for (let i = 0; i < n2; i++) {
    const env = Math.sin(Math.PI * (i / n2));
    out[n1 + i] = Math.sin(TAU * 1760 * (i / SAMPLE_RATE)) * 0.32 * env;
  }
  return out;
}

// 0.06s: 660 Hz square blip, 0.2 amplitude.
function uiMove() {
  const dur = 0.06;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const sq = Math.sign(Math.sin(TAU * 660 * (i / SAMPLE_RATE))) * 0.5;
    const env = Math.sin(Math.PI * t);
    out[i] = sq * 0.2 * env;
  }
  return out;
}

// 0.15s: low thud (100 Hz) plus a short noise burst for stomp impact.
function stomp() {
  const dur = 0.15;
  const n = Math.floor(SAMPLE_RATE * dur);
  const thudEnd = Math.floor(SAMPLE_RATE * 0.06);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const decay = 1 - t;
    const thud = i < thudEnd
      ? Math.sin(TAU * 100 * (i / SAMPLE_RATE)) * 0.5 * (1 - i / thudEnd)
      : 0;
    // Quick noise transient at start only
    const noise = i < thudEnd ? (Math.sin(i * 0.37) * 2 - 1) * 0.15 * (1 - i / thudEnd) : 0;
    out[i] = (thud + noise) * decay * 0.6;
  }
  return out;
}

// 0.22s: sharp descending tone (480→180 Hz) with gritty distortion for "ouch" hit.
function hit() {
  const dur = 0.22;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = 480 + (180 - 480) * t;
    const tone = Math.sin(TAU * (i / SAMPLE_RATE) * freq);
    // Soft clip for grit
    const clipped = Math.tanh(tone * 3) * 0.33;
    const env = Math.exp(-t * 8);
    out[i] = clipped * env * 0.5;
  }
  return out;
}

// 0.1s: 760→900 Hz sine rise, 0.25 amplitude.
function uiSelect() {
  const dur = 0.1;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = 760 + (900 - 760) * t;
    const env = Math.sin(Math.PI * t);
    out[i] = Math.sin(TAU * freq * (i / SAMPLE_RATE)) * 0.25 * env;
  }
  return out;
}

// 0.24s: rising arpeggio (660 → 990 → 1320 Hz), bright power-up pickup.
function pickup() {
  const seg = 0.08;
  const n = Math.floor(SAMPLE_RATE * seg);
  const freqs = [660, 990, 1320];
  const out = new Float32Array(n * freqs.length);
  let idx = 0;
  for (const f of freqs) {
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const env = Math.sin(Math.PI * t);
      out[idx++] = Math.sin(TAU * (i / SAMPLE_RATE) * f) * env * 0.28;
    }
  }
  return out;
}

// 0.18s: short descending blip (880 → 440 Hz) for power-up expiry.
function expire() {
  const dur = 0.18;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = 880 + (440 - 880) * t;
    const env = Math.exp(-t * 5);
    out[i] = Math.sin(TAU * freq * (i / SAMPLE_RATE)) * 0.25 * env;
  }
  return out;
}

// 0.7s: deep guttural growl — low sine sweep (70→45 Hz) + sub-harmonic + grit noise,
// slow swell then decay. The Lava Titan's roar.
function bossRoar() {
  const dur = 0.7;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = 70 + (45 - 70) * t;
    const ph = (i / SAMPLE_RATE);
    const tone = Math.sin(TAU * freq * ph) * 0.6;
    const sub = Math.sin(TAU * (freq * 0.5) * ph) * 0.3;
    const grit = (Math.random() * 2 - 1) * 0.15;
    // Soft clip for a throaty rasp.
    const body = Math.tanh((tone + sub + grit) * 1.8);
    const env = t < 0.3 ? t / 0.3 : (1 - t) / 0.7; // swell-in then long decay
    out[i] = body * env * 0.5;
  }
  return out;
}

// 0.18s: descending whoosh blip — sine sweep 900→300 Hz + airy noise, exponential decay.
// Played when the Titan launches a fireball.
function projectile() {
  const dur = 0.18;
  const n = Math.floor(SAMPLE_RATE * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = 900 + (300 - 900) * t;
    const tone = Math.sin(TAU * freq * (i / SAMPLE_RATE));
    const noise = (Math.random() * 2 - 1) * 0.25 * (1 - t);
    const env = Math.exp(-t * 6);
    out[i] = (tone * 0.7 + noise) * env * 0.32;
  }
  return out;
}

const files = {
  'jump.wav': jump(),
  'coin.wav': coin(),
  'death.wav': death(),
  'rumble.wav': rumble(),
  'scrape.wav': scrape(),
  'crack.wav': crack(),
  'swell.wav': swell(),
  'ding.wav': ding(),
  'kaching.wav': kaching(),
  'ui-move.wav': uiMove(),
  'ui-select.wav': uiSelect(),
  'stomp.wav': stomp(),
  'hit.wav': hit(),
  'pickup.wav': pickup(),
  'expire.wav': expire(),
  'boss-roar.wav': bossRoar(),
  'projectile.wav': projectile(),
};

for (const [name, samples] of Object.entries(files)) {
  const path = resolve(outDir, name);
  writeFileSync(path, encodeWav(samples));
  console.log(`wrote ${path} (${samples.length} samples)`);
}

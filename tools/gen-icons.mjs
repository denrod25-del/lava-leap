// Zero-dependency PWA icon generator for Lava Leap.
// Emits public/icon-192.png and public/icon-512.png — a simple lava motif:
// a dark background (#10101a) with an orange (#ff4d00) diamond + glow.
// Uses only Node built-ins (zlib for the IDAT deflate, no image libs).
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const BG = [0x10, 0x10, 0x1a];
const LAVA = [0xff, 0x4d, 0x00];
const LAVA_HOT = [0xff, 0x9d, 0x33];

/** CRC32 (PNG chunk checksum). */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** Render a `size`x`size` RGB pixel buffer with the lava motif. */
function renderPixels(size) {
  const px = Buffer.alloc(size * size * 3);
  const cx = size / 2, cy = size / 2;
  const r = size * 0.34; // diamond "radius" (manhattan)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
      const diamond = dx + dy; // L1 distance from center
      let color;
      if (diamond < r * 0.55) color = LAVA_HOT;       // hot core
      else if (diamond < r) color = LAVA;             // lava body
      else color = BG;                                 // background
      const i = (y * size + x) * 3;
      px[i] = color[0]; px[i + 1] = color[1]; px[i + 2] = color[2];
    }
  }
  return px;
}

/** Build a valid 8-bit truecolor PNG from an RGB pixel buffer. */
function encodePng(size, rgb) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // color type 2 = truecolor RGB
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  // Raw scanlines, each prefixed with filter byte 0 (none).
  const stride = size * 3;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw);

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const png = encodePng(size, renderPixels(size));
  const out = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(out, png);
  console.log(`wrote ${out} (${png.length} bytes)`);
}

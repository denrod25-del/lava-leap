// Builds the source app icon + splash for @capacitor/assets from the Lava Titan
// sprite, composited on the game's dark background. Uses sharp (a @capacitor/assets
// dependency). Pixel art is upscaled nearest-neighbour to stay crisp.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const BG = { r: 0x10, g: 0x10, b: 0x1a, alpha: 1 };
const TITAN = 'public/assets/boss/titan.png';
mkdirSync('assets', { recursive: true });

async function compose(out, canvas, sprite) {
  const titan = await sharp(TITAN)
    .resize(sprite, sprite, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: canvas, height: canvas, channels: 4, background: BG } })
    .composite([{ input: titan, gravity: 'centre' }])
    .png()
    .toFile(out);
  console.log('wrote', out);
}

// Icon: 1024 canvas, titan ~76% for a little padding.
await compose('assets/icon.png', 1024, 776);
// Splash: 2732 canvas (Capacitor standard), titan ~33% centred.
await compose('assets/splash.png', 2732, 900);
await compose('assets/splash-dark.png', 2732, 900);

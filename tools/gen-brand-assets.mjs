// Rebuilds all app icons + splash screens from the Lava Leap brand art
// (branding/logo.png — the dripping wordmark on dark lava rock).
// Pure-JS (jimp): no native binaries, works in any sandbox.
//
//   node tools/gen-brand-assets.mjs
//
// Outputs:
//   public/assets/brand/logo.png          in-game menu logo (wordmark + tagline)
//   assets/icon.png / splash*.png         @capacitor/assets-compatible sources
//   public/icon-192.png / icon-512.png    PWA icons
//   public/og-image.png                   social share card
//   android/app/src/main/res/**           launcher icons + splash (all densities)
//   ios/App/App/Assets.xcassets/**        app icon + splash (when ios/ exists)
import { Jimp } from 'jimp';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BG = 0x0b0908ff; // near-black matching the logo art's vignetted edges

const master = await Jimp.read('branding/logo.png'); // 1536x1024
// Hand-tuned crops on the master:
const markTag = master.clone().crop({ x: 230, y: 50, w: 1100, h: 900 }); // wordmark + tagline
const mark = master.clone().crop({ x: 230, y: 50, w: 1100, h: 745 }); // wordmark only (icons)

function contain(src, canvasW, canvasH, frac, color = BG) {
  const canvas = new Jimp({ width: canvasW, height: canvasH, color });
  const img = src.clone();
  const scale = Math.min((canvasW * frac) / img.width, (canvasH * frac) / img.height);
  img.resize({ w: Math.round(img.width * scale), h: Math.round(img.height * scale) });
  canvas.composite(img, Math.round((canvasW - img.width) / 2), Math.round((canvasH - img.height) / 2));
  return canvas;
}

mkdirSync('assets', { recursive: true });
mkdirSync('public/assets/brand', { recursive: true });

// In-game menu logo
await markTag.clone().resize({ w: 1000 }).write('public/assets/brand/logo.png');

// Capacitor asset sources
const icon = contain(mark, 1024, 1024, 0.94);
await icon.write('assets/icon.png');
const splash = contain(markTag, 2732, 2732, 0.55);
await splash.write('assets/splash.png');
await splash.write('assets/splash-dark.png');

// PWA icons + share card
await icon.clone().resize({ w: 192, h: 192 }).write('public/icon-192.png');
await icon.clone().resize({ w: 512, h: 512 }).write('public/icon-512.png');
await master.clone().cover({ w: 1200, h: 630 }).write('public/og-image.png');

// Android launcher icons + splash: overwrite every existing density at its own size.
const res = 'android/app/src/main/res';
if (existsSync(res)) {
  for (const dir of readdirSync(res)) {
    const d = join(res, dir);
    for (const f of readdirSync(d)) {
      if (!f.endsWith('.png')) continue;
      const path = join(d, f);
      const { width, height } = await Jimp.read(path);
      let out;
      if (f === 'ic_launcher.png' || f === 'ic_launcher_round.png') {
        out = icon.clone().resize({ w: width, h: height });
      } else if (f === 'ic_launcher_foreground.png') {
        // Adaptive-icon foreground: transparent, mark inside the ~66% safe zone.
        out = contain(mark, width, height, 0.62, 0x00000000);
      } else if (f === 'ic_launcher_background.png') {
        out = new Jimp({ width, height, color: BG });
      } else if (f === 'splash.png') {
        out = splash.clone().cover({ w: width, h: height });
      } else continue;
      await out.write(path);
      console.log('android:', path, `${width}x${height}`);
    }
  }
}

// iOS icon + splash (present after `npx cap add ios`).
const xc = 'ios/App/App/Assets.xcassets';
if (existsSync(xc)) {
  const iconset = join(xc, 'AppIcon.appiconset');
  if (existsSync(iconset)) {
    for (const f of readdirSync(iconset)) {
      if (!f.endsWith('.png')) continue;
      const path = join(iconset, f);
      const { width, height } = await Jimp.read(path);
      await icon.clone().resize({ w: width, h: height }).write(path);
      console.log('ios:', path, `${width}x${height}`);
    }
  }
  const splashset = join(xc, 'Splash.imageset');
  if (existsSync(splashset)) {
    for (const f of readdirSync(splashset)) {
      if (!f.endsWith('.png')) continue;
      const path = join(splashset, f);
      const { width, height } = await Jimp.read(path);
      await splash.clone().cover({ w: width, h: height }).write(path);
      console.log('ios:', path, `${width}x${height}`);
    }
  }
}
console.log('done');

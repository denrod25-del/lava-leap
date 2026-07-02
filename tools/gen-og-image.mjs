// Builds public/og-image.png (1200x630) from the Lava Titan art + an SVG wordmark.
import sharp from 'sharp';

const W = 1200, H = 630;
const titan = await sharp('public/assets/boss/titan.png')
  .resize(420, 420, { kernel: 'nearest' })
  .toBuffer();
const svg = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="600" y="290" font-family="monospace" font-size="92" font-weight="bold" fill="#ff7b00">LAVA LEAP</text>
  <text x="600" y="360" font-family="monospace" font-size="24" fill="#cfd8e3">Climb. Outrun the lava. Face the Titan.</text>
  <rect x="0" y="${H - 60}" width="${W}" height="60" fill="#ff4d00"/>
</svg>`);
await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0x10, g: 0x10, b: 0x1a, alpha: 1 } } })
  .composite([{ input: titan, left: 120, top: 90 }, { input: svg, left: 0, top: 0 }])
  .png().toFile('public/og-image.png');
console.log('wrote public/og-image.png');

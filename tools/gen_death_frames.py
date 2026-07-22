"""Generate death-0..3 burn-up frames for every character.

Flinch source per character: tools/death-raw/<id>/flinch.png if present
(PixelLab pose, Task 2), else derived from the character's jump-3 frame
rotated slightly (transform fallback -- classic always uses this).
Deterministic: rng seeded by character id, so re-runs are reproducible.
Run from repo root:  python tools/gen_death_frames.py
"""
import os
import random
from PIL import Image

CHARS = ['ember', 'classic', 'cole', 'kiko']
SIZE = 48
EMBER_HOT = (255, 150, 40, 255)
EMBER_DIM = (200, 80, 20, 255)
CHAR_DARK = (45, 22, 25)


def char_dir(cid):
    return os.path.join('public', 'assets', 'characters', cid)


def flinch_source(cid):
    raw = os.path.join('tools', 'death-raw', cid, 'flinch.png')
    if os.path.exists(raw):
        im = Image.open(raw).convert('RGBA')
        if im.size != (SIZE, SIZE):
            im = im.resize((SIZE, SIZE), Image.NEAREST)
        return im
    base = Image.open(os.path.join(char_dir(cid), 'jump-3.png')).convert('RGBA')
    return base.rotate(-12, resample=Image.NEAREST, center=(SIZE // 2, SIZE - 8))


def opaque_pixels(im):
    px = im.load()
    return [(x, y) for y in range(im.height) for x in range(im.width) if px[x, y][3] > 40]


def tint(im, strength):
    """Blend opaque pixels toward hot orange by strength (0..1)."""
    out = im.copy()
    px = out.load()
    for x, y in opaque_pixels(out):
        r, g, b, a = px[x, y]
        px[x, y] = (
            int(r + (255 - r) * strength),
            int(g + (120 - g) * strength * 0.8),
            int(b + (30 - b) * strength * 0.8),
            a,
        )
    return out


def char_and_crack(im, rng, crack_frac):
    """Darken toward charred silhouette; a fraction of pixels become orange cracks."""
    out = im.copy()
    px = out.load()
    pts = opaque_pixels(out)
    cracks = set(rng.sample(pts, int(len(pts) * crack_frac)))
    for x, y in pts:
        if (x, y) in cracks:
            px[x, y] = (255, 120, 20, 255)
        else:
            r, g, b, a = px[x, y]
            px[x, y] = (
                int(r * 0.25 + CHAR_DARK[0] * 0.75),
                int(g * 0.25 + CHAR_DARK[1] * 0.75),
                int(b * 0.25 + CHAR_DARK[2] * 0.75),
                a,
            )
    return out


def dissolve(im, rng, frac):
    """Remove frac of opaque pixels; re-draw them as embers drifting upward."""
    out = im.copy()
    px = out.load()
    pts = opaque_pixels(out)
    gone = rng.sample(pts, int(len(pts) * frac))
    for x, y in gone:
        px[x, y] = (0, 0, 0, 0)
    for x, y in gone:
        ex = min(SIZE - 1, max(0, x + rng.randint(-2, 2)))
        ey = max(0, y - rng.randint(1, 5))
        px[ex, ey] = EMBER_HOT if rng.random() < 0.5 else EMBER_DIM
    return out


for cid in CHARS:
    rng = random.Random(cid)
    flinch = flinch_source(cid)
    f0 = tint(flinch, 0.25)
    f1 = dissolve(tint(flinch, 0.55), rng, 0.10)
    f2 = dissolve(char_and_crack(flinch, rng, 0.12), rng, 0.35)
    f3 = dissolve(char_and_crack(flinch, rng, 0.05), rng, 0.72)
    for i, fr in enumerate((f0, f1, f2, f3)):
        fr.save(os.path.join(char_dir(cid), f'death-{i}.png'))
    print(f'{cid}: death-0..3 written')

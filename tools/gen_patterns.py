#!/usr/bin/env python3
"""Recreate the Lava Leap PATTERN tiles as seamless textures (numpy + Pillow).

These are drop-in replacements for the game's tiling textures — they MUST wrap
seamlessly because they tile across every platform / the whole lava surface.
Procedural (not AI) is deliberate: seamless tiling is guaranteed here.

Outputs (public/assets/):
  platform.png   64x16   ROCK — dark stone ledge, grayscale so the per-zone
                          platform tint still colors it.
  lava-tile.png  128x128 MOLTEN FLOW + LAVA CRACKS — hot lava crust with
                          glowing seams, seamless both axes.
Run:  python3 tools/gen_patterns.py
"""
import os
import numpy as np
from PIL import Image, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')


# ----------------------------------------------------------------------------
# seamless noise helpers
# ----------------------------------------------------------------------------
def _smooth(t):
    return t * t * (3 - 2 * t)


def tileable_noise(w, h, period, seed):
    """Value noise that wraps seamlessly: the coarse grid is periodic."""
    rng = np.random.default_rng(seed)
    grid = rng.random((period, period))
    grid = np.pad(grid, ((0, 1), (0, 1)), mode='wrap')   # wrap edge for interp
    ys = np.linspace(0, period, h, endpoint=False)
    xs = np.linspace(0, period, w, endpoint=False)
    y0 = np.floor(ys).astype(int); x0 = np.floor(xs).astype(int)
    ty = _smooth(ys - y0)[:, None]; tx = _smooth(xs - x0)[None, :]
    y1 = y0 + 1; x1 = x0 + 1
    top = grid[y0][:, x0] * (1 - tx) + grid[y0][:, x1] * tx
    bot = grid[y1][:, x0] * (1 - tx) + grid[y1][:, x1] * tx
    return top * (1 - ty) + bot * ty


def tileable_fbm(w, h, period, octaves, seed):
    out = np.zeros((h, w)); amp = 1.0; tot = 0.0; p = period
    for o in range(octaves):
        out += amp * tileable_noise(w, h, p, seed + o * 13)
        tot += amp; amp *= 0.5; p *= 2
    out /= tot
    return (out - out.min()) / (np.ptp(out) + 1e-9)


def toroidal_worley(w, h, n, seed):
    """Cellular noise with wrap-around distance → tiles seamlessly.
    Returns (f1 edge map in [0,1] bright at cell borders, cell-id array)."""
    rng = np.random.default_rng(seed)
    pts = rng.random((n, 2)) * [h, w]
    yy, xx = np.mgrid[0:h, 0:w]
    f1 = np.full((h, w), 1e18); f2 = np.full((h, w), 1e18); cid = np.zeros((h, w), int)
    for i, (py, px) in enumerate(pts):
        dy = np.abs(yy - py); dy = np.minimum(dy, h - dy)
        dx = np.abs(xx - px); dx = np.minimum(dx, w - dx)
        d = dy * dy + dx * dx
        closer = d < f1
        f2 = np.where(closer, f1, np.minimum(f2, d))
        cid = np.where(closer, i, cid)
        f1 = np.where(closer, d, f1)
    edge = np.sqrt(f2) - np.sqrt(f1)
    edge = np.clip(1.0 - edge / 4.0, 0, 1)              # bright along seams
    return edge, cid


def _save(arr, name):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGB').save(os.path.join(OUT, name))


def _save_rgba(rgb, alpha, name):
    """rgb: HxWx3 float 0..255, alpha: HxW float 0..1."""
    a = np.clip(alpha, 0, 1)[:, :, None] * 255
    out = np.concatenate([np.clip(rgb, 0, 255), a], axis=-1).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(os.path.join(OUT, name))


# ----------------------------------------------------------------------------
# ROCK — platform ledge (64x16, grayscale, tint-friendly)
# ----------------------------------------------------------------------------
def gen_platform():
    W, H = 64, 16
    seed = 7
    # Irregular rock chunks via seamless cellular noise (reads as ROCK, not bricks).
    edge, cid = toroidal_worley(W, H, 8, seed)
    # A mid-grey base (so the per-zone platform TINT multiplies to a visible color)
    # with per-chunk value variation + fine grain.
    rng = np.random.default_rng(seed + 1)
    cell_val = (rng.random(cid.max() + 1) * 40 - 20)[cid]    # ±20 per chunk
    val = 150 + cell_val + (tileable_fbm(W, H, 8, 3, seed + 2) - 0.5) * 26
    val -= np.clip(edge * 2.0, 0, 1) * 78                    # dark seams between chunks
    # top highlight + bottom shadow → reads as a lit 3D ledge
    yr = np.arange(H)[:, None]
    val += np.clip(1 - yr / 2.5, 0, 1) * 46                  # bright top edge
    val -= np.clip((yr - (H - 3)) / 2.5, 0, 1) * 40          # bottom shadow
    val = np.clip(val, 24, 235)
    rgb = np.stack([val, val * 0.985, val * 1.02], axis=-1)  # faint cool cast
    _save(rgb, 'platform.png')


# ----------------------------------------------------------------------------
# MOLTEN FLOW + LAVA CRACKS — the rising lava (128x128, seamless both axes)
# ----------------------------------------------------------------------------
def gen_lava():
    W = H = 128
    edge, _ = toroidal_worley(W, H, 26, seed=11)             # crust seams
    hot = tileable_fbm(W, H, 3, 4, seed=33)                  # where molten pools glow
    grain = tileable_fbm(W, H, 10, 3, seed=21)               # crust surface grain

    crust = np.array([30, 12, 8], float)                     # near-black rock crust
    glow_col = np.array([255, 120, 28], float)               # orange crack glow
    core_col = np.array([255, 225, 140], float)              # white-hot crack core
    molten = np.array([235, 90, 20], float)                  # molten pool

    # dark charcoal crust everywhere, with faint surface grain
    img = crust[None, None] * (0.75 + 0.5 * grain[:, :, None])

    # molten pools: only the hottest patches of a few cells glow through
    pool = np.clip((hot - 0.62) / 0.32, 0, 1) ** 1.5
    img += pool[:, :, None] * (molten - crust)[None, None] * 0.9

    # glowing cracks along the seams (soft glow + hot core)
    seam = np.clip(edge, 0, 1)
    glow = np.asarray(Image.fromarray((seam * 255).astype(np.uint8))
                      .filter(ImageFilter.GaussianBlur(1.6))).astype(float) / 255.0
    img += glow[:, :, None] * glow_col[None, None] * 1.05
    img += (np.clip((seam - 0.55) / 0.45, 0, 1) ** 2)[:, :, None] * core_col[None, None] * 0.8
    _save(img, 'lava-tile.png')


# ----------------------------------------------------------------------------
# CHAIN / METAL — UI panel backdrop (128x128 seamless, dark forged plate)
# ----------------------------------------------------------------------------
def gen_ui_plate():
    W = H = 128
    grain = tileable_fbm(W, H, 8, 4, seed=5)
    base = 26 + 16 * grain                                   # dark steel
    # brushed-metal horizontal streaks
    base += (tileable_fbm(W, H, 2, 2, seed=9) - 0.5) * 10
    val = base.copy()
    yy, xx = np.mgrid[0:H, 0:W]
    # riveted panel seams: a border groove every 64px (tiles), + rivets at corners
    seam = ((xx % 64 < 2) | (yy % 64 < 2)).astype(float)
    val -= seam * 12                                         # recessed groove
    val += (((xx % 64 == 2) | (yy % 64 == 2)).astype(float)) * 8   # lit lip
    img = np.stack([val * 0.95, val * 0.97, val * 1.06], -1)  # cool steel cast
    # rivets on the 64-grid corners
    for cy in (0, 64):
        for cx in (0, 64):
            d = (xx - cx) ** 2 + (yy - cy) ** 2
            r = np.clip(1 - d / 20, 0, 1)
            img += r[:, :, None] * np.array([34, 30, 26], float)
            img += np.clip(1 - ((xx - cx + 1) ** 2 + (yy - cy + 1) ** 2) / 6, 0, 1)[:, :, None] * 26
    _save(img, 'ui-plate.png')


# ----------------------------------------------------------------------------
# VOLCANIC ASH — drifting haze overlay (256x256 seamless, additive wisps)
# ----------------------------------------------------------------------------
def gen_ash():
    W = H = 256
    clouds = tileable_fbm(W, H, 3, 6, seed=61)
    wisp = np.clip(clouds - 0.42, 0, 1) ** 1.6              # sparse light wisps
    val = wisp * 150
    img = np.stack([val, val * 0.82, val * 0.66], -1)       # warm ash lit by lava
    _save(img, 'ash.png')                                   # used ADD-blended, low alpha


# ----------------------------------------------------------------------------
# ARCADE GRID — retro overlay (64x64 seamless RGBA, glowing red lines)
# ----------------------------------------------------------------------------
def gen_grid():
    W = H = 64
    yy, xx = np.mgrid[0:H, 0:W]
    line = ((xx < 1) | (yy < 1)).astype(float)              # 1px lines at cell edges
    node = np.clip(1 - ((xx) ** 2 + (yy) ** 2) / 6, 0, 1)   # brighter node at corner
    node += np.clip(1 - ((xx - W) ** 2 + (yy) ** 2) / 6, 0, 1)
    node += np.clip(1 - ((xx) ** 2 + (yy - H) ** 2) / 6, 0, 1)
    inten = np.clip(line * 0.7 + node, 0, 1)
    # soft glow around the lines
    glow = np.asarray(Image.fromarray((inten * 255).astype(np.uint8))
                      .filter(ImageFilter.GaussianBlur(0.8))).astype(float) / 255.0
    rgb = np.stack([np.full((H, W), 255.0), np.full((H, W), 70.0), np.full((H, W), 60.0)], -1)
    _save_rgba(rgb, np.clip(inten + glow * 0.5, 0, 1), 'grid.png')


# ----------------------------------------------------------------------------
# EMBER PARTICLES — soft glowing dot sprite (16x16 RGBA, additive)
# ----------------------------------------------------------------------------
def gen_ember():
    S = 16
    yy, xx = np.mgrid[0:S, 0:S].astype(float)
    d = np.sqrt((xx - (S - 1) / 2) ** 2 + (yy - (S - 1) / 2) ** 2) / (S / 2)
    a = np.clip(1 - d, 0, 1) ** 2
    core = np.clip(1 - d * 2.2, 0, 1)
    rgb = np.stack([np.full((S, S), 255.0),
                    120 + 110 * core,          # hotter center
                    40 + 120 * core], -1)
    _save_rgba(rgb, a, 'ember.png')


# ----------------------------------------------------------------------------
# TITAN EMBLEM — menu watermark (256 RGBA, glowing carved demon face)
# ----------------------------------------------------------------------------
def gen_titan_emblem():
    from PIL import ImageDraw
    S = 256
    mask = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(mask)
    cx = S / 2

    def mirror(pts):
        return [(S - x, y) for (x, y) in pts]
    # horns (up-swept)
    horn = [(cx - 8, 70), (78, 20), (96, 26), (cx - 12, 92)]
    d.polygon(horn, fill=230); d.polygon(mirror(horn), fill=230)
    # angry brow ridge
    d.polygon([(cx - 84, 96), (cx - 6, 84), (cx - 10, 112), (cx - 80, 120)], fill=200)
    d.polygon(mirror([(cx - 84, 96), (cx - 6, 84), (cx - 10, 112), (cx - 80, 120)]), fill=200)
    # eyes (slanted, glowing)
    eye = [(cx - 74, 116), (cx - 30, 108), (cx - 36, 140), (cx - 70, 138)]
    d.polygon(eye, fill=255); d.polygon(mirror(eye), fill=255)
    # snarling fanged mouth (zigzag)
    teeth = []
    n = 7
    for i in range(n + 1):
        x = cx - 84 + i * (168 / n)
        teeth.append((x, 176 + (18 if i % 2 else 0)))
    mouth = [(cx - 88, 168)] + teeth + [(cx + 88, 168)]
    d.polygon(mouth, fill=255)
    # jaw sides
    d.polygon([(cx - 90, 150), (cx - 78, 150), (cx - 60, 210), (cx - 84, 196)], fill=180)
    d.polygon(mirror([(cx - 90, 150), (cx - 78, 150), (cx - 60, 210), (cx - 84, 196)]), fill=180)

    m = np.asarray(mask).astype(float) / 255.0
    glow = np.asarray(mask.filter(ImageFilter.GaussianBlur(6))).astype(float) / 255.0
    inten = np.clip(m + glow * 0.6, 0, 1)
    rgb = np.stack([np.full((S, S), 255.0),
                    90 + 120 * m,              # cores whiter-hot
                    20 + 70 * m], -1)
    _save_rgba(rgb, inten, 'titan-emblem.png')


def main():
    gen_platform()
    gen_lava()
    gen_ui_plate()
    gen_ash()
    gen_grid()
    gen_ember()
    gen_titan_emblem()
    for f in ('platform.png', 'lava-tile.png', 'ui-plate.png', 'ash.png',
              'grid.png', 'ember.png', 'titan-emblem.png'):
        p = os.path.join(OUT, f)
        print(f, Image.open(p).size, os.path.getsize(p), 'bytes')


if __name__ == '__main__':
    main()

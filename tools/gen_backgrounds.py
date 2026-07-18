#!/usr/bin/env python3
"""Procedurally render Lava Leap environment backgrounds at high resolution.

Pure code (numpy + Pillow) — no source art, no upscaling. Renders at 2x the
game canvas (1200x1440) so the backdrops stay crisp when Phaser displays them
at 600x720. Deterministic per-zone seeds → identical output every run.

Usage:  python3 tools/gen_backgrounds.py
Outputs: public/assets/backgrounds/{bg-z0..3,menu,victory,gameover}.jpg
"""
import os
import numpy as np
from PIL import Image, ImageFilter

W, H = 1200, 1440
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'backgrounds')


# ----------------------------------------------------------------------------
# noise primitives
# ----------------------------------------------------------------------------
def _smooth(t):
    return t * t * (3 - 2 * t)


def value_noise(w, h, scale, seed):
    """Bilinear value noise in [0,1], smoothstep-interpolated."""
    rng = np.random.default_rng(seed)
    gw, gh = int(w / scale) + 2, int(h / scale) + 2
    grid = rng.random((gh, gw))
    ys = np.linspace(0, gh - 1.001, h)
    xs = np.linspace(0, gw - 1.001, w)
    y0 = np.floor(ys).astype(int); x0 = np.floor(xs).astype(int)
    y1 = y0 + 1; x1 = x0 + 1
    ty = _smooth(ys - y0)[:, None]; tx = _smooth(xs - x0)[None, :]
    g = grid
    top = g[y0][:, x0] * (1 - tx) + g[y0][:, x1] * tx
    bot = g[y1][:, x0] * (1 - tx) + g[y1][:, x1] * tx
    return top * (1 - ty) + bot * ty


def fbm(w, h, scale, octaves, seed, persistence=0.5):
    """Fractal (sum-of-octaves) value noise, normalized to [0,1]."""
    out = np.zeros((h, w)); amp = 1.0; tot = 0.0; s = scale
    for o in range(octaves):
        out += amp * value_noise(w, h, s, seed + o * 101)
        tot += amp; amp *= persistence; s *= 0.5
    out /= tot
    return (out - out.min()) / (np.ptp(out) + 1e-9)


def worley_edges(w, h, npts, seed, sharp=1.0):
    """Cellular crack map: bright along cell borders (rock seams), dark inside.

    Computed at half-res for speed then upsampled — plenty crisp for glowing
    lava seams and much faster than full-res nearest-point search.
    """
    hw, hh = w // 2, h // 2
    rng = np.random.default_rng(seed)
    pts = rng.random((npts, 2)) * [hh, hw]
    yy, xx = np.mgrid[0:hh, 0:hw]
    f1 = np.full((hh, hw), 1e18); f2 = np.full((hh, hw), 1e18)
    for py, px in pts:
        d = (yy - py) ** 2 + (xx - px) ** 2
        closer = d < f1
        f2 = np.where(closer, f1, np.minimum(f2, d))
        f1 = np.where(closer, d, f1)
    edge = np.sqrt(f2) - np.sqrt(f1)          # small near borders
    edge = np.clip(1.0 - edge / (18.0 / sharp), 0, 1) ** 2
    img = Image.fromarray((edge * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)
    return np.asarray(img).astype(float) / 255.0


# ----------------------------------------------------------------------------
# compositing helpers  (work in float RGB, HxWx3, range 0..255)
# ----------------------------------------------------------------------------
def canvas(rgb):
    return np.ones((H, W, 3)) * np.array(rgb, float)


def vgrad(top, bot, ease=1.0):
    t = (np.linspace(0, 1, H)[:, None] ** ease)
    top = np.array(top, float); bot = np.array(bot, float)
    return (top[None, None] * (1 - t[:, :, None]) + bot[None, None] * t[:, :, None]) * np.ones((1, W, 1))


def screen(a, b):
    return 255 - (255 - a) * (255 - b) / 255


def add_glow(img, mask, color, strength=1.0):
    """Additive colored glow where mask (HxW, 0..1) is hot."""
    m = (mask[:, :, None] * strength)
    return np.clip(img + m * np.array(color, float), 0, 255)


def blur(mask, radius):
    im = Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8))
    im = im.filter(ImageFilter.GaussianBlur(radius))
    return np.asarray(im).astype(float) / 255.0


def vignette(strength=0.55, ry=1.15):
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    cx, cy = W / 2, H / 2
    d = np.sqrt(((xx - cx) / (W / 2)) ** 2 + ((yy - cy) / (H / 2) * ry) ** 2)
    return np.clip(d - 0.55, 0, 1) * strength


def embers(img, n, seed, color, y_bias=1.6, size=(2, 7)):
    rng = np.random.default_rng(seed)
    layer = np.zeros((H, W))
    ys = (rng.random(n) ** (1 / y_bias)) * H         # denser toward bottom
    xs = rng.random(n) * W
    for x, y in zip(xs, ys):
        r = rng.integers(size[0], size[1])
        yy, xx = np.mgrid[max(0, int(y) - r * 3):min(H, int(y) + r * 3),
                          max(0, int(x) - r * 3):min(W, int(x) + r * 3)]
        g = np.exp(-(((xx - x) ** 2 + (yy - y) ** 2) / (2 * r * r)))
        layer[yy.min():yy.min() + g.shape[0], xx.min():xx.min() + g.shape[1]] += g * rng.uniform(0.4, 1.0)
    return add_glow(img, np.clip(layer, 0, 1), color, 1.0)


def finalize(img, name, vig=0.55):
    img = img * (1 - vignette(vig)[:, :, None])
    img = np.clip(img, 0, 255).astype(np.uint8)
    # Opaque, full-screen backdrops → JPEG keeps the web payload small with no
    # visible loss on this soft, gradient-heavy art (PNG was ~4MB total).
    Image.fromarray(img, 'RGB').save(
        os.path.join(OUT, name + '.jpg'), quality=90, optimize=True, progressive=True)
    return img


# ----------------------------------------------------------------------------
# zone renderer — cavern of glowing cracked rock with a lava floor
# ----------------------------------------------------------------------------
def cavern(seed, pal, lava_h=0.34, crack_pts=90, ember_n=90, extra=None, seam_glow=1.0):
    """pal keys: deep, rock, rock_lo, lava_core, lava_mid, lava_dark, glow, ember"""
    img = vgrad(pal['deep'], pal['rock_lo'], ease=1.4)

    # --- rock body: fbm height field, dark, textured -------------------------
    rock = fbm(W, H, 260, 5, seed)
    rock2 = fbm(W, H, 90, 4, seed + 7)
    shade = 0.55 + 0.45 * rock2
    rock_rgb = (np.array(pal['rock'], float)[None, None] * shade[:, :, None]
                + np.array(pal['rock_lo'], float)[None, None] * (1 - shade[:, :, None]))
    # cavern opening: darker toward center-top (the depth you climb into)
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    opening = np.clip(1 - (((xx - W / 2) / (W * 0.42)) ** 2 + ((yy - H * 0.30) / (H * 0.5)) ** 2), 0, 1)
    rock_mask = np.clip(rock * 1.15 - opening * 0.85, 0, 1)
    rock_mask = blur(rock_mask, 2)
    img = img * (1 - rock_mask[:, :, None]) + rock_rgb * rock_mask[:, :, None]

    # --- glowing seams through the rock -------------------------------------
    cracks = worley_edges(W, H, crack_pts, seed + 3, sharp=1.3)
    seam = cracks * rock_mask * (0.35 + 0.65 * (1 - opening))
    img = add_glow(img, blur(seam, 1) * 0.9 * seam_glow, pal['glow'], 1.0)

    # --- lava floor ----------------------------------------------------------
    floor_top = int(H * (1 - lava_h))
    ly = np.clip((np.arange(H) - floor_top) / (H - floor_top), 0, 1)[:, None]
    lava_cells = worley_edges(W, H, 140, seed + 11, sharp=1.7)
    flow = fbm(W, H, 120, 3, seed + 5)
    lava_bright = np.clip((0.4 + 0.6 * flow) * (0.5 + 0.7 * lava_cells), 0, 1)
    lcol = (np.array(pal['lava_dark'], float)[None, None] * (1 - lava_bright[:, :, None])
            + np.array(pal['lava_core'], float)[None, None] * lava_bright[:, :, None])
    lmask = blur(np.clip(ly * 1.2, 0, 1) * np.ones((H, W)), 4)[:, :, None]
    img = img * (1 - lmask) + lcol * lmask
    # big soft up-glow off the lava
    up = blur(np.clip(ly * np.ones((H, W)), 0, 1), 60)
    img = add_glow(img, up * 0.5, pal['lava_mid'], 1.0)

    if extra:
        img = extra(img, seed, pal)

    img = embers(img, ember_n, seed + 21, pal['ember'])
    return img


# ----------------------------------------------------------------------------
# signature extras per zone
# ----------------------------------------------------------------------------
def lava_falls(img, seed, pal):
    """z1 — two bright vertical lava cataracts."""
    rng = np.random.default_rng(seed + 40)
    for fx in (0.30, 0.68):
        x = fx * W + rng.uniform(-30, 30)
        wdt = rng.uniform(34, 52)
        col = np.abs(np.arange(W) - x)
        band = np.clip(1 - col / wdt, 0, 1) ** 1.5
        streak = fbm(W, H, 40, 3, seed + int(fx * 100)) * 0.5 + 0.6
        top = int(H * 0.05)
        ymask = np.clip((np.arange(H) - top) / (H * 0.2), 0, 1)[:, None]
        m = band[None, :] * streak * ymask
        img = add_glow(img, blur(m, 2) * 0.8, pal['lava_core'], 1.0)
        img = add_glow(img, blur(band[None, :] * ymask * np.ones((H, W)), 22) * 0.35, pal['lava_mid'], 1.0)
    return img


def fortress(img, seed, pal):
    """z2 — jagged fortress/spire silhouettes rising from the lava."""
    rng = np.random.default_rng(seed + 60)
    base = int(H * 0.80)
    sky = np.zeros((H, W))
    x = -20
    while x < W:
        tw = rng.integers(90, 190)
        th = rng.integers(200, 520)
        top = max(2, base - th)
        sky[top:base, max(0, x):x + tw] = 1
        # a taller keep spire on some towers
        if rng.random() < 0.5:
            sw = rng.integers(20, 40); sx = x + tw // 2 - sw // 2
            sky[max(2, top - rng.integers(60, 140)):top, max(0, sx):sx + sw] = 1
        # crenellations along the top
        for c in range(max(0, x), x + tw, max(20, tw // 6)):
            sky[max(0, top - rng.integers(16, 34)):top, c:c + rng.integers(10, 20)] = 1
        x += tw + rng.integers(-30, 12)
    sky = blur(sky, 1.4)
    tow = np.array(pal['rock_lo'], float) * 0.6
    img = img * (1 - sky[:, :, None] * 0.92) + tow[None, None] * sky[:, :, None] * 0.92
    # windows: faint glowing dots inside the towers
    win = np.zeros((H, W)); rng2 = np.random.default_rng(seed + 61)
    ys, xs = np.where(sky > 0.9)
    if len(ys):
        idx = rng2.choice(len(ys), size=min(120, len(ys)), replace=False)
        for i in idx:
            win[ys[i]:ys[i] + 3, xs[i]:xs[i] + 3] = rng2.uniform(0.3, 1.0)
    img = add_glow(img, blur(win, 1) * 0.8, pal['lava_core'], 1.0)
    # rim light where towers meet the glow below
    rim = np.clip(sky - np.roll(sky, -8, axis=0), 0, 1)
    img = add_glow(img, blur(rim, 2) * 0.8, pal['glow'], 1.0)
    return img


def _shard(body, edge, cx, cy, ln, wdt, ang):
    """Rasterize one solid crystal shard (thin tapering diamond)."""
    ax, ay = np.cos(ang), np.sin(ang)               # long axis toward the tip
    px, py = -ay, ax                                # perpendicular
    r = int(ln + wdt) + 2
    ya, yb = max(0, int(cy - r)), min(H, int(cy + r))
    xa, xb = max(0, int(cx - r)), min(W, int(cx + r))
    if yb <= ya or xb <= xa:
        return
    yy, xx = np.mgrid[ya:yb, xa:xb]
    u = (xx - cx) * ax + (yy - cy) * ay             # along axis
    v = (xx - cx) * px + (yy - cy) * py             # across axis
    halfw = wdt * (1 - np.clip(u / ln, 0, 1))       # taper to a point
    inside = (np.abs(v) <= halfw) & (u >= -wdt * 0.3) & (u <= ln)
    fill = inside * (0.5 + 0.5 * np.clip(1 - u / ln, 0, 1))
    body[ya:yb, xa:xb] = np.maximum(body[ya:yb, xa:xb], fill)
    facet = np.clip(1 - np.abs(np.abs(v) - halfw) / 3.0, 0, 1) * inside
    edge[ya:yb, xa:xb] = np.maximum(edge[ya:yb, xa:xb], facet)


def crystals(img, seed, pal):
    """z3 — clustered glowing crystal shards growing up from ledges."""
    rng = np.random.default_rng(seed + 80)
    body = np.zeros((H, W)); edge = np.zeros((H, W))
    for _ in range(16):
        cx = rng.uniform(0.06, 0.94) * W
        cy = rng.uniform(0.5, 0.96) * H
        for _ in range(rng.integers(2, 4)):
            ln = rng.uniform(80, 210); wdt = rng.uniform(20, 38)
            ang = -np.pi / 2 + rng.uniform(-0.45, 0.45)   # mostly upward
            _shard(body, edge, cx + rng.uniform(-26, 26), cy + rng.uniform(-8, 8), ln, wdt, ang)
    img = add_glow(img, blur(body, 3) * 0.85, pal['lava_mid'], 1.0)   # solid inner glow
    img = add_glow(img, blur(body, 1) * 0.5, pal['ember'], 1.0)
    img = add_glow(img, blur(edge, 1) * 1.0, (210, 240, 255), 1.0)    # bright white-blue facets
    img = add_glow(img, blur(np.maximum(body, edge), 16) * 0.4, pal['glow'], 1.0)
    return img


# ----------------------------------------------------------------------------
# palettes
# ----------------------------------------------------------------------------
PAL = {
    0: dict(deep=(28, 14, 11), rock=(58, 34, 28), rock_lo=(20, 11, 9),
            lava_core=(255, 196, 70), lava_mid=(255, 96, 20), lava_dark=(120, 24, 8),
            glow=(120, 40, 12), ember=(255, 150, 60)),
    1: dict(deep=(40, 18, 10), rock=(70, 38, 26), rock_lo=(26, 12, 7),
            lava_core=(255, 214, 96), lava_mid=(255, 120, 28), lava_dark=(150, 34, 8),
            glow=(150, 55, 16), ember=(255, 170, 70)),
    2: dict(deep=(26, 18, 20), rock=(58, 50, 52), rock_lo=(18, 13, 14),
            lava_core=(255, 150, 60), lava_mid=(220, 70, 24), lava_dark=(110, 26, 14),
            glow=(120, 46, 30), ember=(200, 195, 200)),
    3: dict(deep=(18, 12, 32), rock=(40, 32, 62), rock_lo=(10, 7, 20),
            lava_core=(150, 90, 255), lava_mid=(110, 60, 220), lava_dark=(40, 20, 90),
            glow=(90, 60, 200), ember=(120, 210, 255)),
}


def render_zones():
    finalize(cavern(1001, PAL[0], lava_h=0.34, crack_pts=90, ember_n=90), 'bg-z0')
    finalize(cavern(2002, PAL[1], lava_h=0.30, crack_pts=80, ember_n=120, extra=lava_falls), 'bg-z1')
    finalize(cavern(3003, PAL[2], lava_h=0.24, crack_pts=70, ember_n=220, extra=fortress, seam_glow=0.4), 'bg-z2', vig=0.6)
    finalize(cavern(4004, PAL[3], lava_h=0.26, crack_pts=70, ember_n=70, extra=crystals), 'bg-z3', vig=0.62)


# ----------------------------------------------------------------------------
# UI screens
# ----------------------------------------------------------------------------
def render_menu():
    p = PAL[0]
    img = vgrad((60, 20, 16), (14, 7, 6), ease=0.8)
    # distant sky glow
    img = add_glow(img, blur(np.clip(1 - np.abs(np.mgrid[0:H, 0:W][1] - W / 2) / (W * 0.5), 0, 1)
                             * (1 - np.linspace(0, 1, H)[:, None]), 40) * 0.4, (180, 70, 30), 1.0)
    # volcano silhouette
    xs = np.arange(W)
    peak = H * 0.34
    mtn = peak + np.abs(xs - W / 2) * 0.62
    prof = fbm(W, 1, 30, 3, 55)[0] * 30
    mtn = mtn + prof
    yy = np.arange(H)[:, None]
    mask = (yy > mtn[None, :]).astype(float)
    mask = blur(mask, 1.5)
    dark = np.array((16, 9, 8), float)
    img = img * (1 - mask[:, :, None]) + dark[None, None] * mask[:, :, None]
    # lava river down the flank + crater glow
    crater = np.exp(-(((xs - W / 2) / 90) ** 2))[None, :] * np.clip(1 - np.abs(yy - peak) / 120, 0, 1)
    img = add_glow(img, blur(crater * mask, 6) * 0.9, p['lava_core'], 1.0)
    riv = np.exp(-(((xs - W / 2) / 26) ** 2))[None, :] * np.clip((yy - peak) / (H - peak), 0, 1) * mask
    img = add_glow(img, blur(riv, 3) * 0.8, p['lava_mid'], 1.0)
    img = embers(img, 120, 77, p['ember'], y_bias=0.9)
    finalize(img, 'menu', vig=0.5)


def render_victory():
    # golden sunburst
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    cx, cy = W / 2, H * 0.62
    ang = np.arctan2(yy - cy, xx - cx)
    rays = 0.5 + 0.5 * np.cos(ang * 26)
    rays = rays ** 3
    rad = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    fall = np.clip(1 - rad / (W * 0.75), 0, 1)
    img = vgrad((110, 55, 10), (30, 12, 4), ease=0.8)
    img = add_glow(img, rays * fall * 0.7, (255, 180, 40), 1.0)
    img = add_glow(img, np.exp(-(rad / (W * 0.32)) ** 2) * 1.0, (255, 225, 130), 1.0)
    # rocky foreground rim
    ridge = H * 0.86 + fbm(W, 1, 40, 3, 9)[0] * 40
    mask = (np.arange(H)[:, None] > ridge[None, :]).astype(float)
    img = img * (1 - blur(mask, 1)[:, :, None] * 0.95)
    img = embers(img, 90, 91, (255, 210, 120), y_bias=0.7)
    finalize(img, 'victory', vig=0.45)


def render_gameover():
    p = PAL[0]
    img = vgrad((60, 8, 12), (10, 2, 3), ease=1.1)
    # cracked scale texture
    cells = worley_edges(W, H, 120, 5, sharp=1.4)
    img = add_glow(img, cells * 0.18, (150, 30, 24), 1.0)
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    # two menacing eyes
    for ex in (W * 0.36, W * 0.64):
        ey = H * 0.40
        d = ((xx - ex) / 95) ** 2 + ((yy - ey) / 55) ** 2
        eye = np.clip(1 - d, 0, 1) ** 1.5
        img = add_glow(img, blur(eye, 3), (255, 140, 30), 1.0)
        img = add_glow(img, np.clip(1 - d * 3, 0, 1), (255, 230, 120), 1.0)
    # grin
    gx = np.linspace(W * 0.30, W * 0.70, 400)
    gy = H * 0.60 + np.sin((gx - W * 0.3) / (W * 0.4) * np.pi) * 46
    grin = np.zeros((H, W))
    for x, y in zip(gx, gy):
        grin[int(y):int(y) + 10, int(x):int(x) + 6] = 1
    img = add_glow(img, blur(grin, 3) * 0.9, (255, 90, 20), 1.0)
    img = embers(img, 70, 13, (220, 60, 40), y_bias=1.0)
    finalize(img, 'gameover', vig=0.6)


def main():
    os.makedirs(OUT, exist_ok=True)
    render_zones()
    render_menu()
    render_victory()
    render_gameover()
    print('rendered ->', os.path.normpath(OUT))
    for f in sorted(os.listdir(OUT)):
        if f.endswith('.jpg'):
            print(' ', f, os.path.getsize(os.path.join(OUT, f)) // 1024, 'KB')


if __name__ == '__main__':
    main()

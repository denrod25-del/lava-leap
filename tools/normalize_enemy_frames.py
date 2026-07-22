"""Normalize raw PixelLab enemy frames onto uniform 48x48 canvases.
Union-bbox across each enemy's frames -> one shared scale (no size pop),
crawler bottom-anchored, drifter centered.
Run from repo root: python tools/normalize_enemy_frames.py
"""
import os, glob
from PIL import Image

OUT = os.path.join('public', 'assets', 'enemies')
CANVAS = 48

for kind, anchor in (('crawler', 'bottom'), ('drifter', 'center')):
    raws = sorted(glob.glob(os.path.join('tools', 'enemy-raw', kind, '*.png')))
    if not raws:
        print(f'{kind}: no raws, skipped'); continue
    ims = [Image.open(p).convert('RGBA') for p in raws]
    boxes = [im.getbbox() for im in ims]
    l = min(b[0] for b in boxes); t = min(b[1] for b in boxes)
    r = max(b[2] for b in boxes); btm = max(b[3] for b in boxes)
    w, h = r - l, btm - t
    scale = min((CANVAS - 2) / w, (CANVAS - 2) / h, 1.0)
    for i, im in enumerate(ims):
        crop = im.crop((l, t, r, btm))
        nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
        crop = crop.resize((nw, nh), Image.LANCZOS)
        canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
        x = (CANVAS - nw) // 2
        y = (CANVAS - nh) if anchor == 'bottom' else (CANVAS - nh) // 2
        canvas.paste(crop, (x, y), crop)
        canvas.save(os.path.join(OUT, f'{kind}-{i}.png'))
    print(f'{kind}: {len(ims)} frames normalized')

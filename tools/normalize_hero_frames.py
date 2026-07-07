#!/usr/bin/env python3
"""Normalize raw PixelLab frames to Lava Leap's 48x48 sprite contract.

For each animation SET: compute ONE union bounding box across the frames it uses
(so inter-frame alignment is preserved exactly — no per-frame wobble), crop every
frame to that box, then composite bottom-anchored + horizontally centered onto a
fresh 48x48 transparent canvas. `y_off` nudges a whole set UP (e.g. a jump tuck)
without re-deriving anything. Pixels are never scaled — only cropped and placed —
so the pixel art stays crisp. Run from repo root: python tools/normalize_hero_frames.py
"""
import sys
from pathlib import Path
from PIL import Image

CANVAS = 48
RAW = Path("tools/hero-raw")
OUT = Path("public/assets/anim")
STATIC_OUT = Path("public/assets/player.png")

# (raw subdir, [(raw_source_index, output_name), ...], y_off)
# jump: pick raw frames 1,2,3,4,6 → crouch, launch, rise, apex, descend.
SETS = [
    ("run",  [(i, f"run-{i}") for i in range(6)], 0),
    ("jump", [(1, "jump-1"), (2, "jump-2"), (3, "jump-3"), (4, "jump-4"), (6, "jump-5")], 0),
    ("idle", [(i, f"idle-{i}") for i in range(4)], 0),
]

def load(subdir):
    files = sorted((RAW / subdir).glob("0*.png"))
    return [Image.open(f).convert("RGBA") for f in files]

def union_bbox(frames):
    box = None
    for im in frames:
        b = im.getbbox()
        if b is None:
            continue
        box = b if box is None else (
            min(box[0], b[0]), min(box[1], b[1]),
            max(box[2], b[2]), max(box[3], b[3]),
        )
    if box is None:
        raise SystemExit("ERROR: a set has only fully-transparent frames")
    return box

def place(frame, box, y_off, scale):
    crop = frame.crop(box)
    if scale < 1.0:
        # One uniform downscale (computed across ALL sets) so she's the same size
        # in every state and fits 48x48. LANCZOS for a clean intermediate; the engine
        # then nearest-samples to the 30x40 display, so this is invisible in-game.
        crop = crop.resize((max(1, round(crop.width * scale)),
                            max(1, round(crop.height * scale))), Image.LANCZOS)
    w, h = crop.size
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(crop, ((CANVAS - w) // 2, CANVAS - h - y_off), crop)
    return canvas

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # First pass: per-set union boxes + the global scale needed to fit 48x48.
    prepared = []
    max_dim = CANVAS
    for subdir, mapping, y_off in SETS:
        frames = load(subdir)
        box = union_bbox([frames[src] for src, _ in mapping])
        max_dim = max(max_dim, box[2] - box[0], box[3] - box[1])
        prepared.append((frames, mapping, y_off, box))
    scale = CANVAS / max_dim  # <=1.0; 1.0 when everything already fits
    idle_first = None
    total = 0
    for frames, mapping, y_off, box in prepared:
        for src, name in mapping:
            out = place(frames[src], box, y_off, scale)
            out.save(OUT / f"{name}.png")
            total += 1
            if name == "idle-0":
                idle_first = out
    if idle_first is not None:
        idle_first.save(STATIC_OUT)
    print(f"Wrote {total} frames + {STATIC_OUT} -> all {CANVAS}x{CANVAS} (scale={scale:.3f})")

if __name__ == "__main__":
    main()

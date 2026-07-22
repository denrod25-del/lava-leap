"""Derive the roar pose from the existing titan.png: warm pixels glow brighter,
whole sprite scales up ~6% re-centered on the same canvas. No regeneration.
Run from repo root: python tools/gen_titan_roar.py
"""
from PIL import Image

im = Image.open('public/assets/boss/titan.png').convert('RGBA')
px = im.load()
W, H = im.size
for y in range(H):
    for x in range(W):
        r, g, b, a = px[x, y]
        if a > 40 and r > 120 and r > b:  # warm mask: mouth/eye/crack glow
            px[x, y] = (min(255, int(r * 1.35)), min(255, int(g * 1.5)), b, a)
s = 1.06
big = im.resize((round(W * s), round(H * s)), Image.NEAREST)
canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
canvas.paste(big, ((W - big.width) // 2, (H - big.height) // 2), big)
canvas.save('public/assets/boss/titan-roar.png')
print('titan-roar.png written', canvas.size)

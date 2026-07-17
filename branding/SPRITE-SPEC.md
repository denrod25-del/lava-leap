# Lava Leap — Game-Ready Sprite Spec

This is the exact spec for redrawing the concept art in this folder
(`concept-climber.png`, `concept-character-pack.png`, `concept-titan.png`,
`concept-powerups.png`) as sprites the game can use **without any code changes**.
Hand it to a pixel artist or an AI pixel-art tool as-is.

The concepts themselves can't be sliced directly: frames aren't on an even grid,
have no transparency, and carry garbled text. This document is the bridge.

## Global rules (apply to every sprite)

- **Format**: PNG with real alpha transparency. No baked-in background, floor
  shadow, or rectangular glow — only the sprite itself.
- **Style**: pixel art with hard edges. No anti-aliasing halo against the
  transparent background (it shows as a grey fringe in-game).
- **Facing**: EAST (facing right). The engine mirrors sprites for left-facing.
- **Canvas**: the exact sizes below — art centered horizontally, feet resting
  ~4 px above the bottom edge, and that baseline identical across every frame
  of a set (otherwise animations "swim").
- **No text or watermarks** anywhere in the art.
- **Filenames**: exactly as listed. Individual PNGs preferred (that is what the
  engine loads); a strip is acceptable only with the frame order stated.
- **Colors**: brand palette `#FF4500 #FFB800 #FFD247 #1A1A1A #6B6B6B #FFFFFF`
  plus what the character needs (red jacket, skin, teal effects). Keep each
  sprite to roughly 16 colors and check it still reads at 50% zoom.

## 1. Player character — 16 files per skin, each **48×48**

Drop-in location: `public/assets/characters/<id>/`. Existing skins to restyle:
`ember` (the default — the red-jacket climber in the concepts), `classic`,
`cole`. A brand-new skin = a new folder + one roster line in
`src/core/characters.ts` (I can add that).

| File | Role | Pose | Playback |
|---|---|---|---|
| `player.png` | static/UI sprite | confident standing pose | — |
| `idle-0.png` … `idle-3.png` | idle loop | subtle breathing cycle | 6 fps, loops — frame 3 must flow back into frame 0 |
| `run-0.png` … `run-5.png` | run loop | full run cycle (contact → push → pass → contact opposite → push → pass) | 10 fps, loops seamlessly |
| `jump-1.png` | jump | crouched anticipation | 12 fps, plays once |
| `jump-2.png` | jump | launch, legs extending | ↑ |
| `jump-3.png` | jump | tucked mid-ascent | ↑ |
| `jump-4.png` | fall | extended in air, falling | 8 fps, plays once |
| `jump-5.png` | fall | landing anticipation, arms up | ↑ |

Note: there is **no `jump-0`** — jump numbering starts at 1. In-game the sprite
is displayed at 30×40 (slightly slimmed), so silhouettes must stay bold and
readable when small.

**AI-tool shortcut**: the current frames were generated with
[PixelLab](https://www.pixellab.ai) at 48×48, direction EAST, using the
`breathing-idle` (4 frames), `running-6-frames` (6 frames), and
`two-footed-jump` (frames 1–5) animation templates. Regenerating with the new
character design on those same templates produces files that drop straight in.

## 2. Lava Titan (boss) — 1 file, **128×128**

`public/assets/boss/titan.png` — transparent PNG, displayed at 140×140. The
game currently uses a **single static image** (rising, shaking, and attacks are
done in code), so only one frame is needed. The idle/attack/fireball/stomp rows
in `concept-titan.png` would need new engine animation support first — treat
those as a separate, later project.

## 3. Enemies — 1 file each, **48×48**

- `public/assets/enemies/crawler.png` — patrols on platforms.
- `public/assets/enemies/drifter.png` — floats/hovers in the air.

Displayed at roughly 32 px; silhouette-first, transparent, EAST-facing.

## 4. Power-up pickups — 4 files, **32×32** (new art slot)

Power-ups are currently plain colored circles (16 px), so this is pure upgrade
territory for the icon style in `concept-powerups.png`. Wiring images in is a
small code change I'll make once art exists. Game names are exact:

| File | In-game effect | Concept reference |
|---|---|---|
| `powerup-shield.png` | one-hit shield | teal shield icon |
| `powerup-rocket.png` | rocket boost upward | speed-boost bolt / fire dash |
| `powerup-magnet.png` | pulls coins in | magnet icon |
| `powerup-slowlava.png` | slows the rising lava | ice/hourglass-style icon (no concept yet) |

(The concept sheet's "coin ×2", "extra life", and "invincible" icons have no
matching mechanic in the game — skip them or treat as future features.)

## 5. Tiles and coin — **32×32** each

- `public/assets/platform.png` — platform tile, must tile horizontally.
- `public/assets/lava-tile.png` — lava surface tile, must tile horizontally
  (the game scrolls it for motion).
- `public/assets/coin.png` — displayed at 16×16; keep it a simple bold coin.

## Acceptance checklist (run per delivered file)

- [ ] Exact canvas size (48×48 / 128×128 / 32×32 as specified)
- [ ] True alpha transparency; no background, floor shadow, or halo
- [ ] Faces EAST (right)
- [ ] Baseline/centering identical across all frames of a set
- [ ] `run` and `idle` loop with no visible pop
- [ ] No text, letters, or watermarks
- [ ] Reads clearly at 50% zoom
- [ ] Filename matches this spec exactly

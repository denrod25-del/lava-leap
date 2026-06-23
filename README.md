# Lava Leap

Lava Leap is an endless vertical climber built with **Phaser 3 + TypeScript + Vite**.
Climb procedurally-generated platforms as fast as you can while escaping the rising
lava below. Your score is your **height plus the coins** you grab along the way, and
your best run is saved as a persistent high score.

## Controls

| Action | Keys |
|--------|------|
| Move left / right | Arrow keys, or `A` / `D` |
| Jump | `Up` or `Space` — tap for a short hop, hold for a higher jump |
| Double jump | Press jump again in mid-air |
| Wall slide | Hold toward a wall while falling |
| Wall jump | Jump while sliding on a wall |
| Air dash | `Shift` or `X` |
| Start / Retry | `Space` |
| Pause / Resume | `Esc` or `P` |

## Setup & Scripts

```bash
npm install
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server — play at <http://localhost:5188> |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run the Playwright boot/render/input smoke test |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run typecheck` | Type-check only (no emit) |

## Project Structure

- `src/core/` — pure, framework-free game logic (level generation, scoring, RNG),
  fully unit-tested.
- `src/scenes/` — Phaser scenes (boot, menu, game, HUD, game over).
- `src/entities/` — in-game entity managers (player, platforms, coins, lava).
- `src/tuning.ts` — all gameplay tuning constants (physics, reach budget, stream).
- `tests/` — Vitest unit tests for the core logic.
- `e2e/` — Playwright end-to-end smoke tests.

---

## v2 — What's New

### Zones

The climb now passes through named biomes. **Volcanic Throat** activates at height 600
and increases lava speed; background gradients and platform tints shift to match the zone.
More zones extend the climb at higher heights.

### Menu Options

From the main menu, extra keys unlock additional screens:

| Key | Screen |
|-----|--------|
| `A` | Achievements — locked/unlocked list of run milestones |
| `D` | Daily Challenge — one fixed seed per calendar day, ranked best |
| `C` | Cosmetics Shop — spend banked coins on player tints |
| `S` | Settings — music volume, SFX volume, screen shake toggle |
| `F9` | Local Stats Panel — runs, coins banked, death-by-height histogram; `J` copies JSON, `R` resets |

### Pause

Press `Esc` or `P` during a run to open the pause overlay. From there you can
Resume, Restart, open Settings, or Quit to Menu. Coins earned so far are banked
on quit/restart.

### Crash Recovery

An unhandled error shows a full-screen overlay instead of a blank canvas. Click
anywhere to reload the game.

### Regenerating Audio Assets

The procedural audio files in `public/audio/` are committed, but can be
regenerated from the synthesis scripts:

```bash
node tools/gen-sfx.mjs    # re-synthesise all SFX WAVs
node tools/gen-music.mjs  # re-synthesise all music loops
```

---

## v3 — What's New

### Enemies

Two enemy types now patrol the climb. **Crawlers** walk along platforms; **drifters**
hover and bob through open air. Contact with either is lethal — but you can fight back:

- **Stomp** an enemy by landing on it from above.
- **Dash** through an enemy (`Shift` / `X`) to destroy it.

### Power-ups

Glowing pickups drop on platforms and grant a timed effect:

| Power-up | Effect |
|----------|--------|
| **Shield** | Absorbs one otherwise-lethal hit |
| **Rocket** | A burst of upward boost |
| **Magnet** | Pulls nearby coins toward you |
| **Slow-lava** | Temporarily slows the rising lava |

### Spikes & Bounce Pads

New platform hazards and helpers: **spikes** are lethal on contact, while **bounce
pads** fling you upward for big vertical gains.

### The Lava Titan (boss)

A boss, the **Lava Titan**, awakens at **1000m, 2000m, and 3000m**. It roars, shakes
the screen, and hurls projectiles. Survive its phase to keep climbing.

### Mobile / Touch Controls

On touch-capable devices, on-screen controls appear automatically (a desktop with a
touchscreen keeps full keyboard support too):

| Control | Where |
|---------|-------|
| Run left / right | **Hold the left half** — a floating joystick appears under your thumb; slide left/right (analog: lean a little to walk, far to run) |
| Jump | **Tap the right half** — tap for a short hop, **hold for a higher jump**, tap again in mid-air to **double jump**, a third time for a **triple jump** |
| Wall jump | Run into a wall, then tap to jump |
| Dash | `DASH` button, bottom-right (one per airtime) |
| Pause | `⏸` button, top-right |

Mobile uses the **same manual moveset as the keyboard** — you control every jump's
height and timing; nothing jumps for you.

### Install as an App (PWA)

Lava Leap ships a web-app manifest and icons, so it can be **installed** from a
supported browser (Add to Home Screen / Install App) and launched full-screen.

---

## v4 — What's New

### Mobile Touch Controls

On touch-capable devices, on-screen controls appear automatically (replacing the
v3 d-pad). Mobile is a **two-thumb** layout running the **exact same manual moveset
as the keyboard** — left thumb runs, right thumb jumps, so you can do both at once:

| Control | How |
|---------|-----|
| Run | **Hold the left half** — a floating joystick spawns under your thumb; slide left/right (analog speed) |
| Jump | **Tap the right half** — short hop, hold = higher, tap-in-air = double, again = **triple jump** (mobile only) |
| Wall jump | Run into a wall, then tap |
| Dash | `DASH` button, bottom-right (one per airtime) |
| Pause | `⏸` button, top-right |

Desktop and mobile share one movement code path (a single run axis), so they feel
identical; only the input source (keys vs. touch joystick) differs. Mobile gets a
triple jump since touch climbing is harder; keyboard stays double.

### Combo / Multiplier Scoring

Chaining actions now builds a **score multiplier**. Each stomp, coin, bounce pad,
or power-up bumps the multiplier up a step (capped at x5), and the multiplier
scales the bonus points those actions award. The multiplier **decays back to x1
after about 2.5 seconds** without a new action, so keeping the chain alive is
worth far more than collecting things one at a time. A live multiplier meter and
a draining timer bar appear at the top of the HUD while a combo is active.

### Coin Upgrades

The Cosmetics **Shop** now has an **Upgrades** tab (toggle with `Tab` or by
tapping the tab header) for permanent, coin-funded boosts that persist across
runs:

| Upgrade | Effect |
|---------|--------|
| **Power-Up Time** | +15% power-up duration per level (up to 3 levels) |
| **Start Shield** | Begin every run already holding a shield |
| **Revive** | Auto-revive once per run on an otherwise-lethal hit |

Upgrades are bought with banked coins and saved permanently; old save files are
migrated forward automatically.

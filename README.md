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
| Fast fall | Hold `Down` or `S` while falling |
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
| Fast fall | **Pull the run-stick down** while falling |
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

---

## v5 — What's New

### First-Run Tutorial

Your very first run walks you through the basics with a short sequence of
non-blocking hints — run, jump, double jump, and the golden rule (**the lava
rises — climb!**). Each hint dismisses itself once you perform the action (or
after a few seconds, so it never traps you), and the wording adapts to your
input: keys on desktop, thumbs on touch. It only plays once; you can re-arm it
any time from **Settings → Replay tutorial**.

### How to Play

A new **How to Play** screen (press `H` on the menu, or tap its row) lays out
the controls, the hazards, the power-ups, and the Lava Titan — with
device-appropriate wording for keyboard vs. touch.

### Fast Fall

You can now **dive** while airborne: hold `Down` / `S` on the keyboard, or
**pull the run-stick down** on touch. Great for bailing out of an overshot jump
or lining up a stomp — wall slides still take precedence.

### Start-Screen Polish

The menu earns its keep: the Lava Titan looms as a centerpiece, an animated
lava strip scrolls along the bottom with embers drifting up, the **TAP TO
CLIMB** prompt pulses, and menu rows highlight on hover and click audibly.

### Loading Bar

Booting now shows the wordmark and a real progress bar instead of a black
screen while assets load.

### Web Presence

The page ships a favicon, a proper meta description, and Open Graph tags with
a generated 1200×630 share image — so links to the game unfurl nicely.

### Analytics Hooks

Lightweight, client-side-only event hooks (`start_game`, `death`, `restart`,
boss events, and more) push into `window.dataLayer` **if the page defines
one** (GTM-style). No network calls, no PII, silent no-op otherwise.

### Juice

The lava surface now **bubbles**, and every UI button across the menus clicks
audibly at your SFX volume.

---

## v5.1 — What's New

### In-Game Version Label

The running build now identifies itself. A `vX.Y.Z · <commit>` label sits in the
bottom-left corner of the title screen (tap it to open the changelog), and a full
version / build-date / build-ID block appears at the bottom of **Settings**. The
version, commit, and build date are **auto-injected from `package.json` + git at
build time** — no manual bumping of a string in the source.

### "What's New" Changelog

A new **What's New** screen (press `N` on the menu, or tap the corner build label)
lists recent updates. It **auto-shows once** after the game updates to a new
version — a quick confirmation to players (and to you) that a fresh deploy actually
landed. It only pops once per version, tracked via a `lastSeenVersion` save field.

### Dev Overlay

In dev builds only, a small top-left readout shows the active scene, live FPS, and
the version / build date. It is compiled out of production bundles (guarded by
`import.meta.env.DEV`), so it never ships to players.

### Tightened Meta

The page title and Open Graph copy are sharpened for cleaner link unfurls.

### Vercel Deploy + Cache Headers

The web build is deploy-ready on Vercel. A committed [`vercel.json`](./vercel.json)
pins the build command / output directory and sets a correct cache strategy:
content-hashed assets are cached `immutable` for a year, while `index.html` is
`max-age=0, must-revalidate` so a new deploy is picked up immediately (no service
worker, so nothing stale to clear). See [`DEPLOY.md`](./DEPLOY.md) for the connect
steps and a post-deploy cache-test checklist.

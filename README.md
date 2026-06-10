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

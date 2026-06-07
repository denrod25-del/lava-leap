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
- `e2e/` — Playwright end-to-end smoke test.

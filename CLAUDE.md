# CLAUDE.md — Lava Leap

Guidance for AI assistants working in this repository.

## What this is

**Lava Leap** is an endless vertical climber game built with **Phaser 3 + TypeScript + Vite**. The player climbs procedurally generated platforms while escaping rising lava. It ships as a web game (Vercel), an installable PWA, and an Android app (Capacitor, appId `com.isymbolic.lavaleap`).

- Current version: see `package.json` (`version` field) — every on-screen version label reads it automatically.
- Live: `https://lava-leap-84pb.vercel.app`
- **Read `docs/HANDOFF.md` first.** It is a maintained, detailed context dump (current state, version history, hard-won gotchas) and is richer than `README.md` for engineering context.

## Commands

```bash
npm install
npm run dev          # Vite dev server on port 5188 (--strictPort) → http://localhost:5188
npm run build        # tsc && vite build → dist/
npm run preview      # preview production build
npm test             # vitest run (unit tests, one-shot)
npm run test:watch   # vitest watch mode
npm run test:e2e     # playwright test (boots dev server in --mode test)
npm run typecheck    # tsc --noEmit
```

- **No linter/formatter** is configured (no ESLint/Prettier). Style is enforced only by TypeScript strict flags. Match surrounding style: 2-space indent, single quotes, semicolons.
- **No CI** — there is no `.github/` directory. All testing is local. Deploy is via Vercel connected to the repo.
- Run e2e with **`--workers=1`** (`npx playwright test --workers=1`) to avoid a pre-existing local flake at default parallelism.

## Architecture

Design space is **600×720 portrait**, scaled with `Phaser.Scale.FIT`, Arcade physics.

- **Entry point:** `src/main.ts` — builds the `Phaser.Game`, registers all scenes, installs global crash-overlay handlers, and exports shared singletons `save` (a `SaveData`) and `leaderboard`.
- **`src/core/` — the central architectural rule: pure, framework-free logic that NEVER imports Phaser.** Fully unit-tested in a node environment. Level generation, RNG, scoring (ScoreTracker/ComboTracker/FlowMeter), save data, boss/zone/hazard rules, characters, achievements, leaderboard client, input math, analytics all live here.
- **`src/scenes/`** — Phaser scenes. `GameScene.ts` is the orchestrator wiring together player, level stream, managers, lava, boss, scoring, audio, juice, input. Note: `this.gameEvents` is the game event hub (Phaser owns `this.events`); `this.inputSrc` is the active input source.
- **`src/entities/`** — Phaser entity managers (Player, PlatformManager, CoinManager, Lava, EnemyManager, PowerupController, BossController, AudioDirector, JuiceController, etc.) plus `entities/input/` sources.
- **`src/tuning.ts`** — ALL gameplay tuning constants as `as const` objects (`TUNING`, `REACH`, `STREAM`, `HAZARD`, `POWERUP`, `ENEMY`, `TOUCH`, `AUTO`, `COMBO`, `FLOW`, `JUICE`, `UPGRADES`). **Change gameplay by editing tuning, not scattered literals.**
- **Input abstraction:** all sources (`KeyboardInput`, `TouchSteerInput`, `AutoTouchInput`) implement `InputSource` and feed one `InputState` with a `runAxis` (±1) so desktop and mobile share one `Player.update()` path.
- **Level generation:** `LevelGenerator` uses the deterministic `mulberry32` RNG (`core/rng.ts`) with a strict "reach budget" that guarantees no gap exceeds jump reach. `LevelStream` streams chunks as the player climbs.
- **Persistence:** `SaveData` owns all localStorage access, guards every read/write, and does versioned migrations.

## Directory map

```
src/core/       Pure logic — no Phaser. New pure logic goes here + a test in tests/.
src/scenes/     Phaser scenes (GameScene is the orchestrator).
src/entities/   Phaser entity managers + input/ sources.
src/tuning.ts   All gameplay constants.
src/main.ts     Entry point.
tests/          Vitest unit tests (mirror src/core).
e2e/            Playwright specs.
public/assets/  Game assets (boss/, characters/<id>/, enemies/, music/, sfx/, ...).
supabase/       migrations/0001_leaderboards.sql (scores table + SECURITY DEFINER RPCs, RLS).
android/        Capacitor Android project (Gradle).
landing/        SEPARATE marketing site — its own project, README, Vercel project. Do not conflate.
tools/          Optional asset-gen scripts.
docs/HANDOFF.md Read this first.
```

## Conventions

- **TypeScript strict everywhere** (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noEmit`). Target ES2020, `moduleResolution: bundler`.
- **Naming:** PascalCase for classes/scenes/entity files (`PlatformManager.ts`); camelCase for pure-function modules (`rng.ts`, `hazardRules.ts`).
- **Dev-only code** is guarded by `import.meta.env.DEV` and stripped from production (e.g. `window.__game`, `DevOverlay`). Live-verification / e2e must run against the dev server.
- **Build identity:** `vite.config.ts` injects `__APP_VERSION__` (package.json), `__BUILD_ID__` (git short hash), `__BUILD_DATE__`, and stamps `index.html` placeholders. There is no hardcoded version string.

## Testing

- **Unit:** Vitest, configured inside `vite.config.ts` (`environment: 'node'`, `include: ['tests/**/*.test.ts']`). Targets `src/core/` pure logic. `npm test`.
- **E2E:** Playwright (`playwright.config.ts`, specs in `e2e/`). Auto-starts `npm run dev -- --mode test` (loads `.env.test` with blank Supabase creds so leaderboards are dormant). Chromium launches with SwiftShader GL flags because headless Phaser WebGL otherwise fails ("Framebuffer Unsupported").
- **E2E input gotchas:** use `{ delay: 40 }` on gameplay key presses (zero-delay press+release no-ops jumps); tap the Menu start zone and poll for `Game.player` rather than fixed-waiting; poll for Menu-active before pressing Space.

## Environment & config

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — both public-by-design (security enforced server-side via Supabase RLS + `submit_score` RPC). Leave unset to disable leaderboards entirely (graceful no-op). Copy `.env.example` → `.env`; `.env.test` is committed and blank.
- Supabase is accessed via **raw `fetch`, no `supabase-js` dependency**.
- `vercel.json`: build `npm run build`, output `dist/`. **No service worker** by deliberate design (it was the stale-cache culprit; `main.ts` defensively unregisters stray SWs on boot).
- `capacitor.config.ts`: appId `com.isymbolic.lavaleap`, webDir `dist`.

## Gotchas

- **Never import Phaser into `src/core/`.** New logic that can be pure should go in `core/` with a matching test.
- **Save migrations:** new top-level `SaveBlob` fields are auto-backfilled by the `{...defaults(), ...parsed}` spread in `SaveData.load()`, but **nested** objects (`settings`, `analytics`, `upgrades`, `identity`) need an explicit deep-merge line — omitting one caused a real production crash. Always add a "legacy save missing field" migration test.
- **Bump `package.json` version each release** — all version labels read it automatically.
- **Adding a character** = 16 asset files under `public/assets/characters/<id>/` + one entry in `src/core/characters.ts` (single source of truth). Characters are purely cosmetic; hitbox/physics identical.
- `landing/` is a completely separate project. Game Supabase env vars go on the `lava-leap-84pb` Vercel project, not the landing one.
- Deliberately out of scope (genre conflicts): level select, star ratings, per-phase timers, landscape orientation, d-pad buttons.

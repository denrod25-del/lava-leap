# Lava Leap — Session Handoff

A snapshot of project state and hard-won context, so a fresh session (or another dev) can continue without re-deriving everything.

_Last updated: 2026-07-06 (v0.8.0)._

---

## What it is
**Lava Leap** — an endless vertical climber (Phaser 3 + TypeScript + Vite + Vitest). Climb procedurally-generated platforms, outrun rising lava; score = height + coins. Own git repo (`master`), public at **github.com/denrod25-del/lava-leap**. Also packaged as an Android app via Capacitor and deployed to the web on Vercel.

## Current state — v0.8.0, shipped & LIVE with ONLINE LEADERBOARDS
- **Web (live):** https://lava-leap-84pb.vercel.app — serves `v0.8.0` with the Supabase env baked in (leaderboards ENABLED in production; verified by grepping the deployed bundle for the project ref).
- **Backend:** Supabase project `alnvkpzzyahuztyrtjxv` (user's account, free tier) — `scores` table + `submit_score`/`top_scores`/`player_rank` RPCs from `supabase/migrations/0001_leaderboards.sql`. Live-verified: valid submit lands, absurd score silently rejected, direct table write blocked by RLS (42501), in-game death → auto-submit → GameOver `GLOBAL #`. Anon key is public-by-design; `service_role` never used. Local `.env` (gitignored) + the two `VITE_SUPABASE_*` vars in Vercel (GAME project — a separate `landing/` Vercel project also exists on this repo; env vars must go on lava-leap-84pb).
- **GitHub release + APK:** latest release is still **v0.6.0** — v0.7.0/v0.8.0 shipped web-only; APK rebuild + release + tester email are open follow-ups.
- **Tests:** 152 unit (Vitest) + 16 e2e (Playwright; `--workers=1` — pre-existing local flake at default parallelism), all green; typecheck + build clean.
- Everything pushed; working tree clean.

## Version history (all shipped)
| Ver | What |
|---|---|
| v0.1.0 | Core endless climber (run/jump/wall/dash, procedural reach-based gen, lava, coins) |
| v0.2.0 | Event spine, juice, zones, shop/daily/achievements, audio, pause/settings, crash overlay |
| v0.3.0 | Enemies (crawler/drifter), power-ups, bounce pads, Lava Titan boss, mobile/touch, PWA, PixelLab art |
| v0.4.0 | Combo/multiplier scoring, coin-funded upgrades (power-up time/start shield/revive); Capacitor Android packaging (`com.isymbolic.lavaleap`) |
| v0.4.1–4.5 | **Mobile-controls arc** → landed on **two-thumb**: left-half floating run joystick + right-half tap-to-jump (double/**triple** on touch), fast fall, multi-touch fix (`addPointer`) |
| v0.5.0 | First-run tutorial, How-to-Play, start-screen polish, fast fall, loading bar, favicon/OG/meta, analytics hooks (`window.dataLayer`), lava bubbles |
| v0.5.1 | Build/version visibility (auto-injected version+commit+date on title/Settings/dev-overlay), "What's New" auto-shown on version change, Vercel deploy + cache headers |
| v0.5.2 | Public HTML shell: static lava-themed pre-loader with build stamp (visible pre-JS, removed on Phaser READY), `<noscript>` readable content (description+controls), JSON-LD VideoGame, meta-description copy swap, defensive SW/CacheStorage cleanup on boot; build info injected into static HTML via a vite `transformIndexHtml` plugin (`%APP_VERSION%`/`%BUILD_ID%`/`%BUILD_DATE%` placeholders) |
| v0.5.3 | A11y + feel pass: Reduce Motion setting (gates camera shake AND death slow-mo; `settings.reducedMotion`, backfilled on legacy saves + migration test), lava surface heat-glow (generated gradient canvas texture `lava-glow`, ADD blend, tracks `surfaceY`), title-screen subtitle + tagline |
| **v0.8.0** | **GLOBAL LEADERBOARDS (first backend)** — Supabase, frontend stays static: `src/core/leaderboard.ts` raw-fetch client (no supabase-js; env-gated via `VITE_SUPABASE_*`, **graceful-disable**: no env → no UI/calls/game changes), `SECURITY DEFINER` RPCs w/ server-side anti-cheat (physics caps, score≈height consistency, 2s per-board cooldown on `updated_at`, `created_at` immutable except on improvement = fair tiebreaks, NULL guards, name charset; RLS blocks direct writes), account-free identity (`SaveData.identity {playerId UUID (lazy, polyfilled), name}` + `leaderboardPrompted`), HTML name overlay + Settings NAME row + first-run nudge (deferred past What's-New boots — scene.start is QUEUED, both would fire same create()), auto-submit on death (both boards on daily, PEAK height, submitDone threaded to GameOver so ranks include the run), LeaderboardScene (all-time/daily tabs, YOU highlight, 24-row cap + own-row pin, stale-response guards). Reviews caught: dead SQL rate limit, tiebreak corruption, What's-New collision, dormant name-burn |
| v0.7.0 | AUTO-JUMP control mode (new mobile DEFAULT) — the user reversed the v4.x manual-controls decision after playing v0.6.0, so the scheme is now a Setting (`settings.controlScheme: 'auto'\|'manual'`, default auto, deep-merge backfilled + migration test). AUTO = hold anywhere to steer toward the finger (pure `steerAxis` in `src/core/autoSteer.ts`), jumping automatic (`Player.autoJump`, full-height, emits `jump`, runs AFTER the buffer-arm line — ordering prevents a same-frame tap minting a free air jump), TAP = dash / TAP mid-dash = launch (taps resolve on pointer-UP: ≤180ms + ≤14px drift; `isDashing()` at release routes dash vs cancel), steer-pointer handoff promotes a still-held finger, no fast-fall/DASH-button in auto, auto jumps are NOT Flow beats, MANUAL scheme byte-identical. Settings row CONTROLS, 3rd tutorial variant (4 steps), scheme-aware HowTo |
| v0.6.0 | DASH-FLOW — the signature-move update (differentiation from Icy Tower): dash-jump cancel (jump mid-dash keeps dash speed, full jumpVelocity by design, buffers when out of jump slots), dash i-frames (`Player.invulnerable` gates boss fireballs; enemies already died to dash; lava NEVER gated), coin-grab dash refresh, pure `FlowMeter` (`src/core/FlowMeter.ts`) — 4 tiers COOL/WARM/HOT/BLAZING ×1/1.25/1.6/2 heat multiplier on height+pickups, `combinedMultiplier` caps Flow×Combo at 8; **passive airtime stalls at the WARM boundary** (hot flow holds airborne; HOT/BLAZING need chain beats); HUD right-edge meter, tier trail/edge-glow/stings (reducedMotion-gated, dt-correct lerp), 2 tutorial steps, revive-lift absorbed pre-heat-scoring |

## Key technical facts / gotchas
- **Architecture:** pure logic in `src/core/` (never imports Phaser; unit-tested); Phaser in `src/scenes/` + `src/entities/`. Tuning in `src/tuning.ts`. In `GameScene` the event hub is `this.gameEvents` (Phaser owns `this.events`); input source is `this.inputSrc`.
- **Build info:** `vite.config.ts` `define`s `__APP_VERSION__` (from `package.json` via `readFileSync` — tsconfig has no `resolveJsonModule`, `moduleResolution: bundler`), `__BUILD_ID__` (git short hash via `execSync`, try/catch → `'dev'`), `__BUILD_DATE__`; `src/build-globals.d.ts` declares them; `src/core/buildInfo.ts` re-exports with vitest fallbacks. **Bump `package.json` version each release** — every on-screen label reads it automatically.
- **Save migrations (`src/core/SaveData.ts`):** new **top-level** `SaveBlob` fields are backfilled by the `{ ...defaults(), ...parsed }` spread; **nested** objects (`settings`/`analytics`/`upgrades`) need an explicit deep-merge line in `load()` — omitting one caused a real production crash (recordDeath on a legacy save). Always add a "legacy save missing field" migration test.
- **No service worker** (deliberate — the stale-cache culprit). Vite content-hashes assets; `vercel.json` sets `immutable` on `/assets/*` and `max-age=0, must-revalidate` on `index.html`.
- **Live verification via `window.__game`:** WebGL screenshots are flaky; a hidden preview tab **stalls the async audio loader (~78–88%)** → alias missing audio keys from a loaded buffer (`g.cache.audio.add(key, g.cache.audio.get(loadedKey))`) so scenes boot; **HMR keeps stale scene instances** → full page reload before testing new fields; force touch with `Object.defineProperty(navigator,'maxTouchPoints',{value:5,configurable:true})` before `scene.start('Game')`; Phaser TileSprites clone textures under UUID keys (probe the field, not the texture key); `body.reset(x,y)` syncs the Arcade body immediately (plain `setPosition` doesn't until a physics step).
- **Controls:** desktop = keyboard (run/variable-jump/double-jump/wall/dash/fast-fall). Mobile = two-thumb — hold left half = floating run joystick (analog, pull down = fast fall); tap right half = jump (hold = higher, tap-in-air = double, again = triple; mobile-only triple via `Player.maxJumps`); DASH + pause buttons. One shared `Player.update()` reads a single `InputState.runAxis` (±1) so desktop/mobile feel identical.
- **APK build (Windows):** Android Studio's bundled `jre` is Java 11 → Android Gradle Plugin rejects it; use JDK 21 at `C:\Program Files\Android\openjdk\jdk-21.0.8`. `cd android && JAVA_HOME=<jdk21> ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk ./gradlew assembleDebug --no-daemon` (~25s incremental). Full steps + Play Store AAB path in `MOBILE.md`; Vercel connect + cache-test checklist in `DEPLOY.md`.
- **Deliberately out of scope** (endless-game genre conflicts): level select, 3-star phase ratings, per-phase timer/best-time, landscape orientation, left/right d-pad buttons.
- **Workflow:** brainstorming → writing-plans → subagent-driven-development (fresh implementer subagent per milestone + a holistic reviewer), each milestone live-verified via `window.__game`. Specs in `docs/superpowers/specs/`, plans in `docs/superpowers/plans/` (these live in the **outer workspace repo**, not this repo).
- **Tester distribution:** Gmail blocks `.apk` attachments → host on GitHub Releases and email the download link (draft to `cleonwheatley@gmail.com`; the Gmail connector only creates drafts, the user sends).
- **Playwright gameplay-input trap:** zero-delay `keyboard.press()` fires keydown+keyup in one tick — the variable-height jump-cut consumes the jump before physics registers airtime, so jumps/dashes silently no-op. Use `{ delay: 40 }` on gameplay key presses.
- **Playwright touch-start trap:** the Menu's tap-to-start zone is a 600×365 rect — taps below y≈365 of the canvas hit dead space and the run never starts. Tap at ~30% height and poll for `Game.player` to exist rather than fixed-waiting.
- **`window.__game` is DEV-ONLY** (`import.meta.env.DEV` in main.ts) — production builds strip it; e2e specs that read it must run against the dev server (the Playwright config does).

## Open / next candidates (nothing in progress)
- Signed **Play Store** build (AAB): $25 one-time account + keystore — steps in `MOBILE.md`.
- Custom Vercel domain.
- `tools/gen-og-image.mjs` needs `sharp` installed manually if regenerating the OG image (the committed PNG is fine as-is).
- More gameplay content / marketing if desired.

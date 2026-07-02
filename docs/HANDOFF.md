# Lava Leap — Session Handoff

A snapshot of project state and hard-won context, so a fresh session (or another dev) can continue without re-deriving everything.

_Last updated: 2026-07-02 (v0.5.1)._

---

## What it is
**Lava Leap** — an endless vertical climber (Phaser 3 + TypeScript + Vite + Vitest). Climb procedurally-generated platforms, outrun rising lava; score = height + coins. Own git repo (`master`), public at **github.com/denrod25-del/lava-leap**. Also packaged as an Android app via Capacitor and deployed to the web on Vercel.

## Current state — v0.5.1, shipped & live
- **Web (live):** https://lava-leap-84pb.vercel.app — Vercel auto-deploys on push to `master`; serves `v0.5.1 · <commit>` with correct cache headers (verified).
- **GitHub release + APK:** https://github.com/denrod25-del/lava-leap/releases/tag/v0.5.1 · local `LavaLeap-v0.5.1-debug.apk`.
- **Tests:** 100 unit (Vitest) + 7 e2e (Playwright), all green; typecheck + build clean.
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
| **v0.5.1** | **Build/version visibility** (auto-injected version+commit+date on title/Settings/dev-overlay), "What's New" auto-shown on version change, Vercel deploy + cache headers |

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

## Open / next candidates (nothing in progress)
- Signed **Play Store** build (AAB): $25 one-time account + keystore — steps in `MOBILE.md`.
- Custom Vercel domain.
- `tools/gen-og-image.mjs` needs `sharp` installed manually if regenerating the OG image (the committed PNG is fine as-is).
- More gameplay content / marketing if desired.

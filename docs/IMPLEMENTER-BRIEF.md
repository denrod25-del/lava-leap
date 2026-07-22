# Standing Implementer Brief

Instructions for ANY agent (or human) implementing a task in this repo. These are
lessons paid for with real failures — follow them mechanically.

## Environment

- The Bash tool's cwd silently resets between calls in this workspace: **always
  `cd /c/Users/skyea/claude/LavaLeap` first in every shell command.**
- Port 5188 must be free before any Playwright run (`reuseExistingServer: false`
  spawns its own dev server). Check `netstat -ano | grep :5188` and kill listeners.
- Run e2e **in the foreground** with `npx playwright test --workers=1`. Never
  background the run — a backgrounded run's results are lost when your session ends.

## Verification discipline

- **Read test summaries directly — never gate on grep.** `npm test | grep Tests`
  exits 0 even when tests fail (grep matches the summary line either way). A red
  commit was once pushed exactly this way.
- **No anomaly ships unexplained.** If a measurement looks wrong, calling it an
  "environment artifact" requires *demonstrating the artifact's mechanism* — a
  plausible story is not a diagnosis. Instrument, don't hypothesize. (The v0.14
  clip-encoder bug shipped because a real fast-forward signature was written off
  as a SwiftShader artifact; a user found it.)
- **Root-cause e2e failures; never weaken an assertion to pass.**
- For anything audiovisual, **inspect the actual artifact**: extract frames with
  ffmpeg / view generated images with the Read tool. Numbers lie by omission.

## Measurement runs

- Synthetic key-mashing playtests **die organically and SPACE-retry into a fresh
  run** — a short recording is usually a CORRECT recording of run #2, not a bug.
  This contaminated three separate audits. For uninterrupted runs use
  `surviveClimb()` from `e2e/helpers.ts` (hops the player up the platform stream).
- Verify clip DURATION only where render fps is honest (real GPU headed, or rely
  on the encoder-regression e2e); `window.__game` is dev-only — prod verification
  is bundle/asset checks, not pokes.
- `game.scene.start('X')` from the page context LAUNCHES a scene without stopping
  the active one (composite artifact in screenshots). Real navigation uses the
  ScenePlugin. Poke through the Menu path when the visual matters.

## Repo conventions

- Version bump ⇒ sweep EVERY e2e `lastSeenVersion` seed in the SAME commit, and
  update the hardcoded lock in `tests/changelog.test.ts`. Verify with
  `grep -rn "lastSeenVersion: '0.1" e2e/ | grep -v '<new>'` → must print nothing.
- Asset moves + the code that loads them land in ONE commit (split = 404s).
- Adding fields to any persisted save object ⇒ deep-merge with defaults on load
  + a legacy-save migration test (see `tests/saveData.test.ts` idioms).
- SettingsScene rows are key-based (`ROW_DEFS`) — never index math.
- Public pushes to master are user-gated. Do not push unless told to.
- Commit messages end with the project's Co-Authored-By trailer.

## Before writing e2e pokes

Grep the actual types/fields first (`PlatformDescriptor`, `g.enemies`, `g.boss`,
`g.stream.active`, method names). Plans cite line numbers that drift — anchor on
code, not numbers.

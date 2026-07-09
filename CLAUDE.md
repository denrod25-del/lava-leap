# Lava Leap — repo guide

## Layout

- **Repo root** — the game: Vite + TypeScript, plain canvas rendering.
  `npm run dev` to run, `npm test` for unit tests, `npx playwright test` for
  e2e. Deploys to Vercel (`lava-leap-84pb.vercel.app`) on push to `master`.
- **`landing/`** — the marketing landing page: static HTML/CSS/JS, no build
  step. Deploys as its own Vercel project (`lava-leap-landing.vercel.app`,
  Root Directory = `landing`). See `landing/README.md` for setup.
- **`android/`** — Capacitor wrapper; the APK ships from GitHub Releases.

## Design charter

All UX work — game, landing, and any future app — follows
`docs/UX-PRINCIPLES.md`. Read it before designing or reviewing screens.
Non-negotiables: no dark patterns, no fabricated data (e.g. fake leaderboard
entries), honor `prefers-reduced-motion`, WCAG 2.2 AA, and truthful marketing
claims only.

## Conventions

- The landing page is deliberately dependency-free ES5-compatible JS —
  keep it that way (no frameworks, no build-time transpilation).
- The game's trust claims on the landing page ("Open Source", "APK on GitHub
  Releases") must stay accurate — update the landing page if either changes.

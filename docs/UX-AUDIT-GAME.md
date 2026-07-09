# UX Audit — Game (vs docs/UX-PRINCIPLES.md)

Audited against the standing charter by mapping the full UX surface
(scenes, save data, feedback systems, settings).

## What's already strong

- **First 60 seconds:** no forced onboarding — one tap from the menu into a
  run. The tutorial (`src/entities/TutorialOverlay.ts`) teaches *inside* the
  first real run with non-blocking, auto-advancing hints keyed to the control
  scheme. This is exactly the charter's "guided interaction, not lectures."
- **Feedback:** rich and layered — squash/stretch, particles, score popups,
  screen shake, flow-tier audio stings, proximity lava rumble, HUD combo decay
  bar and FLOW meter (`src/entities/JuiceController.ts`,
  `src/entities/AudioDirector.ts`, `src/scenes/HudScene.ts`).
- **Progress:** high score, coin bank, 16 achievements, daily challenge with
  7-day history, cosmetics/upgrades shop — all in one guarded localStorage
  blob (`src/core/SaveData.ts`).
- **Trust:** clean. Leaderboard is genuinely disabled when unconfigured, no
  fake urgency, no fabricated data, analytics stay local. Changelog auto-shows
  once per version.
- **Fast failure loop:** death → game over → SPACE to retry in under a second.

## Gaps found and fixes applied (this branch)

1. **OS `prefers-reduced-motion` ignored** — the manual Settings toggle
   existed, but a motion-sensitive first-time player got full shake/slow-mo
   before ever finding Settings, violating the charter's non-negotiable.
   **Fixed:** fresh saves now initialize `reducedMotion` from the OS media
   query (`src/core/SaveData.ts`); the explicit Settings choice still wins
   afterwards.
2. **Game Over answered "what happened" but not "what next / how close":**
   only retry was offered. **Fixed:** the Game Over screen now shows the
   nearest locked achievement as `NEXT GOAL: ☆ …` and offers an `M / tap`
   route back to the Menu (`src/scenes/GameOverScene.ts`).
3. **Bare first-run empty states:** Achievements (`0/16`, all grey) and Shop
   (everything dimmed) taught nothing. **Fixed:** with zero unlocks the
   Achievements screen points at the first achievable goal, and with zero
   coins the Shop explains that coins collected mid-run bank automatically
   (`src/scenes/AchievementsScene.ts`, `src/scenes/ShopScene.ts`).

## Remaining recommendations (not implemented — design-level)

4. **Color-only encoding** — Flow tiers (HUD bar) and the hazard legend encode
   meaning purely in hue. Add a shape/pattern or text cue per tier
   (e.g. tier initials on the meter) for colorblind players.
5. **No text scaling** — every font size is hardcoded px. A UI-scale setting
   (0.9×/1×/1.2×) applied through a shared text factory would close the
   WCAG 2.2 AA gap.
6. **"Daily challenge" without a streak/history view** — dailyBest keeps 7
   days of data but nothing surfaces it. A small "last 7 days" strip on the
   daily entry (honest history, no guilt mechanics) would complete the loop.
7. **Coins-to-goal indicator in the Shop** — show "12 more coins" on the
   cheapest unowned item instead of only dimming it.
8. **Global mute** — volume 0 works, but a single mute toggle (and honoring
   the page's visibility change) is friendlier.

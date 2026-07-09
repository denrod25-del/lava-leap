# UX Audit — Landing Page (vs docs/UX-PRINCIPLES.md)

Audited against the standing charter. The landing page is a
marketing/static surface, so game-only sections of the charter (achievements,
learning engine, dashboards) are N/A here.

## Scorecard

| Principle | Grade | Notes |
|---|---|---|
| Core four questions | **B+** | Waitlist states answer "what happened" perfectly; success state doesn't answer "what next" |
| First 60 seconds | **B** | Real value is one click away (Play Free), zero onboarding friction; carousel still shows styled placeholders instead of real gameplay |
| Smart feedback | **A−** | Submit spinner, disable-while-submitting, distinct success/duplicate/error/rate-limit/network messages, aria-live status; audio buffering gives no feedback on slow networks |
| Empty states | **A** | Unconfigured waitlist degrades honestly to "opens soon"; no dead ends |
| Loading states | **B+** | Page renders fast; fonts swap; analytics deferred; audio `preload=none` — but no "loading" state between click and playback |
| Microinteractions | **A−** | Hover/press transforms, scroll reveals, embers, parallax — all reduced-motion-gated except the initial page fade-in |
| Cognitive load | **A** | One primary CTA per section, clear hierarchy, plain language, sticky mobile bar has exactly one action |
| Trust | **A−** | Honest leaderboard teaser, verified claims, real legal pages, no dark patterns; waitlist form lacks a one-line "what we'll do with your email" reassurance |
| Accessibility | **A−** | Skip link, single h1, focus-visible rings, aria-live, aria-pressed, keyboard carousel, ≥48px targets; not yet validated with an axe/Lighthouse pass |
| Performance | **A** | Static, no framework, root-absolute assets, immutable-cacheable media; Lighthouse not yet measured |
| Delight | **A** | Embers, retro palette, "WELCOME, LEAPER" — subtle, never blocking |

## Recommended improvements (priority order)

1. **Real gameplay in the carousel / demo video** — the single biggest gap
   against "demonstrate real value in 60 seconds." (In progress: waiting on
   footage.)
2. **Waitlist success next-step** — after "YOU'RE ON THE LIST," suggest the
   next action: a "while you wait — ▶ play free in browser" link. Answers
   "what should I do next?" at the exact moment of highest engagement.
3. **Audio buffering state** — show "♪ LOADING…" on the sound toggle between
   click and playback so slow connections don't read as broken.
4. **Waitlist privacy line** — one sentence under the form: "Launch news
   only — no spam, unsubscribe anytime" linking to /privacy. Cheap trust win.
5. **Gate the page fade-in behind reduced-motion** — the `pageIn` body
   animation is the one animation that ignores `prefers-reduced-motion`.
6. **Run an axe/Lighthouse pass** on the production URL after merge to
   validate the a11y and performance grades above.

Items 2–5 are small, low-risk edits; item 1 is content-dependent; item 6 is a
verification task.

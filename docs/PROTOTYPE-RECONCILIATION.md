# Prototype Reconciliation — which Lava Leap is canonical

_Decision recorded 2026-07-23, confirmed by the owner._

## The decision

**The Phaser 3 + TypeScript game in this repo (v0.18.1) is the one true Lava Leap.**

A separate single-file prototype was uploaded to branch `denrod25-del-demo-patch-1`
(commit "Add files via upload", under `lavaleappackage/lava-leap/`). It was built in
another session that had never seen this repo, and its accompanying handoff planned to
flatten that package to the repo root. That plan is **rejected** — do not merge or
flatten `denrod25-del-demo-patch-1`. The branch is kept for reference only.

## What the prototype is

An ~866-line, zero-dependency HTML5 canvas game with a different design: "Kip," a
molten blob that **auto-bounces** (player steers only), rising lava, 4 platform types,
PWA packaging (manifest + service worker + icons), and a 286-line GDD
(`lavaleappackage/lava-leap/GDD.md`) written blind to the real game. Its GDD's gameplay
sections describe a game this repo has long surpassed (endless + campaign + daily modes,
medals, missions, achievements, shop, boss, clip recording, Capacitor Android builds,
256 unit / 35 e2e tests).

## What's worth salvaging from the prototype's GDD

Gameplay content is superseded, but the **business and marketing thinking** was
developed with the owner and still applies to the real game:

### Decisions already made with the owner (carry forward)
- **Audience:** 13–26, TikTok/Shorts-native, gender-balanced casual. Marketing is
  TikTok-first, with YouTube Shorts + Instagram Reels cross-posts; itch.io / Poki /
  CrazyGames for web distribution.
- **Pricing:** FREE on Google Play, never paid. Revenue: rewarded ads ("Second Wind"
  continue-after-death), $2.99 remove-ads IAP, cosmetics later. Web/TWA ads via
  Google Ad Placement API (not AdMob). Steam later at $2.99–4.99 as precision-arcade.
- **Design rules:** free forever; never pay for altitude; cosmetic-only spending;
  no dark patterns (young audience); deaths always feel like the player's mistake;
  retry < 1.5 s. (Aligns with the existing `docs/UX-PRINCIPLES.md` charter.)

### Ideas worth evaluating against the real game
- **Second Wind** rewarded-ad continue (once per run, resume from a safe platform) —
  target ≥25% opt-in on eligible deaths.
- **Share score card** on the death screen (image with character, height, zone) as a
  lighter-weight complement to the existing clip recorder.
- **Success-metric targets:** D1 ≥ 25%, D7 ≥ 8%, ≥5 runs/session, load-to-first-run
  < 3 s; decision rule: if D1 < 15% on the first 1,000 organic installs, fix the first
  minute before spending on ads.
- **Google Play alternative path:** the repo already ships a Capacitor APK; the
  prototype's PWABuilder → TWA `.aab` route (closed test: 12 testers / 14 days for new
  personal accounts; `assetlinks.json` SHA-256 from Play Console → App signing) is a
  documented fallback.
- **Marketing hooks the design already serves:** portrait-clip-friendly framing,
  score-stamped recordings, near-miss drama, distinctive death audio, shared
  vocabulary (zone names, daily mode) for creators.

## Related history

- The game briefly lived in the `aqua-intel-dashboard` repo (branch
  `claude/lava-leap-marketing-c80zk3`, served under `/lava-leap/`); it was fully
  removed there once this repo became home. Nothing game-related remains in that repo.
- TikTok scripts + captions for launch marketing were delivered in chat during the
  marketing session (not committed anywhere).

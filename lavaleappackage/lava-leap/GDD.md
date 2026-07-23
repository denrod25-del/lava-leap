# LAVA LEAP — Game Design Document

**Version:** 1.0
**Date:** July 2026
**Scope:** The full game (v1.0 release + post-launch direction). The playable prototype in `app/index.html` is the P0 vertical slice of the design described here.

---

## 1. Game overview

### Elevator pitch
The floor is lava — for real this time. Lava Leap is a one-thumb vertical platformer where you bounce Kip, a small molten creature, up an endless volcano while the lava rises hungrily beneath you. Climb from the magma chamber to the open sky, dodge collapsing rock and fireballs, grab power-ups, and get one meter higher than your best — or your friends' best — before the lava wins. It always wins. The question is how high you got first.

### Vision statement
A game anyone understands in 3 seconds, plays their first "SO close!" run within 60 seconds, and keeps in their daily rotation for months because there's always a taller number to chase, a friend to beat, and something new to unlock. Every design decision serves three words: **instant, fair, shareable.**

### Design pillars
1. **Instant** — no tutorial, no menus in the way, retry in under 1.5 seconds. If a feature adds friction before the fun, it's cut.
2. **Fair** — deaths are always the player's mistake. Everything that kills you is visible before it kills you. Difficulty comes from mastery, never from surprise.
3. **Shareable** — the game is a clip factory: portrait framing, visible score, dramatic deaths, near-miss tension. If a feature won't ever appear in someone's TikTok, it must justify itself another way.

### Fact sheet
| | |
|---|---|
| **Genre** | Endless vertical platformer (arcade; hyper-casual entry, skill-game depth) |
| **Platforms** | Web (HTML5) → Google Play (TWA) → iOS → Steam (Electron, premium positioning) |
| **Orientation** | Portrait 9:16 |
| **Session** | 30 seconds – 3 minutes per run; 3–10 runs per session |
| **Business model** | Free-to-play + rewarded ads + $2.99 remove-ads + cosmetic IAP |
| **Age rating** | E / Everyone (stylized cartoon peril) |
| **Audience** | Core 13–26, mobile-first, TikTok/Shorts-native, gender-balanced; secondary: lapsed Doodle Jump generation |

### Unique selling points
1. **The lava is a character.** Not a fail-line — it rises, glows, bubbles, accelerates, and *chases*. The threat is on screen at all times.
2. **A premise every human already knows.** "The floor is lava" is pre-installed in the audience's childhood. Zero explanation needed, instant meme compatibility.
3. **Altitude tells a story.** The volcano visibly changes as you climb — every personal best literally shows the player somewhere new.
4. **Built to be clipped.** Every run produces vertical, score-stamped, drama-arced footage by default.

---

## 2. Core gameplay

### The run (core loop)
1. Tap → Kip starts bouncing automatically.
2. Steer left/right to land on platforms and climb; the camera follows your highest point.
3. Lava rises from below — faster the higher you go, never falling far behind.
4. Grab cinders (coins) and power-ups along the way; survive hazards.
5. Die → death screen with height, cinders earned, and one-tap retry or Second Wind.

### The meta loop (across runs)
Beat your best → earn cinders and altitude milestones → unlock skins, trails, and characters → climb the leaderboard → play today's Daily Peak → share the clip → come back tomorrow.

### Controls
- **Mobile:** hold the left or right half of the screen to steer. One thumb. No buttons, no joystick.
- **Desktop:** ← → or A/D. **Gamepad** (Steam): left stick / d-pad.
- **Jumping is automatic** on every platform touch. The player controls *where*, never *when*. This one rule makes the game playable by literally anyone.
- **Screen wrap:** exit the left edge, re-enter on the right. Enables skilled routing and escapes.

### Physics targets
| Parameter | Target | Feel goal |
|---|---|---|
| Gravity | 2100 px/s² | Snappy, not floaty |
| Bounce | −940 px/s (≈2 platform gaps of height) | Constant forward momentum |
| Geyser launch | −1460 px/s (≈2.4× bounce height) | Thrill + brief loss of control as the cost |
| Steer max speed | 430 px/s (full screen width in ~1 s) | Always feels reachable |
| Steer response | High acceleration, heavy release friction | Precise landings without ice-skating |

All values are validated in the prototype and are the reference tuning for every platform port. 10 px = 1 m of altitude.

---

## 3. World structure: the volcano

The climb passes through **altitude biomes** — visual and mechanical bands that make height feel like progress through a place, not just a number. Biomes change background art, palette accents, platform skins, hazard mix, and music layer. Transitions are celebrated with a full-width visual moment + chime.

| Biome | Altitude | Look | New pressure introduced |
|---|---|---|---|
| **1. Magma Chamber** | 0–150 m | Glowing rock walls, dripping magma, warm darkness | Baseline: standard + geyser platforms; drifters from 30 m, crumblers from 60 m |
| **2. Obsidian Caves** | 150–400 m | Cooler blues/purples of volcanic glass, lava glow from below intensifies contrast | Ice-slick obsidian ledges (low friction), steam vents (sideways push) |
| **3. Crater Rim** | 400–800 m | Open air, ash clouds, distant horizon, ember rain | Falling rocks, wind gusts, sparser platforms |
| **4. Ash Sky** | 800 m+ | Night sky through ash, floating pumice islands, aurora of heat | Fireball arcs, phase platforms, maximum lava speed |

Biomes are fixed bands so the community develops shared language ("I finally hit the Crater Rim!") — that shared vocabulary is a retention and marketing asset.

---

## 4. Game elements

### Kip (the player character)
A fist-sized molten blob with big eyes and a flickering flame tuft, born in the lava and trying to get out of it (one sentence of lore; never shown in-game, used in store/social bios). Kip squashes on landing, stretches when rising, faces the direction of travel. Kip is **the brand**: app icon, social avatar, merch if we're ever so lucky. Additional playable characters ship as cosmetics (identical physics — cosmetic only, always): e.g., Cindy (ember wisp), Basalt (grumpy rock), Puff (steam cloud).

### Platform catalog (v1.0)
| Platform | First appears | Behavior | Design role |
|---|---|---|---|
| **Basalt slab** | 0 m | Static | Reliable baseline |
| **Geyser vent** | 0 m (~8% of slabs) | Launches 2.4× height | Reward + risk |
| **Drifter** | 30 m | Slides horizontally, speeds up with altitude | Timing check |
| **Crumbler** | 60 m | Visibly cracked; collapses after one bounce | No camping, forced commitment |
| **Obsidian ledge** | 150 m | Slippery (¼ friction) | Precision under momentum |
| **Steam platform** | 250 m | Periodically erupts steam, pushing sideways | Rhythm reading |
| **Pumice floater** | 500 m | Sinks slowly while stood on, bobs back | Urgency without collapse |
| **Phase platform** | 800 m | Fades in/out on a visible 2 s pulse | Endgame mastery |

Post-launch cadence: one new platform type or hazard per content update, introduced at the altitude band where the difficulty curve needs it.

### Hazards (never at 0 m; each telegraphs before it threatens)
- **Falling rocks** (400 m+): shadow + rumble warning, then drop through the play field.
- **Fireballs** (800 m+): arc across the screen on visible trajectories.
- **Wind gusts** (Crater Rim): screen-edge streak warning, then steady lateral push for 2 s.
- **The lava** — the only hazard that's always present. Speed = base 26 px/s + 0.55/m (capped ~146 px/s); rubber-bands to never trail the camera by more than ~1.3 screens. Touching it is instant, spectacular death: particle eruption, screen shake, sizzle. The death screen frames height as an achievement, never a failure.

### Power-ups (spawn on platforms; one active at a time; ~15 s or one-use)
| Power-up | Effect | Tension it creates |
|---|---|---|
| **Heat Shield** | Survive one lava touch — flung upward out of the surface | Converts certain death into a comeback clip |
| **Updraft** | 3 s of free rising flight through everything | Skips danger, lands you in unscouted territory |
| **Cinder Magnet** | Vacuum nearby cinders for 15 s | Pure economy, zero risk — the "always nice" pickup |

Power-ups are earnable in-run only — never purchasable. Paying for altitude is forbidden by pillar 2.

### Cinders (soft currency)
Small glowing motes scattered along routes (riskier lines carry more). Spent exclusively on cosmetics. Earn rate targets: casual session ≈ 30–60 cinders; first skin at 300; no cinder purchases for real money at v1.0 (evaluate later; if added, cosmetic-only stays absolute).

---

## 5. Difficulty & scoring

Difficulty scales on four independent smooth dials — platform gap (62→115 px), platform width (78→60 px), moving-element speed, lava speed — plus the biome hazard schedule. No difficulty steps, no runs ruined by RNG walls: generation guarantees at least one survivable route at all times (validated by the generator, not by hope).

**Skill curve targets:** first-time players die at 30–60 m; day-two players reach 150 m; 400 m (Crater Rim) is genuinely hard; 800 m+ (Ash Sky) is the top-1% flex; no cap. A 1,000 m clip should earn comments from strangers.

**Scoring:** live altitude, huge, top-left — positioned so every screen recording is score-stamped. Milestone chime every 100 m. Best score always visible beneath. Anti-cheat for leaderboards: server-validated run seeds + sanity-checked physics traces (Daily Peak only; the global endless board is labeled "unverified" until accounts exist).

---

## 6. Game modes

| Mode | Description | Purpose |
|---|---|---|
| **Endless Climb** | The core game. Procedural, infinite. | The habit |
| **Daily Peak** | One seeded layout, identical for everyone, one scored attempt per day (practice attempts unscored). Friend + global leaderboard. | The conversation ("today's Daily is EVIL"), the daily reason to return |
| **Lava Rush** (post-launch) | Weekend event: lava at 2× speed, cinders at 3× | Spikes for veterans, event content for creators |
| **Ghost race** (post-launch) | Race the translucent replay of a friend's (or your own) best run | Direct social challenge loop |

---

## 7. Game feel (juice) — non-negotiable spec

- **Squash & stretch** on every bounce; recovery eased over ~100 ms.
- **Particles:** geyser bursts, crumble debris, ambient rising embers, cinder sparkles, 40+ particle death eruption.
- **Screen shake:** death (16 px), geyser (5 px), rock impacts (8 px). All suppressed under `prefers-reduced-motion`.
- **Lava rendering:** layered sine surface, bright crest line, gradient-lit body, glow bleed above, surfacing bubbles.
- **Parallax:** ≥2 background layers per biome.
- **Audio:** distinctive synthesized SFX — bounce boings (pitch rises with combo of consecutive perfect-center landings), geyser chirp, crumble crunch, death sizzle + descending growl, milestone chime. The death sizzle must be recognizable enough to carry "🔊 sound on" posts. v1.0 adds a low ambient rumble bed per biome that ducks under SFX. Mute state persists.

---

## 8. Art direction

**Committed world: molten arcade.** Dark grounds make lava the light source of every frame. Each biome keeps the system but shifts accents (Obsidian Caves go cold so the lava contrast doubles; Ash Sky goes near-black with aurora warmth).

### Base palette
| Token | Hex | Use |
|---|---|---|
| Obsidian | `#0d0508` | Grounds |
| Magma deep | `#3a0d08` | Sky/ambient base |
| Lava core | `#ff5a1f` | Primary accent, lava body |
| Lava hot | `#ffb347` | Highlights, Kip |
| Ember | `#ffe08a` | Hottest points, UI accents |
| Warm ink | `#ffeee2` | All text |

### Rules
- Warm light on dark ground; cool hues only as deliberate biome contrast.
- Friendly things are round (Kip, platforms); dangerous things are jagged (cracks, rocks, ridge silhouettes).
- Heavy geometric sans, tight tracking; fire-gradient fill on the logotype only; tabular numerals for all scores.
- **The screenshot test:** any paused frame should work as a store screenshot.

---

## 9. UI / UX

| Screen | Contents | Rule |
|---|---|---|
| **Title** | Logo, tagline, animated game world behind, "Tap to leap," small buttons: skins, Daily Peak, settings | Max one tap to playing |
| **HUD** | Altitude (large), best (small), mute. Power-up timer as a thin arc around Kip, not a UI bar | Nothing else. Ever. |
| **Death** | "The lava got you at" + huge meters, ★ New best ★, cinders earned, Second Wind offer (when eligible), retry, share | Retry is the dominant action; appears after 0.55 s so the death itself reads |
| **Skins** | Grid of Kip variants + trails, cinder prices, equipped state | Try-on preview bounces live |
| **Daily Peak** | Today's seed name, friends' scores, your attempt state | One scored run — the button says so plainly |

**Accessibility:** playable with zero reading; reduced-motion mode; danger encoded by shape + animation, never hue alone; no time-pressured menus; left/right-handed identical by symmetry.

---

## 10. Monetization

**Free forever. Never pay for altitude.** Revenue = convenience + identity.

1. **Rewarded ads (primary):**
   - *Second Wind* — on death, once per run: watch 15–30 s to resume from a safe platform at death height. Highest-motivation moment in the game; target ≥25% opt-in on eligible deaths.
   - *Hot Streak* — optional pre-run: 2× cinders for the next 3 runs.
2. **Remove Ads — $2.99 one-time.** Kills interstitials forever; rewarded ads remain (players choose those). No subscriptions.
3. **Cosmetics:** skins, trails, characters via cinders (earnable) or $0.99–1.99 direct. Visible in shared clips = self-marketing.
4. **Interstitials — minimal:** at most one per 3–4 runs, never mid-run, never interrupting the death screen. If retention data shows damage, they're cut before anything else.

**Ethics line (also a market-positioning line for a young audience):** no pay-to-win, no loot boxes, no countdown-pressure offers, no punishment streaks. Google Families / E-rating discipline throughout.

**Tech:** web + TWA builds use Google's Ad Placement API (AdSense for Games) — one integration for site and Play. Poki/CrazyGames builds use their SDKs (rev-share, they handle fill). Steam build ships with all ads removed at a $2.99–4.99 premium price.

---

## 11. Retention & social

- **Daily Peak** (see modes) — the appointment mechanic.
- **Altitude milestones:** lifetime-best bands unlock cosmetics; biome entry is itself a reward moment.
- **One-tap share:** death screen generates a clean score card (Kip, height, biome reached); post-v1.0, auto-captured 10 s replay of the final moments exported vertical for TikTok/Shorts.
- **Streak flame:** daily-play streak shown warmly, zero penalty when broken.
- **Friend leaderboards** before global ones — beating a stranger is a number, beating your friend is a story.

---

## 12. Technical design

- **Stack:** HTML5 Canvas 2D + WebAudio, vanilla JS, no engine, no runtime network dependency. The prototype proves the whole core loop in ~25 KB; the full game stays lean (target < 5 MB with all art/audio). Loads in under a second on a school Chromebook — that *is* the tech strategy.
- **Rendering:** logical 420 × 746 (9:16) scaled by devicePixelRatio (cap 2×); 60 fps target; delta-time loop capped at 33 ms so slow devices slow down rather than tunnel through platforms.
- **Procedural generation:** seeded PRNG (shared seeds power Daily Peak and ghost races); generator guarantees a survivable route; difficulty dials driven purely by altitude.
- **Persistence:** localStorage (best, cinders, cosmetics, settings). Accounts only when leaderboards demand them — Play Games Services first, minimal backend for Daily Peak scores.
- **Analytics (privacy-light):** runs, death altitude/cause, session length, ad opt-ins, D1/D7. No PII; COPPA/GDPR-safe defaults.
- **Ports:** PWA (manifest + service worker, full offline cache) → PWABuilder → TWA `.aab` for Google Play; identical build to itch.io/Poki/CrazyGames; Steam later via Electron with gamepad support and achievements, positioned as precision-arcade at $2.99–4.99.

---

## 13. Marketing integration (design-side commitments)

The TikTok-first marketing plan makes demands on the game design, owned here:

1. Portrait play field, score always visible → every recording is a ready vertical clip. ✅
2. Deaths dramatic and legible → the rage-fail format works. ✅
3. Near-miss engineering: rubber-band lava + difficulty dials tuned so "died one platform from my best" happens regularly — that's the clip.
4. Meme-able audio: bounce boings and death sizzle distinctive enough to carry "🔊 sound on."
5. One-tap share card at v1.0; replay export after.
6. Shared vocabulary hooks: biome names + Daily Peak give creators and commenters common reference points (`#lavaleap`).

---

## 14. Success metrics

| Metric | v1.0 target |
|---|---|
| Time from load to first run | < 3 s |
| Runs per session | ≥ 5 |
| D1 retention | ≥ 25 % |
| D7 retention | ≥ 8 % |
| Second Wind opt-in | ≥ 25 % of eligible deaths |
| Daily Peak participation (D7 players) | ≥ 40 % |
| Error-free sessions | ≥ 99.5 % |

Decision rule: if D1 < 15 % on the first 1,000 organic installs, fix the first minute before spending a dollar on ads.

---

## 15. Roadmap

| Phase | Scope | Exit criterion |
|---|---|---|
| **P0 — Prototype** ✅ | Core loop, 4 platform types, lava, juice, score (`app/index.html`) | Fun for 5 minutes |
| **P1 — Web launch** | Biomes 1–2, cinders, PWA, share card, itch.io + Poki/CrazyGames, basic analytics | Public link live in TikTok bio |
| **P2 — Google Play** | TWA package, closed test (12 testers/14 days), Ad Placement API, Remove Ads IAP, store listing | Live on Play |
| **P3 — Retention** | Daily Peak, milestones, 3+ skins, friend leaderboard, biomes 3–4, power-ups | D7 ≥ 8 % |
| **P4 — Expansion** | Lava Rush events, ghost races, replay export, iOS and/or Steam by traction data | Data-driven |

---

## 16. Risks & mitigations

| Risk | Mitigation |
|---|---|
| "Doodle Jump clone" perception | The chasing lava, biome climb, and committed art direction are the identity; market as "the floor is lava," never "like Doodle Jump" |
| Hyper-casual churn | P3 retention systems before any paid UA; ad spend gated on D7 ≥ 8 % |
| Ad revenue needs volume | Multi-platform day one; Poki/CrazyGames bring built-in audiences + rev share |
| Solo-dev scope creep | This document is the scope; new ideas go to the parking lot, reviewed only at phase exits |
| Young audience + monetization scrutiny | Cosmetic-only spending, honest ads, no dark patterns, E-rating discipline |
| Content drought post-launch | One platform type/hazard per update is deliberately cheap to produce against the existing dial system |

---

*Living document. Update at each phase exit. `app/index.html` in this folder is the reference implementation for core-loop tuning.*

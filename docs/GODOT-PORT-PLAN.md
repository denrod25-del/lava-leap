# Lava Leap → Godot Re-Engine Plan

_A phased plan to rebuild Lava Leap in **Godot 4.x** for native performance, controller support, and self-owned hardware (Raspberry Pi / arcade), while the web/Capacitor version stays frozen and shippable._

Status: **planning** (engine chosen: Godot; first code phase not started).
Source of truth for game design: this repo's `src/` + `docs/HANDOFF.md` + `tests/`.

---

## 1. Goals & non-goals

**Goals**
- Native desktop (Windows / macOS / Linux), improved mobile (Android / iOS), and **Raspberry Pi / Linux-ARM** builds from one codebase.
- First-class **gamepad** support (the current game is keyboard/touch only).
- Headroom for richer effects (shaders, lighting, more particles) than the Phaser build.
- Keep the **web version untouched and live** — this is a parallel rebuild, not a migration of the existing repo.

**Non-goals (for now)**
- Official closed-console store releases (Switch/PS/Xbox). If that becomes the goal, revisit Unity — but it would sacrifice the easy Pi path.
- Feature parity on day one. We rebuild the *feel* first, then re-add systems in priority order.

---

## 2. Engine decision (settled): Godot 4.x, GDScript

**Why Godot over Unity for _this_ project**
- **Raspberry Pi is the tiebreaker.** Godot exports natively to Linux/ARM and runs well on a Pi 4/5; Unity has no practical Pi target. Self-owned hardware is a stated goal.
- **2D-first.** Godot's 2D pipeline (CanvasItem, Camera2D, TileMap, `CharacterBody2D`) is native, not layered on a 3D engine.
- **Free / open-source, no runtime fees**, tiny self-contained export binaries — ideal for shipping on hardware you own and for kiosk/arcade.
- **Built-in input abstraction** (`InputMap` actions) → keyboard + gamepad + touch from one mapping.

**Language: GDScript** (not C#). Rationale: fastest iteration, best editor integration, and — importantly — **no .NET runtime dependency**, which keeps the Pi/ARM and mobile export story simple. The existing logic is TypeScript; TS→GDScript is a mechanical translation for the pure modules (both are dynamically-typed-ish, similar control flow). Revisit C# only if a contributor strongly prefers it.

**Target Godot version:** latest stable 4.x (4.3+). Pin it in `project.godot` and CI.

---

## 3. Repository strategy

- **New, separate repository** (e.g. `lava-leap-godot`, or the rebrand name once chosen). A Godot project's structure is nothing like the Vite/TS repo; mixing them would be messy and would risk the frozen web build.
- The current repo (`denrod25-del/lava-leap`) stays as the **web/Capacitor** product. `master` = live web; no re-engine code lands here.
- Until the rebrand name is decided, we can bootstrap under a placeholder repo/name and rename later (Godot project rename is cheap).
- **Shared, engine-agnostic design assets** (tuning numbers, generation rules, save schema) are copied/translated, not imported — but this plan + the TS source are the canonical spec.

---

## 4. What carries over vs. what gets rebuilt

### Reuse as-is (drop into the Godot project)
- **All art:** character spritesheets (`public/assets/characters/*`), AI backgrounds (`backgrounds/*.jpg`), the new seamless **pattern tiles** (`platform.png`, `lava-tile.png`, `ui-plate.png`, `ash.png`, `grid.png`, `ember.png`, `titan-emblem.png`), enemy/boss/coin sprites. Godot imports PNG/JPG directly. (Set texture filter to **nearest** for the pixel sprites, **linear** for the painterly JPGs.)
- **All audio** (`assets/sfx/*.wav`, `music/*.ogg`) → `AudioStreamPlayer`.
- **Supabase leaderboards** — pure HTTP + anon key; reuse the same project/RPCs via Godot `HTTPRequest`. No backend work.

### Translates ~1:1 to GDScript (pure logic, no Phaser)
These modules are engine-independent math/state and should be ported almost line-for-line, keeping the exact constants:
- `core/tuning.ts` → a `Tuning` autoload / resource (the single most valuable file — every feel number).
- `core/rng.ts`, `core/dailySeed.ts` → seeded RNG (use `RandomNumberGenerator` with a fixed seed so the **daily challenge stays deterministic** across platforms).
- `core/LevelGenerator.ts` + `core/LevelStream.ts` + `core/zones.ts` + `core/hazardRules.ts` + `core/setpieces.ts` → the procedural reach-based platform stream.
- `core/ScoreTracker.ts`, `ComboTracker.ts`, `FlowMeter.ts` → scoring/flow/combo.
- `core/SaveData.ts` → `user://save.json` via `FileAccess` (same schema, same deep-merge/migration discipline).
- `core/characters.ts` (+ movement profiles), `levels.ts`, `boss.ts`, `bossTemplates.ts`, `relics.ts`, `achievements.ts`, `AchievementTracker.ts`, `story.ts`, `StoryProgress.ts`, `cutscenes.ts`, `changelog.ts`, `analytics.ts`, `ledge.ts`, `autoSteer.ts`.
- **The 34 unit tests are the port's safety net** — reimplement them in **GdUnit4** (or GUT). Porting a module isn't "done" until its ported test passes with the same expectations. This is how we prove the generation math, reach validity, save migration, and boss boundaries survived the move.

### Rebuilt in-engine (Phaser-specific → Godot idioms)
- **Scenes** (`src/scenes/*`, 16 of them) → Godot `.tscn` scenes + scripts. Phaser's scene manager ≈ Godot's `SceneTree` / `change_scene`. HUD as a `CanvasLayer`.
- **Physics/movement** (`entities/Player.ts`): Phaser Arcade AABB (`body.blocked.down`) → `CharacterBody2D` + `move_and_slide()` + `is_on_floor()`. **This is the highest-risk part** — see §7.
- **Input** (`entities/input/*`, `core/InputState.ts`): replace the three input sources with a single `InputMap`-driven layer that yields the same `InputState` struct; gamepad falls out for free. Keep the AUTO (assist) and MANUAL schemes as input-mapping profiles.
- **Managers** (`PlatformManager`, `CoinManager`, `EnemyManager`, `PowerupController`, `Lava`, `BossController`, `RelicManager`) → node-pooled spawners. Lava = a `Node2D` with a scrolling shader/`Sprite2D` + `GPUParticles2D`.
- **Juice** (`JuiceController`, `StingController`, `Letterbox`, screen shake) → `Tween`, `Camera2D` shake, `GPUParticles2D`, `CanvasLayer` bars.
- **UI text** → `Label`/`RichTextLabel` with the monospace font (Godot Control nodes + theme).

---

## 5. Godot project architecture (proposed)

```
project.godot
/autoload
  Save.gd            # persisted profile (singleton)
  Tuning.gd          # all feel constants
  Events.gd          # global signal bus (mirrors core/events.ts)
  Audio.gd           # sfx/music director
  Leaderboard.gd     # Supabase HTTP (feature-flagged, like today)
/scenes
  Boot.tscn  Menu.tscn  Game.tscn  Hud.tscn  Pause.tscn
  Shop.tscn  Settings.tscn  GameOver.tscn  LevelSelect.tscn
  Journal.tscn  Achievements.tscn  Cutscene.tscn  ...
/actors
  Player.tscn/.gd    Platform.tscn   Coin.tscn   Enemy.tscn
  Powerup.tscn       Lava.tscn       Boss.tscn
/core                # pure GDScript, unit-tested, no node deps
  level_generator.gd  level_stream.gd  zones.gd  hazard_rules.gd
  score_tracker.gd  combo_tracker.gd  flow_meter.gd  rng.gd
  characters.gd  levels.gd  boss.gd  ledge.gd  ...
/assets              # art/audio copied from the web repo
/tests               # GdUnit4 mirrors of tests/*.ts
/shaders             # lava flow, heat-haze, glow (new headroom)
```

Design rule preserved from the web build: **`/core` stays free of engine/node dependencies** so it's unit-testable in isolation — exactly the discipline that made `src/core` test-locked today.

---

## 6. Input & controller design

One `InputMap` with actions: `move_left`, `move_right`, `jump`, `dash`, `fast_fall`, `pause`, `ui_up/down/left/right`, `ui_accept/cancel`. Each bound to keyboard **and** gamepad **and** touch. The input layer emits the same `InputState` the logic already expects, so `autoSteer`/AUTO-assist and the two control schemes port unchanged. Controller "just works" on desktop, Pi, and Android TV.

---

## 7. The one big risk: movement feel

The soul of this game is jump/dash/wall/ledge feel, hand-tuned over many versions. **The tuning numbers will NOT transfer 1:1** because Phaser Arcade and Godot integrate velocity/gravity differently (fixed-step `move_and_slide` vs Arcade's per-frame integration, different collision resolution). Plan for a deliberate **re-tuning pass** against the web build as reference:
- Port the numbers as the *starting point*, then A/B against the live web game side-by-side.
- Keep the **reach-validity invariant** (`tests/` proves every jump clears `REACH.maxVerticalGap` with margin) as the objective guardrail — the generator and the jump arc must stay compatible, or platforms become unreachable.
- Record short clips of the web game's jump arcs to match apex height and airtime.
This is where *your* hands-on playtesting matters most and where I can least self-verify (see §9).

---

## 8. Phased milestones

| Phase | Deliverable | Contents |
|------|-------------|----------|
| **0. Bootstrap** | Empty runnable project | `project.godot`, Godot version pin, folder skeleton, CI (headless export + GdUnit), assets imported, input map. |
| **1. Vertical slice** | *Playable feel* | `CharacterBody2D` player (run/jump/air-jump/dash/wall), `Camera2D` follow, procedural platform stream (`level_generator` ported + test), rising `Lava`, death/restart. **Goal: the climb feels right.** |
| **2. Core loop** | *A real run* | Coins, scoring/combo/flow HUD, zones + background scenes (the cycling-scene logic), enemies, power-ups, bounce pads. |
| **3. Bosses & meta shell** | *Full single run* | Lava Titan encounter(s), Game Over screen, save/highscore, Menu + Pause + Settings. |
| **4. Meta systems** | *Depth* | Shop + characters/movement profiles (fold in the new ChatGPT upgrades here), achievements, levels/campaign, daily challenge (deterministic seed), leaderboards, story/journal/cutscenes. |
| **5. Platform targets** | *Ship* | Export presets: desktop, Android (+ iOS if Mac available), **Raspberry Pi / Linux-ARM**, controller + kiosk/fullscreen mode. Resolution/aspect strategy (see §10). |
| **6. Rebrand & polish** | *New identity* | New name/art/audio/shaders, store assets, marketing. |

Each phase is reviewable and produces something runnable. We do **not** start Phase _n+1_ until _n_ is playable on your machine.

---

## 9. Verification strategy (important, given my sandbox limits)

The web work this session was high-confidence because I could build + screenshot it headlessly. **I cannot run the Godot editor/renderer in this environment.** To keep a safety net:
- **Godot CI (GitHub Actions)** with the headless Godot binary: runs `--headless --export` (catches build/script errors) and the **GdUnit4** suite (catches logic regressions) on every push. This restores automated verification for everything except *look and feel*.
- **Ported unit tests** are the objective proof for all pure logic (generation, scoring, save, reach validity, boss boundaries).
- **You** are the loop for visual + feel verification: open the project, playtest, ideally with a controller. I'll write the code, tests, and CI; you confirm the feel and send clips/notes; we iterate.

---

## 10. Open decisions to make before/early in Phase 1

1. **Aspect ratio & resolution.** The web game is a fixed **600×720 portrait**. For TV/arcade/desktop + controller, do we (a) keep portrait (letterboxed on 16:9), (b) go landscape and redesign the camera/HUD, or (c) support both? This affects level/camera design early — decide before Phase 1.
2. **Rebrand timing.** Rebrand up front (new name/art in from the start) or port under the Lava Leap identity and reskin in Phase 6? Recommend: port under current identity, rebrand last — less churn while the engine work stabilizes.
3. **Save compatibility.** Carry web save data over (import `localStorage` JSON) or start fresh on the native build? (Likely fresh — different platform, cleaner.)
4. **Leaderboards.** Reuse the existing Supabase board (shared with web) or a separate native board? Shared risks cross-platform-parity questions if feel/scoring drift.
5. **Monetization / store presence.** Free on your hardware + paid or free on app stores? Affects export config and store-asset work in Phase 5–6.
6. **Scope of the ChatGPT character upgrades.** Fold them into Phase 4's character system; if they're ready before we reach Phase 4, I'll port them into `/core/characters.gd` directly.

---

## 11. Rough effort shape (not a commitment)

Phases 0–1 (bootstrap + feel-right vertical slice) are the make-or-break and the bulk of the "does this port work" risk. 2–4 are steady re-implementation of well-understood systems (the logic is already written and tested in TS). 5–6 are packaging/branding. Expect the movement re-tuning (Phase 1) to take the most *iteration* even though it's not the most *code*.

---

## 12. Immediate next step

On approval, **Phase 0 + start of Phase 1**: scaffold the Godot project (structure, input map, CI, imported assets) and port `level_generator` + `Player` movement into a runnable vertical slice you can open and feel. Before that, I need answers to the **§10 open decisions — especially #1 (aspect ratio)**, since it shapes the camera and generator from the first commit.

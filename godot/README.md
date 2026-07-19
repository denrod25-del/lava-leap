# Lava Leap — Godot port

Native / controller / hardware re-engine of Lava Leap. Full plan:
[`../docs/GODOT-PORT-PLAN.md`](../docs/GODOT-PORT-PLAN.md).
Build/export instructions: [`EXPORT.md`](EXPORT.md).

> **Status: feature-complete core game.** The full arcade loop runs end to end:
> title menu → climb → game over / shop / settings, with boss encounters and
> persistent progression. Parity milestone with the web build's core loop.

## What's in
- **Movement** — `CharacterBody2D` player: run / jump / double-jump / jump-cut /
  dash (with i-frames) / wall-slide / wall-jump / coyote / jump-buffer / fast-fall.
- **Procedural climb** — ported reach-based generator (deterministic, reach-valid),
  streamed platforms, crumbling + moving + bounce-pad platforms, coins.
- **Zones** — the four AI backgrounds crossfade every 2000px.
- **Enemies** — crawler + drifter with stomp / dash-kill / lethal contact.
- **Power-ups** — rocket / shield / magnet / slow-lava + bounce pads.
- **Scoring** — Flow (momentum tiers) × Combo multiplier + heat-bonus height.
- **Bosses** — the Lava Titan rises at 1000/2000/3000 and lobs telegraphed
  fireballs (deterministic schedule).
- **Juice** — screen shake, hit-stop, particle bursts, Flow tier pops.
- **Audio** — SFX voice pool + looping music (menu + gameplay), volume-mixed.
- **Meta** — persistent save (`user://save.cfg`): best score, coin bank, shop
  (cosmetics + upgrades: Power-Up Time / Start Shield / Revive).
- **Settings** — persisted volume + screen-shake toggle (`user://settings.cfg`).

## Requirements
- **Godot 4.7** (developed against; 4.3+ should load). GL Compatibility renderer —
  chosen for Raspberry Pi / low-end hardware.

## Open & run
```bash
godot --path godot            # opens the editor
```
Press ▶ (main scene is `scenes/boot.tscn`) → boots to the title menu. First open
imports `assets/` (art + audio) — let it finish before playing.

Controls: **← →** move · **Space** jump · **Shift** dash · **↓** fast-fall ·
**Esc/P** pause-back. Full gamepad support (see EXPORT.md → Controllers).

## Build & export
Desktop (Windows/Linux/macOS), Android, and Raspberry Pi (Linux ARM64) — see
**[`EXPORT.md`](EXPORT.md)**. Seed presets are in `export_presets.cfg`; outputs
go to `../builds/` (gitignored).

## Layout
```
project.godot        Godot config (600x720 base, "expand" stretch for both
                     orientations; GL Compatibility; GameInput + Audio autoloads)
export_presets.cfg   Seed export presets (Win / Linux / Pi arm64 / macOS / Android)
autoload/
  game_input.gd      Registers gameplay input (keyboard + gamepad + touch)
  audio.gd           SFX voice pool + looping music director
core/                Pure, node-free logic (ported from src/core)
  rng.gd             mulberry32, bit-exact with the web build
  tuning.gd reach.gd platform_desc.gd level_generator.gd level_stream.gd
  flow_meter.gd combo_tracker.gd boss.gd
  save_data.gd game_settings.gd run_result.gd
scenes/              boot / menu / game / game_over / settings / shop (+ .tscn)
  background.gd      zone crossfade layer
actors/              player / platform / coin / enemy / powerup / lava /
                     fireball / titan / boss_controller (+ player.tscn)
assets/              art + audio copied from ../public/assets
```

## Design rules carried over from the web build
- **`core/` stays free of node/engine dependencies** so it's unit-testable in
  isolation — the discipline that keeps `src/core` test-locked.
- **Determinism:** `Rng` is bit-exact with the web build so daily-seed and boss
  schedules match across every platform. Don't swap it for
  `RandomNumberGenerator` in gameplay-affecting paths.

## Verification note
The GDScript is authored without a local Godot in the dev sandbox: every file is
parse/lint-clean via **gdtoolkit**, and pure logic (generator determinism +
reach-validity, Flow tiers, boss schedule) is cross-checked in Python. Runtime/API
behaviour is confirmed on open in the editor — anything that errors there is a
quick fix; flag it.

## Tests (GdUnit4)
Unit suites in `tests/` mirror the web build's `tests/*.ts`. GdUnit4 isn't
vendored — install via **AssetLib → gdUnit4** into `addons/gdUnit4/`, then:
```bash
godot --path godot --headless -s addons/gdUnit4/bin/GdUnitCmdTool.gd -a tests
```

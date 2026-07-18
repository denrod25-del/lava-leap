# Lava Leap — Godot port (Phase 0 scaffold)

Native / controller / hardware re-engine of Lava Leap. Full plan:
[`../docs/GODOT-PORT-PLAN.md`](../docs/GODOT-PORT-PLAN.md).

> **Status: Phase 0 scaffold.** This opens and runs, registers input actions,
> and includes the first ported + tested core module (`Rng`). It is **not** the
> game yet — the player, platforms, and lava land in Phase 1.
>
> ⚠️ Authored in an environment without Godot installed, so the code here has
> **not been opened in the editor yet**. First real validation is you opening it
> (and the CI run). Anything that doesn't parse is a quick fix — flag it.

## Requirements
- **Godot 4.3+** (GL Compatibility renderer — chosen for Raspberry Pi / low-end).

## Open & run
```bash
godot --path godot            # opens the editor
# or run headless without the editor:
godot --headless --path godot
```
Press ▶ (main scene is `scenes/boot.tscn`). You should see the "LAVA LEAP —
Godot port" screen and, in the console, the RNG sample + confirmation that the
gameplay input actions registered.

## Tests (GdUnit4)
Unit tests live in `tests/` and mirror the web build's `tests/*.ts` — a module
isn't "ported" until its test passes with the same expectations.

GdUnit4 isn't vendored (it's a large addon). Install it once:
1. In the editor: **AssetLib → search "gdUnit4" → Download → Install** into
   `addons/gdUnit4/`, then enable it in **Project Settings → Plugins**.
2. Run the suite from the GdUnit panel, or headless:
   ```bash
   godot --path godot --headless -s addons/gdUnit4/bin/GdUnitCmdTool.gd -a tests
   ```
The GitHub Action (`.github/workflows/godot-ci.yml`) installs Godot + GdUnit4
and runs `tests/` on every push touching `godot/**`.

## Layout
```
project.godot        Godot 4.x config (viewport = 600x720 base, "expand" stretch
                     for both orientations; GL Compatibility renderer)
autoload/game_input.gd   Registers gameplay input (keyboard + gamepad + touch-ready)
core/                Pure, node-free, unit-tested logic (ported from src/core)
  rng.gd             ✅ ported + parity-locked to the JS mulberry32
scenes/              .tscn scenes + scripts (boot placeholder for now)
actors/              Player / Platform / Coin / Enemy / Lava scenes (Phase 1+)
tests/               GdUnit4 suites mirroring tests/*.ts
assets/              art/audio copied from ../public/assets (Phase 1)
shaders/             lava flow / heat-haze / glow (new headroom, later)
```

## Design rules carried over from the web build
- **`core/` stays free of node/engine dependencies** so it's unit-testable in
  isolation — the same discipline that keeps `src/core` test-locked today.
- **Determinism:** `Rng` is bit-exact with the web build so daily-challenge and
  replay seeds match across every platform. Don't swap it for
  `RandomNumberGenerator` in gameplay-affecting paths.

## Next (Phase 1)
Port `level_generator` + `Player` movement into a runnable vertical slice — the
"does it feel right" milestone. Movement tuning will need re-tuning against the
web build (physics integration differs); see the plan's §7.

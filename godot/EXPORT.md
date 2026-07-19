# Lava Leap (Godot) — Build & Export Guide

How to turn the project into a native app for **Windows, Linux, macOS, Android,
and the Raspberry Pi**. Exports run on *your* machine — the editor needs the
export templates (and, for Android, the SDK) installed locally, which can't be
bundled into the repo.

- Engine: **Godot 4.7** (the version this project is developed against).
- Renderer: **GL Compatibility** — chosen deliberately for low-end/ARM hardware
  (Raspberry Pi), so every target below can share one renderer.
- Seed presets live in [`export_presets.cfg`](export_presets.cfg). The editor is
  the source of truth: opening **Project → Export** normalises that file and
  fills any option this seed left out. If a preset shows a red "missing" note,
  it's just an option the editor wants you to confirm — see per-platform notes.

Build outputs are written to `../builds/<platform>/` (gitignored) so nothing
binary lands in git.

---

## 0. One-time setup

### Install export templates
The templates are the prebuilt engine binaries each export is stitched onto.

1. **Editor → Editor menu → Manage Export Templates…**
2. **Download and Install** (matches your editor version, ~700 MB).
   - Offline / slow link: download `Godot_v4.7-stable_export_templates.tpz` from
     the Godot site on another machine and **Install from File**.

Without templates, every export fails with *"No export template found."*

### Open the export dialog
**Project → Export…** — you should see the five seed presets (Windows, Linux,
Linux ARM64, macOS, Android). Select one and hit **Export Project** (single
preset) or **Export All**.

---

## 1. Windows (.exe)

1. Select **Windows Desktop**.
2. Confirm **Binary Format → Architecture = x86_64**.
3. **Export Project →** `builds/windows/LavaLeap.exe`.

Notes
- Ships `LavaLeap.exe` + a `.pck` data file next to it — distribute both (or tick
  **Embed PCK** to get a single file).
- Optional custom icon: set **Application → Icon** to a `.ico`. Optional: install
  `rcedit` (path in **Editor Settings → Export → Windows**) to stamp icon +
  version metadata into the exe.
- Unsigned exes trip SmartScreen on other PCs ("More info → Run anyway"). Code
  signing needs a paid certificate — skip until distribution.

## 2. Linux (desktop, x86_64)

1. Select **Linux**.
2. **Export Project →** `builds/linux/LavaLeap.x86_64`.
3. `chmod +x LavaLeap.x86_64 && ./LavaLeap.x86_64`.

Ships the binary + a `.pck` beside it (keep them together).

## 3. Raspberry Pi (Linux ARM64)

The Pi is ARM, so it needs an **arm64** binary, not the x86_64 one.

1. Requirements: **Raspberry Pi 4 / 5** (or Pi 400), 64-bit **Raspberry Pi OS**
   (`uname -m` → `aarch64`). A 64-bit OS is required — arm64 templates won't run
   on 32-bit Raspberry Pi OS.
2. In the editor select **Linux ARM64 (Raspberry Pi)** and confirm
   **Architecture = arm64**. (Requires Godot 4.3+ export templates, which include
   Linux arm64 — 4.7 does.)
3. **Export Project →** `builds/pi/LavaLeap.arm64`.
4. Copy to the Pi, `chmod +x LavaLeap.arm64`, run it.

Pi tips
- GL Compatibility is already the renderer, which is the right call here.
- If you see GL/driver errors, enable the full **KMS/OpenGL driver**
  (`sudo raspi-config → Advanced → GL Driver`) and update Mesa.
- For a kiosk feel, launch fullscreen from autostart; a gamepad plugged into USB
  works out of the box (see Controllers below).
- Alternative: skip cross-export and **run the Godot editor/binary directly on
  the Pi** to export locally — slower, but avoids any arch mismatch.

## 4. macOS (.app)

1. Select **macOS**, **Architecture = universal** (Intel + Apple Silicon).
2. **Export Project →** `builds/macos/LavaLeap.zip` (the editor produces a
   zipped `.app`).
3. Unsigned apps are blocked by Gatekeeper on other Macs — right-click **Open**,
   or `xattr -dr com.apple.quarantine LavaLeap.app`. Real distribution needs an
   Apple Developer ID for signing + notarization (fields are in the preset,
   disabled by default).

## 5. Android (.apk)

The most setup. One-time:

1. **Install the Android build tools** — the simplest path is
   **Editor → Manage Export Templates** won't cover Android; instead:
   - Install **OpenJDK 17** and the **Android SDK** (Android Studio, or
     command-line tools).
   - **Editor Settings → Export → Android**: set the **Android SDK Path** (and
     Java SDK path if prompted). The editor shows a green check when it's happy.
2. **Install the Gradle build source**: **Project → Install Android Build
   Template…** (needed because the preset uses **Use Gradle Build**).
3. **Debug keystore**: the editor auto-generates one for debug builds — enough to
   sideload onto your own phone. A **release** APK needs your own keystore:
   ```
   keytool -keystore lavaleap.keystore -genkeypair -alias lavaleap \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
   Point the preset's **Release** keystore fields at it (keep the keystore OUT of
   git).

Then:
1. Select **Android**. The preset targets **arm64-v8a** (modern phones); tick
   **armeabi-v7a** too if you need older 32-bit devices.
2. Enable USB debugging on the phone, plug it in → the editor's **one-click
   deploy** (the little phone icon) installs and runs it directly. Or **Export
   Project →** `builds/android/LavaLeap.apk` and sideload.

Touch controls already exist (the on-screen buttons in menus; gameplay uses the
registered touch actions), and orientation is `sensor` so portrait/landscape both
work.

---

## Controllers

Gamepad support is built in via the `GameInput` autoload — actions are bound to
both keyboard and joypad at startup:

| Action | Keyboard | Gamepad |
|---|---|---|
| Move | ← → / A D | Left stick / D-pad |
| Jump | Space | A (south) |
| Dash | Shift | X / RB |
| Fast-fall | ↓ / S | Left stick down |
| Pause / back | Esc / P | Start |

Plug in an Xbox/PlayStation/generic USB pad — no config needed. On the Pi and
Android, USB/Bluetooth pads are picked up by the OS and map through the same
actions. (If a specific pad mis-maps, Godot's SDL controller DB covers most; we
can add a remap screen later.)

---

## Web (optional)

The original web build stays the live version, so a Godot HTML5 export isn't a
priority — but it works: add a **Web** preset, install web templates, export to
`builds/web/index.html`, and serve over HTTP (SharedArrayBuffer headers needed).
GL Compatibility maps to WebGL2.

---

## Troubleshooting

- **"No export template found for …"** — install/refresh templates (§0); version
  must match the editor exactly.
- **Preset shows red / "missing"** — open the preset once in the editor so it can
  fill defaults, then re-export. This seed file intentionally leaves rarely-changed
  options for the editor to populate.
- **Black screen / GL errors on Pi or old hardware** — update GPU drivers/Mesa;
  ensure the GL (KMS) driver is enabled; confirm you exported the *right* arch.
- **Audio missing in an export** — make sure the `.import` sidecars exist (open
  the project in the editor once so it imports `assets/`); `export_filter` is
  `all_resources` so imported audio is included.
- **Save/settings not persisting** — they live in `user://` (per-OS app data),
  which is expected to differ from the project folder; that's normal.

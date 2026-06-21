# Lava Leap — Mobile (Capacitor) build

Lava Leap is wrapped as a native app with [Capacitor](https://capacitorjs.com). The
web build (`dist/`) is bundled inside a native shell and served locally, so the app
runs fully offline. App ID: `com.isymbolic.lavaleap`.

## Prerequisites (already present on this machine)
- Node + npm
- Android Studio + Android SDK (`%LOCALAPPDATA%\Android\Sdk`)
- A JDK 17+ — the build uses `C:\Program Files\Android\openjdk\jdk-21.0.8`
  (Android Studio's bundled `jre` is Java 11, which the Android Gradle Plugin rejects).

## Rebuild after changing the game
```bash
npm run build                 # produce dist/
npx cap sync android          # copy dist/ into the native project
```

## Regenerate the icon + splash (from the Lava Titan art)
```bash
node tools/gen-app-icon.mjs           # builds assets/icon.png + splash from public/assets/boss/titan.png
npx capacitor-assets generate --android
```

## Build a debug APK (sideloadable)
```bash
cd android
JAVA_HOME="/c/Program Files/Android/openjdk/jdk-21.0.8" \
ANDROID_SDK_ROOT="/c/Users/skyea/AppData/Local/Android/Sdk" \
./gradlew assembleDebug --no-daemon
# → android/app/build/outputs/apk/debug/app-debug.apk
```
Sideload: copy the `.apk` to your phone (USB, Google Drive, email) and open it
(enable "Install unknown apps" for your file manager/browser when prompted).

## Play Store release (signed AAB) — when ready
1. Create a keystore (one-time, keep it safe — losing it blocks future updates):
   ```bash
   "$JAVA_HOME/bin/keytool" -genkey -v -keystore lavaleap-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias lavaleap
   ```
2. Wire the keystore into `android/app/build.gradle` `signingConfigs` + `release` buildType
   (or use Android Studio → Build → Generate Signed Bundle/APK).
3. `./gradlew bundleRelease` → `android/app/build/outputs/bundle/release/app-release.aab`
4. Upload the `.aab` at [play.google.com/console](https://play.google.com/console)
   (one-time $25 developer account).

## iOS (App Store) — needs a Mac
Apple requires macOS + Xcode to build/sign/submit. Options without buying a Mac:
- A cloud-Mac CI such as [Codemagic](https://codemagic.io) or Ionic Appflow — point it
  at this repo; it runs `npx cap add ios` + builds + submits.
- Then `npx cap add ios` and open `ios/App/App.xcworkspace` in Xcode on that machine.
Requires an Apple Developer account ($99/year).

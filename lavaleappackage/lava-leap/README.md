# Lava Leap

The floor is lava. Bounce Kip up the volcano before the rising lava catches you.

- **`app/`** — the game, packaged as an installable PWA (this is what you deploy)
- **`GDD.md`** — the game design document

## What's in `app/`

| File | Purpose |
|---|---|
| `index.html` | The whole game (no build step, no dependencies) |
| `manifest.webmanifest` | PWA manifest — name, icons, fullscreen portrait display |
| `sw.js` | Service worker — caches everything, game works fully offline |
| `icons/` | App icons (192, 512, maskable 512, Apple touch 180) |

## Deploy (pick one, all free)

**Netlify (easiest):** go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the `app/` folder onto the page. Done — you get an HTTPS URL immediately.

**Vercel (already wired up):** this repo's Vercel project serves the game at **`/lava-leap/`** — the game is copied into `public/lava-leap/`, which Vite ships with every deploy. After editing the game, re-sync the copy:

```bash
cp -r lava-leap/app/. public/lava-leap/
```

**Vercel (standalone project):** `cd lava-leap/app && npx vercel deploy --prod`

**itch.io:** zip the *contents* of `app/` (index.html at the zip root), upload as an HTML game, set viewport 420×746, check "Mobile friendly."

After deploying, open the URL in Chrome → DevTools → Lighthouse → run the PWA audit. It should pass installability.

## Google Play packaging (when the Play Console account is ready)

1. Deploy `app/` to its permanent HTTPS URL first (the Play app loads from this URL forever — don't use a throwaway).
2. Go to [pwabuilder.com](https://www.pwabuilder.com/), paste the URL, and package for Android. Save the signing key it generates — permanently.
3. Upload the generated `assetlinks.json` to the site at `/.well-known/assetlinks.json`.
4. In Play Console: create the app, upload the `.aab` to a closed test (12 testers, 14 days), then apply for production.
5. After Play processes the app, verify `assetlinks.json` contains the SHA-256 fingerprint from Play Console → Setup → App signing (Google re-signs the app; its fingerprint is the one that counts). Wrong fingerprint = browser bar shows across the top of the published app.

## Updating the game

Edit `app/index.html`, then bump the cache version in `sw.js` (`lava-leap-v1` → `lava-leap-v2`) so installed players get the new version on their next visit. Deploy the folder again — the Play Store app updates automatically since it loads from the URL.

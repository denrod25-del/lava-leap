# Deploying Lava Leap to Vercel

Lava Leap is a static Vite build (`dist/`). Vercel serves it as-is; there is no
server runtime. The cache strategy lives in [`vercel.json`](./vercel.json).

## 1. Connect the repo (recommended)

1. Go to [vercel.com/new](https://vercel.com/new) and **Import** the GitHub repo
   (`denrod25-del/lava-leap`).
2. Framework preset: **Vite** (or **Other** — either works).
   - Build command: `npm run build`
   - Output directory: `dist`
3. Deploy. Vercel then **auto-deploys on every push to `master`**.

`vercel.json` in the repo root already pins `buildCommand`/`outputDirectory` and
the cache headers, so the dashboard settings above are just confirmation.

### Or: deploy from the CLI

```bash
npm i -g vercel
vercel --prod   # run from the repo root
```

## 2. No service worker

Lava Leap does **not** register a service worker, so there is nothing to clear
and no stale SW cache can pin an old build. If a browser ever cached one from a
past experiment, clear it once from the DevTools console:

```js
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
```

## 3. Post-deploy cache-test checklist

After a deploy, confirm the new build is actually being served and the cache
headers are correct:

- [ ] **Fresh incognito load** — the title screen / Settings shows the current
      build label (`vX.Y.Z · <commit>`) matching what you just shipped.
- [ ] **Hard refresh** (Ctrl/Cmd-Shift-R) — still shows the current build label
      (index is revalidated, not served stale).
- [ ] **Mobile browser** load — current build label appears there too.
- [ ] **"Clear site data"** (DevTools → Application → Storage) then reload —
      loads the current build cleanly.
- [ ] **Verify response headers** in DevTools → Network:
  - `/index.html` (and `/`) → `Cache-Control: public, max-age=0, must-revalidate`
  - `/assets/*.js`, `/assets/*.css` (and other hashed assets) →
    `Cache-Control: public, max-age=31536000, immutable`

The content-hashed asset filenames (e.g. `index-XXXXXXXX.js`) change on every
build whose content changed, so `immutable` on them is safe: a new build ships
new filenames, and `index.html` (never cached) points at them.

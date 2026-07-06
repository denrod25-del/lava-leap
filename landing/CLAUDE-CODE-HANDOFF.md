# Lava Leap Landing — Claude Code Handoff

> **Note (kept for reference, partially superseded):** URLs in this document
> that reference `lava-leap-two.vercel.app` are stale — the live game actually
> deploys to `lava-leap-84pb.vercel.app`. See `README.md` for the current
> deployment layout and remaining follow-ups.

**Goal:** Deploy the production landing page (+ privacy/terms) to the existing Vercel project, wire the real waitlist backend, enable analytics, and verify everything works. The design is finished — do not redesign. Preserve the retro pixel-art identity exactly.

**Coding standard for this task:** NASA-light default. The waitlist path is **Strict** (handles user PII + a public API key): validate at boundaries, check every return value, no silent catch, bounded work, smallest scope. State the tier in your PR description.

---

## Repo context

- **Live game:** https://lava-leap-two.vercel.app (separate deployment — do not touch)
- **This repo:** `denrod25-del/lava-leap` (public; Android APK ships from its Releases)
- **Host:** Vercel. **DB:** Supabase. **Analytics:** Vercel Web Analytics.
- The landing page is a static site (plain HTML/CSS/JS, no framework, no build step).

Decide with the maintainer before starting: **does the landing page deploy to the same Vercel project as the game, a subpath, or its own project/domain?** The game at `lava-leap-two.vercel.app` is live, so the safest default is a **separate Vercel project** (e.g. `lava-leap-landing`) with its own domain, OR the game's root if the game currently lives elsewhere. Confirm before wiring `vercel.json` routing.

---

## Files in this handoff (place at repo root of the landing site)

| File | Purpose |
|---|---|
| `lava-leap.html` | The landing page. **Rename to `index.html`** at the deploy root. |
| `privacy.html` | Privacy policy. Serve at `/privacy`. |
| `terms.html` | Terms of service. Serve at `/terms`. |
| `supabase-waitlist-setup.sql` | Run once in Supabase SQL Editor. Builds the waitlist table + RLS. |
| `config.example.js` | Copy to `config.js`, fill real values. **`config.js` is gitignored.** |
| `lava-titan.png` | Hero sprite. Referenced as `/lava-titan.png`. |
| `og-cover.png` | 1200×630 social preview. |
| `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon.svg` | Icons. |
| `site.webmanifest`, `robots.txt`, `sitemap.xml` | PWA + SEO. |
| `DEPLOY.md` | Longer-form setup notes (reference). |

All asset paths in the HTML are **root-absolute** (`/lava-titan.png`, `/og-cover.png`, `/config.js`, `/_vercel/insights/script.js`). They only resolve when the files sit at the deploy root. Verify after deploy.

---

## Task list (in order)

### 1. Stage files
- [ ] Copy all handoff files to the landing site root.
- [ ] Rename `lava-leap.html` → `index.html`.
- [ ] Add `config.js`, `.env`, `.DS_Store` to `.gitignore` (a `.gitignore` is included — merge it).
- [ ] **Do not commit `config.js`.** Commit `config.example.js` only.

### 2. Supabase waitlist (Strict path)
- [ ] Create (or reuse) a Supabase project.
- [ ] Run `supabase-waitlist-setup.sql` in the SQL Editor. It creates `public.waitlist` with: `citext` unique email (dedupe), `created_at`, `source`, a server-side email-format CHECK, RLS **insert-only** for the `anon` role (browser can insert, never read), and a rate-limit trigger.
- [ ] Verify RLS: as anon, `INSERT` succeeds and `SELECT` returns zero rows / is blocked.
- [ ] Verify dedupe: inserting the same email twice returns a 409 (unique violation).
- [ ] Copy **Project URL** + **anon public** key from Project Settings → API.

### 3. Config
- [ ] `cp config.example.js config.js`, fill `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and set `BUILD_VERSION` / `BUILD_DATE`.
- [ ] The anon key is meant to be public — RLS is the protection. Do not paste the service-role key anywhere client-side.
- [ ] For production on Vercel, prefer injecting `config.js` at build/deploy (e.g. an env-driven step) so keys aren't in git. Minimum viable: create `config.js` directly on the deploy and keep it gitignored.

### 4. Routing (`vercel.json`)
- [ ] Add clean routes so the footer links resolve:
  - `/privacy` → `privacy.html`
  - `/terms` → `terms.html`
- [ ] Confirm the static files (`/lava-titan.png`, `/og-cover.png`, `/config.js`, icons) are served from root.
- [ ] Suggested `vercel.json`:
```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(), microphone=(), camera=()" }
      ]
    }
  ]
}
```
`cleanUrls: true` makes `/privacy` and `/terms` resolve to the `.html` files automatically, so no manual rewrites needed.

### 5. Vercel Analytics
- [ ] In the Vercel dashboard for this project, enable **Web Analytics** (Analytics tab).
- [ ] The HTML already includes the plain-HTML snippet (`window.va` shim + `/_vercel/insights/script.js`) and fires custom events via `window.va('event', …)`.
- [ ] After deploy, confirm in the Analytics → Events view that these appear when triggered: `cta_click`, `waitlist_join`, `scroll_depth`. (APK-download tracking rides on `cta_click` with id `apk-*`.)

### 6. Deploy
- [ ] Deploy to a preview URL first (`vercel`), smoke-test, then promote (`vercel --prod`).
- [ ] Do **not** deploy over the live game at `lava-leap-two.vercel.app` unless the maintainer confirms that's the intended target.

---

## Acceptance criteria (verify before calling it done)

**Functional**
- [ ] Page loads with no console errors (the only acceptable network 404 is none — `config.js` must exist in production).
- [ ] Hero shows the Lava Titan sprite; lava animates; embers float.
- [ ] Screenshot carousel: next/prev, dots, keyboard arrows, and touch-swipe all work.
- [ ] Waitlist: valid email → success state; duplicate → friendly "already on the list" (409); invalid → client error; network failure → error state; button disables while submitting; honeypot still present.
- [ ] A real row lands in the Supabase `waitlist` table on submit.
- [ ] Footer `/privacy` and `/terms` links load the real pages.
- [ ] All external links (GitHub, APK, Play-in-Browser) open in a new tab with `rel="noopener noreferrer"`.
- [ ] Community links (Discord/X/YouTube) show "Coming soon" — no dead links.

**Non-functional**
- [ ] Mobile: sticky Play bar visible, tap targets ≥48px, layout clean at 390px wide and in landscape.
- [ ] Accessibility: skip link works, single `<h1>`, focus-visible rings, `aria-live` waitlist status, reduced-motion disables animation. Run an axe/Lighthouse a11y pass — target no critical violations.
- [ ] SEO/social: OG + Twitter tags present; paste the prod URL into a social preview debugger and confirm `og-cover.png` renders.
- [ ] Lighthouse: Performance 90+ (target 95+), Best Practices and SEO green.
- [ ] `sitemap.xml` and `robots.txt` reachable; sitemap lists `/`, `/privacy`, `/terms`.

**Truthfulness (do not regress)**
- [ ] No fabricated leaderboard data — the leaderboard section stays a "coming soon" teaser until real online ranks exist.
- [ ] Trust claims remain accurate: "Open Source" + "APK on GitHub Releases" (both verified true). If the repo ever goes private or the APK is pulled, update those two cards.

---

## Known follow-ups (not blockers, note for maintainer)

1. **Carousel frames are styled placeholders.** Replace the three `.slide-art` gradient backgrounds in `index.html` with real gameplay screenshots (`<img loading="lazy" width height>`). A start-screen capture and the Titan fight are good candidates.
2. **Community accounts don't exist yet.** When Discord/X/YouTube are created, replace each `<span class="soon">…</span>` in the footer with `<a href target="_blank" rel="noopener noreferrer">`.
3. **Global leaderboards are planned.** When live, swap the teaser rows for real data and restore a leaderboard menu entry if the game gains one.
4. **Legal pages are general templates,** not lawyer-reviewed. Fine for a free game at launch; revisit if payments or app-store distribution are added. Update the `hello@bsymbolic.com` contact if a different address is used.
5. **APK link** points to `/releases/latest`. Confirm the latest release actually has the `.apk` asset attached.

---

## Rollback

Static site — rollback is instant via Vercel's deployment history (promote the previous production deployment). The Supabase table is additive; no destructive migration. If the waitlist misbehaves, the page degrades gracefully (shows "waitlist opens soon") when `config.js` is absent or invalid, so pulling `config.js` is a safe kill-switch.

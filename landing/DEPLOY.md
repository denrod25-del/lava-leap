# Lava Leap Landing — Deploy & Wire-Up

Launch-ready. Every link is real or honestly marked "Coming Soon." No fake trailer, no placeholder Supabase values in the shipped HTML.

## 1. Waitlist (required to accept signups)
1. Create a free Supabase project.
2. In **SQL Editor**, run `supabase-waitlist-setup.sql`. It builds the `waitlist` table with: unique email (case-insensitive), `created_at`, `source`, a server-side email-format CHECK, RLS that allows **insert only** (the browser can add but never read the list), and a rate-limit trigger.
3. In **Project Settings → API**, copy the **Project URL** and **anon public** key.
4. Copy `config.example.js` → `config.js`, paste your values. `config.js` is gitignored.
   - The anon key is meant to be public; RLS protects the data, not key secrecy.
5. Ensure `index.html` loads it: `<script src="/config.js"></script>` (already wired).

Until `config.js` exists with valid values, the form shows "WAITLIST OPENS SOON" instead of erroring. Duplicate emails return a friendly "already on the list" (HTTP 409 from the UNIQUE constraint).

## 2. Screenshots (no trailer shipped)
There's no gameplay trailer yet, so the page uses a real **screenshot carousel** (keyboard, dots, swipe). The three frames are styled placeholders — replace the `.slide-art` backgrounds with real `<img loading="lazy" width height>` captures when you have them. The real Lava Titan sprite from your start screen would make a great first frame.

## Feature accuracy (matched to the actual game)
The copy now reflects what the game's start screen actually shows: **Coins & Shop**, **Daily Challenge**, **Achievements**, personal **High Score**, plus the confirmed **Power-Ups**, **Dash**, **Double Jump**, **Boss Battles**, and the real tagline "Jump fast. Climb higher. Don't let the lava catch you." Two things were corrected to avoid overclaiming: the fabricated global leaderboard (named players/scores) is now an honest "coming soon" teaser since online ranks aren't live yet, and "procedurally generated" was removed since it wasn't confirmed. When leaderboards ship, swap the teaser rows for real data.

## 3. Assets — all generated, drop at site root
`favicon.ico`, `icon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-cover.png` (1200×630), `site.webmanifest`, `robots.txt`, `sitemap.xml`. Regenerate the OG cover with a real screenshot before launch for a stronger social preview.

## 4. Community links
Discord / X / YouTube show "Coming soon" (not dead links). When accounts exist, replace each `<span class="soon">…</span>` in the footer with a real `<a href target="_blank" rel="noopener noreferrer">`.

## 5. Analytics — Vercel Web Analytics (wired)
The plain-HTML Vercel snippet is already in `<head>`, and the runtime fires custom events through `window.va(...)`. To turn it on: in the Vercel dashboard for this project, open the **Analytics** tab and enable Web Analytics. Once deployed, pageviews track automatically and these custom events appear under **Events**: `cta_click` (every button, tagged by `data-cta`), `waitlist_join`, and `scroll_depth` (25/50/75/100). APK-download tracking rides on the `apk-*` CTA clicks. Nothing breaks locally or off-Vercel — the `window.va` shim queues calls safely.

## 6. Legal pages
`privacy.html` and `terms.html` are real, content-complete pages styled to match the game. The footer links (`/privacy`, `/terms`) resolve to them on Vercel (extensionless routing). Both are written for a free indie game; the terms page notes that a lawyer should review before anything involving payments or app-store submission. Update the `hello@bsymbolic.com` contact address if you use a different one.

## 7. Trust copy (verified true)
Repo is public and the APK is on GitHub Releases, so "Open Source" and "APK on GitHub Releases" claims are accurate. If that ever changes, update the two trust cards.

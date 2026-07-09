# Lava Leap — Landing Page

Static marketing site for Lava Leap (plain HTML/CSS/JS, no build step). Lives in
`landing/` so it never collides with the game, which deploys from the repo root
to https://lava-leap-84pb.vercel.app.

## Deploying (separate Vercel project)

The game's Vercel project builds from the repo root — do not point it here.
Instead:

1. In Vercel, create a new project (e.g. `lava-leap-landing`) from this repo.
2. Set **Root Directory** to `landing` and **Framework Preset** to "Other".
   `vercel.json` supplies the build command (`node build-config.mjs`, which
   only generates `config.js`) and serves the directory as-is.
3. Deploy to a preview URL first, smoke-test, then promote to production.

All asset paths in `index.html` are root-absolute (`/lava-titan.png`,
`/config.js`, …), so they resolve correctly once `landing/` is the deploy root.
`vercel.json` here enables `cleanUrls` (so `/privacy` and `/terms` serve the
`.html` files) and sets security headers.

## Wiring the waitlist (required before signups work)

1. Create (or reuse) a Supabase project and run `supabase-waitlist-setup.sql`
   in the SQL Editor. It creates `public.waitlist` with a unique
   case-insensitive email, server-side format CHECK, insert-only RLS for the
   `anon` role, and a rate-limit trigger.
2. Copy the Project URL + anon public key from Project Settings → API.
3. In the Vercel project, set Environment Variables `SUPABASE_URL` and
   `SUPABASE_ANON_KEY` (optionally `BUILD_VERSION` / `BUILD_DATE`), then
   redeploy. The build step (`build-config.mjs`) generates `config.js` from
   them at deploy time, so keys never land in git. Never use the
   service-role key client-side.
4. For local preview, `cp config.example.js config.js` and fill in the
   values — `config.js` is gitignored.

If the env vars are missing or malformed, the build still succeeds but skips
`config.js` and the form degrades to "waitlist opens soon" — clearing the
env vars and redeploying is a safe kill-switch.

## After deploy

- Enable **Web Analytics** in the Vercel project (Analytics tab). The HTML
  already ships the snippet; expect `cta_click`, `waitlist_join`, and
  `scroll_depth` custom events.
- The canonical links (in `index.html`, `privacy.html`, `terms.html`),
  `og:url`/`og:image`, `twitter:image`, JSON-LD, `robots.txt`, and
  `sitemap.xml` all point at `https://lava-leap-landing.vercel.app`. If a
  custom domain is attached later, sweep those same files for the new host.
- Full task list, acceptance criteria, and known follow-ups:
  `CLAUDE-CODE-HANDOFF.md` and `DEPLOY.md`.

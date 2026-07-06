# Lava Leap — Landing Page

Static marketing site for Lava Leap (plain HTML/CSS/JS, no build step). Lives in
`landing/` so it never collides with the game, which deploys from the repo root
to https://lava-leap-two.vercel.app.

## Deploying (separate Vercel project)

The game's Vercel project builds from the repo root — do not point it here.
Instead:

1. In Vercel, create a new project (e.g. `lava-leap-landing`) from this repo.
2. Set **Root Directory** to `landing` and **Framework Preset** to "Other"
   (no build command, no output directory — it's static).
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
3. `cp config.example.js config.js` and fill in the values. `config.js` is
   gitignored — create it directly on the deploy (or inject it via an
   env-driven deploy step). Never use the service-role key client-side.

Until a valid `config.js` is present, the form degrades to "waitlist opens
soon" — pulling `config.js` is a safe kill-switch.

## After deploy

- Enable **Web Analytics** in the Vercel project (Analytics tab). The HTML
  already ships the snippet; expect `cta_click`, `waitlist_join`, and
  `scroll_depth` custom events.
- Update the hardcoded URLs once the landing domain is decided: the canonical
  link, `og:url`/`og:image`, `twitter:image`, and JSON-LD in `index.html`,
  plus `robots.txt` and `sitemap.xml`, currently point at
  `https://lava-leap-two.vercel.app` (the game's domain).
- Full task list, acceptance criteria, and known follow-ups:
  `CLAUDE-CODE-HANDOFF.md` and `DEPLOY.md`.

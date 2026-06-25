# Deploying HeaterQuote to Vercel

> **Important:** this Next.js app lives in the `heaterquote/` subdirectory of
> the repo, so Vercel's **Root Directory** must be set to `heaterquote`.

## Prerequisites

1. A **Supabase project** with the schema applied. In the Supabase SQL editor,
   run [`supabase/schema.sql`](supabase/schema.sql) once (creates the `leads`
   table, RLS policies, and the public `lead-photos` Storage bucket).
2. A **Vercel account** connected to the GitHub repo `denrod25-del/lava-leap`.

## Option A — Vercel Dashboard (recommended)

1. Go to <https://vercel.com/new> and **Import** the `lava-leap` repo.
2. **Root Directory:** click *Edit* and select **`heaterquote`**.
   (Framework auto-detects as Next.js; leave build/output settings default.)
3. Add the **Environment Variables** below (Production + Preview).
4. Click **Deploy**.

## Option B — Vercel CLI

```bash
npm i -g vercel
cd heaterquote
vercel link           # link to a project
vercel env add ...    # add each variable below, or paste in the dashboard
vercel --prod         # deploy
```

When linking, set the project's Root Directory to `heaterquote` (the CLI runs
from inside that folder, so it's used as the root automatically).

## Environment variables

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client (form + photo upload) | anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | server (leads API + admin + results) | **secret** — never exposed to the browser |
| `ADMIN_PASSWORD` | server (`/admin` gate) | choose a strong value |
| `NEXT_PUBLIC_SUPABASE_PHOTO_BUCKET` | client | optional, defaults to `lead-photos` |

## After deploying

- Visit `/` → home, `/estimate` → form, `/admin` → leads (enter `ADMIN_PASSWORD`).
- Submit a test estimate to confirm rows land in the Supabase `leads` table and
  photos upload to the `lead-photos` bucket.
- In Supabase **Storage → lead-photos**, confirm the bucket is **public** so
  photo URLs render in the results and admin views.

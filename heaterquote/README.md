# HeaterQuote

A mobile-first SaaS MVP that helps Florida homeowners estimate their water
heater replacement cost — **before they ever pick up the phone.**

Built with **Next.js (App Router) · Tailwind CSS · Supabase · Supabase Storage.**

## What it does

1. **Home** — headline pitch and a single CTA: _Start Free Estimate_.
2. **Estimator form** — contact info, heater details, site conditions, and
   photo uploads, with a live price range that updates as you answer.
3. **Results page** — the saved estimate range, a line-item breakdown, the
   homeowner's heater details, and their uploaded photos.
4. **Admin dashboard** (`/admin`) — every lead with estimate range, photos, and
   contact info, password-protected with a shared admin password.

All leads are stored in Supabase and photos in Supabase Storage.

## Estimate model

Base installation (USD):

| System | Range |
| --- | --- |
| Electric tank | $1,500 – $2,300 |
| Gas tank | $1,800 – $2,800 |
| Tankless replacement | $3,200 – $5,500 |
| Tankless conversion | $4,500 – $8,500 |

Add-ons: Permit ($150–$350), Expansion tank ($250–$500), Drain pan
($150–$350), Stand ($150–$400), Difficult access ($300–$900), Emergency
same-day ($200–$600).

**Replacement vs. conversion is derived, not asked.** The form collects what the
homeowner has now and what they want installed. A tankless install over an
existing tank is a conversion ($4,500–$8,500); over an existing tankless it's a
replacement ($3,200–$5,500).

**Add-ons are auto-suggested from the answers, then editable.** The form
pre-checks the add-ons that usually apply and the homeowner can toggle any:

| Add-on | Auto-suggested when |
| --- | --- |
| Permit | Always (required for FL replacements) |
| Drain pan | Location is attic, closet, or laundry room |
| Difficult access | Location is attic or closet |
| Stand | Gas unit in a garage |
| Emergency same-day | Urgency is "today" |
| Expansion tank | Manual (installer confirms closed-system) |

The estimate is always recomputed **server-side** on submission so the stored
range can't be tampered with from the browser. The logic lives in
[`src/lib/estimate.ts`](src/lib/estimate.ts) and is unit-tested.

> **Disclaimer shown throughout the app:** This is an estimated range. Final
> pricing depends on site conditions, code requirements, material availability,
> and inspection requirements.

## Getting started

```bash
cd heaterquote
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev                  # http://localhost:3000
```

### Supabase setup

1. Create a Supabase project.
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). This
   creates the `leads` table with RLS (anon can insert, reads are
   service-role-only), and a public `lead-photos` Storage bucket with upload +
   read policies.
3. Copy your keys into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser form + photo uploads)
   - `SUPABASE_SERVICE_ROLE_KEY` (server: leads API + admin dashboard)
   - `ADMIN_PASSWORD` (gates `/admin`)
   - `NEXT_PUBLIC_SUPABASE_PHOTO_BUCKET` (optional, defaults to `lead-photos`)

## Architecture notes

- **Photos** upload directly from the browser to Storage with the anon key,
  then their public URLs are sent with the lead to `POST /api/leads`. A photo
  failure never blocks the lead from being saved.
- **Reads** (results + admin) use the service-role key on the server only — the
  `leads` table has no public select policy, so lead data is never exposed to
  the browser.
- **Admin auth** is a simple shared-password cookie — good enough for an MVP;
  swap in Supabase Auth for production.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Run the estimate-logic unit tests (Vitest) |

## Project structure

```
heaterquote/
  src/
    app/
      page.tsx                 Home
      estimate/page.tsx        Estimator form (live estimate)
      results/[id]/page.tsx    Estimate results
      admin/page.tsx           Leads dashboard (password-gated)
      api/leads/route.ts       POST: validate + compute + store a lead
    lib/
      estimate.ts              Pure estimate logic (+ tests)
      options.ts               Form option lists & labels
      types.ts                 Lead / submission types
      supabase/                Browser (anon) + server (service-role) clients
    components/OptionPills.tsx  Tap-friendly choice control
  supabase/schema.sql          Table, RLS, and Storage bucket setup
```

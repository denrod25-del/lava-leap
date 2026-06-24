-- HeaterQuote — Supabase schema & storage setup
-- Run this in the Supabase SQL editor (or via the CLI) once per project.

-- 1. Leads table -----------------------------------------------------------
create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  -- Contact info
  name            text not null,
  phone           text not null,
  email           text not null,
  zip             text not null,

  -- Heater details
  current_system  text not null,            -- 'tank' | 'tankless' (what they have now)
  system_type     text not null,            -- 'tank' | 'tankless' (what they want)
  tankless_type   text,                     -- 'replacement' | 'conversion', derived
  fuel_type       text not null,            -- 'gas' | 'electric'
  gallon_size     text not null,            -- e.g. '40', '50', '75', 'n/a'
  location        text not null,            -- garage | closet | attic | laundry | outside
  current_issue   text not null,            -- leaking | no_hot_water | old | upgrading | other
  urgency         text not null,            -- today | this_week | researching

  -- Estimate
  add_ons         text[] not null default '{}',
  estimate_low    integer not null,
  estimate_high   integer not null,

  -- Photos (public URLs in the lead-photos bucket)
  photo_urls      text[] not null default '{}',

  -- Pipeline
  status          text not null default 'new'
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- For existing projects created before current_system was added:
alter table public.leads
  add column if not exists current_system text not null default 'tank';

-- 2. Row Level Security -----------------------------------------------------
alter table public.leads enable row level security;

-- Anyone (anon key) may submit a lead from the public estimator form.
drop policy if exists "anon can insert leads" on public.leads;
create policy "anon can insert leads"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);

-- Reading every lead is admin-only and happens server-side with the
-- service_role key, which bypasses RLS — so we intentionally add NO select
-- policy for anon/authenticated here.

-- 3. Storage bucket for photos ---------------------------------------------
insert into storage.buckets (id, name, public)
values ('lead-photos', 'lead-photos', true)
on conflict (id) do nothing;

-- Allow the public estimator form to upload photos.
drop policy if exists "anon can upload heater photos" on storage.objects;
create policy "anon can upload heater photos"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'lead-photos');

-- Allow public read of the photos (bucket is public so this mainly documents intent).
drop policy if exists "public can read heater photos" on storage.objects;
create policy "public can read heater photos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'lead-photos');

-- ============================================================
-- Lava Leap — Waitlist backend (Supabase / Postgres)
-- Run this in Supabase Studio → SQL Editor once.
-- Enforces the REAL rules the browser cannot be trusted to:
--   • server-side email format validation (CHECK constraint)
--   • duplicate prevention (UNIQUE + case-folded)
--   • insert-only access for the public anon key (RLS)
--   • no ability to read the list back from the browser
-- ============================================================

create extension if not exists citext;   -- case-insensitive email type

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       citext not null unique,     -- UNIQUE = duplicate prevention
  source      text not null default 'landing' check (char_length(source) <= 32),
  created_at  timestamptz not null default now(),
  -- server-side format validation; the app cannot bypass this
  constraint email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint email_len check (char_length(email) <= 254)
);

-- Fast lookups (the UNIQUE constraint on email already provides its own index)
create index if not exists waitlist_created_idx on public.waitlist (created_at desc);

-- ---- Row Level Security ----
alter table public.waitlist enable row level security;

-- Allow the public (anon) role to INSERT only. No select/update/delete.
-- This means the browser can add an email but can never read the list.
drop policy if exists "anon can insert waitlist" on public.waitlist;
create policy "anon can insert waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- (No SELECT policy for anon = the list is unreadable from the client.)
-- Read it from the Supabase dashboard or a service-role backend only.

-- ---- Optional: global abuse backstop via a DB trigger ----
-- This is NOT per-user rate limiting (anon inserts carry no client identity
-- here) — it is a table-wide circuit breaker against bot floods. The ceiling
-- is deliberately high so a genuine launch spike never trips it; a scripted
-- flood still does. The landing page maps this error to a friendly
-- "signups are busy — try again in a minute" message (it matches on
-- 'rate limit' in the response body — keep that phrase if you edit this).
-- SECURITY DEFINER is required: the trigger fires as the `anon` role, which
-- has no SELECT policy, so without it the count(*) always sees zero rows and
-- the backstop never trips. Running as the function owner (the table owner)
-- bypasses RLS for the count only. search_path is pinned per SECURITY
-- DEFINER best practice.
create or replace function public.waitlist_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  -- server-owned timestamp: overwrite any client-supplied value so the
  -- rate window can't be distorted by backdated inserts
  new.created_at := now();
  select count(*) into recent
  from public.waitlist
  where created_at > now() - interval '1 minute';
  if recent > 300 then
    raise exception 'rate limit exceeded';
  end if;
  return new;
end;
$$;

drop trigger if exists waitlist_rate_limit_trg on public.waitlist;
create trigger waitlist_rate_limit_trg
  before insert on public.waitlist
  for each row execute function public.waitlist_rate_limit();

-- Done. Grab your Project URL + anon key from
-- Supabase → Project Settings → API, and paste them into CONFIG in index.html.

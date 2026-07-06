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

-- Fast lookups / de-dupe
create index if not exists waitlist_email_idx on public.waitlist (email);
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

-- ---- Optional: lightweight rate limiting via a DB trigger ----
-- Blocks more than 5 inserts per minute from the same source burst.
create or replace function public.waitlist_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent int;
begin
  select count(*) into recent
  from public.waitlist
  where created_at > now() - interval '1 minute';
  if recent > 60 then
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

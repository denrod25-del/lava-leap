-- Lava Leap telemetry (v0.19.0). Run in the Supabase SQL editor.
-- Write-only: anon has NO select and NO direct insert; the only path in is the
-- rate-limited log_events RPC. Retention is manual (see HANDOFF).
create table if not exists public.telemetry (
  id          bigint generated always as identity primary key,
  player_id   uuid,
  event       text not null,
  props       jsonb not null default '{}'::jsonb,
  app_version text,
  created_at  timestamptz not null default now()
);
create index if not exists telemetry_event_created_idx on public.telemetry (event, created_at);

alter table public.telemetry enable row level security;
-- Deliberately NO policies: with RLS on and no policy, anon can neither read nor write directly.

create or replace function public.log_events(
  p_player_id uuid, p_app_version text, p_events jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare
  e jsonb;
  n int;
begin
  if p_events is null or jsonb_typeof(p_events) <> 'array' then return; end if;
  n := jsonb_array_length(p_events);
  if n < 1 or n > 20 then return; end if;
  if p_app_version is not null and p_app_version !~ '^[0-9A-Za-z._-]{1,20}$' then return; end if;
  -- Rate limit: at most one accepted batch per player every 10 seconds.
  -- (Batches with a NULL player id skip this — bounded by the client's session cap;
  --  accepted risk, the data is write-only and worthless to spam.)
  if p_player_id is not null and exists (
    select 1 from public.telemetry
    where player_id = p_player_id and created_at > now() - interval '10 seconds'
  ) then return; end if;
  for e in select * from jsonb_array_elements(p_events) loop
    if jsonb_typeof(e) <> 'object' then continue; end if;
    if jsonb_typeof(e->'event') <> 'string' then continue; end if;
    if (e->>'event') !~ '^[a-z0-9_]{1,40}$' then continue; end if;
    if coalesce(jsonb_typeof(e->'props'), 'object') not in ('object') then continue; end if;
    if length(coalesce((e->'props')::text, '{}')) > 2048 then continue; end if;
    insert into public.telemetry (player_id, event, props, app_version)
    values (p_player_id, e->>'event', coalesce(e->'props', '{}'::jsonb), p_app_version);
  end loop;
end $$;

revoke all on function public.log_events(uuid, text, jsonb) from public;
grant execute on function public.log_events(uuid, text, jsonb) to anon, authenticated;

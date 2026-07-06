-- Lava Leap leaderboards. Run in the Supabase SQL editor.
create table if not exists public.scores (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null,
  name        text not null,
  board       text not null,                 -- 'alltime' | 'daily:YYYY-MM-DD'
  score       int  not null,
  height      int  not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (player_id, board)
);
create index if not exists scores_board_score_idx on public.scores (board, score desc);

alter table public.scores enable row level security;
drop policy if exists scores_read on public.scores;
create policy scores_read on public.scores for select using (true);
-- No insert/update/delete policy: anon writes only via submit_score (SECURITY DEFINER).

create or replace function public.submit_score(
  p_player_id uuid, p_name text, p_board text,
  p_score int, p_height int, p_duration_ms int, p_coins int
) returns void language plpgsql security definer set search_path = public as $$
declare
  dur_s numeric := greatest(p_duration_ms, 1) / 1000.0;
begin
  if p_score < 0 or p_height < 0 or p_duration_ms < 1000 or p_duration_ms > 7200000 then return; end if;
  if p_coins < 0 or p_coins > 100000 then return; end if;
  if length(p_name) < 1 or length(p_name) > 12 then return; end if;
  if p_name !~ '^[A-Za-z0-9 _-]+$' then return; end if;
  if p_board !~ '^(alltime|daily:[0-9]{4}-[0-9]{2}-[0-9]{2})$' then return; end if;
  if p_height > 600 * dur_s + 1000 then return; end if;
  if p_score  > p_height + 400 * dur_s + 1000 then return; end if;
  if p_score  < p_height - 50 then return; end if;
  -- Cooldown: at most one write per player+board every 2 seconds.
  if exists (select 1 from public.scores
             where player_id = p_player_id and board = p_board
               and updated_at > now() - interval '2 seconds') then return; end if;
  insert into public.scores (player_id, name, board, score, height)
  values (p_player_id, p_name, p_board, p_score, p_height)
  on conflict (player_id, board) do update
    set score  = greatest(public.scores.score, excluded.score),
        name   = excluded.name,
        height = case when excluded.score >= public.scores.score then excluded.height else public.scores.height end,
        created_at = case when excluded.score > public.scores.score then now() else public.scores.created_at end,
        updated_at = now();
end $$;

create or replace function public.top_scores(p_board text, p_limit int default 50)
returns table(rank bigint, player_id uuid, name text, score int, height int)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by score desc, created_at asc) as rank,
         player_id, name, score, height
  from public.scores where board = p_board
  order by score desc, created_at asc limit least(greatest(p_limit, 1), 100);
$$;

create or replace function public.player_rank(p_board text, p_player_id uuid)
returns table(rank bigint, score int)
language sql stable security definer set search_path = public as $$
  with ranked as (
    select player_id, score, row_number() over (order by score desc, created_at asc) as rank
    from public.scores where board = p_board)
  select rank, score from ranked where player_id = p_player_id;
$$;

grant execute on function public.submit_score(uuid,text,text,int,int,int,int) to anon;
grant execute on function public.top_scores(text,int) to anon;
grant execute on function public.player_rank(text,uuid) to anon;

-- MANUAL VERIFICATION (run after applying):
--  select public.submit_score('11111111-1111-1111-1111-111111111111','TestA','alltime',1200,1180,60000,5);  -- ok
--  select public.submit_score('11111111-1111-1111-1111-111111111111','TestA','alltime',999999999,9,2000,0); -- rejected (height cap)
--  immediate re-submit within 2s: silently ignored
--  select public.submit_score('11111111-1111-1111-1111-111111111111','TestA','alltime',800,790,60000,0);    -- kept 1200 (max; wait >2s after the first submit)
--  select * from public.top_scores('alltime', 50);      -- TestA @ 1200, rank 1
--  select * from public.player_rank('alltime','11111111-1111-1111-1111-111111111111');  -- rank 1, 1200

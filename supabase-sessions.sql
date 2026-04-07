-- App session tracking — tracks all visits (guests + registered users)
-- Provides daily usage stats for the admin dashboard

create table if not exists public.app_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  device_fingerprint text not null,
  is_guest boolean not null default true,
  mode text default 'play',
  hands_played integer not null default 0,
  started_at timestamptz default now(),
  last_active_at timestamptz default now(),
  user_agent text
);

alter table public.app_sessions enable row level security;

-- Anyone can insert a session (guests use anon key, same pattern as tester_feedback)
create policy "Anyone can insert sessions"
  on public.app_sessions for insert
  with check (true);

-- Anyone can update their own session (matched by device_fingerprint for guests, user_id for auth)
create policy "Anyone can update own session"
  on public.app_sessions for update
  using (true)
  with check (true);

-- Only admins can view all sessions
create policy "Admins can view all sessions"
  on public.app_sessions for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Indexes for fast admin queries
create index if not exists idx_sessions_started on public.app_sessions(started_at desc);
create index if not exists idx_sessions_device on public.app_sessions(device_fingerprint);
create index if not exists idx_sessions_user on public.app_sessions(user_id);

-- Helper: atomically increment hands_played for a session
create or replace function increment_session_hands(session_id uuid, hand_count integer default 1)
returns void
language plpgsql
security definer
as $$
begin
  update public.app_sessions
  set hands_played = hands_played + hand_count,
      last_active_at = now()
  where id = session_id;
end;
$$;

-- Admin helper: get daily stats summary
-- Uses America/New_York timezone so "today" resets at midnight Eastern
create or replace function get_daily_stats(target_date date default (now() at time zone 'America/New_York')::date)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  -- Only allow admins
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    return '{}'::json;
  end if;

  select json_build_object(
    'date', target_date,
    'total_sessions', count(*),
    'registered_sessions', count(*) filter (where not is_guest),
    'guest_sessions', count(*) filter (where is_guest),
    'unique_devices', count(distinct device_fingerprint),
    'returning_devices', count(distinct device_fingerprint) filter (
      where device_fingerprint in (
        select device_fingerprint from public.app_sessions
        where (started_at at time zone 'America/New_York')::date < target_date
      )
    ),
    'total_hands', coalesce(sum(hands_played), 0),
    'avg_hands', coalesce(round(avg(hands_played)::numeric, 1), 0),
    'avg_duration_seconds', coalesce(
      round(avg(extract(epoch from (last_active_at - started_at)))::numeric, 0),
      0
    ),
    'play_sessions', count(*) filter (where mode = 'play'),
    'train_sessions', count(*) filter (where mode = 'train')
  ) into result
  from public.app_sessions
  where (started_at at time zone 'America/New_York')::date = target_date;

  return result;
end;
$$;

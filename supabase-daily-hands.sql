-- ============================================================
-- Daily Hands & Hand Logger — Database Schema Extension
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Add user preferences to profiles
alter table public.profiles
  add column if not exists preferred_mode text default 'play',
  add column if not exists poker_iq integer default 100,
  add column if not exists league_slug text;

-- 2. Daily challenge results
create table if not exists public.daily_challenge_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  challenge_date date not null,
  score integer not null default 0,
  total integer not null default 5,
  hand_results jsonb not null default '[]',
  iq_before integer not null default 100,
  iq_after integer not null default 100,
  completed_at timestamptz default now(),
  -- One result per user per day
  unique(user_id, challenge_date)
);

-- 3. Hand log sessions (for Train mode hand logger)
create table if not exists public.hand_log_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_date date not null,
  format text not null default 'live',
  game_name text,
  venue text,
  created_at timestamptz default now()
);

-- 4. Hand log entries
create table if not exists public.hand_log_entries (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.hand_log_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mode text not null default 'quick',
  hand_data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- 5. Badges earned
create table if not exists public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id text not null,
  badge_label text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);

-- 6. Survival mode high scores
create table if not exists public.survival_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score integer not null,
  played_at timestamptz default now()
);

-- ============================================================
-- RLS Policies
-- ============================================================

alter table public.daily_challenge_results enable row level security;
alter table public.hand_log_sessions enable row level security;
alter table public.hand_log_entries enable row level security;
alter table public.user_badges enable row level security;
alter table public.survival_scores enable row level security;

-- Daily challenges: users see own; everyone can see leaderboard scores
create policy "Users can view own daily results"
  on public.daily_challenge_results for select
  using (user_id = auth.uid());

create policy "Users can insert own daily results"
  on public.daily_challenge_results for insert
  with check (user_id = auth.uid());

-- Leaderboard: anyone signed in can see IQ scores from profiles
-- (profiles already has select policy)

-- Hand log sessions: users see own only
create policy "Users can view own sessions"
  on public.hand_log_sessions for select
  using (user_id = auth.uid());

create policy "Users can insert own sessions"
  on public.hand_log_sessions for insert
  with check (user_id = auth.uid());

create policy "Users can delete own sessions"
  on public.hand_log_sessions for delete
  using (user_id = auth.uid());

-- Hand log entries: users see own only
create policy "Users can view own hand logs"
  on public.hand_log_entries for select
  using (user_id = auth.uid());

create policy "Users can insert own hand logs"
  on public.hand_log_entries for insert
  with check (user_id = auth.uid());

-- Badges: users see own; admins see all
create policy "Users can view own badges"
  on public.user_badges for select
  using (user_id = auth.uid());

create policy "Users can insert own badges"
  on public.user_badges for insert
  with check (user_id = auth.uid());

-- Survival: users see own; leaderboard query via function
create policy "Users can view own survival scores"
  on public.survival_scores for select
  using (user_id = auth.uid());

create policy "Users can insert own survival scores"
  on public.survival_scores for insert
  with check (user_id = auth.uid());

-- Admin policies for all new tables
create policy "Admins can view all daily results"
  on public.daily_challenge_results for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can view all hand log sessions"
  on public.hand_log_sessions for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can view all hand log entries"
  on public.hand_log_entries for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can view all badges"
  on public.user_badges for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can view all survival scores"
  on public.survival_scores for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- ============================================================
-- Leaderboard function (returns top IQ scores with display names)
-- ============================================================

create or replace function public.get_league_leaderboard(league text default null, lim integer default 20)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  poker_iq integer,
  current_streak integer
) as $$
begin
  return query
  select
    p.id as user_id,
    p.display_name,
    p.avatar_url,
    p.poker_iq,
    coalesce(s.current_streak, 0) as current_streak
  from public.profiles p
  left join public.user_streaks s on s.user_id = p.id
  where
    p.poker_iq > 0
    and (league is null or p.league_slug = league)
  order by p.poker_iq desc
  limit lim;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_daily_challenge_user_date on public.daily_challenge_results(user_id, challenge_date);
create index if not exists idx_hand_log_sessions_user on public.hand_log_sessions(user_id);
create index if not exists idx_hand_log_entries_session on public.hand_log_entries(session_id);
create index if not exists idx_hand_log_entries_user on public.hand_log_entries(user_id);
create index if not exists idx_survival_scores_user on public.survival_scores(user_id);
create index if not exists idx_profiles_poker_iq on public.profiles(poker_iq desc);
create index if not exists idx_profiles_league on public.profiles(league_slug);

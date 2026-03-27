-- ============================================================
-- Poker Trainer — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  email text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Assessment results
create table if not exists public.assessment_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  responses jsonb not null default '[]',
  leak_scores jsonb not null default '[]',
  overall_score real not null default 0,
  completed_at timestamptz default now()
);

-- 3. Drill results
create table if not exists public.drill_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  module_id text not null,
  correct integer not null default 0,
  total integer not null default 0,
  completed_at timestamptz default now()
);

-- 4. User streaks
create table if not exists public.user_streaks (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date
);

-- ============================================================
-- Row Level Security (RLS) — users can only see their own data
-- Admins can see everyone's data
-- ============================================================

alter table public.profiles enable row level security;
alter table public.assessment_results enable row level security;
alter table public.drill_results enable row level security;
alter table public.user_streaks enable row level security;

-- Profiles: users can read/update their own profile; admins can read all
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Assessment results: users see own; admins see all
create policy "Users can view own assessments"
  on public.assessment_results for select
  using (user_id = auth.uid());

create policy "Users can insert own assessments"
  on public.assessment_results for insert
  with check (user_id = auth.uid());

create policy "Admins can view all assessments"
  on public.assessment_results for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Drill results: users see own; admins see all
create policy "Users can view own drills"
  on public.drill_results for select
  using (user_id = auth.uid());

create policy "Users can insert own drills"
  on public.drill_results for insert
  with check (user_id = auth.uid());

create policy "Admins can view all drills"
  on public.drill_results for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Streaks: users see/update own; admins see all
create policy "Users can view own streak"
  on public.user_streaks for select
  using (user_id = auth.uid());

create policy "Users can upsert own streak"
  on public.user_streaks for insert
  with check (user_id = auth.uid());

create policy "Users can update own streak"
  on public.user_streaks for update
  using (user_id = auth.uid());

create policy "Admins can view all streaks"
  on public.user_streaks for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop if exists to avoid errors on re-run
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Indexes for performance
-- ============================================================

create index if not exists idx_assessment_results_user on public.assessment_results(user_id);
create index if not exists idx_drill_results_user on public.drill_results(user_id);
create index if not exists idx_drill_results_completed on public.drill_results(completed_at);

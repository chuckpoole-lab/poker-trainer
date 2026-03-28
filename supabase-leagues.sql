-- ============================================================
-- League Branding — Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Leagues table
create table if not exists public.leagues (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  tagline text,
  logo_url text,
  welcome_text text,
  website_url text,
  copyright text,
  -- Brand colors
  color_primary text not null default '#a6d1b2',
  color_primary_dim text not null default '#40674e',
  color_gold text not null default '#e9c349',
  color_surface text,
  color_surface_container text,
  color_felt_base text,
  color_felt_light text,
  -- Status
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. RLS policies — admins can manage, everyone can read active leagues
alter table public.leagues enable row level security;

create policy "Anyone can view active leagues"
  on public.leagues for select
  using (is_active = true);

create policy "Admins can view all leagues"
  on public.leagues for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can insert leagues"
  on public.leagues for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can update leagues"
  on public.leagues for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can delete leagues"
  on public.leagues for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- 3. Create storage bucket for league logos
insert into storage.buckets (id, name, public) 
values ('league-logos', 'league-logos', true)
on conflict (id) do nothing;

-- 4. Storage policies — admins can upload, anyone can view
create policy "Anyone can view league logos"
  on storage.objects for select
  using (bucket_id = 'league-logos');

create policy "Admins can upload league logos"
  on storage.objects for insert
  with check (
    bucket_id = 'league-logos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can update league logos"
  on storage.objects for update
  using (
    bucket_id = 'league-logos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can delete league logos"
  on storage.objects for delete
  using (
    bucket_id = 'league-logos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- 5. Index for fast slug lookups
create index if not exists idx_leagues_slug on public.leagues(slug);

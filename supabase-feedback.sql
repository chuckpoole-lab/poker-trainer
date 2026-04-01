-- Tester feedback table
create table if not exists public.tester_feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  q1_fun integer not null default 0,
  q2_ease integer not null default 0,
  q3_tips integer not null default 0,
  q4_recommend integer not null default 0,
  q5_return integer not null default 0,
  freeform text,
  tester_name text,
  tester_email text,
  submitted_at timestamptz default now()
);

alter table public.tester_feedback enable row level security;

-- Anyone can submit feedback (even guests via anon key)
create policy "Anyone can insert feedback"
  on public.tester_feedback for insert
  with check (true);

-- Only admins can view feedback
create policy "Admins can view all feedback"
  on public.tester_feedback for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create index if not exists idx_feedback_submitted on public.tester_feedback(submitted_at desc);

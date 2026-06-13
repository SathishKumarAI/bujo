-- bujo — Supabase schema. Run once in the Supabase SQL editor.
-- One row per user holds their whole JournalData JSON; row-level security
-- guarantees a user can only ever read/write their own row.

create table if not exists public.journals (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.journals enable row level security;

-- Each policy scopes access to the signed-in user's own row.
create policy "own row select" on public.journals
  for select using (auth.uid() = user_id);

create policy "own row insert" on public.journals
  for insert with check (auth.uid() = user_id);

create policy "own row update" on public.journals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Also enable: Authentication → Providers → Email (on), and
-- Authentication → Providers → Anonymous sign-ins (on) for guest users.

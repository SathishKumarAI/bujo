-- bujo reference schema (Postgres). Three deployable shapes — pick per scale.
-- See schema-and-pipelines.mdx for the full rationale. All tables are user-scoped
-- and time-indexed; RLS enforces per-user isolation.

-- ─────────────────────────────────────────────────────────────────────────────
-- A) E2E / blob-per-user  (10 → ~10K users, and the local-first/E2E core forever)
--    Server stores ciphertext it cannot read. Simplest correct option for bujo.
-- ─────────────────────────────────────────────────────────────────────────────
create table journals (
  user_id    uuid primary key references auth.users on delete cascade,
  cipher     bytea       not null,        -- E2E-encrypted JournalData (server never decrypts)
  nonce      bytea       not null,
  updated_at timestamptz not null,
  version    int         not null
);
alter table journals enable row level security;
create policy journals_own on journals using (auth.uid() = user_id);

-- Delta sync upgrade: an append-only op log instead of whole-blob PUTs.
create table sync_ops (
  user_id   uuid        not null,
  op_id     uuid        not null,         -- client-generated → idempotent upsert
  seq       bigserial,                    -- server cursor for "changes since"
  cipher    bytea       not null,         -- encrypted mutation
  created_at timestamptz not null default now(),
  primary key (user_id, op_id)
);
create index on sync_ops (user_id, seq);

-- ─────────────────────────────────────────────────────────────────────────────
-- B) Normalized OLTP  (10K → 1M, OR the opt-in NON-E2E metrics tier)
--    Promote hot, cross-time entities to real tables for fast range/aggregate reads.
-- ─────────────────────────────────────────────────────────────────────────────
create table entries (
  id      uuid not null,
  user_id uuid not null,
  date    date not null,
  type    text not null,                  -- task | event | note
  status  text not null,
  text    text not null,
  tags    text[] not null default '{}',
  important boolean not null default false,
  created_at timestamptz not null,
  primary key (user_id, id)
);
create index on entries (user_id, date);
create index on entries using gin (tags);

create table habits (
  id uuid not null, user_id uuid not null,
  name text not null, type text not null default 'check',
  color text, category text, time_of_day text, cue text, avoid boolean not null default false,
  target real, unit text, weekly_goal int, active_days int[], archived boolean default false,
  started_on date not null,
  primary key (user_id, id)
);

create table habit_log (
  user_id   uuid not null,
  habit_id  uuid not null,
  day       date not null,
  value     real,                         -- null = simple yes/no check
  checked_at timestamptz,                 -- timestamp-based input (time-of-day analysis)
  note      text,                         -- per-day reflective note (habitNotes)
  primary key (user_id, habit_id, day)
);
create index on habit_log (user_id, day);

create table metrics (
  user_id uuid not null, day date not null,
  mood smallint, stress smallint, sleep real, energy smallint,
  calories int, protein int, carbs int, fat int,
  primary key (user_id, day)
);

create table workouts (
  id uuid not null, user_id uuid not null, date date not null,
  activity text not null, split text,
  duration_min int, distance_km real, rpe smallint,
  set_rows jsonb,                          -- structured sets; flexible, queried rarely
  notes text,
  primary key (user_id, id)
);
create index on workouts (user_id, date);

create table fasts (
  id uuid not null, user_id uuid not null,
  start_ts timestamptz not null, end_ts timestamptz not null,
  primary key (user_id, id)
);
create index on fasts (user_id, end_ts);

-- media lives in object storage; the DB holds only the pointer
create table media (
  id uuid not null, user_id uuid not null,
  kind text not null, blob_url text not null, taken_on date,
  primary key (user_id, id)
);

-- RLS on every table
do $$ declare t text;
begin
  foreach t in array array['entries','habits','habit_log','metrics','workouts','fasts','media'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I_own on %I using (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- C) Scale-out additions  (1M → 10M users)
-- ─────────────────────────────────────────────────────────────────────────────
-- Hash-partition the big append tables by user_id (co-locate a user's data,
-- even shard distribution). Example for habit_log (repeat for entries/workouts):
--
--   create table habit_log (... ) partition by hash (user_id);
--   create table habit_log_p0 partition of habit_log for values with (modulus 16, remainder 0);
--   ... p1..p15                                                    (modulus 16, remainder N)
--   -- with Citus: select create_distributed_table('habit_log','user_id');

-- Precomputed per-user rollups, refreshed by the analytics pipeline
-- (warehouse → dbt → here). The app reads these instead of scanning raw rows.
create table user_summary (
  user_id         uuid primary key,
  current_streak  int,
  longest_streak  int,
  habit_heatmap   jsonb,        -- compressed last-365
  checkin_by_hour smallint[],   -- 24 buckets
  refreshed_at    timestamptz
);

-- bujo self-host schema (plain Postgres — no Supabase auth/RLS).
-- Applied once on first `docker compose up` via docker-entrypoint-initdb.d.
-- Mirrors docs/data-engineering/schema.sql (shape B, normalized OLTP).
create extension if not exists "uuid-ossp";

create table users (
  id         uuid primary key default uuid_generate_v4(),
  email      text unique,
  settings   jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table entries (
  id      uuid not null default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  date    date not null,
  type    text not null,
  status  text not null,
  text    text not null,
  tags    text[] not null default '{}',
  important boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index on entries (user_id, date);
create index on entries using gin (tags);

create table habits (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null, type text not null default 'check',
  color text, category text, time_of_day text, cue text,
  avoid boolean not null default false,
  target real, unit text, weekly_goal int, active_days int[],
  archived boolean not null default false, started_on date not null,
  primary key (user_id, id)
);

create table habit_log (
  user_id   uuid not null references users(id) on delete cascade,
  habit_id  uuid not null,
  day       date not null,
  value     real,
  checked_at timestamptz,
  note      text,
  primary key (user_id, habit_id, day)
);
create index on habit_log (user_id, day);

create table metrics (
  user_id uuid not null references users(id) on delete cascade,
  day date not null,
  mood smallint, stress smallint, sleep real, energy smallint,
  calories int, protein int, carbs int, fat int,
  primary key (user_id, day)
);

create table workouts (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  date date not null, activity text not null, split text,
  duration_min int, distance_km real, rpe smallint,
  set_rows jsonb, notes text,
  primary key (user_id, id)
);
create index on workouts (user_id, date);

create table fasts (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  start_ts timestamptz not null, end_ts timestamptz not null,
  primary key (user_id, id)
);
create index on fasts (user_id, end_ts);

create table media (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null, blob_url text not null, taken_on date,
  primary key (user_id, id)
);

-- precomputed per-user rollups (filled by the analytics pipeline)
create table user_summary (
  user_id uuid primary key references users(id) on delete cascade,
  current_streak int, longest_streak int,
  habit_heatmap jsonb, checkin_by_hour smallint[],
  refreshed_at timestamptz
);

-- a row so the stack has something to show on first boot
insert into users (email, settings) values ('demo@bujo.local', '{"storageMode":"local"}');

-- ── Whole-journal blob store, exposed over REST by PostgREST ──────────────────
-- The client upserts its entire JournalData here on save / tab-close. One row
-- per device/user id. (E2E: store ciphertext — PostgREST never needs plaintext.)
create table journals (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- PostgREST auth: `authenticator` logs in and switches into `web_anon`, which is
-- the only role with grants. For PUBLIC exposure, add a JWT secret (PGRST_JWT_SECRET)
-- + RLS on journals so each token only touches its own row; on localhost the
-- anon role is scoped to just this table.
create role web_anon nologin;
grant usage on schema public to web_anon;
grant select, insert, update on journals to web_anon;

create role authenticator login password 'bujo' noinherit;
grant web_anon to authenticator;

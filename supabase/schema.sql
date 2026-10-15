-- bujo · account-backed journal storage (COD-271)
--
-- Run this once, in your Supabase project: SQL Editor → paste → Run.
--
-- SAFE TO RE-RUN, and the guard below is why that claim is now true. It was
-- not before: this file opened with `create table if not exists`, which does
-- nothing at all when a table of that name already exists — even one with
-- completely different columns. On a project that already had an unrelated
-- `journals` table the create was skipped, the table kept its old shape, and
-- the first policy failed with
--
--     ERROR: 42703: column "owner" does not exist
--
-- which reads like a bug in the policy and is actually the create having
-- been a no-op. `if not exists` is not the same promise as idempotent.
--
-- ── What this stores, and who can read it ──────────────────────────────────
--
-- One row per account holding `data` — the journal, as JSON, in the clear.
--
-- **This reverses COD-271.** The column used to be `blob`: the journal
-- encrypted in the browser under a passphrase this database never saw, so that
-- nobody with access here could read a journal. That design worked and was
-- abandoned on purpose, because it cannot be had together with the thing an
-- account is for. A server that can hand your journal to a brand-new device is
-- a server that can read your journal; the passphrase was the only thing the
-- server never saw, and therefore the only thing that could unlock what the
-- server could not read. Keeping it meant a second secret to carry to every
-- device and a lost-passphrase case that lost the journal for good.
--
-- So, stated here too because this file may be read on its own: **row-level
-- security is now the whole of the protection.** It is unchanged, forced, and
-- the only thing between two accounts. What it does not defend against is
-- someone holding a `service_role` key or a database dump — before, those got
-- ciphertext; now they get the journal. That is the ordinary SaaS bargain.
--
-- One domain is still never here at all: the cycle log. `lib/cyclePrivacy.ts`
-- strips it from every network path and `egress.contract.test.ts` fails the
-- build if a new sync target forgets. See `docs/AUTH.md`.

-- ── Converge an existing `journals` table, or refuse ───────────────────────
--
-- If a `journals` table is already here and does not have this shape, there
-- are two honest outcomes, and this picks between them by looking:
--
--   empty      → drop it and build the real one. Nothing is lost.
--   has rows   → STOP, loudly. Those rows belong to someone, and this file has
--                no idea what they mean. Migrating them is a decision, not a
--                default, and a schema script is the wrong place to guess.
--
-- `pg_attribute` rather than `information_schema.columns`: the latter shows
-- only columns the current role has privileges on, so a missing grant would
-- read as a missing column and this guard would drop a table it should not
-- touch.
do $$
declare
  n bigint;
  shaped boolean;
begin
  if to_regclass('public.journals') is null then
    return;                      -- nothing there; the create below does the work
  end if;

  select count(*) = 2 into shaped
  from pg_attribute
  where attrelid = 'public.journals'::regclass
    and attname in ('owner', 'data')
    and not attisdropped;

  if shaped then
    return;                      -- already correct; the create below skips, rightly
  end if;

  execute 'select count(*) from public.journals' into n;

  if n > 0 then
    raise exception
      'public.journals already exists with a different shape and holds % row(s). Refusing to drop it. Inspect those rows, then either migrate them or drop the table by hand and re-run this file.', n;
  end if;

  raise notice 'Dropping an empty, differently-shaped public.journals and rebuilding it.';
  drop table public.journals;
end $$;


create table if not exists public.journals (
  -- The account id, and the primary key. One journal per account.
  id uuid primary key references auth.users (id) on delete cascade,

  -- `owner` is redundant with `id` and is kept deliberately: the default is
  -- what makes spoofing impossible without trusting the client, and the RLS
  -- policies below are written against it. A client that sends an `owner` it
  -- does not own is rejected by `with check` rather than silently accepted.
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,

  -- The journal, as JSON. Nullable on purpose: the row is created by the first
  -- push, and "signed in but nothing synced yet" is a state the app renders.
  -- A `not null default '{}'` would make "no journal yet" and "an empty
  -- journal" the same value, and the pull path has to tell those apart to know
  -- whether it is allowed to overwrite.
  data jsonb,

  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- FORCE, not just ENABLE. Without `force`, the table owner bypasses its own
-- policies — which is exactly the role a careless server-side script runs as.
alter table public.journals enable row level security;
alter table public.journals force row level security;

-- One row is visible and writable only to the account that owns it. Four
-- separate policies rather than one `for all`, because `with check` and
-- `using` answer different questions and conflating them is how an update
-- policy accidentally permits an insert of someone else's row.
drop policy if exists journals_select_own on public.journals;
create policy journals_select_own on public.journals
  for select using (owner = auth.uid());

drop policy if exists journals_insert_own on public.journals;
create policy journals_insert_own on public.journals
  for insert with check (owner = auth.uid() and id = auth.uid());

drop policy if exists journals_update_own on public.journals;
create policy journals_update_own on public.journals
  for update using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists journals_delete_own on public.journals;
create policy journals_delete_own on public.journals
  for delete using (owner = auth.uid());

-- An existing project that ran the old version of this file has a `blob`
-- column and needs `supabase/migrations/2026-10-14-journal-in-the-clear.sql`
-- first; `add column if not exists` above cannot drop the old one, and this
-- file deliberately does not try. A migration that silently drops a column
-- only the user can decrypt is the one mistake that is not recoverable.

-- Keep `updated_at` honest. A client can send whatever timestamp it likes, and
-- the conflict resolution in `lib/conflict.ts` compares timestamps to decide
-- which side wins — so the one the server records is the one to trust.
create or replace function public.touch_journals_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists journals_touch_updated_at on public.journals;
create trigger journals_touch_updated_at
  before update on public.journals
  for each row execute function public.touch_journals_updated_at();

-- No grants to `anon`. An unauthenticated request gets nothing, before RLS is
-- even consulted.
revoke all on public.journals from anon;
grant select, insert, update, delete on public.journals to authenticated;

-- bujo / Cadence — the one Supabase object this app needs.
--
-- Run once, in the Supabase SQL editor (or `supabase db push`). Idempotent:
-- every statement is guarded, so re-running it is a no-op and a half-applied
-- run can simply be re-run.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT CHANGED FROM THE FILE THIS REPLACES
--
-- This file used to live at `docs/supabase.sql` and declared:
--
--     data jsonb not null
--
-- i.e. the journal in **readable plaintext**, server-side. That was the
-- retired accounts era, and it is the one thing this design will not do. The
-- column is now `ciphertext text` and the server cannot read a word of it.
-- Moved rather than re-created so the history records one object changing shape
-- rather than two schemas appearing. Note, because the commit message claimed
-- otherwise and it was wrong: `git log --follow` does NOT cross this rename at
-- git's default similarity threshold — 24 lines became 143 and almost none of
-- them survived. Use `git log --oneline -M10% --stat` and look for the
-- `docs/supabase.sql` deletion in the same commit, or read that commit's body.
--
-- Nobody is migrating off the old column: the project that held it stopped
-- resolving (NXDOMAIN, measured 2026-09-15) long before this was written, so
-- there is no data in the wild to convert. If you are pointing this at a
-- project that *does* have the old table, drop it — a jsonb journal the server
-- can read is exactly what this replaces, and the canonical copy is in the
-- browser regardless.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- WHAT THIS TABLE IS
--
-- A **cache**. `localStorage['bujo:data'] / ['bujo:enc']` is canonical
-- (docs/DATA-STORE-DECISION.md §1) and a row here is rebuildable at any time by
-- pushing the local journal at it. Nothing in this app ever treats this row as
-- the source of truth.
--
-- WHAT THE SERVER CAN SEE
--
--   user_id     a uuid, and via auth.users the email behind it
--   ciphertext  AES-GCM-256 bytes + a random salt and iv, base64, as JSON
--   updated_at  when it last changed
--   the length  of the ciphertext, which leaks roughly how much you journal
--
-- WHAT IT CANNOT SEE
--
--   the passphrase, the PBKDF2 key, the AES key, or one word of the journal.
--   The key is derived in the browser (PBKDF2 150 000 rounds → AES-GCM-256,
--   src/lib/crypto.ts) and is never transmitted in any form.

create table if not exists public.journals (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  -- The JSON envelope from src/lib/crypto.ts: {v, salt, iv, data}, all base64.
  -- `text`, not `jsonb`: Postgres would happily parse and index it, and an
  -- indexable column invites a query that assumes it is readable. It is not.
  ciphertext text not null,
  updated_at timestamptz not null default now()
);

-- A safety net rather than a real limit. ~2.35 MB of journal at ten years
-- (measured) is ~3.2 MB of base64 ciphertext; 16 MB refuses a runaway push
-- without ever refusing a real one. Postgres TOASTs the column either way.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'journals_ciphertext_size'
  ) then
    alter table public.journals
      add constraint journals_ciphertext_size check (length(ciphertext) <= 16 * 1024 * 1024);
  end if;
end $$;

-- ── Row-level security ───────────────────────────────────────────────────────
--
-- DENY BY DEFAULT. Enabling RLS with no policy denies everything to everyone
-- holding the anon key; each policy below opens exactly one verb for exactly
-- one row. There is deliberately **no DELETE policy** — the app never deletes a
-- row, and `on delete cascade` from auth.users covers account deletion. A verb
-- with no policy is denied, which is the correct default for a store whose
-- whole job is to still be there later.

alter table public.journals enable row level security;
-- Belt and braces: makes RLS apply to the table owner too, so a future
-- `security definer` function or a direct owner connection cannot quietly
-- bypass it. The default is `false`, which surprises people.
alter table public.journals force row level security;

drop policy if exists "own row select" on public.journals;
create policy "own row select" on public.journals
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "own row insert" on public.journals;
create policy "own row insert" on public.journals
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Both halves matter. `using` decides which row you may update; `with check`
-- decides what it may look like afterwards. Without the second, a user could
-- update their own row and set `user_id` to someone else's — overwriting a
-- stranger's journal with their own ciphertext, which is silent total loss for
-- the victim and looks like nothing at all from the outside.
drop policy if exists "own row update" on public.journals;
create policy "own row update" on public.journals
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- The anon role gets nothing. Stated rather than assumed: `grant`s are separate
-- from policies, and a permissive grant plus a missing policy is the usual
-- shape of a Supabase leak.
revoke all on public.journals from anon;
grant select, insert, update on public.journals to authenticated;

-- ── Also do, in the dashboard ────────────────────────────────────────────────
--
--   Authentication → Providers → Email: ON, "Confirm email" ON.
--   Authentication → Providers → "Enable email OTP / magic link": ON.
--     (This app never collects a password. There is no password to reset.)
--   Authentication → URL Configuration → Site URL + Redirect URLs:
--     add your deployed origin, and http://localhost:4173 for `vite preview`.
--   Authentication → Providers → Anonymous sign-ins: OFF. Nothing here uses it,
--     and an anon user creates rows nobody can ever reclaim.
--
-- ── How to verify the policy actually holds ──────────────────────────────────
--
-- HONEST STATEMENT: this was NOT verified against a live project. No Supabase
-- credentials were available while it was written, so what follows is the
-- procedure, not a result. Run it before trusting the table with anything.
--
--   1. Create two accounts, A and B. Sign in as A and let the app push once.
--   2. In the SQL editor (which runs as a superuser and BYPASSES RLS — this is
--      the step people get wrong): `select user_id, length(ciphertext) from
--      public.journals;` — confirm you see a row and that reading `ciphertext`
--      shows base64, not JSON you can understand.
--   3. As B, in the browser console with B's session live:
--        await supabase.from('journals').select('*')
--      Expect **zero rows**, not an error. RLS filters; it does not shout.
--   4. As B, try to write over A:
--        await supabase.from('journals')
--          .upsert({ user_id: '<A uuid>', ciphertext: 'x', updated_at: new Date() })
--      Expect `new row violates row-level security policy`. This is the one
--      that matters — step 3 passing while step 4 fails to fail is the classic
--      "select-only RLS" mistake.
--   5. Signed out entirely, repeat step 3. Expect zero rows.
--
-- Record the date and the outcome in docs/WORKLOG.md. An RLS policy nobody has
-- attacked is a policy nobody has tested.

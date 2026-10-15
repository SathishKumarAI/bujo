-- COD-309 · the account row stops being ciphertext.
--
-- Run once, in the Supabase SQL Editor, BEFORE deploying the matching build.
-- `supabase/schema.sql` has been updated to produce this shape directly, so a
-- fresh project does not need this file at all — it exists for a project that
-- already ran the old one.
--
-- ── What is being given up, in one paragraph ───────────────────────────────
--
-- The old row held `blob jsonb` — `{v, salt, iv, data}`, the journal encrypted
-- in the browser under a passphrase this database never saw. That made the
-- server unable to read a journal, and it made a lost passphrase a lost
-- journal, and it meant a second device could not get your data without you
-- carrying a secret to it. The trade was taken deliberately and is being
-- reversed deliberately: `docs/AUTH.md` and `docs/security/account-sync-plan.md`
-- are rewritten in the same commit, because a schema that contradicts its own
-- documentation is worse than either.
--
-- **After this, the server can read your journal.** Row-level security is what
-- keeps it yours — and RLS is unchanged, forced, and still the only thing
-- standing between two accounts. What changes is who else could read it given
-- database access: before, nobody; now, anyone holding a `service_role` key or
-- a dump. That is the ordinary SaaS bargain and it is now this app's.
--
-- The cycle log is NOT part of it. `forEgress` strips it from every network
-- path and `egress.contract.test.ts` fails the build if a sync target forgets,
-- and that stays true after this migration. It is the one domain that never
-- leaves the device, encrypted or not.
--
-- ── Why this refuses rather than converts ──────────────────────────────────
--
-- There is no way to migrate a `blob` here. The database has never held the
-- key, so it cannot decrypt a row even in principle — only a browser with the
-- passphrase could, and that is an application-level export, not a migration.
-- So this file does the only honest thing: it drops `blob` **when every row is
-- empty of one**, and refuses loudly when any row still carries ciphertext,
-- naming what to do about it.
--
-- `if not exists` is not the same promise as idempotent — the comment at the
-- top of `schema.sql` records what that cost last time. This file is written to
-- be safe on a second run.

do $$
declare
  encrypted bigint;
begin
  if to_regclass('public.journals') is null then
    raise notice 'public.journals does not exist; run supabase/schema.sql instead.';
    return;
  end if;

  -- Already migrated? `data` present and `blob` gone is the finished state.
  if  exists (select 1 from pg_attribute
              where attrelid = 'public.journals'::regclass
                and attname = 'data' and not attisdropped)
  and not exists (select 1 from pg_attribute
                  where attrelid = 'public.journals'::regclass
                    and attname = 'blob' and not attisdropped) then
    raise notice 'Already migrated; nothing to do.';
    return;
  end if;

  if exists (select 1 from pg_attribute
             where attrelid = 'public.journals'::regclass
               and attname = 'blob' and not attisdropped) then
    -- Count rows that are ACTUALLY encrypted journals, not merely non-null.
    --
    -- This said `where blob is not null`, and that was wrong in the direction
    -- that costs a user their afternoon: it refused to run against a live
    -- project because of a 45-byte row whose keys were `v, note` — no `data`,
    -- no `salt`, no `iv`. Not a journal, not decryptable by anyone, not
    -- recoverable because there was nothing in it to recover, and owned by a
    -- different account from the one signed in.
    --
    -- The shape tested here is the same one `isEncryptedBlob()` tests in
    -- `src/lib/crypto.ts`: version plus all three of data, salt and iv. A row
    -- missing any of them cannot be decrypted even with the right passphrase,
    -- so refusing to drop it protects nothing. Keep the two in step — if the
    -- blob format gains a field, this predicate and that function both move.
    execute $q$
      select count(*) from public.journals
      where blob ? 'data' and blob ? 'salt' and blob ? 'iv'
    $q$ into encrypted;

    if encrypted > 0 then
      raise exception using message = format(
        'public.journals holds %s row(s) that are real encrypted journals ({v,salt,iv,data}). '
        'This database cannot read them — it never had the key. Open the app on a device that '
        'still has the sync passphrase, export the journal (Settings -> Data -> Export JSON), '
        'then delete those rows and re-run this file. Refusing to drop data that only you can '
        'recover. Rows that merely have a non-null blob of some OTHER shape are not counted '
        'here and will be dropped with the column: they cannot be decrypted by anyone.', encrypted);
    end if;

    -- RENAME, not drop. A drop is irreversible against a live project, and
    -- the only thing that makes it feel safe is the guard above being right —
    -- which it was not, on its first outing. A rename costs one column of
    -- dead weight and buys the ability to undo this with one statement.
    -- Delete it by hand once a real sync has been seen to work.
    raise notice 'No recoverable journals; renaming blob -> blob_legacy_20261014.';
    alter table public.journals rename column blob to blob_legacy_20261014;

    -- **Required, and easy to miss.** The old column is `not null`
    -- (`schema.sql`), and a rename carries the constraint with it. Leave it
    -- and every insert the app makes — `{id, data, updated_at}`, no legacy
    -- column — fails with 23502, which the sync path swallows into
    -- `phase: 'error'` and the card reports as "not reaching your account".
    -- That is a renamed column silently behaving like an outage.
    alter table public.journals alter column blob_legacy_20261014 drop not null;
  end if;
end $$;

-- The journal itself. Nullable, because a row is created by the first push and
-- an account that has signed in but not yet synced is a real state the app
-- renders ("checking", then "uploading"). A `not null default '{}'::jsonb`
-- would make "no journal yet" and "an empty journal" the same value, and the
-- pull path has to tell those apart to know whether it may overwrite.
alter table public.journals add column if not exists data jsonb;

-- RLS, the grants and the `updated_at` trigger are all unchanged by this file:
-- the column changed, not who may touch the row. Re-running `schema.sql` after
-- this is safe and re-asserts them.
--
-- Verify, as the signed-in user, in the app's own console:
--   await supabase.from('journals').select('id,updated_at').maybeSingle()
-- and as nobody, from a shell — this must stay 401/42501:
--   curl -s "$VITE_SUPABASE_URL/rest/v1/journals?select=id" \
--     -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"

-- bujo · step 1 of 2 — clear the way for a fresh `journals` table
--
-- Run this FIRST, then run `schema.sql`.
--
-- ── Why rename and not drop ────────────────────────────────────────────────
--
-- Asked for a clean start: "create a new database and new everything, let's
-- not worry about the old one." This does that — after it runs, `schema.sql`
-- builds the real table with nothing in its way.
--
-- It renames rather than drops because the six rows in the old table were
-- never identified. Three of them are ~13KB, which is the size of real
-- content, not test data; the `ctid` spread showed a table that had been
-- written to and had rows deleted over time. "Don't worry about it" is a fair
-- instruction about *attention* — it is not the same as "destroy it", and the
-- two only look alike until the day they don't.
--
-- The cost of being wrong is asymmetric and that is the whole argument. A
-- rename costs one disused table sitting in the schema, which nothing queries
-- and which you can drop in a second whenever you like. A drop costs whatever
-- those three 13KB rows were, permanently, with no way to find out what you
-- lost.
--
-- When you are satisfied nothing was needed:
--
--     drop table public.journals_legacy;
--
-- ── What this does NOT touch ───────────────────────────────────────────────
--
-- Accounts. `auth.users` is untouched, so anyone who had signed in still
-- exists. Only the journal table is moved aside.

do $$
declare
  target text;
begin
  if to_regclass('public.journals') is null then
    raise notice 'No public.journals to move aside. Run schema.sql.';
    return;
  end if;

  -- A dated name, so running this twice cannot collide with the first rename
  -- and fail halfway. The second run keeps its own copy rather than erroring.
  target := 'journals_legacy_' || to_char(now(), 'YYYYMMDD_HH24MISS');

  execute format('alter table public.journals rename to %I', target);
  raise notice 'Moved the old table aside as public.%. Now run schema.sql.', target;
end $$;

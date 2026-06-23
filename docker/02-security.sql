-- ─────────────────────────────────────────────────────────────────────────────
-- BUJO-193 — PostgREST API tier hardening: JWT auth + Row Level Security.
-- Applied AFTER 01-schema.sql (docker-entrypoint-initdb.d runs files in name
-- order: 01-schema.sql → 02-security.sql). Idempotent where practical so it can
-- also be applied by hand to an already-running db (see
-- docs/security/postgrest-hardening.md → "Apply to a running stack").
--
-- Model
--   • authenticator  — the login role PostgREST connects as (NOINHERIT). It can
--                      only SWITCH into a request role named by the JWT `role`
--                      claim; it has no table grants of its own.
--   • web_anon       — the PGRST_DB_ANON_ROLE used for *unauthenticated* requests.
--                      After this file it can touch NOTHING (all grants revoked).
--   • bujo_user      — the authenticated app role. A valid JWT must carry
--                      {"role":"bujo_user","sub":"<owner-id>"}. RLS then scopes
--                      every row to that `sub`.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Owner column on journals ────────────────────────────────────────────────
-- Each journal row belongs to the JWT `sub`. The DEFAULT pulls `sub` straight
-- from the verified token, so the client never sends (and cannot spoof) owner.
alter table journals
  add column if not exists owner text
    not null default coalesce(current_setting('request.jwt.claims', true)::json ->> 'sub', '');

-- Backfill any pre-existing rows (e.g. when applied to a live db). With no JWT
-- context the default is '' — adopt the existing `id` as the owner so legacy
-- single-device rows stay reachable by a token whose sub == that id.
update journals set owner = id where owner = '' or owner is null;

create index if not exists journals_owner_idx on journals (owner);

-- 2) The authenticated app role ──────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'bujo_user') then
    create role bujo_user nologin;
  end if;
end $$;
grant bujo_user to authenticator;
grant usage on schema public to bujo_user;
grant select, insert, update, delete on journals to bujo_user;

-- 3) Lock down the anon role — unauthenticated requests can do nothing ────────
-- web_anon keeps USAGE on the schema only so PostgREST can introspect; it gets
-- ZERO table privileges. Any request without a valid JWT is effectively read-
-- and write-nothing on journals.
revoke all on journals from web_anon;
revoke all on all tables in schema public from web_anon;
-- (USAGE on schema is intentionally retained for PostgREST schema reload.)
grant usage on schema public to web_anon;

-- 4) Row Level Security on journals ──────────────────────────────────────────
alter table journals enable row level security;
alter table journals force row level security;  -- applies to table owner too

-- Owner-only policy: a row is visible/writable iff its owner == the JWT `sub`.
-- WITH CHECK on insert/update prevents writing rows under someone else's id.
drop policy if exists journals_owner_isolation on journals;
create policy journals_owner_isolation on journals
  for all
  to bujo_user
  using  (owner = (current_setting('request.jwt.claims', true)::json ->> 'sub'))
  with check (owner = (current_setting('request.jwt.claims', true)::json ->> 'sub'));

-- No policy is granted to web_anon, so RLS denies it everything even if a stray
-- grant ever reappears.

-- 5) Future-proof default privileges ─────────────────────────────────────────
-- Don't auto-grant new tables to web_anon; do for bujo_user is left explicit on
-- purpose (each new table opts in via its own GRANT + RLS policy).
alter default privileges in schema public revoke all on tables from web_anon;

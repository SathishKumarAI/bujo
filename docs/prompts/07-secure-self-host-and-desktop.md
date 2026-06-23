# Prompt — Secure the self-host tier & ship a desktop build

> Use when hardening `bujo`'s self-host PostgREST stack (JWT + RLS + TLS),
> wiring the client to it, or scaffolding the Tauri desktop wrapper.
> Captures the BUJO-193/194/195 work so it's repeatable.

## Role

You are a senior full-stack + security engineer working in the existing `bujo`
codebase (Vite + React 19 + TS, local-first; optional self-host stack via Docker:
nginx web + PostgREST API + Postgres + Adminer).

## Context

<stack>
Read docs/security/postgrest-hardening.md and docker-compose.yml. The app pushes a
whole-journal blob to PostgREST `/journals`. Client sync lives in
`src/lib/serverSync.ts` + `src/components/ServerSync.tsx`; settings UI in
`src/views/Settings.tsx`. Conflict/merge logic in `src/lib/conflict.ts`
(`resolveIncoming` / `mergeJournals`).
</stack>

<task>
{{One of: (a) harden the API tier; (b) wire the client to the secured API;
(c) scaffold the desktop app.}}
</task>

## Steps

### (a) Harden the API tier — JWT + RLS + TLS
1. **JWT**: set `PGRST_JWT_SECRET` (required; fail closed). Define a Postgres
   `authenticator` role (NOINHERIT, no grants) and a `bujo_user` role; strip
   `web_anon` of all table grants.
2. **RLS**: `ENABLE` + `FORCE ROW LEVEL SECURITY` on `journals`; add an `owner`
   column defaulted from the JWT `sub` (un-spoofable); policy `owner = jwt.sub`.
   Backfill legacy rows `owner = id`. Ship as `docker/02-security.sql` (runs after
   the schema via initdb name-ordering; idempotent for hand-apply).
3. **TLS**: terminate HTTPS at an nginx `api-proxy` (`docker/api-nginx.conf`);
   301-redirect HTTP, send HSTS, cap body size, forward `Authorization`.
   Self-signed locally, real cert in prod. Stop publishing Postgres/PostgREST
   ports directly; bind db/adminer to `127.0.0.1`.
4. Document threat model + apply steps + a `curl` smoke test. Verify live:
   anon write → 401, authed write → 201, cross-owner read isolation, HTTP → 301.

### (b) Wire the client (no `src/store.tsx`/`src/App.tsx` edits)
1. Config in `settings.selfHostUrl` + `settings.selfHostToken` (a pasted HS256
   JWT with `role=bujo_user`, `sub=<deviceId>`). Add a `serverConfigured()` guard.
2. `pushJournalToServer`: POST upsert `{ id, data, updated_at }` (NO `owner` —
   the DB sets it), headers `Authorization: Bearer <token>` + `Prefer:
   resolution=merge-duplicates`.
3. `pullJournalFromServer`: `GET /journals?id=eq.<deviceId>&select=data`; 401/403/
   empty/network-error → `null` (fail closed = keep local).
4. `ServerSync.tsx`: pull-on-mount → `migrate()` → `resolveIncoming(local, remote)`
   (unions non-conflicting items) → `replaceAll`.

### (c) Desktop (Tauri v2)
1. Scaffold `src-tauri/` (Cargo.toml, tauri.conf.json with `frontendDist:../dist`,
   `beforeBuildCommand: npm run build`, capabilities/default.json, build.rs,
   src/main.rs+lib.rs). Add `tauri:dev`/`tauri:build` npm scripts.
2. Document prerequisites (Linux webkit2gtk/libsoup deps → a sudo `.sh`), icon
   generation (`npx @tauri-apps/cli icon`), and the future storage-adapter plan
   (browser storage today → SQLite + git-sync behind a `StorageAdapter`).

## Guardrails

- MUST NOT publish DB/PostgREST ports unauthenticated; the API MUST refuse to
  start without `PGRST_JWT_SECRET`.
- MUST keep sync **fail-closed**: any auth/network error keeps local data.
- MUST run `npx tsc -b` + `npx vitest run` + `npm run build` before done.
- MUST NOT commit `.env` or `docker/certs/` (add to `.gitignore`).

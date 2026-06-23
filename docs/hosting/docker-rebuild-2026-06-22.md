# Docker rebuild — why it was needed (2026-06-22)

The running `bujo-web` container served a **stale image** (built before today's
work) and was `unhealthy`; a plain `docker compose up` also failed. Two distinct
root causes, both side-effects of work landed earlier today.

## 1. Stale web image → needed `--build`
`docker-compose.yml`'s `web` service builds from source via the multi-stage
`Dockerfile` (`COPY . . && npm run build`). The container kept running its old
image, so none of today's changes (Chrome-style light theme, per-addiction
streaks, in-place session editing) were served. Fix: `docker compose up -d --build web`
rebuilds the image from current source.

## 2. Compose refused to parse → needed a `.env`
The **BUJO-193 hardening** made `PGRST_JWT_SECRET` a *required, fail-closed*
variable in compose (`${PGRST_JWT_SECRET:?...}`). Compose interpolates the whole
file at parse time, so with **no `.env` present** every `docker compose` command
errored before doing anything — including an unrelated `up web`.
Fix: a gitignored `.env` (see `.env.example`):
```
POSTGRES_PASSWORD=bujo
PGRST_JWT_SECRET=<any value, ≥32 chars for HS256; throwaway locally>
```
For production, generate a real secret: `openssl rand -base64 48`.

## 3. `npm ci` failed inside the build → needed a lockfile sync
The **BUJO-195 Tauri scaffold** added `@tauri-apps/cli` to `package.json`
devDependencies but intentionally did **not** run `npm install`, so
`package-lock.json` was out of sync. The Dockerfile uses `npm ci`, which aborts
on any lock/manifest mismatch. Fix: `npm install --package-lock-only` regenerated
the lockfile (no `node_modules` download), after which `npm ci` matched and the
image built.

## Result
`bujo-web` (:8080), `bujo-db` (:5432, 127.0.0.1), `bujo-adminer` (:8081) up; web
serves the fresh build (verified light-theme tokens `#f8f9fa`/`#202124` in the
emitted CSS). The hardened API tier (`bujo-api` + `bujo-api-proxy` on :8443) is a
separate concern — it still wants real certs in `docker/certs/` + a real
`PGRST_JWT_SECRET` per `docs/security/postgrest-hardening.md`.

## Editing records
- App UI: **http://localhost:8080** (now current).
- DB GUI: **http://localhost:8081** (Adminer) — System PostgreSQL, Server `db`,
  user/pass/db `bujo`/`bujo`/`bujo`.
- Direct: `docker exec -it bujo-db psql -U bujo -d bujo`.

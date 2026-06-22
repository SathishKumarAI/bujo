# PostgREST API hardening — JWT + RLS + TLS (BUJO-193)

The self-host stack exposes the whole-journal blob store (`journals` table) over
PostgREST. Before this ticket the tier was **unsecured**: the `web_anon` role had
full read/write on `journals` and any client could read or overwrite any row.
BUJO-193 closes that: **JWT-gated writes, per-owner Row Level Security, and TLS
in front of PostgREST.**

> Client wiring (sending the `Authorization: Bearer …` header from the app) is a
> separate ticket, **BUJO-194**. This doc covers the server/infra side only.

## What's now enforced

| Layer | Before | After |
|---|---|---|
| **Auth** | `web_anon` had `select/insert/update` on `journals` | `web_anon` has **zero** table grants. Writes require a JWT claiming `role=bujo_user`. No secret ⇒ stack refuses to start (fails closed). |
| **Isolation (RLS)** | none — one flat table, any id readable | RLS **forced** on `journals`; `journals_owner_isolation` policy: a row is visible/writable iff `owner == jwt.sub`. `owner` defaults from the verified token, so it can't be spoofed. |
| **Transport** | PostgREST plain HTTP on `:3000`, published to host | PostgREST only on the compose network; `api-proxy` (nginx) terminates **TLS on :8443** and 301-redirects HTTP→HTTPS. |
| **DB / adminer exposure** | `5432` and adminer published on all interfaces | bound to `127.0.0.1`; prod note: don't publish at all. |

## Threat model

| Threat | Mitigation |
|---|---|
| Anonymous internet client reads/writes journals | Anon role stripped of all grants; PostgREST returns 401 without a valid JWT. |
| Authenticated user reads/overwrites **another** user's journal | RLS `USING`/`WITH CHECK` on `owner = jwt.sub`; `FORCE ROW LEVEL SECURITY` so even the table owner is subject to it. |
| Client forges an `owner` to plant a row under someone else | `owner` column DEFAULTs from `request.jwt.claims->>'sub'`; `WITH CHECK` rejects any insert/update whose `owner` ≠ token `sub`. |
| Forged / tampered JWT | HS256 signature verified by PostgREST against `PGRST_JWT_SECRET`. |
| Token sniffed on the wire | TLS termination at `api-proxy` + HSTS; HTTP redirected to HTTPS. |
| DB reached directly, bypassing PostgREST | `5432` bound to localhost only; `authenticator` is `NOINHERIT` and has no table grants of its own. |
| Adminer used as an unauthenticated DB path | Bound to localhost; doc says remove it in prod. |

## Roles

- **`authenticator`** — the login role PostgREST connects as. `NOINHERIT`; can
  only *switch into* the role named by the JWT `role` claim. No table grants.
- **`web_anon`** — `PGRST_DB_ANON_ROLE`, used for unauthenticated requests.
  Keeps `USAGE` on the schema (for PostgREST introspection) and **nothing else**.
- **`bujo_user`** — the authenticated app role. A valid JWT must carry
  `{"role":"bujo_user","sub":"<owner-id>"}`. RLS scopes all rows to that `sub`.

## The JWT

PostgREST verifies an **HS256** JWT signed with `PGRST_JWT_SECRET`. Required claims:

```json
{ "role": "bujo_user", "sub": "<stable per-user/per-device id>" }
```

- `role` → the Postgres role PostgREST switches into (`bujo_user`).
- `sub`  → the row owner. Use the app's stable id (today `serverSync.ts`'s
  `deviceId()`; with accounts, the user id). The token's `sub` becomes the
  `owner` of every row that token writes, and the only rows it can read.

Where the token comes from (pick one):
- **Helper/mint endpoint** — a tiny signer (your auth server) issues HS256 tokens
  with the shared secret. Recommended for multi-user.
- **Supabase-style** — if you front this with Supabase Auth, reuse its HS256
  `JWT secret` as `PGRST_JWT_SECRET` and pass the Supabase access token.
- **Local single-user** — mint one long-lived token by hand (example below).

### Set the secret

```bash
# 32+ chars. Put it in .env (see .env.example).
openssl rand -base64 48
```

```dotenv
# .env
PGRST_JWT_SECRET=<paste the generated value>
```

An empty/unset secret makes `docker compose up` fail fast — the API never comes
up unauthenticated.

### Mint a token by hand (local testing)

```bash
SECRET="<your PGRST_JWT_SECRET>"
python3 - "$SECRET" "my-device-id" <<'PY'
import sys, hmac, hashlib, base64, json
b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b'=').decode()
secret, sub = sys.argv[1], sys.argv[2]
h = b64(json.dumps({"alg":"HS256","typ":"JWT"}).encode())
p = b64(json.dumps({"role":"bujo_user","sub":sub}).encode())
sig = b64(hmac.new(secret.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest())
print(f"{h}.{p}.{sig}")
PY
```

(For production, add an `exp` claim and re-mint on expiry.)

## TLS

PostgREST speaks plain HTTP; the `api-proxy` nginx terminates TLS.

### Local (self-signed)

```bash
mkdir -p docker/certs
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout docker/certs/api.key -out docker/certs/api.crt \
  -subj "/CN=localhost"
```

The API is then at `https://localhost:8443` (accept the self-signed cert). HTTP
on `:8480` 301-redirects to HTTPS.

### Production

Replace `docker/certs/api.{crt,key}` with a real cert (certbot/Let's Encrypt or
your load balancer's cert), or terminate TLS at an upstream LB and point it at
`api-proxy`. HSTS is already sent.

## Apply

### Fresh stack (recommended)

`02-security.sql` runs automatically after `01-schema.sql` on first boot
(docker-entrypoint-initdb.d, name order).

```bash
cp .env.example .env            # then fill PGRST_JWT_SECRET + POSTGRES_PASSWORD
mkdir -p docker/certs && \
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout docker/certs/api.key -out docker/certs/api.crt -subj "/CN=localhost"
docker compose down -v          # WARNING: -v wipes the db volume (initdb only runs on an empty volume)
docker compose up -d
```

### Existing stack (db volume already has data)

`initdb` scripts only run on an empty volume, so apply the migration by hand —
it's idempotent:

```bash
docker cp docker/02-security.sql bujo-db:/tmp/02-security.sql
docker exec bujo-db psql -U bujo -d bujo -v ON_ERROR_STOP=1 -f /tmp/02-security.sql
# then bring up the proxy + restart the API with the secret set in .env
docker compose up -d api api-proxy
```

> Backfill note: the migration sets `owner = id` for any pre-existing rows, so a
> legacy single-device row stays reachable by a token whose `sub` equals that id.

## Verify

```bash
SECRET="<your secret>"; TOK="<minted token, sub=alice>"
API="https://localhost:8443/journals"   # add -k for the self-signed cert

# anon → 401
curl -k -o /dev/null -w '%{http_code}\n' -X POST "$API" \
  -H 'Content-Type: application/json' -d '{"id":"x","data":{}}'

# authenticated upsert → 201
curl -k -o /dev/null -w '%{http_code}\n' -X POST "$API" \
  -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
  -H 'Prefer: resolution=merge-duplicates' \
  -d '{"id":"my-device-id","data":{"hello":"world"}}'

# read back — only this owner's rows
curl -k "$API?select=id,owner" -H "Authorization: Bearer $TOK"
```

A second token with a different `sub` will read `[]` for the first owner's rows —
that's RLS isolation working.

## What the client must send (for BUJO-194)

Every request to `/journals` must include:

```
Authorization: Bearer <HS256 JWT with role=bujo_user, sub=<deviceId/userId>>
```

- Use HTTPS (`https://…:8443`, or your prod API origin).
- Do **not** send an `owner` field in the body — the DB sets it from the token.
- Upserts keep using `Prefer: resolution=merge-duplicates` on `POST /journals`.

## Residual notes

- Single shared `PGRST_JWT_SECRET` (HS256). For stronger key separation use RS256
  with `PGRST_JWT_SECRET` pointing at a JWKS — out of scope here.
- Tokens minted by hand have no `exp`; add expiry + rotation for production.
- `PGRST_CORS_ORIGINS=*` is dev-only; pin to your app origin in prod (`.env`).

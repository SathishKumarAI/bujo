# Security & Privacy

`bujo` is **local-first** and has **no backend, no accounts, and no analytics**.
This document states the threat model, what data exists, and the guarantees.

## Data inventory

| Data | Where it lives | Sensitivity |
|---|---|---|
| All journal content (entries, metrics, gratitude, memories, workouts, cycle, nofap, settings) | `localStorage` key `bujo:data` (this browser only) | High — personal |
| Uploaded photos | inside the same `bujo:data` blob as downscaled JPEG data-URLs | High |
| "Notified today" flag | `localStorage` key `bujo:notified:<date>` | None |

Nothing is transmitted to any server owned by this project — there is no server.

## Threat model

| Threat | Exposure | Mitigation |
|---|---|---|
| Network interception | None — app is static; no API calls except opt-in weather | Weather/geocode are opt-in and off by default; everything else is offline |
| Server breach | N/A — no server, no database | Local-first architecture |
| Shared/again-used device | Another user of the same OS account + browser profile can open the app and read everything | Planned: passcode + client-side encryption (v2). Today: use an OS user account / private profile for privacy |
| XSS injecting a script that reads `localStorage` | Low — no `dangerouslySetInnerHTML`, no `eval`, all rendering via React text nodes | Keep dependencies patched; never render untrusted HTML |
| Malicious import file | A crafted JSON/ICS could inject odd data, not code | `migrate()` merges onto a clean default; ICS/JSON are parsed as data, never executed |
| Browser clears storage | Data loss (not disclosure) | One-click JSON/Markdown export + backup nudge |

## Third-party network calls (all opt-in, off by default)

Enabled only when the user turns on **Auto-log weather & location** in Settings:

| Endpoint | Purpose | Data sent |
|---|---|---|
| `api.open-meteo.com` | Current weather | latitude/longitude only |
| `api.bigdatacloud.net` reverse-geocode | City label for the month | latitude/longitude only |
| `fonts.googleapis.com` / `fonts.gstatic.com` | Web fonts | standard font request (no journal data) |

No journal content is ever sent. Geolocation requires explicit browser permission.

## Secure-coding practices

- No `eval`, `Function`, or `dangerouslySetInnerHTML`.
- No secrets in the repo (there are none to keep — no backend).
- Images are re-encoded through a `<canvas>` (strips original EXIF/GPS metadata).
- Dependencies are minimal and pinned in `package.json`; run `npm audit` in CI.

## Verifying Row Level Security, without two Google accounts

RLS is the only thing making the account feature multi-tenant. A policy nobody
has tried **from the other side** is a policy nobody has tested — so this is
the procedure, and the result of running it on 2026-10-09.

The obstacle is that the obvious test needs two real Google accounts. It does
not: **two anonymous sign-ins are two distinct `auth.uid()`s**, which is
exactly what the policies separate on. Anonymous sign-in is a legitimate
testing tool — it is just not something to leave switched on.

### The procedure

1. Supabase → Authentication → Providers → **Anonymous sign-ins → on**.
2. `POST /auth/v1/signup` twice with an empty body and the publishable key.
   Each returns an `access_token` and a distinct user id. Assert they differ.
3. Run the seven calls below with those two bearer tokens.
4. Authentication → **Users**, delete every user with no email address. The
   `journals` rows go with them: `id` is
   `references auth.users (id) on delete cascade`, so this is **one step, not
   two** — do not bother deleting rows by hand.
5. Providers → **Anonymous sign-ins → off**. In that order: turning it off
   first does not remove the users already created.

### What must happen, and what did

| # | As | Action | Required | 2026-10-09 |
|---|---|---|---|---|
| 1 | A | insert its own row | succeeds, `owner` filled from the JWT | **201**, owner = A |
| 2 | B | `select` the whole table | sees nothing | **`[]`** |
| 3 | B | select A's row by id | sees nothing | **`[]`** |
| 4 | B | `patch` A's row | changes nothing | **`[]`**, 0 rows |
| 5 | B | insert claiming `owner: A` | refused | **403** `42501 new row violates row-level security policy` |
| 6 | B | `delete` A's row | deletes nothing | **`[]`**, 0 rows |
| 7 | A | re-read its own row | unchanged | **unchanged** |

Step 7 is the one that matters: after B attempted to read, overwrite, spoof and
delete, A's data was byte-identical. Step 1 proves `owner default auth.uid()`
holds — a client cannot write a row it does not own, because the server fills
that column from the token rather than trusting the payload.

### A note on cleanup, which is itself a result

An agent holding only the publishable key **cannot tidy up after this test**:
a fresh session reads the table as empty, a mass `delete` returns 204 having
removed zero rows, and `/auth/v1/admin/users` answers `403 not_admin`. If
cleanup were possible from that key, the test above would have failed. The
inability is the proof.


## Roadmap (v2)

- **Passcode lock** on app open.
- **Client-side encryption** of the `bujo:data` blob with a key derived from a
  passphrase (Web Crypto, AES-GCM) — so even cloud sync (if added) stores only
  ciphertext. See `docs/prompts/02-add-login-and-sync.md`.

## Reporting

Found an issue? Open a GitHub issue (no sensitive data) or email the maintainer.

## Incident response & breach notification (GDPR Art. 33)

bujo is **local-first and minimizes what could ever be breached**: by design the
maintainer holds no readable user data. Data lives on the user's device, in the
user's own Google Drive, or — for the optional cloud — as an **E2E-encrypted blob**
whose key never leaves the device. A server/database compromise therefore exposes
ciphertext, not journal contents.

Procedure if a security incident is suspected:

1. **Detect & assess (0–2h).** Classify severity. Confirm whether any *readable*
   personal data was exposed (for E2E/BYO storage, normally no — only ciphertext or
   per-user-isolated rows protected by Supabase RLS).
2. **Contain.** Rotate affected secrets (Supabase keys, `GITHUB_TOKEN`), revoke
   sessions, disable the affected path. Preserve logs as evidence.
3. **Eradicate & verify.** Patch the root cause; re-run the security audit
   (`security_scanner` / `vulnerability_assessor` must return exit 0) before redeploy.
4. **Notify (≤72h).** If readable personal data of EU users was exposed, notify the
   relevant supervisory authority within 72 hours of becoming aware, and inform
   affected users without undue delay (Art. 33/34). E2E/BYO architecture is expected
   to keep most incidents out of this category.
5. **Post-incident.** Document the timeline + root cause; add a preventive control.

**Report a vulnerability:** open a GitHub issue (or use the in-app feedback widget)
marked security; for sensitive reports, contact the maintainer directly rather than
filing publicly.

**User data rights (Art. 17/20):** users can export their full journal (JSON/CSV) at
any time and delete it locally or from their chosen storage — ownership is exit-able.

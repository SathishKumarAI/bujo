# Security & Privacy

`bujo` is **local-first** and has **no analytics**. It has optional accounts
(2026-09-27) and several optional sync targets, and the rule that governs all
of them is one sentence: **anything that leaves this device leaves encrypted,
with a key the receiving server never has.**

This document states the threat model, what data exists, and the guarantees.
See [`AUTH.md`](AUTH.md) for what an account is and is not.

## Data inventory

| Data | Where it lives | Sensitivity |
|---|---|---|
| All journal content (entries, metrics, gratitude, memories, workouts, cycle, nofap, settings) | `localStorage` key `bujo:data` — **canonical**, this browser only | High — personal |
| The same, when a passcode is set | `localStorage` key `bujo:enc`, AES-GCM-256 ciphertext; `bujo:data` is removed | High, at rest encrypted |
| Uploaded photos | IndexedDB `bujo-images`, as downscaled JPEG data-URLs. The journal holds `img:` ids | High |
| Sync encryption key | IndexedDB `bujo-keys`, as a **non-extractable** `CryptoKey`. Cannot be exported or copied out | Key material, unexfiltratable |
| Blob sync locator | `localStorage` key `bujo:sync-code`. Non-secret — it is the path every request already sends | Low |
| Supabase session (only when an account is used) | `localStorage` key `sb-<ref>-auth-token`, a JWT + refresh token | Grants access to **ciphertext**, not to the journal |
| Device id | `localStorage` key `bujo:device-id` | None |
| "Notified today" flag | `localStorage` key `bujo:notified:<date>` | None |

**Retired 2026-09-27: `localStorage['bujo:sync']`, which held the sync
passphrase in plaintext beside the ciphertext it opens** (F-8). It is migrated
to the non-extractable key above on first load and then deleted. See
[`AUTH.md`](AUTH.md#auto-sync-used-to-hand-over-the-cloud-copy-in-plaintext).

Nothing readable is transmitted anywhere. Every sync target — the Vercel blob,
a Supabase row, a folder, Drive, a gist, a self-hosted PostgREST — receives
either ciphertext or a file the user chose the location of.

## Threat model

| Threat | Exposure | Mitigation |
|---|---|---|
| Network interception | None — app is static; no API calls except opt-in weather | Weather/geocode are opt-in and off by default; everything else is offline |
| Server breach (Vercel blob, Supabase) | **Ciphertext only.** The key is derived in the browser with PBKDF2 150 000 rounds and never transmitted in any form | E2E encryption + Supabase row-level security scoped to `auth.uid()` (`supabase/migrations/0001_journals_e2ee.sql`). A breach also exposes email addresses and ciphertext *lengths* — stated rather than denied |
| A second user of the same journal's row | Someone who guessed or was given your passphrase could read the blob path's copy; there is no identity there to separate them | Accounts address a row by `auth.uid()` instead of by a hash of the passphrase, so the locator is no longer a function of the secret |
| Shared/reused device | Another user of the same OS account + browser profile can open the app and read everything | **Passcode lock** (Settings → Sync & privacy) encrypts the journal at rest. Note: with auto-sync on, a usable key is kept here too — see the qualifier in `AUTH.md` |
| XSS injecting a script that reads `localStorage` | Low — no `dangerouslySetInnerHTML`, no `eval`, all rendering via React text nodes. **A script on this origin can still use the stored sync key to decrypt.** It cannot export or exfiltrate it | Keep dependencies patched; never render untrusted HTML. Non-extractable key stops the secret *leaving*, not its use — a browser cannot keep a secret from code running in it |
| A stolen browser profile / storage dump | Yields ciphertext plus a key bound to that profile's IndexedDB | Was a journal in cleartext before F-8 was fixed |
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
- **No secrets in the repo.** Supabase configuration is read from
  `import.meta.env.VITE_SUPABASE_*` only; `.env*` is gitignored with a single
  exception for `.env.example`, which holds placeholders. The **anon** key is
  the only key that may ever be compiled into the client — it is public by
  design, and RLS is what actually restricts access. `src/lib/auth.contract.test.ts`
  fails the build if a project URL, or the string `service_role`, appears in `src/`.
- Images are re-encoded through a `<canvas>` (strips original EXIF/GPS metadata).
- Dependencies are minimal and pinned in `package.json`; run `npm audit` in CI.

## Shipped since this page first said "roadmap"

- **Passcode lock** on app open — done.
- **Client-side encryption** of the journal with a PBKDF2-derived key — done,
  and it is what every sync target now sends.
- **The sync key out of plaintext** — done 2026-09-27 (F-8).

Still open, deliberately: photo bytes over the network paths are bounded by a
2.8 MB budget (F-1); the unbounded answer is blob-per-photo. See
[`DATA-STORE-DECISION.md`](DATA-STORE-DECISION.md) §8.

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

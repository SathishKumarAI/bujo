# Auth & data-security design — guest + Google, secure by page

Status: **design / "think and tell"** (BUJO-152). Not yet implemented.
Lens: treat the journal as sensitive personal data (mood, cycle, NoFap, health) —
assume the threat model of a privacy app, not a todo list.

## TL;DR

Most of the hard security is **already in place** — keep it, don't rebuild it:

- Supabase **Row-Level Security** scopes every row to `auth.uid()` (`docs/supabase.sql`).
  A user can only ever read/write their own `journals` row. This is the core control.
- **Anonymous guest** sessions already exist (`signInGuest` → `signInAnonymously`).
- **Local client-side encryption** already exists (`src/lib/crypto.ts`: PBKDF2 →
  AES-GCM, passcode never leaves device).

The ask resolves to **three** concrete additions, not a rewrite:

1. Add **Google OAuth** as a sign-in provider (alongside guest + email).
2. Formalize the **two-tier model**: _guest = local-first / view & try_, _signed-in =
   durable encrypted cloud storage_, with a lossless **guest → Google upgrade**.
3. Apply a **hardening checklist** (CSP, token handling, optional end-to-end cloud
   encryption, sensitive-page gating).

## Two-tier model

| Tier | Identity | Where data lives | Guarantee |
|------|----------|------------------|-----------|
| **Guest** | Supabase anonymous session (or no session at all) | `localStorage` on this device; optional passcode encryption | "Just start", view & try. Data is device-bound; clearing the browser loses it. No cross-device. |
| **Signed in (Google / email)** | Supabase user (`auth.uid()`) | `journals` row in Postgres, RLS-scoped; mirrored to `localStorage` for offline | Durable, multi-device, per-user isolated. Optional E2E so even the server can't read it. |

Local-first stays the default: the app works fully offline as a guest; signing in
**upgrades** persistence rather than gating the UI.

### Guest → Google upgrade (must be lossless)

Supabase supports promoting an anonymous user in place. The flow:

1. Guest has an anonymous session + a local journal.
2. User taps "Sign in with Google" → `linkIdentity({ provider: 'google' })` (links the
   OAuth identity to the **same** `auth.uid()`, so the anonymous id is preserved).
3. On success, push the local journal to the now-permanent user's row.
4. If linking fails because that Google account already exists (a returning user),
   fall back to `signInWithOAuth` and **merge**: pull the existing cloud journal and
   reconcile against local using the existing `resolveIncoming` conflict logic
   (BUJO-146) — never silently overwrite either side.

> Edge case to handle explicitly: a returning Google user signing in on a device that
> has guest data. Use `resolveIncoming(local, remote)` so the newer side wins and the
> user is prompted on a real conflict.

## Auth wiring (Supabase + Google)

Net-new code is small:

- **Supabase dashboard:** Authentication → Providers → **Google** (on). Create a Google
  Cloud OAuth client; set authorized redirect to the Supabase callback
  (`https://<ref>.supabase.co/auth/v1/callback`) and the app origin(s).
- **`src/lib/supabase.ts`:** add
  - `signInGoogle()` → `auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`
  - `linkGoogle()` → `auth.linkIdentity({ provider: 'google' })` for the guest-upgrade path.
- **UI:** a "Continue with Google" button in `Welcome` and `AccountMenu` (the gate
  already distinguishes guest vs signed-in).
- **Secrets:** Google client secret lives only in the Supabase project, never in the
  bundle. The app only ever holds the public anon key (safe by design — RLS enforces
  access, not the key).

## Threat model (STRIDE-lite) and mitigations

| Threat | Vector | Mitigation |
|--------|--------|------------|
| **Data at rest, server-side** | Supabase/Postgres breach or admin access reads `journals.data` | Offer **optional end-to-end encryption**: reuse `crypto.ts` to encrypt the blob client-side before `pushJournal`, store ciphertext in `data`. Server (and a stolen DB) sees only ciphertext. Trade-off: lose server-side search and password-reset of the *data* key (key is user-held). Make it opt-in, clearly labelled. |
| **Data at rest, device** | Shared/stolen device reads `localStorage` | Existing passcode encryption (`setPasscode` → AES-GCM). Encourage it for sensitive views; auto-lock on idle (future). |
| **Token theft / XSS** | Script injection steals the Supabase session (it lives in `localStorage`) | Strict **CSP** (no inline/eval, pinned origins), keep deps lean, sanitize any user-rendered HTML (the app renders markdown-ish text — verify no `dangerouslySetInnerHTML` on untrusted input). Short-lived access tokens + refresh rotation are Supabase defaults. |
| **RLS bypass / IDOR** | Crafted requests for another user's row | Already mitigated: all policies are `auth.uid() = user_id`. **Add a CI check / test** that the table has RLS enabled and no permissive policy regressed. |
| **Feedback endpoint abuse** | `/api/feedback` is public → spam/issue flooding | Already: honeypot + per-IP rate limit + input caps. Upgrade path: durable rate limit (Upstash) + optional Turnstile if abused. |
| **Blob path guessing** (bujocloud) | Unguessable-path + E2E model | Keep E2E; document that bujocloud security rests on (1) unguessable path and (2) ciphertext — never store plaintext there. |
| **MITM** | Network interception | HTTPS only (Vercel default + HSTS); no mixed content. |
| **OAuth-specific** | Open redirect, CSRF on callback, account pre-takeover via link | Pin `redirectTo` to known origins (allowlist in Supabase); rely on Supabase's PKCE flow; on `linkIdentity` collision, require the user to actually authenticate the existing account before merge (no silent claim). |

## "Per-page data handled securely"

All views read one `JournalData` object, so security is **central**, not per-page —
which is good (one control plane). Page-level nuances:

- **Sensitive views** (Cycle, NoFap, health metrics) are already settings-gated. Add an
  optional **per-app lock** (passcode/biometric via WebAuthn later) that covers the whole
  journal, since the data is one blob.
- **Export/share** paths (CSV export, "Share app", feedback meta) must never include the
  full journal unless the user explicitly exports. Audit that feedback `meta` carries
  only `url`/`version`/`ua` (it does) — no entry content.
- **Demo/guest data** must never sync to a real account by accident — gate `pushJournal`
  on a non-anonymous, non-demo session.

## Recommendation & sequencing

1. **Google OAuth** (provider + `signInGoogle`/`linkGoogle` + buttons) — small, high value.
2. **Lossless guest→Google upgrade** using `linkIdentity` + `resolveIncoming` merge.
3. **CSP + RLS regression test** — cheap, high leverage.
4. **Opt-in end-to-end cloud encryption** (reuse `crypto.ts`) — the biggest privacy win;
   ship behind a clear toggle because it disables server-side recovery of data.
5. Later: idle auto-lock, WebAuthn unlock, durable feedback rate limiting.

Both logins stay available: **guest for view/try, Google (or email) for secure storage** —
exactly the split requested, with the upgrade path making the boundary seamless.

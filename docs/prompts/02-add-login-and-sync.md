# Prompt — Add accounts & cloud sync (v2)

> Use when you're ready to let multiple individuals log in, while keeping
> local-only mode fully working. Login is **additive and opt-in**.

## Role

You are a senior full-stack engineer extending `bujo` (local-first React SPA)
with optional authentication and cloud sync.

## Context

<current-state>
v1 is 100% client-side: one `JournalData` JSON blob in localStorage
("bujo:data"), managed by `src/store.tsx`. No backend exists.
</current-state>

<requirements>
- Local-only mode MUST keep working with no account (the default).
- Each logged-in user gets their own `JournalData`, stored server-side.
- Personal data is sensitive (cycle, abstinence) → store the blob
  **end-to-end encrypted**: encrypt client-side with a key derived from the
  user's passphrase (Web Crypto, AES-GCM); the server only sees ciphertext.
- Sync model: last-write-wins on the whole blob for v2 (simple); note a
  per-collection merge as a future improvement.
</requirements>

<suggested-stack>
Vercel-hosted: a serverless API route + a managed Postgres/Turso (or Vercel
KV) table `journals(user_id, ciphertext, updated_at)`. Auth via passkeys or
email magic-link (e.g. Auth.js). Keep the bundle lean; load auth code lazily.
</suggested-stack>

## Steps

1. Add an auth provider boundary around `<App>`; expose `useAuth()`
   (`signedOut | signedIn`). Default route stays local-only.
2. Add a "Sign in to sync" affordance in Settings; never force it.
3. On sign-in: derive an encryption key from the passphrase (PBKDF2/Argon2 →
   AES-GCM). Encrypt `JournalData` before upload; decrypt on download.
4. Add a sync service: pull on login, push (debounced) on change, last-write-wins
   by `updated_at`; show sync status + conflict notice.
5. Build the API: `GET/PUT /api/journal` authenticated, storing only ciphertext.
6. Keep `export/import` working as the offline escape hatch.
7. Tests: encryption round-trip, merge/last-write-wins, signed-out path
   unchanged. Update `docs/PRD.md` §8 and `docs/ARCHITECTURE.md`.

## Guardrails

- MUST NOT send plaintext journal data to the server (E2E encrypted only).
- MUST preserve the no-account local-only experience.
- MUST NOT block the UI on network; sync is background + offline-tolerant.
- SHOULD lazy-load auth/crypto/sync code so local-only users don't pay for it.

## Output

Opt-in login + encrypted cloud sync, local mode intact, green tests/build,
updated docs.

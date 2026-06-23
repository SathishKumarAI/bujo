# 🔌 Backend view

bujo has **no required backend**. "Backend" here means the optional, opt-in sync
adapters and the two thin serverless functions — all designed so the server sees
as little as possible.

## Serverless functions (Vercel, `api/`)
| Route | Runtime | Sees | Notes |
|---|---|---|---|
| `api/sync.ts` | nodejs | **ciphertext only** | E2E sync to Vercel Blob. Client sends a `code` (hash of a secret passphrase, not the passphrase) + an already-AES-GCM-encrypted payload. Stored at `sync/<code>.json`. Security = unguessable path + E2E crypto. Validates `code` `^[a-f0-9]{16,128}$`, caps payload 8 MB. |
| `api/feedback.ts` | nodejs | feedback text | Appends user feedback to Blob. |

## Sync adapters (client → backend), all opt-in
Chosen via `settings.storageMode` / explicit toggles:

| Adapter | Lib | Backend | Auth | Encryption |
|---|---|---|---|---|
| **Supabase account** | `lib/supabase.ts` | Supabase Postgres `journals` table | email / guest / Google (OAuth) | RLS (row per `user_id`) |
| **Cloud folder** | `lib/fscloud.ts` | your Drive/Dropbox/OneDrive folder | File System Access API | your cloud's |
| **E2E blob sync** | `lib/bujocloud.ts` → `api/sync` | Vercel Blob | passphrase hash | AES-GCM E2E |
| **GitHub gist** | `lib/github.ts` | gist | PAT (gist scope) | — |
| **Self-host** | `lib/serverSync.ts` | your PostgREST | JWT | your call |

## Supabase auth (`lib/supabase.ts`)
- Client created only when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are
  set (anon key is public by design — ships in the bundle). Else the app is
  fully local and the Account page says "not configured".
- Methods: `signInGuest` (anonymous), `signUpEmail` / `signInEmail`,
  `signInGoogle` (links to the guest user if one exists), `signOut`,
  `resetPassword` / `updatePassword`, `onPasswordRecovery`, `onAuthChange`.
- Email + guest are **enabled**; **Google provider is disabled** until configured
  (`../auth/google-oauth-setup.md`). `providerEnabled('google')` hides the button
  until then.
- **Journals table:** `pullJournal` / `pushJournal` upsert one row per user;
  `subscribeJournal` gives realtime multi-device updates. RLS restricts rows to
  the owner. Conflict resolution: pull-before-push, adopt the newer `updatedAt`.

## Auth gate (App.tsx)
Signed-out + on the `account` view ⇒ render full-screen (no shell) so the login
page can't reach other views. Gate lifts for **any** session (guest or real);
local-first users have explicit escapes. See sequence in [uml.md](uml.md).

## Security boundaries
- Server never holds plaintext journals (blob path = ciphertext; Supabase =
  the user's own RLS-scoped row).
- Strict CSP, HSTS, COOP/CORP, no-sniff, framing denied (`vercel.json`).
- At-rest passcode encryption (AES-GCM, `lib/crypto.ts`) for the local copy.
- Full model in [`../SECURITY.md`](../SECURITY.md).

## Deploy
Not Git-connected; ship via `scripts/ship.sh` (prebuilt `--prod` + re-alias).
`VITE_SUPABASE_*` live in the Production env and are **sensitive** → ship.sh
re-injects them before the build or login breaks. See [`../PIPELINE.md`](../PIPELINE.md).

# Accounts, Google sign-in, and an encrypted journal in Supabase

The plan for COD-271. Requested directly and repeatedly: *"create an account,
use Gmail, access the data from mobile and desktop, like a SaaS application"*,
and *"something which we need to securely save this data… let the user know
what security practices we have practised."*

This reverses a decision. [`AUTH.md`](../AUTH.md) says the app has no accounts
and `src/lib/auth.contract.test.ts` fails the build on any attempt to add one.
Both change here, deliberately and in the same work — a mechanism that
contradicts its own documentation is worse than either alone.

## 0. The shape, in one paragraph

**Google says who you are. A passphrase says what the data means.** Sign-in
picks your row; the journal is encrypted in your browser with a key derived from
a passphrase that is never transmitted, and Supabase stores ciphertext. Local
storage stays the primary copy and the app keeps working with no network and no
account, exactly as today.

The decision that shaped it was taken explicitly, over the simpler alternative:

| | Plaintext JSONB + RLS | **Encrypted blob + RLS (chosen)** |
|---|---|---|
| Sign in on a new device | data is simply there | prompted for the passphrase |
| Server can read the journal | **yes** | no — `{v, salt, iv, data}` only |
| Lose the passphrase | nothing to lose | **data unreadable, permanently** |
| Breach of the database | every journal readable | ciphertext |

This journal carries mood, recovery and addiction logs. That is why the second
column won.

## 1. The promise, and the two places it is NOT true

Everything below is a claim the code has to keep, and the UI has to state. The
honest half matters more than the strong half.

**What is protected**

| Property | Mechanism |
|---|---|
| The server cannot read your journal | AES-GCM-256, key from PBKDF2-HMAC-SHA256 at **600 000 rounds**, 16-byte random salt and 12-byte random IV **per write** |
| The key never leaves the device | Derived in the browser from the passphrase; neither is ever sent |
| Another account cannot read your row | Postgres RLS, `force`d, four separate policies; `owner` defaults from the verified JWT so a client cannot spoof it |
| An unauthenticated request gets nothing | No grants to `anon` at all — refused before RLS is consulted |
| Your cycle log never leaves the device | `forEgress` strips it from **every** network path, unconditionally, enforced by `egress.contract.test.ts` |
| Your other services' tokens never travel | the same `forEgress` strips `githubToken`, `selfHostToken`, `googleClientId` |
| In transit | TLS to Supabase |

**What is not protected, and must be said on screen**

- **A lost passphrase is a lost journal.** The account still works, the row is
  still yours, and it is permanently unreadable. This is the single most
  important sentence in the feature, because *account* normally implies *I can
  always get back in* — here it means *I can always get back to my ciphertext*.
- **Auto-sync keeps the passphrase in `localStorage` in plaintext** (COD-228).
  Anyone who can read that storage can read the cloud copy. Already disclosed
  for passphrase sync; the same disclosure applies here and must not be dropped
  because an account makes it feel more official.
- **Google knows you use this app.** Sign-in is an OAuth round trip; that is
  inherent, not a flaw, and it is the privacy cost of the convenience asked for.
- **Metadata is not encrypted.** Row id, account id and `updated_at` are
  plaintext by necessity — the server has to route and order writes. Someone
  with database access learns *that* you wrote, and when, never *what*.

## 2. The edge cases, which are the actual work

Listed because the failure modes here are data loss, and most of them are
invisible rather than loud.

### The dangerous ones

| # | Case | What must happen |
|---|---|---|
| 1 | **Wrong passphrase, then a push** | The push must be **refused**. Decrypt failure means "this row is not mine to overwrite" — pushing a fresh encryption would destroy a journal that is intact and merely unreadable *by this device*. A single `canPush` latch, false until a pull has succeeded or the row is known empty. |
| 2 | **Two devices, two different passphrases, one account** | Device B cannot read A's blob. Same latch as 1: B refuses to push rather than clobbering A. The UI says "this account's journal was encrypted with a different passphrase", not "wrong passphrase". |
| 3 | **Switching accounts on one device** | Must **not** merge the previous user's journal into the new one. This exact bug shipped before (COD-135). On a user id change: drop the in-memory journal, do not push, pull the new account's row fresh. |
| 4 | **Signed in while the demo is loaded** | Never push demo data to a real account. Guard on `settings.demoSeeded`; sync stays off until the demo is cleared, and says why. |
| 5 | **Token expires mid-push** | `autoRefreshToken` handles the common case; a 401 retries **once** after a refresh, then surfaces an error rather than silently dropping the write. |
| 6 | **Passphrase changed** | Re-encrypt the whole journal and replace the row in one write. Any device still holding the old passphrase then hits case 2 and refuses to push — correct, and it needs the message from case 2 to be comprehensible. |

### The ordinary ones

| # | Case | What must happen |
|---|---|---|
| 7 | First sign-in, empty row | Push local. No prompt, no conflict. |
| 8 | Sign out | Keep the local journal, drop the session and the cached passphrase. Signing out must never look like deleting. |
| 9 | Offline | Local save is unaffected; the push retries on the next change. No queue — the whole journal is the payload, so the next push is the queue. |
| 10 | Both sides changed | `resolveIncoming` + `mergeJournals`, the path every other sync target already uses. Remote newer → union, never clobber. Local newer → ask. |
| 11 | Clock skew | `updated_at` is set by a Postgres trigger, not by the client, so the ordering the merge depends on is the server's. |
| 12 | Journal larger than the request allows | `inlineImagesWithinBudget`, as the other paths do: the journal syncs, photos stay behind, reported as `photos-skipped`. |
| 13 | Unconfigured build | No `VITE_SUPABASE_URL`/`ANON_KEY` → the feature is **absent**, not broken. No client constructed, nothing rendered. The repo is public; a sign-in button that throws on click is a worse first run than none. |
| 14 | Row exists but is not a blob this version understands | Throw and say so. Never "treat it as empty", which is one push away from overwriting it. |

## 3. Increments

Each is a branch, a PR, and a squash-merge into `main`.

| # | Branch | What | Shippable alone? |
|---|---|---|---|
| 1 | `docs/account-sync-plan` | this page | yes |
| 2 | `feat/supabase-client` | `lib/supabase.ts`, `supabase/schema.sql`, env plumbing, the `auth.contract.test.ts` rewrite, `AUTH.md` + `PRODUCT_GAPS.md` | yes — absent without env, changes nothing |
| 3 | `feat/account-sign-in` | one sign-in surface, session in the header, sign-out | yes |
| 4 | `feat/account-sync` | pull on sign-in, debounced push, the six dangerous cases above, status | yes |
| 5 | `feat/security-disclosure` | the §1 table on screen, both halves | yes |

**One sign-in surface, not three.** Before removal this app had the same auth
form copied into Account, Welcome and Settings, plus two more direct call sites
that bypassed the shared hook — and the removal had to be a tree-wide sweep
because of it. The rewritten contract test enforces the count this time.

## 4. What the contract test becomes

It does not get deleted. It currently asserts the *absence* of auth; it will
assert the *shape* of it, which is the same instrument pointed at the thing now
worth protecting:

- exactly **one** module may import `@supabase/supabase-js`
- exactly **one** component may render a sign-in control
- no path may send a journal that did not pass through `forEgress`
  (`egress.contract.test.ts` already enforces this and will cover the new path
  for free — a new `lib` module typing a `JournalData` and calling out fails its
  inventory tripwire until it is classified)
- the words `AUTH.md` bans stay banned where they are still true

## 5. Setup, which only the owner can do

1. Create a Supabase project. Copy **Project URL** and **anon key**.
2. SQL Editor → paste [`supabase/schema.sql`](../../supabase/schema.sql) → Run.
3. Authentication → Providers → Google → enable, with a Google OAuth client ID
   and secret from Google Cloud Console.
4. Authentication → URL Configuration → add the site URL and
   `https://<site>/**` as a redirect.
5. Put `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` locally,
   and in the Vercel project's environment variables for the deploy.

The anon key is publishable by design — it is in the client bundle, and RLS is
what makes that safe. The **service role** key must never appear in this repo.

## 6. Verification each increment owes

`npm run verify` on every branch, plus:

| Increment | The check that fails if the logic is wrong |
|---|---|
| 2 | unconfigured build renders nothing and constructs no client; schema applies twice without error |
| 3 | one import, one sign-in surface — asserted by the contract test |
| 4 | each of cases 1–6 driven deliberately, especially **1 and 3**: wrong passphrase must not overwrite, and switching accounts must not merge |
| 5 | the disclosure says the unrecoverable half, not only the strong half |

And once, by hand against the real project: **sign in as a second account and
confirm it cannot read the first account's row.** RLS is the control that makes
multi-tenant safe, and a policy nobody has tried from the other side is a policy
nobody has tested.

## See also

- [`../AUTH.md`](../AUTH.md) — what each secret is; its words table changes with increment 2
- [`sync-hardening-plan.md`](sync-hardening-plan.md) — §0 is the decision this reverses, and why it stood until now
- [`postgrest-hardening.md`](postgrest-hardening.md) — the same RLS shape on the self-host tier
- `src/lib/cyclePrivacy.ts` — the egress boundary this path is bound by

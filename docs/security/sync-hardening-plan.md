# Sync hardening — the egress boundary, the blob store, and the KDF

Audit of every path the journal takes off this device, written 2026-10-05 after
a request to "add Supabase sign-in and background sync". The answer to that
request is in §0; the rest of the page is the work the audit actually found.

Four phases, each its own branch and PR, in this order. Phase 1 is a data-loss
bug and ships first.

| Phase | Branch | What | Ticket |
|---|---|---|---|
| 0 | — | Supabase: decided against, recorded | — |
| 1 | `fix/sync-egress-boundary` | One egress function, one pull guard, a contract test that finds the next gap | COD-265 |
| 2 | `fix/sync-blob-recovery` | Version history + honest errors on `/api/sync` | COD-266 |
| 3 | `fix/sync-kdf-hardening` | PBKDF2 600k, a derived path code, out of the query string | COD-267 |

## 0. Supabase sign-in: not being built

The request was email/password sign-in with the journal syncing to Supabase in
the background. It is not being done, and this section is here so the question
does not get re-asked without the reasons attached.

| Fact | Where |
|---|---|
| Accounts were removed on purpose, 2026-09-11 | [`../AUTH.md`](../AUTH.md) § "Why accounts were removed" |
| `@supabase/supabase-js`, `lib/supabase.ts`, `lib/legacyAccount.ts` all deleted | not in `package.json`, not on disk |
| The project does not resolve | `ueahhgqxshfvkjgcwtnh.supabase.co` → NXDOMAIN, measured 2026-08-02 and again 2026-09-15 |
| Re-adding it fails a test | `src/lib/auth.contract.test.ts` — 4 assertions, **zero exceptions**, green at `f186152` |

The contract test fails the build on any import of `lib/supabase` or
`@supabase/supabase-js`, on `signInEmail` / `signInGoogle` / `useAuthForm` and
friends, and on any input carrying `autoComplete="email|username|current-password|new-password"`.
So this is not a gap to fill; it is a decision with a guard on it.

**What sign-in would actually buy.** Nothing the passphrase does not already do.
Cross-device sync works today without anyone learning who the user is. An email
address, by contrast, makes the project a data controller, obliges a privacy
policy and a deletion path, and — because the journal must stay client-side
encrypted — would still not let the server do anything useful with the data.
A login screen over an encrypted blob is a login screen for its own sake.

**If it is ever wanted anyway**, the honest shape is: Supabase Auth, RLS
`auth.uid() = owner`, the journal column still `encryptString`-ed client-side,
`onAuthStateChange` feeding the existing `resolveIncoming` merge, and
`auth.contract.test.ts` rewritten rather than exempted. Plus the copy: `AUTH.md`
bans the words "sign in" for this app, and `docs/PRODUCT_GAPS.md` commits to
Path A. Both change first, in the same PR. That is a product reversal across
roughly six surfaces, not an integration — which is why it is §0 and not a phase.

Dead config to delete while passing: `.env.local` still carries
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Nothing reads them. The file
is gitignored (`.gitignore:34`), so this is a local edit with no commit.

## 1. The egress boundary is written four times and missing from four paths

This is the phase that matters. `lib/cyclePrivacy.ts` says, in its own header:

> Cycle data is **excluded from every network path, unconditionally**.

It is not. And its other half — `mergePulled`, the rule that *withheld is not
deleted* — is reached only through `resolveIncoming`, which four of the app's
seven pull sites never call.

### Measured: every push path

`forNetwork` has three call sites. There are four network destinations.

| Push site | Destination | `forNetwork`? | Secrets stripped? |
|---|---|---|---|
| `bujocloud.pushCloud` | `/api/sync` (encrypted) | yes | **no** |
| `serverSync.pushJournalToServer` | PostgREST (plaintext) | yes | **no** |
| `CloudStorage.tsx:66` → `pushGist` | GitHub gist (plaintext) | yes | **no** |
| `DriveSync.tsx:43` → `pushData` | Google Drive (plaintext) | **no** | **no** |
| `fscloud.saveToFolder` | a local folder | n/a, deliberately exempt | n/a |

So **Google Drive uploads the cycle log**, and the page that collects it says
"It is never uploaded, synced, or sent to us or anyone else". `cyclePrivacy.ts`'s
own table does not list Drive at all — the doc was written before that path
existed and nothing re-read it. Exactly the shape of the "an audit keyed on a
prop misses the feature it feeds" trap in `CLAUDE.md`: `forNetwork` was audited
by grepping its own name, which cannot find a destination that never called it.

Second, smaller leak on the same paths: no push strips sync secrets. `csv.ts`
already has `stripSyncSecrets` (`selfHostToken`, `githubToken`, `googleClientId`,
`googleEmail`, …) and all five **export** sites call it; no **sync** site does.
So a GitHub PAT is written into the gist it authenticates to, and posted in
cleartext to a self-hosted Postgres row. Two people sharing one sync passphrase —
a supported scenario per `AUTH.md` — also share each other's tokens.

### Measured: every pull path

`resolveIncoming` → `mergePulled` is the guard. Four sites skip it and call
`replaceAll(migrate(remote))` raw.

| Pull site | Source | Guarded? | Effect on the cycle log |
|---|---|---|---|
| `App.tsx:84` | bujocloud auto | yes | safe |
| `App.tsx:163` | folder auto | yes | safe |
| `ServerSync.tsx:40,55` | PostgREST auto | yes | safe |
| `CloudSyncCard.tsx:50` | **bujocloud manual Pull** | **no** | **erased, every time** |
| `SelfHostCard.tsx:33` | PostgREST manual Load | **no** | **erased** |
| `CloudStorage.tsx:86` | gist restore | **no** | **erased** |
| `DriveSync.tsx:63` | Drive restore | **no** | erased once §1 strips Drive |
| `CloudStorage.tsx:34`, `Welcome.tsx:36` | folder restore | no | safe — the folder copy keeps its cycle data |

The first of those is the worst, and it is not an edge case. Push strips cycle,
so the cloud blob *always* holds `cycle: []`. Press **Pull** in Settings → Sync
and the most sensitive log in the app is replaced by an empty array, with no
prompt naming it and no way back. The confirm dialog says "Everything currently
on this device is overwritten by the encrypted copy stored in the cloud" — true,
and the user cannot know that "everything" includes a log the cloud was never
allowed to hold.

`conflict.ts` says "Every pull path in the app funnels through this function".
That comment is false for four sites. Per `CLAUDE.md`: when a comment and the
code disagree, find out which is lying — here it is the comment, and the fix is
to make it true rather than to soften it.

### The fix

One function, because four call sites each remembering two rules is how this
happened:

```ts
// lib/cyclePrivacy.ts — the single thing a network push may send.
export function forEgress<T extends JournalData>(data: T): T {
  return stripSyncSecrets(forNetwork(data))
}
```

- Every push site calls `forEgress`. `fscloud` stays exempt and says why.
- Every pull site routes through `resolveIncoming` (auto paths, already) or at
  minimum `mergePulled` (the four explicit *replace* buttons — the user asked
  for a replace, so keep that, but a remote that was never allowed to carry the
  cycle log cannot be read as having deleted it).
- The three "Replace my data" dialogs gain one clause: the cycle log stays,
  because it was never uploaded. A dialog that overstates what it destroys is
  the same defect as one that understates it.
- Verify `stripSyncSecrets` on push cannot break a round trip: `mergeJournals`
  spreads `{...loserSettings, ...winnerSettings}`, and a key absent from the
  winner keeps the loser's value, so a local token survives a pull of a payload
  that omits it. Assert that in a test rather than reasoning about it.

### The lasting half: a contract test

Both halves of this were found by reading, and both were invisible to every
gate. The repo already has the right instrument for "assert the absence of a
mistake across a whole tree" — `auth.contract.test.ts` — so copy its shape:

`src/lib/egress.contract.test.ts` globs the source, finds every call that sends
a journal to a network destination, and asserts the argument passes through
`forEgress`; and finds every `replaceAll(migrate(` and asserts the argument
passed through `mergePulled` or `resolveIncoming`. A new sync target that
forgets either then fails a test instead of shipping.

This is the deliverable that outlives the patch. The one-line `forEgress(data)`
fixes Drive; the contract test fixes the next Drive.

## 2. The blob store cannot recover from a bad write

`api/sync.ts` is unauthenticated by design — security is the unguessable path
plus end-to-end encryption, and that reasoning holds for *reads*. For writes it
does not: `put(..., { allowOverwrite: true })` with no history means one POST
replaces the journal permanently.

| Property | Now | After |
|---|---|---|
| Overwrite | unconditional, in place | previous blob copied to `sync/<code>/v<ts>.json` first, last 3 kept |
| Recovery from a bad/hostile write | none | pull a prior version |
| 500 body | `(e as Error).message` — leaks internals | generic string, detail to the server log |

**Deliberately not doing compare-and-swap.** A `prev`-hash check would turn a
concurrent overwrite into a 409, but both clients already pull-before-push, and
CAS stops no attacker — anyone who can write can first read the hash. The
unrecoverable part is destruction, so history is the fix and CAS is the ceiling:
`// ponytail: history, not CAS — add a prev-hash 409 if two devices ever race hard enough to lose a write`.

Also still true and still fine: no rate limit. Guessing a 40-hex path is not a
thing a rate limit meaningfully changes, and `AUTH.md` already says sync is not
a backup.

## 3. The path code is the cheapest attack on the passphrase

The sharpest finding. One passphrase does two jobs, and they are stretched very
differently:

| Derived | How | Cost per guess |
|---|---|---|
| The AES key | PBKDF2-HMAC-SHA256, 150 000 rounds, random salt | ~150 000 hashes |
| The storage path | `SHA-256('bujo-sync:' + passphrase)`, unsalted, once | **1 hash** |

So an attacker who learns one path code recovers the passphrase ~150 000× faster
than by attacking the ciphertext — unsalted single SHA-256 is GPU work measured
in billions of guesses per second. And path codes are the half that *leaves the
device*: `GET /api/sync?code=…` puts it in a query string, so it lands in
serverless access logs, CDN logs, browser history and `Referer` headers. One
leaked log line plus a weak passphrase is the whole journal.

The key's own 150 000 rounds is separately below current guidance (OWASP: 600 000
for PBKDF2-HMAC-SHA256).

### The fix, and the migration it needs

1. **`crypto.ts`: 150k → 600k, versioned.** `EncryptedBlob.v` becomes `1 | 2`.
   `decryptString` picks rounds from `v` so every existing blob still opens;
   `encryptString` only ever writes `v: 2`. Migration is lazy — the next push or
   the next passcode save rewrites at v2, no upgrade step.

2. **Derive the path code too.** `deriveCode(passphrase)` = PBKDF2 at 600 000
   rounds with a fixed context salt, hex, 40 chars. The salt must be fixed — the
   server has to find the blob without knowing the passphrase, and that is
   inherent to a no-accounts design — but fixed-salt-at-600k is still 600 000×
   the work of a bare SHA-256, and it is the ceiling worth writing down rather
   than the defect worth hiding.

3. **Move the code out of the URL.** Send `x-sync-code` on the GET. Keep reading
   `?code=` for one release so a cached old bundle does not break, with a comment
   naming the release that drops it.

4. **Migrate the read path.** A journal already in the cloud sits at its old
   SHA-256 path. `pullCloud` tries the new code, falls back to the old one; on a
   successful old-path pull it re-encrypts to the new path. Without this
   fallback, everyone who synced before the release is told "nothing stored for
   that passphrase yet" and handed a fresh empty blob — which from the chair is
   indistinguishable from their journal having been deleted.

   **Changed during implementation: the old blob is NOT deleted.** This section
   first said to delete it via a new `DELETE /api/sync`, on the reasoning that
   leaving it keeps a full copy reachable from the weak derivation. That
   reasoning does not survive contact: the weak code is derivable from the
   passphrase *whether or not a blob answers at it*, so an attacker holding a
   leaked v1 code can attack the passphrase offline with no ciphertext at all —
   deletion removes a stale copy, not the exposure. Against that, an
   unauthenticated DELETE is strictly more destructive power than the overwrite
   §2 had just finished making recoverable. The remedy for a suspected leak is a
   new passphrase, which is already a new code and a new blob. Consequence worth
   stating: the v1 blob stays decryptable by the OLD passphrase forever, so
   rotating is not erasing.

Note for phase 3's own sake: the arithmetic above also fits a world where the
path code was never leaked, and then none of it matters. The fix is cheap, the
measurement is not available, and a secret that travels in a query string should
be assumed logged.

**Cost, measured before picking 600 000** (`crypto.subtle.deriveKey`, median of
5 on this machine): 150k → **15.0 ms**, 300k → **30.1 ms**, 600k → **59.3 ms**.
Linear. Two derivations happen per sync — the key and the path code — so the
naive bump would be ~120 ms per 4-second push cycle; the path code is memoised
per passphrase in `bujocloud`, which makes it ~59 ms once per session plus
~44 ms extra per push, inside a debounce. Worth the number being here: "raise
the rounds" is the kind of advice that is repeated without anyone checking
whether the hot path can afford it.

## What is not in this plan

- **`bujo:sync` holds the passphrase in plaintext**, which defeats the passcode
  lock. Already known, already filed as **COD-228**, already disclosed in
  `AUTH.md` and warned about on screen in `CloudSyncCard`. It is a surfaced
  trade-off (auto-sync cannot run unattended without the secret), not a hidden
  bug, and changing it is a product decision. Untouched here.
- **Rate limiting `/api/sync`** — see §2.
- **Compare-and-swap** — see §2.
- **Two devices never converging on the self-host path** (`COD-136`) and **four
  copies of the pull-then-push dance** (`COD-137`). Both real, both pre-existing,
  neither a security property. §1's `forEgress` makes the eventual
  de-duplication easier by removing one of the two rules each copy has to
  remember.

## Verification, per phase

`npm run verify` (`tsc -b` → `vitest run` → `eslint .` → `vite build`) on every
branch, output quoted in the PR. Note `npx tsc --noEmit` typechecks nothing in
this repo — the root config is solution-style.

Phase-specific, because a green suite is not evidence that a sync path works:

| Phase | The check that would fail if the logic broke |
|---|---|
| 1 | `egress.contract.test.ts` (the sweep) + a unit test that a pull of a cycle-less payload leaves the local log intact, per path |
| 2 | A unit test over the handler's version bookkeeping; a real POST/GET round trip against the deployed function |
| 3 | A v1 blob still decrypts after the bump; old-path → new-path migration round-trips; `deriveCode` is stable across calls and differs from the old `pathCode` |

The browser gates (`a11y`, `smoke`, `clipped`, `space`) are unaffected by
phases 2 and 3. Phase 1 touches three dialogs' copy, so `a11y` runs on it —
backgrounded, per `CLAUDE.md`.

## See also

- [`../AUTH.md`](../AUTH.md) — what each secret is, and the words this app will not use
- [`../diagrams/storage-and-sync.md`](../diagrams/storage-and-sync.md) — every write path with its crypto parameters
- [`postgrest-hardening.md`](postgrest-hardening.md) — the self-host tier's JWT/RLS/TLS model
- [`auth-and-data-security.md`](auth-and-data-security.md)
- `src/lib/cyclePrivacy.ts` — the egress boundary itself

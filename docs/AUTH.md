# Accounts, identity and sync

**bujo has one account, and it is not what an account usually means.** As of
COD-271 there is a Google sign-in, and a per-account row in Supabase holding
your journal — **as ciphertext**. The server knows who you are and cannot read
what you wrote.

That distinction is the whole page. The words the industry uses for these things
(*account*, *sign in*, *secure*, *backed up*) all imply a server that holds your
data and can give it back to you; here the server holds your data and **cannot**
give it back to you without a passphrase it has never seen.

> **The account is recoverable. The journal is not.** Lose the passphrase and
> you can still sign in, your row is still there, and it is permanently
> unreadable. Say this wherever sign-in is offered — it is the single sentence
> most likely to be assumed the other way.

Everything below still applies: the local profile, the sync passphrase and the
passcode lock are unchanged, and the app works with no account at all.

## The three things people mean by "my account"

| What you want | What does it in bujo | What it is **not** |
|---|---|---|
| The app knowing my name | **Local profile** — `settings.profile`, a name and an emoji | Not authentication. Nothing is verified. |
| My journal on two devices | **Sync passphrase** — `lib/bujocloud.ts` | Not an account. A shared secret, not a login. |
| Nobody else reading my journal | **Passcode lock** — `lib/crypto.ts`, Settings → Sync & privacy | Not the profile. The name protects nothing. |

They are independent. You can have any, all, or none. The common mistake — the
one this page exists to prevent — is assuming the first implies the third.

## Local profile

A name and an emoji, stored in the journal like any other setting and saved to
the same `localStorage` key as your entries.

**It is identity, not authentication.** There is no password because there is
nothing to check a password against. A password stored beside the data it claims
to guard is theatre: anyone who can read one can read the other. So the profile
is exactly what it looks like — a label, so the app can greet you and so a
shared export says whose journal it is.

Anyone holding your unlocked device can read it, change it, or delete it. If
that matters, the passcode lock is the control that actually addresses it.

## Sync passphrase

```mermaid
flowchart LR
  pass([Your passphrase]) --> key["PBKDF2 600 000 rounds<br/>random salt<br/>→ AES-GCM 256 key"]
  pass --> path["PBKDF2 600 000 rounds<br/>fixed context salt<br/>→ 40 hex chars"]
  journal[JournalData] --> enc["encrypt in this browser"]
  key --> enc
  enc --> blob[("Vercel Blob — ciphertext only")]
  path --> blob
```

One passphrase does two jobs: it derives the key, which never leaves your
device, and it derives the *path*, which does. The server stores ciphertext at a
location it cannot invert back into the passphrase.

**Both jobs are now stretched the same amount, and that is the point.** Until
COD-267 the key was PBKDF2 at 150 000 rounds while the path was a *single
unsalted SHA-256* of the same passphrase — so the cheapest attack on the
passphrase was never against the ciphertext, it was against the path code, by a
factor of 150 000. And the path code is the half that leaves the device: it
travelled in a query string, into serverless access logs, CDN logs, browser
history and `Referer` headers. It is an `x-sync-code` header now.

The path's salt is a fixed context string and has to be — the server must find
the blob knowing only what the client sends, and there is no account to hang a
per-user salt on. That is the real ceiling of a no-accounts design, written down
rather than hidden.

Four consequences, all of them worth knowing before you turn it on:

- **Anyone with the passphrase has the journal.** There is no per-person
  identity to separate two people who know it — they read and write the same
  blob. A leaked passphrase is a leaked journal, and there is no revocation.
- **A lost passphrase cannot be recovered.** By construction, not as an
  oversight. There is no reset, and building one would mean the server holding
  something that could decrypt your data.
- **It is sync, not backup.** One live blob per passphrase, overwritten in
  place. It now keeps the **three previous payloads** (COD-266) — because the
  endpoint is unauthenticated by design, so before that a single POST destroyed
  a journal permanently, and "sync is not a backup" was a statement about
  version history rather than a licence to have none. Three ten-minute-apart
  snapshots is a recovery path, not a backup: there is no UI for it, and reading
  one is a `curl` (see below). Keep real backups — Settings → Data → export.
- **Photos may not travel.** Vercel caps a request body at 4.5 MB; over that the
  journal syncs and the images stay behind, reported as `photos-skipped`.

Other sync targets — a folder you pick, a private GitHub gist, Google Drive, a
self-hosted PostgREST stack — work the same way as far as identity goes: they
authenticate to *that service*, never to bujo. See
[`diagrams/storage-and-sync.md`](diagrams/storage-and-sync.md).

## Passcode lock

The only control here that restricts access to the journal on this device.
PBKDF2 → AES-GCM over the whole journal at rest, so `localStorage` holds
ciphertext (`bujo:enc`) instead of plaintext (`bujo:data`). Web Crypto,
entirely local, nothing transmitted.

Same rule as the passphrase: **no recovery.** It is the honest cost of the key
never leaving your device.

### Auto-sync used to defeat it. Fixed — COD-228

**This section has been wrong twice, in opposite directions, so read the dates.**
It first claimed the passcode was "the only control that actually restricts
access" with no qualifier, which the code did not honour. It was then corrected
to say auto-sync defeats the lock, which was true. As of COD-228 it no longer
does, and here is the mechanism rather than a reassurance.

The hole was not merely a key in the clear. The sync passphrase is also what
encrypts the **cloud** copy at `/api/sync`, and the storage path is *derived*
from it. So `bujo:sync` in plaintext meant anyone holding the locked device
could derive the path, download the blob and decrypt it — obtaining a
byte-identical copy of the journal the passcode was protecting, without ever
attacking the passcode. Measured at the time:

```
bujo:enc    {"v":1,"salt":"R6+Ar…      103,399 characters of ciphertext
bujo:sync   correct-horse-battery      the key to an identical remote copy
```

`lib/syncSecret.ts` is now the only thing that decides where that passphrase
may live:

| passcode set | where it lives |
|---|---|
| no | `bujo:sync`, plaintext. Unchanged, and correct — the journal is plaintext too, so sealing its key would be theatre. |
| yes | `bujo:sync.enc`, encrypted **under the passcode**, plus an in-memory copy that dies with the tab. |

In-memory means a module variable, not `sessionStorage`: the latter survives a
reload and is readable by any script on the origin, which is most of what this
stops.

Setting a passcode **re-seals** an existing plaintext key, and clearing one
unseals it. Without that the fix would only ever have protected new users, and
the plaintext key would have sat there untouched on every existing install.

**The cost, which is the honest half:** auto-sync does not run while the
journal is locked. That is the feature being truthful rather than a regression
— a journal you have locked should not be shipping itself anywhere until you
unlock it. `CloudSyncCard` now says that at the switch instead of asking you to
accept a plaintext key.

**Push and Pull by hand still store nothing.**

### Recovering an earlier cloud payload

There is deliberately no button for this. The history exists so a destroyed
journal is recoverable at all, not as a feature — and a version picker over
ciphertext is a real piece of UI that nobody has asked for. The passphrase's
path code is what addresses the blob, so recovery is:

```sh
# what can be recovered, newest first
curl -s 'https://<your-deploy>/api/sync?code=<path-code>&versions=1'
# one earlier payload — the same shape the normal pull reads
curl -s 'https://<your-deploy>/api/sync?code=<path-code>&v=<timestamp>' > old.json
```

The payload is ciphertext; decrypting it needs the passphrase, exactly as a
normal pull does. Snapshots are taken at most every ten minutes and only three
are kept, so this is a window of minutes-to-hours, not an archive.

## Words this app does not use, and why

Copy near any of this has to keep the promise the mechanism makes. These are
banned on purpose:

| Never say | Because |
|---|---|
| "Sign in" / "Log in" for the **local profile** | No credential is checked there, so nothing can fail. It's a name. Google sign-in is a real sign-in and may be called one. |
| "Your data is safe with your account" | The account gets you to the row. Only the passphrase gets you to the journal. Say both halves. |
| "Secure account", "protected", "private account" | The profile secures nothing. The passcode does, and it is a separate setting. |
| "Your account" for the passphrase | `bujocloud` has no accounts. Two people with one passphrase are not two users. |
| "Forgot passphrase?" | There is no reset path and there will not be one. Say it cannot be recovered. |
| "Backed up" for sync state | One live blob and three throwaway snapshots is not a backup. Say "synced". |
| "The passcode protects your journal" with auto-sync on | It protects the copy on this device. `bujo:sync` hands over the cloud copy. Qualify it or do not say it. |

## Why accounts were removed (2026-09-11)

The app previously offered Supabase email+password and Google OAuth, across
**three separate copies of the same form** (Account, Welcome, Settings) plus two
more direct call sites. It was removed, not deprecated:

- **An email address is a liability with no matching benefit here.** Collecting
  one makes the project a data controller, obliges a privacy policy and a
  deletion path, and buys a user nothing that the passphrase does not already
  do — the passphrase syncs across devices without anyone learning who you are.
- **It contradicted the product.** `PRODUCT_GAPS.md` committed to "Path A —
  local-first, bring-your-own-cloud", and explicitly listed accounts-plus-database
  as Path B, not being done. The login screen was Path B's front door, shipped
  anyway, and it was the *first* thing a new user saw.
- **Two mechanisms for one job.** `bujocloud` already did cross-device sync,
  better, with less to trust.

Anyone still signed in when this shipped was offered a one-time migration on
next launch: their cloud journal pulled, merged through the normal conflict path
(never a silent replace), and the session signed out.

**That rescue is gone as of 2026-09-15, and it had already stopped working long
before.** The Supabase project's hostname does not resolve —
`ueahhgqxshfvkjgcwtnh.supabase.co` returns NXDOMAIN, the same as a host that
never existed, and `TASKS.md` recorded the same thing on 2026-08-02, *five weeks
before accounts were even retired*. So `currentUser()` failed at DNS, the rescue
caught that as "nothing to bring across", and every user got the same silent
nothing whether or not they had a journal there.

A carve-out for a path that cannot succeed is not a safety net; it is a hole in
the no-accounts contract that `lib/auth.contract.test.ts` exists to defend. The
client, the rescue and the dependency are deleted, and that test now allows
**zero** exceptions.

**If a journal existed only in that project, it was already unreachable** before
any of this — deleting the client did not cause that, and could not have
prevented it. `settings.legacyAccountChecked` stays in the type as an inert
field: existing journals carry it, and removing a key from `JournalData` is a
one-way-door schema change for no gain.

## See also

- [`diagrams/storage-and-sync.md`](diagrams/storage-and-sync.md) — every write path, with the crypto parameters
- [`PRODUCT_GAPS.md`](PRODUCT_GAPS.md) — Path A vs Path B, and why B is not being built
- [`SECURITY.md`](SECURITY.md)

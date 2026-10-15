# Sync audit and design — one Google sign-in, local and cloud in step

**Goal, in the owner's words:** *"sync the data locally as well as sync the data
to the cloud, both Supabase, using the login credentials from the user, only
once from the Google."*

Audited on `main` at `e34afbd`, 2026-10-14. Every number below carries the
command or `file:line` that produced it. Where something could not be
established it says **UNVERIFIED** and names the one check that would settle it.

---

## 0. The verdict, in one sentence each

| | |
|---|---|
| **Will the stated goal work today?** | **No.** Account sync is dead in production right now: the live `public.journals` table has no `data` column, so every pull errors and `mayPush` refuses forever. Verified by probe, §1.1. |
| **Is the local store still the right one?** | **Yes, but its headroom is gone.** Measured 10-year projection is **4.83 MB** against a measured Chromium cap of **5,177,344 characters**. The previous decision was taken at 2.35 MB / 47%; it is now 97%. Keep localStorage, add a quota guard, and name IndexedDB as the successor with a measured trigger. §1.4, §4.2 |
| **What is the one change that most reduces risk?** | **Make the account path pull-before-push, like every other path already does.** It is the only one of the four **network** writers that pushes blind. §2.1, §5 F-1 |
| **Should `bujo:sync` survive?** | **The module yes; the second concurrent auto-writer no.** Removing the passphrase removes the only E2EE sync and the only account-free sync. Removing the *App.tsx effect that pushes on a timer beside the account push* removes a real divergence. §4.5 |
| **Is anything silently broken?** | **Eight.** Two were found by probing the live system, six by running the code or reading the four push paths side by side. §5 |

---

## 1. What was measured, and with what

### 1.1 The live Supabase project

`public.journals` column set, enumerated through PostgREST's error codes.
PostgREST resolves the `select` list against its schema cache **before** the
privilege check, so a missing column answers `42703` and an existing one you may
not read answers `42501`. That makes an anon key enough to enumerate columns
without reading a single row.

```sh
KEY=$(grep -m1 '^VITE_SUPABASE_ANON_KEY=' .env.local | cut -d= -f2-)
URL=$(grep -m1 '^VITE_SUPABASE_URL=' .env.local | cut -d= -f2-)
for c in id owner data blob updated_at created_at v note salt iv; do
  curl -s "$URL/rest/v1/journals?select=$c&limit=1" \
       -H "apikey: $KEY" -H "Authorization: Bearer $KEY"; echo " <- $c"
done
```

| column asked for | answer | means |
|---|---|---|
| `id` | `42501` permission denied | **exists** |
| `owner` | `42501` | **exists** |
| `blob` | `42501` | **exists** |
| `updated_at` | `42501` | **exists** |
| `created_at` | `42501` | **exists** |
| **`data`** | **`42703` column journals.data does not exist** | **ABSENT** |
| `v` `note` `salt` `iv` `user_id` `journal` `payload` `content` | `42703` | absent (they are JSON keys inside `blob`, not columns) |

So the live shape is `journals(id, owner, blob, updated_at, created_at)` — the
pre-COD-309 shape. `supabase/migrations/2026-10-14-journal-in-the-clear.sql`
**has not been applied**, confirming the lead.

Two more facts from the same probe:

| Claim | Result |
|---|---|
| Project reachable | `GET /auth/v1/settings` → `401` (needs apikey), not DNS failure |
| `anon` is locked out | `select=id` → `42501` *before* RLS is consulted. The `revoke all … from anon` in `schema.sql` is in force |
| A `journals_legacy` table | `PGRST205 Could not find the table 'public.journals_legacy'`. A **dated** `journals_legacy_YYYYMMDD_HHMMSS` from `00-fresh-start.sql` cannot be ruled out this way — **UNVERIFIED**; one `select tablename from pg_tables where tablename like 'journals%'` in the SQL editor settles it |

**The 45-byte row's contents are UNVERIFIED and remain so.** RLS correctly
refuses it to anon and to any account but its owner, which is the system working.
What `select=v` proves is only that `v` is not a *column*; it says nothing about
the JSON inside `blob`. The one query that settles it, run in the dashboard:

```sql
select id, updated_at, pg_column_size(blob) as bytes, jsonb_object_keys(blob)
from public.journals;
```

### 1.2 Production deployment — the stale alias is fixed

`docs/auth/sync-state-and-diagnosis.md` §1a says the live alias serves a build
from 2026-09-27, predating the account feature. **That is no longer true.**

```sh
curl -s https://bujo-journal.vercel.app/ | grep -oE 'assets/[^"]+\.js' | sort -u \
  | while read -r f; do curl -s "https://bujo-journal.vercel.app/$f"; done > prod.js
grep -c 'ueahhgqxshfvkjgcwtnh' prod.js          # -> 1
grep -c 'nothing has been overwritten' prod.js  # -> 1   (UNUSABLE_MESSAGE, COD-309)
grep -c 'x-sync-code' prod.js                   # -> 1
```

`UNUSABLE_MESSAGE` only exists in `src/lib/accountSync.ts:117` as of COD-309, so
production is running a post-COD-309 build with the real project ref baked in.
The live CSP header's `connect-src` is byte-identical to `vercel.json`'s and
includes `https://*.supabase.co wss://*.supabase.co`. **Nothing is wrong with
the deployment.** That row of the fix list in the diagnosis doc is done; update it.

### 1.3 The OAuth redirect allow-list — fixed for production, broken for local

Re-ran the §1b probe (start an `authorize`, then drive the callback with a dummy
error and read the `Location` back):

| asked to return to | actually returned to | verdict |
|---|---|---|
| `https://bujo-journal.vercel.app/` | **itself** | allow-listed — this is the fix landing |
| `http://localhost:5180/` | `https://bujo-journal.vercel.app` | **not allow-listed** |
| `http://localhost:5173/` | `https://bujo-journal.vercel.app` | **not allow-listed** |
| `http://localhost:4173/` | `https://bujo-journal.vercel.app` | **not allow-listed** |
| `http://localhost:3000/` | `https://bujo-journal.vercel.app` | not allow-listed (the old Site URL) |
| `https://example.invalid/` | `https://bujo-journal.vercel.app` | not allow-listed (control) |

The control row is what makes the others readable: everything not on the list is
substituted with the Site URL, and the Site URL is now the Vercel origin.

**So the dashboard half of COD-293 was applied, and it dropped the localhost
entries while doing it.** `docs/AUTH.md` warned about exactly this in bold —
*"**Keep the localhost entries** — they are what makes local development work,
and dropping them is how this gets rediscovered from the other side"* — and this
is that rediscovery. A developer signing in at `localhost:5180` today is sent to
production with the session attached to the wrong origin. §5, F-2.

### 1.4 The local store — size, growth, and the real ceiling

Measured by bundling `src/lib/demo.ts` with esbuild and running it under Node 24
(the same method as the previous audit, so the numbers are comparable).

**One 90-day demo journal: 125,579 bytes across 33 top-level keys.** The
previous audit measured **65,957 bytes across 31 keys**. Per-day density has
**roughly doubled** as domains were added.

| collection | bytes | share |
|---|---|---|
| `workouts` | 25,462 | 20% |
| `habitLog` | 21,736 | 17% |
| `entries` | 14,233 | 11% |
| `habitValues` | 11,733 | 9% |
| `cycle` | 11,003 | 9% |
| `metrics` | 10,807 | 9% |
| `devSessions` | 6,499 | 5% |
| `nofap` | 6,102 | 5% |
| `mindsetPractice` | 3,022 | 2% |
| everything else (24 keys) | 14,982 | 12% |

Splitting fixed-size keys (definitions and preferences) from day-scaled ones:

| | bytes |
|---|---|
| fixed (`settings`, `habits`, `collections`, `recurrences`, `birthdays`, `challenges`, `customGoals`, `mindsetFocus`, `friends`, `books`, `readLinks`, `routines`, `monthly`) | 6,684 |
| day-scaled (everything else) | 118,894 → **1,321 bytes/day** |

**Projection, and the measured cost at each size** (second column from a real
journal built by replicating the day-keyed collections, so the timings are of
actual objects of that size, not extrapolated):

| horizon | projected | measured replica | `JSON.stringify` | `JSON.parse` | ×4 sync effects per keystroke |
|---|---|---|---|---|---|
| 1 year | 0.49 MB | 0.50 MB | 1.1 ms | 1.1 ms | 4 ms |
| 5 years | 2.42 MB | 2.45 MB | 5.4 ms | 5.7 ms | 22 ms |
| **10 years** | **4.83 MB** | **5.03 MB** | **12.3 ms** | 11.7 ms | **49 ms** |

**And the ceiling those numbers run into, measured in a real Chromium** (144.0 →
`Chrome/156.0.8078.4`, fresh profile, Playwright, against `localhost:5180`):

| | value |
|---|---|
| `localStorage` one-key maximum before `QuotaExceededError` | **5,177,344 characters** |
| `navigator.storage.estimate().quota` | **10,737,418,240** (10 GiB) |
| time to `setItem` a 5,000,000-char string | **6.4 ms** |
| time to `getItem` it | 0.2 ms |

Two things follow, and the second is a trap worth writing down:

1. **The 10-year journal does not fit.** 4.83 MB projected against 5.18 MB
   measured is 93%; the replica measurement (5.03 MB) is 97%. Dividing it out:
   `(5,177,344 − 6,684) / 1,321 = 3,914 days = **10.7 years**`. The previous
   decision's own stated trigger — *"the blob exceeds ~4 MB"* — is crossed at
   **year 8.3**.
2. **`navigator.storage.estimate()` cannot be used to check the localStorage
   budget.** It reports 10 GiB because that is the *origin* quota, shared by
   IndexedDB and Cache. `localStorage` has its own hard ~5 MiB cap that
   `estimate()` knows nothing about. Anything built on F-5's suggestion of
   comparing the meter against `estimate()` will read 0.05% right up to the throw.

**Assumptions, stated.** The demo is an *upper bound* on density — every domain
logged nearly every day. A lighter user takes proportionally longer to hit the
wall. What would change the answer: measuring the owner's actual
`localStorage['bujo:data'].length` and dividing by days since
`settings.startedOn`. That is one line in a console and it replaces the whole
projection with a fact.

### 1.5 What the code says

`npx tsc -b` → exit 0.
`npx vitest run src/lib/{accountSync,conflict,egress.contract,account,accountStatus,cyclePrivacy}.test.ts`
→ **6 files, 75 tests, all pass.**

---

## 2. The verified map — every path a journal can take

### 2.1 Auto-writing. All six can be live at once.

| # | Writer | Target | Trigger (`file:line`) | Pull-first? | Conflict rule | `forEgress`? | Failure visible? |
|---|---|---|---|---|---|---|---|
| 1 | `storage.ts:288 save()` | `localStorage['bujo:data']` | `store.tsx:278` effect, every `data` change | n/a | **canonical** | n/a | **Yes** — `emitPersist(false)` → `bujo:persist` → `StorageBanner` |
| 2 | `store.tsx:280 encryptString().then(writeEncrypted)` | `localStorage['bujo:enc']` | same effect, when `passcodeRef.current` is set. Mutually exclusive with #1 | n/a | **canonical** | n/a | **NO** — `.catch(console.error)`, no `emitPersist`. §5 F-4 |
| 3 | `supabase.ts:283 pushAccount` | Supabase `journals.data` | `AccountSync.tsx:107`, **4000 ms** debounce | **NO** | **none on push — blind `upsert`** | yes (`supabase.ts:288`, before image inlining) | Partly — phase `error`, red pill |
| 4 | `bujocloud.ts:72 pushCloud` | `POST /api/sync` (Vercel Blob), E2E encrypted, path = PBKDF2 of passphrase | `App.tsx:106`, **4000 ms** debounce, gated on `getSyncPassphrase()` | **yes** (`App.tsx:110`) | adopt-if-newer → `resolveIncoming` **union** | yes (`bujocloud.ts:82`) | Partly — pill; the debounced push swallows via `catch {}` |
| 5 | `fscloud.ts:111 saveToFolder` | `<picked folder>/bujo.json` | `App.tsx:172`, **1500 ms** debounce, gated on `settings.storageMode === 'folder' && hasFolder()` | **yes** (`App.tsx:174`) | adopt-if-newer → `resolveIncoming` **union** | **no — deliberate** (a folder on this machine is this device; this is how Export backup works) | **No** — `catch { }` |
| 6 | `serverSync.ts:48 pushJournalToServer` | self-host PostgREST `/journals`, row keyed by `deviceId()` | `ServerSync.tsx:54`, **2500 ms** debounce **+ `pagehide` + `visibilitychange` flush** (`ServerSync.tsx:74`) | **yes** (`ServerSync.tsx:55`) | adopt-if-newer → `resolveIncoming` **union** | yes (`serverSync.ts:66`) | **No** — returns `false`, caller ignores |

Four debounce windows: **1500 / 2500 / 4000 / 4000 ms**. Unchanged from the
previous audit's F-7, and now the account path is the fifth thing in the race.

**The single most important row is #3.** `AccountSync.tsx:107-119` is:

```
const id = setTimeout(async () => {
  setAccountStatus({ phase: 'uploading' })
  lastPushed.current = JSON.stringify(latest.current)
  await pushAccount(latest.current)      // <- no pull, no precondition
  markSynced()
}, 4000)
```

Paths 4, 5 and 6 each read the remote and compare `updatedAt` before writing.
Path 3 — the one the owner wants to be *the* path — does not. That is F-6 from
the previous audit, reborn on the new target.

### 2.2 Manual and one-way

| Writer | Target | Trigger | Notes |
|---|---|---|---|
| `gdrive.ts:88 pushData` | Drive `appDataFolder/bujo.json` | button, `DriveSync.tsx` | `forEgress` applied at the **call site** — the module takes `unknown`, so only a source sweep can see the rule. `egress.contract.test.ts` is that sweep |
| `github.ts:20 pushGist` | private gist `bujo.json` | button, `CloudStorage.tsx:62` | same |
| `imageStore.ts putImage` | IndexedDB `bujo-images` | on photo add | photo bytes; the journal holds `img:` ids. Travels inside a push only within `SYNC_INLINE_BUDGET` |
| `fscloud.ts idbPut` | IndexedDB `bujo-fs` | on folder pick | a `FileSystemDirectoryHandle`, not journal data |
| `Settings.tsx` downloads | JSON · redacted JSON · checksummed `.json.txt` · Markdown · ICS · 9 × CSV | buttons | one-way, no write-back |

### 2.3 The satellite keys — the ones nobody counts

| Key | Holds | Cleared by |
|---|---|---|
| `bujo:sync` | the blob-sync passphrase, **plaintext**, when no passcode | the auto-sync toggle (`CloudSyncCard.tsx:113`), `wipe.ts:120`. **Not** by sign-out |
| `bujo:sync.enc` | the same passphrase sealed under the passcode | same |
| `bujo:device-id` | `deviceId()`, the self-host row key | `wipe.ts` prefix sweep |
| `bujo:account.lastSync` | ms epoch of the last account sync | `wipe.ts` prefix sweep |
| `bujo:auth.pending` | the origin a sign-in left from (COD-293 watchdog) | `clearSignInPending()` |
| `bujo:onboarded` | first-run flag | the one entry on `wipe.ts`'s keep-list |
| `bujo.ui.*` | per-device UI state, incl. the Explore-banner dismissal | `wipe.ts` prefix sweep |
| `sb-*` | the Supabase session | `signOut()`, `wipe.ts` prefix sweep |

### 2.4 Dead, unreachable, or currently inert — and how that was established

| Thing | State | How established |
|---|---|---|
| The whole account push/pull path | **Inert in production and locally.** `pullAccount` does `.select('data')` against a table with no `data` column → PostgREST error → `throw` → `afterPull(…, 'unreadable')` → `unusable` → `mayPush` false forever | PostgREST probe §1.1 + `supabase.ts:326` + `accountSync.ts:99` + `accountSync.ts:59` |
| `pullAccount`'s `isEncryptedBlob` refusal (`supabase.ts:333`) | **Unreachable today.** It sits after the `select('data')` that already errors | same |
| The `demo` escape hatch | **No non-destructive exit exists.** All three writers of `explore: false` (`ExploreBanner.tsx:59`, `DemoResetCard.tsx:80`, `DemoResetCard.tsx:161`) call `replaceAll(emptyJournal())` first | `grep -rn "explore: false" src/` — 3 hits, each preceded by the wipe |
| A manual "Sync now" / "Pull" for the account | **Does not exist.** One pull site and one push site, both inside `AccountSync` | `grep -rn "pullAccount\|pushAccount" src/` — 2 call sites |
| `public.journals_legacy` | absent under that exact name | `PGRST205`, §1.1. Dated variants **UNVERIFIED** |
| `/api/sync` (blob sync) | **alive** | `curl` with a 40-hex code → `404`, which is `readAt`'s "nothing stored" answer, not an outage |
| `settings.storageMode === 'drive'` | in the type (`types.ts:752`); `Welcome.tsx` only ever writes `'local'` and `'folder'` | `grep -n storageMode src/views/Welcome.tsx` |

---

## 3. The divergence risks, scenario by scenario

Each row says what the code does **today**, with the citation, and whether that
is right.

### 3.1 Two devices signed into the same account, both open

| | |
|---|---|
| **Today** | Device A pushes its whole journal every 4 s after a change (`AccountSync.tsx:107`). Device B does the same. **Neither pulls**, because the only pull is on an auth event (`AccountSync.tsx:49`). So each push overwrites the other's row content wholesale. |
| **Does it converge?** | Only when one of them next fires an auth event. `onAuthChange` is wired with `(_e, session) => fn(...)` — **the event type is ignored** (`supabase.ts:162`), so `INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED` and `USER_UPDATED` all trigger a full pull + merge. `TOKEN_REFRESHED` fires roughly hourly. So convergence is accidental and roughly hourly. **UNVERIFIED at runtime** — the event list is from `node_modules/@supabase/auth-js/dist/module/lib/types.d.ts:15` at v2.117.2; that these fire in this app was not observed. Two signed-in browsers and a `console.log` in `onAuthChange` settles it. |
| **Where data is actually lost** | An item created on A, pushed, then erased from the row by B's blind push, **and then A's localStorage is cleared or the device is lost**. The item existed in the cloud and no longer does, with no error anywhere. |
| **Right?** | **No.** Every other path guards this. Fix F-1. |

### 3.2 Sign out, then sign in as someone else on the same device

This is the COD-135 catastrophe, and the guard that exists does not cover the
route a user actually takes. Run against the real functions:

```
alice -> bob directly      : discardLocal = true    <- the unit test's case
alice -> sign out -> bob   : discardLocal = false   <- the UI's case
reload, then bob signs in  : discardLocal = false   <- after any reload
```

| | |
|---|---|
| **Today** | `onAccountChange` detects a switch only when `prev.userId !== null && next !== null && they differ` (`accountSync.ts:76`). Sign-out sets `prev.userId = null` (`AccountSync.tsx:50-52`), so the pair `alice → null → bob` is two "first sign-ins". `discardLocal` is false, `resolveIncoming` unions, and **alice's journal is merged into bob's account and pushed there.** |
| **And it is worse after a reload** | `AccountSyncState` is `useState` (`AccountSync.tsx:36`). Nothing persists the last user id — `grep -rn "lastUser\|previousUser" src/` finds nothing; `bujo:account.lastSync` holds only a timestamp. So after any reload there is no `prev.userId` to compare against, ever. |
| **Why the tests are green** | `accountSync.test.ts` asserts each step correctly — "keeps the local journal on sign-out" and "keeps the local journal on a first sign-in" are both right in isolation. The hole is the **composition**, which no test composes. |
| **Right?** | **No.** This is the single worst failure in the audit: it is cross-account data disclosure, not just loss. Fix F-3. |

### 3.3 Offline edits, then reconnect

| | |
|---|---|
| **Today** | Push throws → `catch` sets `lastPushed.current = ''` and phase `error` (`AccountSync.tsx:113-118`). The comment says *"The whole journal is the payload, so the next change IS the retry queue — no queue needed."* |
| **Is that claim true?** | **Half.** The payload really is idempotent — `upsert({ id: user.id, … }, { onConflict: 'id' })` (`supabase.ts:297`) is safe to repeat any number of times, and `lastPushed = ''` guarantees the next change re-pushes. That half survives. |
| **What does not survive** | *"The next change"* may never come. There is no `pagehide` flush, no `online` listener, no persisted dirty flag — `grep -rn "addEventListener('online'\|pagehide" src/` finds them **only in `ServerSync.tsx`**. So: last edit of the session → go offline or close the tab within 4 s → that edit never reaches the cloud, and nothing on screen says so after the pill fades. |
| **And the recovery is a destructive dialog** | On the next load, `pullAccount` returns the older row; `resolveIncoming` sees `l && (!r \|\| l > r)` (`conflict.ts:175`) and **prompts** with `CONFLICT_PROMPT`, styled `destructive: true`, titled *"This device has changes newer than the cloud copy"*. But this is not a conflict — it is one person's own unsynced edit. The dialog's "Use the cloud version" button is the data-losing one, and it is offered on the **common** path. |
| **Right?** | **No, twice.** The queue needs a persisted stamp and two retry triggers; the dialog needs to not fire when there is nothing to choose between. Fixes F-5 and F-6. |

### 3.4 A demo journal

| | |
|---|---|
| **Today** | `isDemo(d)` is `demoSeeded \|\| explore` (`accountSync.ts:105`); `mayPush` refuses (`accountSync.ts:58`); phase `demo` and the card says so (`account.ts` `phaseCopy('demo')`). |
| **Refusing is right** | Sample data must not enter a real account, and `demo` deliberately does not light the red pill. |
| **The trap is still fully live** | `Welcome.tsx:114` sets `{storageMode:'local', explore:true}` and `generateDemoData()` sets `demoSeeded = true` (`demo.ts:1310`). **Every** way to clear those flags wipes the journal first (§2.4). `ExploreBanner` *can be dismissed*, persisted to `bujo.ui.explore.banner`, after which the only remaining statement that nothing is syncing is one row on one card in Settings. |
| **Right?** | **No.** A journal that began as "just looking" and became real cannot be made syncable without being destroyed. That is a hard blocker on the goal for exactly the users most likely to have taken that path. Fix F-7. |

### 3.5 A passcode-locked device

| | |
|---|---|
| **Today** | `store.tsx` returns `<LockScreen>` *instead of* `children` while locked, and `AccountSync` is mounted inside `AppShell` (`AppShell.tsx:224`), which is inside `App`, which is inside that gate. So **nothing syncs while locked.** `initAuth()` in `main.tsx` fixes the *auth return* through that gate (COD-295); it does not and cannot make the sync run. |
| **Right?** | **Yes, by accident, and the accident should be made deliberate.** `docs/AUTH.md` argues the behaviour is correct ("a journal you have locked should not be shipping itself anywhere"). It is now enforced by component mount position rather than by a check, which means any future refactor that hoists `AccountSync` above the gate silently reverses a privacy decision. One line in `mayPush` would pin it. |
| **The real passcode problem is local, not remote** | See §5 F-4 and F-5: for a passcode user the canonical write is unreported on failure, 1.37× larger, and racy. |

### 3.6 A failed push mid-change

| | |
|---|---|
| **Today** | `lastPushed.current` is set **before** the `await` (`AccountSync.tsx:110`) and reset to `''` in the `catch`. So a push that half-happens (server wrote, response lost) leaves `lastPushed = ''`, and the next change re-sends the whole blob to an idempotent upsert. |
| **Right?** | **Yes.** This is the one part of the account path that is designed correctly for at-least-once delivery, and it is correct *because* the payload is the whole journal keyed on a stable id. Keep that property; it is what makes F-5's one-value outbox sufficient instead of a real queue. |

### 3.7 Two writers of the same bytes, with an account signed in

| | |
|---|---|
| **Today** | Nothing makes the sync targets mutually exclusive. A user with the blob-sync passphrase set **and** signed in has `App.tsx:102` pushing to `/api/sync` on a 4000 ms timer and `AccountSync.tsx:107` pushing to Supabase on its own 4000 ms timer, from two independent echo guards, over the same object. Add the folder path (1500 ms) and self-host (2500 ms) and there are four. |
| **Right?** | **No, and it is now worse than when F-7 was filed**, because the account is supposed to be the default. Fix F-8. |

---

## 4. The design

**Recommendation in one sentence: keep `localStorage['bujo:data']` canonical and
make the Supabase row a strictly derived cache that is written only after a read
of the row it is replacing, with one durable "dirty" stamp as the entire offline
queue.** Nothing else changes shape, so there is no schema migration for data in
the wild.

### 4.1 The access patterns this is designed for

Name the queries before choosing the store. **Server-side, there are exactly
two, and neither filters, joins, sorts, nor ranges:**

| Query | Shape | Frequency |
|---|---|---|
| read my whole journal | `select data from journals where id = auth.uid()` | once per auth event, plus once before each push after F-1 |
| replace my whole journal | `upsert(id = auth.uid(), data, updated_at)` | at most once per 4 s while editing |

That is why **one `jsonb` column keyed by `auth.uid()` is the right server
shape** and normalising it would buy nothing: there is no server-side predicate
to index for. The app's real queries — streaks, correlations, per-day rollups
across nine collections — all run in memory over the whole object and all join
on the ISO day string; they are enumerated and measured in
`docs/DATA-STORE-DECISION.md` §4 and nothing in this audit changes them.

**Client-side the pattern is "read whole, write whole, every keystroke."** That
is the decisive fact for §4.2.

### 4.2 The local store: keep localStorage, with a guard and a named successor

| Criterion | localStorage today |
|---|---|
| Read whole / write whole | perfect fit; synchronous, which the `useReducer` store requires |
| Inspectable without the app | best on the platform — devtools, one string, plain JSON |
| Atomic | **yes, and this is the property that forbids splitting it.** One `setItem` or none |
| Size | **4.83 MB projected at 10 years against a measured 5,177,344-char cap.** 93–97%. |
| Write cost | 6.4 ms measured for 5 MB; 12.3 ms to `stringify` it; ~49 ms per keystroke across four sync effects |

**So: do not migrate now, but the "do not migrate" decision has lost its
headroom and must be re-stated with a trigger that can actually fire.**

| Decision | Trigger that reverses it |
|---|---|
| Keep `bujo:data` as one localStorage key | `localStorage['bujo:data'].length > 3_500_000` **measured on the owner's device**, or `save()` returning false once |
| If it fires: move to **IndexedDB, one record, same JSON, same key name** | Not sql.js, not per-collection keys. The shape on disk stays `JournalData`; only the `getItem`/`setItem` pair changes, behind `storage.ts`'s existing `load`/`save` seam. The cost is that `load()` becomes async, which the `useReducer` initialiser must then await behind the existing `LockScreen`/`Welcome` gates — the same gate shape already in place |
| Never | split `JournalData` into per-collection keys or files. One atomic write becomes 28 torn ones with no transaction |

Two consequences that need stating now, not at the trigger:

- **The passcode path hits the wall ~3 years earlier.** `bujo:enc` is base64
  ciphertext (`crypto.ts:74`, `b64(ct)`), so ×4/3 plus the JSON wrapper:
  4.83 MB of journal is ~6.5 MB stored, over the measured 5.18 MB cap at about
  **year 7.8**.
- **The storage meter cannot be fixed with `navigator.storage.estimate()`**
  (§1.4). The honest meter is `localStorage['bujo:data'].length / 5_177_344`,
  measured, plus a separate line for IndexedDB photo bytes from `estimate()`.

### 4.3 How local and cloud stay in step — the rule, not the code

Five rules. They are ordered, and each one exists because a specific failure in
§3 violates it.

| # | Rule | Kills |
|---|---|---|
| **R1** | **Exactly one store is canonical: this device's `bujo:data` (or `bujo:enc`). The Supabase row is a cache of the union of every device, and is labelled one everywhere it is described.** | the ambiguity that makes every other rule arguable |
| **R2** | **A device may write the row only after it has read the row in this session, and only if the row it is replacing is the one it read.** "Verified" is not enough; the row must not have moved since. | §3.1 — the blind push |
| **R3** | **Every read unions. Remote ∪ local, winner on item-id collision is the remote; additions beat deletions.** Already true (`conflict.ts:73`) and already the right bias: losing a fresh note is worse than re-seeing a deleted one. | §3.3's silent drops |
| **R4** | **Never ask the user to choose between two copies of their own journal.** A union discards nothing, so there is nothing to choose. The prompt may only appear where a union genuinely cannot run — which, after R3, is nowhere on the account path. | §3.3 — the destructive dialog on the common path |
| **R5** | **The account the row belongs to is pinned durably, and a different account means the local journal is set aside, not merged.** "Set aside" means exported to a download or kept under a second key, never silently dropped — but never merged either. | §3.2 — alice's journal into bob's account |

**R2 is the only one that needs a mechanism rather than a deletion.** The
cheapest correct one, in order of preference:

1. **Conditional upsert on `updated_at`.** The pull already reads the row; have
   it read `updated_at` too, and make the push
   `.update({...}).eq('id', uid).eq('updated_at', seenAt)`, falling back to an
   insert when the row is absent. Zero rows affected means the row moved: pull,
   union, retry. This is optimistic concurrency with no new dependency and no
   new column. **The `updated_at` trigger in `schema.sql` already makes the
   server the authority on that value**, which is exactly what this needs.
2. **Or: pull immediately before each push**, as paths 4, 5 and 6 already do.
   Simpler, costs one extra round trip per push, and has a residual race window
   between the read and the write. Acceptable for one user with two devices;
   option 1 is strictly better and barely more code.

**Realtime is optional and should be deferred.** `wss://*.supabase.co` is
already in the CSP, so a `postgres_changes` subscription on `journals` would
make two devices converge in seconds instead of hourly. It is not needed for
correctness once R2 holds — R2 turns a lost write into a retried write — and it
is a second inbound path to get wrong. Add it when two devices are actually used
at once and the hourly convergence is felt.

### 4.4 Offline, and what the queue is

**The claim "the whole journal is the payload, so the next change is the retry"
is true about idempotency and false about liveness.** Verified in §3.6 and §3.3.
It survives with three additions and no queue:

| Piece | What it is |
|---|---|
| **One durable stamp** | `localStorage['bujo:account.dirtySince']` = the `updatedAt` of the journal that failed to push. Written in the `catch`, cleared on `markSynced()`. One value, because the payload is the whole journal — a queue of whole-journal payloads is a queue whose every entry supersedes the last. |
| **Three retry triggers** | `window.addEventListener('online')`, `document.visibilitychange → visible`, and the existing pull on load. Each one: if the stamp is set and `mayPush`, push. |
| **One flush** | `pagehide` + `visibilitychange → hidden`, pushing `latest.current` with `keepalive: true`. `serverSync.ts:72` already does exactly this and is the model to copy — the Supabase client takes a `fetch` option, so `keepalive` is reachable. |

Failure mode of this design, stated: a browser killed hard (crash, OOM, force
quit) between the last edit and the next push loses nothing locally and leaves
the row up to 4 s stale, with `dirtySince` set so the next load repairs it. The
outside view is the account card reading *"not reaching your account"* until the
app is opened again — which is true.

### 4.5 Should `bujo:sync` survive?

**Yes as a module and a target; no as a concurrent auto-writer.**

| If `bujo:sync` were removed entirely | Breaks |
|---|---|
| `lib/bujocloud.ts`, `api/sync.ts`, the Vercel Blob target | the **only end-to-end-encrypted sync in the app**, and the only one that works with **no account at all** — which is the configuration the app's own privacy copy has promised for a year |
| `lib/syncSecret.ts` | the whole passcode-reseal mechanism (COD-228) and `bujo:sync.enc` |
| `App.tsx:92-128` | two effects |
| `CloudSyncCard`, `SyncStatusBar.tsx:46`, `AccountMenu.tsx:81` | the auto-sync switch and two status readouts |
| `crypto.ts deriveCode/legacyCode`, `bujocloud.test.ts` | the path-code derivation and its v1 fallback |

That is a real feature with real users' data behind it, and `docs/AUTH.md`
already states the trade it buys. **Keep it.**

**What must change is that it stops being a second writer of the same bytes at
the same time.** Make the sync targets mutually exclusive, with the account as
the default: when a user is signed in and the account path is healthy, the
blob-sync auto-push effect does not arm. The passphrase stays, the target stays,
manual Push/Pull stays. This is F-7 from the previous audit, finally answered,
and it is a deletion rather than an addition.

Two smaller points on the same key:

- **It still survives sign-out, in plaintext** (`supabase.ts:259-266` says so and
  defers the decision to COD-309). COD-309 has landed and the account no longer
  needs a secret, so the deferral has expired: `signOut()` should
  `clearSyncPassphrase()`. The argument against — "under a device-held key,
  wiping it on sign-out would destroy the journal" — does not apply, because the
  account row is no longer encrypted under it.
- **`SyncStatusBar` reads `autoSyncEnabled()` with no subscription**
  (`SyncStatusBar.tsx:46`), so the bar reads `sync · off` until a reload. Already
  filed as a known gap; it is cosmetic and it reads as "the setting did not take".

### 4.6 Migration path, including the 45-byte row

**No schema migration for data in the wild.** `JournalData` is unchanged;
`SCHEMA_VERSION` stays 4; nothing stored on any device changes shape. A user who
never updates keeps a working app.

Server-side, in order. Steps 1–3 are one-way doors and are written to be
reversible anyway:

| # | Step | Why this way |
|---|---|---|
| 1 | **Read the row before deciding anything.** `select id, updated_at, pg_column_size(blob), jsonb_object_keys(blob) from public.journals;` in the dashboard | §1.1: its contents are UNVERIFIED and no amount of reasoning substitutes. 45 bytes with keys `v, note` is not any shape this app has ever written |
| 2 | **Fix the migration's guard before running it.** It refuses on `blob is not null`, which counts a non-journal row as ciphertext worth protecting. Make it match what the app actually calls ciphertext — `isEncryptedBlob` (`crypto.ts:96`) requires `v ∈ {1,2}` **and** the keys `data`, `salt`, `iv`: `where blob ? 'data' and blob ? 'salt' and blob ? 'iv' and (blob->>'v') in ('1','2')` | one definition of "is this ciphertext", in two languages, agreeing. A guard stricter than the code it protects blocks a migration for a row nothing can read |
| 3 | **Rename, do not drop.** `alter table public.journals rename column blob to blob_legacy_20261014;` instead of `drop column blob` | 45 bytes is free to keep and impossible to recover. `00-fresh-start.sql` already argues this case for the table; it applies to the column. Drop it when someone has looked at it |
| 4 | **`alter table public.journals add column if not exists data jsonb;`** then re-run `schema.sql` to re-assert RLS, grants and the `updated_at` trigger | the migration file already does both and both are idempotent |
| 5 | **Verify with the probe, not with the absence of an error.** `select=data` must flip from `42703` to `42501` | §1.1. This is the measurement that would have caught the whole situation a week ago |
| 6 | **Restore the localhost redirect URLs** while in the dashboard: add `http://localhost:5173/**`, `http://localhost:4173/**`, `http://localhost:5180/**`. Re-run the §1.3 probe; each must return to itself | §1.3. The production fix removed them |

**What happens to each existing user's data, spelled out:**

| Who | Before | After step 4 | Data at risk |
|---|---|---|---|
| The owner's account (holds the 45-byte row) | pull throws, phase `unusable`, nothing uploaded | pull reads `data` → `null` → `row: 'empty'` → local journal is the only copy and is uploaded | **None**, provided step 3 renames rather than drops. The row's `blob` is preserved under a new name |
| The other 15 users (count UNVERIFIED — from the owner's lead, not measured here) | same `unusable` | same: `data` is null for them, so their local journal uploads | **None.** No row is read as a journal that is not one |
| Anyone who had a COD-271 ciphertext row | step 2's guard refuses and names the export path | — | protected by the refusal, which is the point of it |

**Nobody is asked to do anything, and no stored byte on any device changes.**

### 4.7 Backup, restore, and the rehearsal this now needs

`docs/DATA-STORE-DECISION.md` §7 has the pipeline and a 9-step quarterly
rehearsal, and it is good. **A backup that has never been restored is not a
backup, and the account row has never been restored by anyone.** Two steps have
to be added to that rehearsal, because the account is about to become the primary
replica:

| # | Step | Pass condition |
|---|---|---|
| A | In a **private window**, choose "local", then sign in with the same Google account. Do nothing else. | The journal appears. The six `dataSummary` tiles match the real app's. |
| B | In that private window, add one entry, wait 10 s, then close it. Reload the real app. | The entry is there. If it is not, §3.1 or §3.3 is live. |

And one claim in the erase dialog needs re-reading in light of COD-309:
`eraseDevice()` sweeps this device by prefix and **does not delete the Supabase
row** (`wipe.ts:107-145`; no Supabase call anywhere in the file). The copy says
*"from this device"*, which is honest — but under COD-271 the row was ciphertext
whose key was being wiped in the same action, so erase was effectively total.
It no longer is: erase, then sign in again, and the journal comes back. That is
either a feature (an undo for a panicked erase) or a broken promise, and it
should be one of them on purpose. A `delete from journals where id = auth.uid()`
is one line and `journals_delete_own` already permits it.

### 4.8 Explicitly not doing

| Not doing | Condition that would change it |
|---|---|
| Delta / op-log sync | The blob is 0.49 MB at one year. Revisit above ~10 MB, or if the owner syncs on metered mobile data |
| Realtime `postgres_changes` on `journals` | Two devices genuinely used at once and the hourly convergence being felt. Correctness does not need it once R2 holds |
| Moving the canonical store off localStorage **now** | `bujo:data.length > 3_500_000` measured on the owner's device, or one `save()` returning false. Then IndexedDB, one record, same shape (§4.2) |
| Normalising the journal, server- or client-side | There is no server-side predicate to index and every client join is same-day and fast. Normalisation belongs in the derived SQLite (`DATA-STORE-DECISION.md` §5), which is still not built |
| Re-encrypting the account row | Decided, on request, in COD-309. Not re-litigated here |
| Deleting any sync target | They work and they are cheap. Making them **mutually exclusive** fixes the divergence without removing anyone's setup |
| Raising `SYNC_INLINE_BUDGET` for the Supabase path | It is sized for Vercel's 4.5 MB body limit (`imageStore.ts:106-119`), which the Supabase path does not go through. Worth raising — but note the second-order effect: once the journal alone exceeds 2.8 MB (year ~6, §1.4) photos stop travelling on **every** network path regardless. The unbounded answer is still blob-per-photo |

---

## 5. Already broken, nobody noticed

Ordered by how quietly each one loses or leaks data.

**F-1 · The account path pushes blind, and it is the only one that does.**
`AccountSync.tsx:107-119` upserts with no pull and no precondition, while
`App.tsx:110` (blob), `App.tsx:174` (folder) and `ServerSync.tsx:55` (self-host)
all read the remote and compare `updatedAt` first.
*Found by:* reading the four push effects side by side.
*Check that proves it fixed:* two signed-in browsers, A creates an entry, B
(which has not pulled since) edits anything; A's entry must still be in the row
afterwards. Today it is not.

**F-2 · Local Google sign-in is broken right now, and the fix that broke it is
the one the docs told us to apply.** The Supabase Site URL is now
`https://bujo-journal.vercel.app` — correct — and **no localhost origin is
allow-listed any more**. §1.3. A developer signing in at `localhost:5180` is
redirected to production with the session attached there; from inside the local
app it is indistinguishable from "nothing happened", which is COD-293 exactly,
in the other direction.
*Found by:* re-running the §1b probe from `docs/auth/sync-state-and-diagnosis.md`
instead of trusting its table.
*Check:* the probe's localhost rows must return to themselves.

**F-3 · Sign out, sign in as someone else, and one person's journal is merged
into the other's account.** §3.2, with the three-line probe output.
`onAccountChange` cannot see a switch across a sign-out, and after a reload it
cannot see one at all because the previous user id is never persisted.
*Found by:* composing two unit tests that each pass —
`accountSync.test.ts`'s "keeps the local journal on sign-out" and "keeps the
local journal on a first sign-in" — and running the composition through the real
functions.
*Check:* persist the last-signed-in id (e.g. `bujo:account.owner`) and add a
test that asserts `alice → null → bob` yields `discardLocal: true`.

**F-4 · For a passcode user, a failed canonical write is invisible.**
The plaintext path reports: `save()` returns false and `emitPersist(false)` fires
`bujo:persist`, which `StorageBanner` renders (`storage.ts:288-299`). The
encrypted path does not: `store.tsx:280` is
`encryptString(...).then(writeEncrypted).catch((e) => console.error(...))`, and
`writeEncrypted` (`storage.ts:318`) is a bare `setItem` with no try. So a quota
failure on `bujo:enc` is a console line. The app keeps working from memory and
loses everything on reload — which is F-4 from the previous audit, fixed for one
of the two canonical writers. There are **two** such call sites, both with the
same `.catch(console.error)`: `store.tsx:280` (every edit) and `store.tsx:1047`
(setting a passcode) — so the write that *creates* the encrypted journal can fail
as quietly as the ones that maintain it.
*Found by:* grepping `emitPersist` and finding one caller.
*Check:* fill `localStorage` to the cap with a passcode set, make an edit, and
assert the `StorageBanner` appears.

**F-5 · `mergeJournals` silently drops `mindsetPractice` from the losing side.**
F-3 of the previous audit, one shape over. `MAPS` in `conflict.ts:25` lists seven
map collections; `emptyJournal()` has five and `mindsetPractice` is not among the
seven. Measured against the real functions:

```
map keys in emptyJournal(): habitLog, habitValues, challengeLog, habitSkips, mindsetPractice
DROPPED by mergeJournals  : mindsetPractice
```

The regression guard that exists (`conflict.test.ts` · *"keeps a loser-only item
in EVERY array collection"*) filters on `Array.isArray(v)`, so it structurally
cannot see a map. `mindsetPractice` is 3,022 bytes of the 90-day demo — 2% of the
journal, and it is the collection whose whole purpose is the long run
(`types.ts`: *"the one chart whose whole job is to show the long run"*).
*Found by:* bundling `conflict.ts` with esbuild and running the array test's own
logic over the map keys instead.
*Check:* the same derived test for maps. It fails today.

**F-6 · A destructive dialog fires on the ordinary offline-edit recovery.**
§3.3. `resolveIncoming` prompts whenever local is newer than the row
(`conflict.ts:175`), which is the *expected* state after any offline edit or any
tab closed within the 4 s debounce. The prompt's confirm button is the one that
overwrites. Worse, it can fire on a `TOKEN_REFRESHED` while the user is typing,
because `onAuthChange` ignores the event type (`supabase.ts:162`) and every auth
event runs a full pull.
*Found by:* tracing `resolveIncoming`'s branch conditions against the states
`AccountSync` can be in.
*Check:* edit offline, reconnect, reload — no dialog, and the edit is in the row.

**F-7 · A demo journal cannot become a real one without being deleted.**
§3.4, §2.4. Three writers of `explore: false`, each preceded by
`replaceAll(emptyJournal())`. The banner that offers the escape can be dismissed
permanently.
*Found by:* `grep -rn "explore: false" src/` and reading each of the three hits.
*Check:* a "this journal is mine now" action that clears `demoSeeded`/`explore`
and keeps the data, plus an assertion that `isDemo` goes false and the next push
is allowed.

**F-8 · Four auto-writers, four debounce windows, all armable at once.**
Unchanged from F-7 of the previous audit, now with the account as the fifth
thing in the race (§2.1, §3.7). Nothing makes the targets exclusive.

**And one thing that is not broken and reads as if it is.** The `unusable` phase
currently shown to every signed-in user says *"This account's journal could not
be read, so nothing has been overwritten."* The row is fine; the **column the
code asks for does not exist** (§1.1). The refusal is correct and fail-safe —
`mayPush` stays false and nothing is destroyed — but the message sends the user
looking for a journal problem that is actually a one-line DDL. After step 4 of
§4.6 it will stop appearing; until then, do not debug it as a data problem.

---

## 6. The fix list, in order

Server- and dashboard-side first: three of the top four cannot be done from a PR,
and until step 2 lands nothing else about the account path is observable.

| # | Where | Fix | Evidence it is needed | Check that proves it done |
|---|---|---|---|---|
| **1** | Supabase SQL editor | Read the one row: `select id, updated_at, pg_column_size(blob), jsonb_object_keys(blob) from public.journals;` | §1.1 — its contents are UNVERIFIED and everything in step 2 depends on them | You can state what it is in one sentence |
| **2** | Supabase SQL editor | Amend the migration's guard to the `isEncryptedBlob` predicate, rename `blob` → `blob_legacy_20261014` instead of dropping it, then `add column data jsonb` and re-run `schema.sql` | §1.1 — no `data` column, so **every** account pull errors; §4.6 — the guard refuses on a row it should not | `select=data` flips `42703` → `42501` on the §1.1 probe |
| **3** | Supabase dashboard | Re-add `http://localhost:5173/**`, `4173/**`, `5180/**` to Redirect URLs. Keep the Site URL as it is | §1.3 / F-2 — local sign-in is broken today | The §1.3 probe: every localhost row returns to itself; `example.invalid` still does not |
| **4** | `components/AccountSync.tsx`, `lib/supabase.ts` | **R2.** Pull returns `updated_at`; push becomes a conditional update on it, falling back to insert, and on zero rows affected pulls, unions and retries | F-1 — the only blind writer of six | Two browsers, A writes, B pushes stale, A's item survives in the row |
| **5** | `lib/accountSync.ts`, `components/AccountSync.tsx` | **R5.** Persist the owner id (`bujo:account.owner`); treat *any* incoming id that differs from it as a switch, including across sign-out and reload | F-3 — the probe in §3.2 | A test asserting `alice → null → bob` ⇒ `discardLocal: true`; and bob's row never contains alice's entries |
| **6** | `lib/conflict.ts`, `lib/conflict.test.ts` | Add `mindsetPractice` to `MAPS`; add the map-shaped twin of the "no collection is left behind" test | F-5 — measured drop, 3,022 bytes of the demo | The new derived test, which fails before and passes after |
| **7** | `src/store.tsx`, `lib/storage.ts` | Give the encrypted write the same `emitPersist`/`boolean` contract as `save()`; serialise the encrypt so two in-flight writes cannot land out of order | F-4 — one caller of `emitPersist` | `StorageBanner` appears on a quota failure with a passcode set |
| **8** | `components/AccountSync.tsx` | **R4 + the outbox.** Stop prompting on the account path (a union discards nothing); add `bujo:account.dirtySince`, retry on `online` and `visibilitychange`, flush on `pagehide` with `keepalive` | F-6 and §3.3 — the dialog on the common path, and no liveness | Edit offline → reconnect → no dialog, and the row updates without another edit |
| **9** | `views/Welcome.tsx`, `components/ExploreBanner.tsx` | A "keep this, it's mine now" action that clears `demoSeeded`/`explore` **without** `replaceAll(emptyJournal())` | F-7 — three destructive-only exits | `isDemo` false, data intact, next push allowed |
| **10** | `App.tsx`, `components/account/CloudSyncCard.tsx` | Make the targets mutually exclusive: with a healthy account, the blob-sync auto-push effect does not arm. Manual Push/Pull unchanged | F-8 — four windows over one object | Only one network writer fires per edit, observed in the network panel |
| **11** | `lib/supabase.ts:268` | `signOut()` also `clearSyncPassphrase()` | §4.5 — the deferral in that docstring expired when COD-309 landed | `bujo:sync` absent after sign-out |
| **12** | `components/settings/SyncStatusBar.tsx` | Subscribe instead of reading `localStorage` once | known gap; it misreports `sync · off` until a reload | Toggling auto-sync updates the bar without a reload |
| **13** | docs | Update `docs/auth/sync-state-and-diagnosis.md`: the stale alias (§1a) and the production origin (§1b) are **fixed**; the `no-passphrase` gate in its §2 table no longer exists (COD-309 removed it); localhost is now the broken half | §1.2, §1.3 — two of its three "BROKEN" rows are stale, and a stale diagnosis page is how §1b stayed true for two releases | The verdict table matches a re-run of its own probes |
| **14** | `lib/account.ts`, `components/settings/DemoResetCard.tsx` | Decide whether erase deletes the cloud row, and make the copy match | §4.7 — erase then sign in restores the journal; the dialog implies otherwise | Erase, sign in again, and the outcome is the one the dialog promised |

Items 4, 5, 6, 7 and 8 are the data-loss ones. Items 1–3 unblock being able to
see any of it.

---

## Appendix · every command used

```sh
# Live column enumeration (anon key; reads no rows)
KEY=$(grep -m1 '^VITE_SUPABASE_ANON_KEY=' .env.local | cut -d= -f2-)
URL=$(grep -m1 '^VITE_SUPABASE_URL=' .env.local | cut -d= -f2-)
for c in id owner data blob updated_at created_at v note salt iv; do
  curl -s "$URL/rest/v1/journals?select=$c&limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
done

# Redirect allow-list (substitution probe; the control row is load-bearing)
probe () {
  ENC=$(printf %s "$1" | sed 's|:|%3A|g; s|/|%2F|g')
  ST=$(curl -s -o /dev/null -D - "$URL/auth/v1/authorize?provider=google&redirect_to=$ENC" \
        -H "apikey: $KEY" | tr -d '\r' | grep -i '^location:' | grep -o 'state=[^&]*' | cut -d= -f2)
  curl -s -o /dev/null -D - "$URL/auth/v1/callback?error=probe&state=$ST" \
    | tr -d '\r' | grep -i '^location:'
}
probe "http://localhost:5180/"; probe "https://bujo-journal.vercel.app/"; probe "https://example.invalid/"

# What production is actually running
curl -s https://bujo-journal.vercel.app/ | grep -oE 'assets/[^"]+\.js' | sort -u \
  | while read -r f; do curl -s "https://bujo-journal.vercel.app/$f"; done > prod.js
grep -c 'ueahhgqxshfvkjgcwtnh\|nothing has been overwritten' prod.js

# Journal size, growth and serialisation cost (esbuild + node, no browser)
npx esbuild probe.ts --bundle --platform=node --format=esm --outfile=probe.mjs && node probe.mjs
#   imports generateDemoData / mergeJournals / onAccountChange by ABSOLUTE path
#   (esbuild will not resolve a relative path out of a temp dir into the repo)

# The real localStorage cap, in a real Chromium, in a fresh profile
#   playwright, goto http://localhost:5180, append 64 KB chunks until QuotaExceededError
#   -> 5,177,344 chars; navigator.storage.estimate().quota -> 10,737,418,240 (not applicable)

npx tsc -b                       # exit 0
npx vitest run src/lib/accountSync.test.ts src/lib/conflict.test.ts \
  src/lib/egress.contract.test.ts src/lib/account.test.ts \
  src/lib/accountStatus.test.ts src/lib/cyclePrivacy.test.ts   # 6 files, 75 tests, pass
```

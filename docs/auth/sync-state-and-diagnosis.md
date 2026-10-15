# Account sync: the measured state of this project

**What this page is.** `docs/AUTH.md` says how accounts are *designed*;
`docs/auth/google-oauth-setup.md` says how to *set them up*. This page says what
is **actually true of project `ueahhgqxshfvkjgcwtnh` and the deployment at
`bujo-journal.vercel.app` right now**, measured rather than assumed, and what to
change.

Every number below came from a probe that is written out so you can re-run it.
Measured 2026-10-14 against `main` at `fdae640`.

---

## Verdict

| Thing | State | Evidence |
|---|---|---|
| Supabase project reachable | **works** | `/auth/v1/settings` answers 200 |
| Google provider enabled | **works** | `"google":true` in that response |
| `public.journals` table exists | **works** | anon gets `42501 permission denied`, not `PGRST205 relation not found` |
| RLS / anon lockout | **works** | anon `select` refused before policies are consulted |
| Local dev build configured | **works** | `VITE_SUPABASE_*` in `.env.local`; the Account card renders |
| Local sign-in origin allow-listed | **works** | `localhost:*` returns to itself |
| **Production build configured** | **BROKEN** | no `supabase.co` string in any deployed chunk; no sign-in button on the page |
| **Production origin allow-listed** | **BROKEN** | `bujo-journal.vercel.app` is substituted with the Site URL |
| **Supabase Site URL** | **BROKEN** | still `http://localhost:3000`, the Supabase default |
| Sign-in → anything syncs | **conditional** | four silent refusals, below |

Two of those are the answer to "I signed in and nothing synced", and they are
**different failures on different machines**. Fix both.

---

## 1. Why production shows no sign-in at all

Two independent causes, either one sufficient.

### 1a. The build has no project

`src/lib/supabase.ts` reads `import.meta.env.VITE_SUPABASE_URL`. Vite inlines
that **at build time**. Vercel's build has neither variable, so it inlines
`undefined`, `isConfigured()` constant-folds to `false`, and Rollup drops the
whole feature — client, card, button. This is the file's own "absent, not
broken" design working exactly as written; it is just pointed at the wrong
build.

Measured:

```
# every JS chunk the production index.html references
curl -s https://bujo-journal.vercel.app/ \
  | grep -oE 'assets/[A-Za-z0-9_.-]+\.js' | sort -u \
  | while read -r f; do curl -s "https://bujo-journal.vercel.app/$f"; done \
  | grep -c 'supabase.co'
# → 0      (a local `npx vite build` gives 1, with the real project ref)
```

And on the page itself, Settings → Account renders **`Profile` + `Units & week`
only** — no `Account` card, no `Continue with Google`. Locally the same tab
renders **`Account`, `Create a local account`, `About you`, `Units & week`**.

> The deployed `pendingSession-4PTZIf72.js` chunk is **byte-for-byte the same
> name as a local build's**, so production is *not* an old commit. Same code,
> different env. That is worth stating because "Vercel is on an older version"
> is the natural guess and it is wrong.

**Fix:** Vercel → project `bujo` → Settings → Environment Variables, add for
Production *and* Preview:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://ueahhgqxshfvkjgcwtnh.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the publishable/anon key from `.env.local` |

Then **redeploy** — an env var added without a rebuild changes nothing, because
the value is baked into the bundle.

### 1b. The production origin is not allow-listed

`signInGoogle()` sends `redirectTo = origin + pathname + search`. Supabase
checks that against the project's Redirect URLs and, when it does not match,
**silently substitutes the Site URL** — 302, no error, nothing in the response
to read.

This is measurable from outside, and the probe is the one worth keeping: start
an authorize, then drive the callback with a dummy error and read where it sends
you.

```sh
set -a && . ./.env.local && set +a
probe () {
  ENC=$(printf %s "$1" | sed 's|:|%3A|g; s|/|%2F|g')
  ST=$(curl -s -o /dev/null -D - \
        "$VITE_SUPABASE_URL/auth/v1/authorize?provider=google&redirect_to=$ENC" \
        -H "apikey: $VITE_SUPABASE_ANON_KEY" \
       | tr -d '\r' | grep -i '^location:' | grep -o 'state=[^&]*' | cut -d= -f2)
  BACK=$(curl -s -o /dev/null -D - \
        "$VITE_SUPABASE_URL/auth/v1/callback?error=probe&state=$ST" \
       | tr -d '\r' | grep -i '^location:' | cut -d' ' -f2-)
  printf '%-48s -> %s\n' "$1" "${BACK%%\?*}"
}
```

Measured:

| asked to return to | actually returned to | verdict |
|---|---|---|
| `http://localhost:5180/` | `http://localhost:5180/` | allow-listed |
| `http://localhost:5173/` | `http://localhost:5173/` | allow-listed |
| `http://localhost:4173/` | `http://localhost:4173/` | allow-listed |
| `https://bujo-journal.vercel.app/` | **`http://localhost:3000`** | **not allow-listed** |
| `https://example.invalid/` | `http://localhost:3000` | not allow-listed (control) |

`http://localhost:3000` is the **Site URL**, still Supabase's untouched default.
So a production sign-in goes: app → Google → consent → Supabase callback → a
dead local port. The app never runs again and never sees a session. From inside
the app this is indistinguishable from "nothing happened".

The control row matters: without `example.invalid` landing in the same place,
the vercel row could be read as a redirect loop rather than a substitution.

**This was already diagnosed.** The header comment of `src/lib/authReturn.ts`
states it in full — Site URL `http://localhost:3000`, no deployed origin
allow-listed — and `docs/auth/google-oauth-setup.md` §3 prescribes the fix. The
code half shipped (COD-293's pending-stamp watchdog); **the dashboard half never
did**, and this probe confirms it is still undone. A fix that lives only in a
doc is not applied.

**Fix:** Supabase dashboard → Authentication → URL Configuration:

- **Site URL:** `https://bujo-journal.vercel.app`
- **Redirect URLs:** add `https://bujo-journal.vercel.app/**`, keep
  `http://localhost:5173/**`, add `http://localhost:4173/**` (CI's preview port)

Re-run the probe afterwards. The vercel row must return to itself.

---

## 2. Why a signed-in device still uploads nothing

`AccountSync` will not push until **every** answer is yes. `mayPush()` is
deliberately conservative — refusing to push stalls a sync, pushing over a
journal you could not read destroys one — so each refusal is silent by
construction.

| Gate | Refuses when | Phase shown | Where to fix it |
|---|---|---|---|
| `userId` | not signed in | `signed-out` | sign in |
| `hasPassphrase` | no sync passphrase | `no-passphrase` | Settings → Sync & privacy → Sync passphrase |
| `isDemo` | `settings.demoSeeded` or `settings.explore` | `demo` | Settings → Data → erase the demo |
| `mismatch` | the row exists and this passphrase does not open it | `locked` | type the other device's passphrase |
| `verified` | no successful pull yet this session | `checking` | resolves itself |

**The two that silently catch real users:**

**`no-passphrase`.** Google sign-in sets up *identity*. Encryption uses a
separate `bujo:sync` passphrase, and a brand-new account has none — so the
commonest state of a fresh account is signed in, row created, **nothing
uploaded, nothing ever going to be**. `phaseCopy('no-passphrase')` says so on
the card, in the header menu and in the Sync status bar.

**`demo`.** Pressing **"Explore the demo →"** on the Welcome screen sets
`settings.explore = true` (`src/views/Welcome.tsx:114`), and `isDemo()` is
`demoSeeded || explore`. That flag is **permanent until the demo is erased** —
so a journal that started as "just looking" and then became real will never
sync, and the only thing that says so is one card's status row. Verified on a
fresh profile: a journal created this way reports `demoSeeded: true,
explore: true` with 71 entries.

> If sync "stopped working" and you remember clicking *Explore the demo* at any
> point, check this first. Settings → Data → erase the demo, then re-enter your
> entries or import a JSON export.

---

## 3. Why the UI may not say "you are already logged in"

Four surfaces render identity, and since COD-291 all four read the **one**
module store `lib/authUser.ts`:

| Surface | File |
|---|---|
| Header account menu | `components/shell/AccountMenu.tsx` |
| Account card | `components/account/AccountCard.tsx` |
| Sync status bar | `components/settings/SyncStatusBar.tsx` |
| Lost-sign-in report | `components/AuthReturnReport.tsx` |

So a signed-in session that shows nowhere has one of three causes, in the order
worth checking:

1. **The build is unconfigured** (production, §1a). `isConfigured()` is false,
   `authUser` publishes `{user: null, ready: true}` immediately and finally, and
   every surface is correct to show signed-out. There is no bug in the UI here.
2. **The session never arrived** (§1b). The browser was returned to
   `localhost:3000`, so the fragment carrying the token was never consumed.
   `bujo:auth.pending` is left behind and `AuthReturnReport` says *"That sign-in
   never came back"* on the next load **of this app** — which you only see if
   you come back by typing the URL.
3. **A passcode lock swallowed the return.** With a passcode set,
   `store.tsx` returns `<LockScreen>` *instead of* the tree, so none of those
   four components mount, nothing reads `#access_token=…`, and the sign-in is
   dropped. `initAuth()` in `main.tsx` exists to cover this — it builds the
   client before `createRoot` — so this is fixed, but it is the shape to
   remember.

**Known gap, minor:** the Sync status bar reads `autoSyncEnabled()`, a plain
`localStorage` read with no subscription. Setting a sync passphrase leaves the
bar reading `sync · off` until a reload, after which it reads
`sync · passphrase only`. Cosmetic, but it reads as "the setting did not take".

---

## 4. Sign-out: what it does, and what it leaves

`signOut()` is one line — `sb()?.auth.signOut()`. Everything else is a
consequence.

| Removed | Kept |
|---|---|
| The Supabase session (`sb-*` keys) | The journal (`bujo:data`) — stated on screen |
| | **The sync passphrase `bujo:sync`, in plaintext** |
| | `bujo:account.lastSync` |
| | Photos in the `bujo-images` IndexedDB |

`onAuthChange(null)` fires, `onAccountChange` resets to
`{userId: null, verified: false, mismatch: false}`, the phase goes
`signed-out`, and the card says *"Your journal is still on this device."*

**The leftover passphrase is the part worth knowing.** It is cleared by exactly
two things — the auto-sync toggle (`CloudSyncCard.tsx:113`) and the full erase
(`wipe.ts:120`) — and **not** by signing out. It does not expose the *account*
row, which is gated by RLS on `auth.uid()`. It does expose the **blob sync**
copy, whose storage path is derived from the passphrase itself
(`crypto.ts`, fixed-salt PBKDF2). So on a shared machine, *sign out* is not
*log out of everything*; **Settings → Data → erase** is.

Erase does sweep correctly, by prefix (`bujo:`, `bujo.ui.`, `sb-`) with an
explicit keep-list of one (`bujo:onboarded`) — the direction that stays correct
as keys are added — and it deletes the IndexedDB stores with a timeout race,
because `deleteDatabase` blocks silently forever on a held connection.

---

## 5. The security layers, as mechanisms

The app states these itself under Settings → Sync & privacy → *"How your journal
is protected"*. They check out against the code:

| Claim | Mechanism | Where |
|---|---|---|
| The server cannot read your journal | AES-GCM-256; key from PBKDF2-SHA256 at 600,000 rounds; fresh 16-byte salt and 12-byte IV **per write** | `lib/crypto.ts` |
| The key never leaves the device | derived in `crypto.subtle`; no request carries key or passphrase | `lib/crypto.ts` |
| No other account can read your row | RLS **forced** (not merely enabled), four separate policies, `owner` defaults to `auth.uid()` and `with check` refuses any other | `supabase/schema.sql` |
| A signed-out request gets nothing | `revoke all on public.journals from anon` — refused before RLS is consulted | verified live: `42501` |
| The cycle log never leaves | `forEgress()` on every network path, enforced by `egress.contract.test.ts` | `lib/cyclePrivacy.ts` |
| Other services' tokens never travel | same `forEgress` step strips GitHub / Drive / self-host tokens | `lib/cyclePrivacy.ts` |
| Encrypted in transit | TLS, plus a production CSP with `frame-ancestors 'none'`, `object-src 'none'`, HSTS `max-age=63072000; includeSubDomains; preload` | `vercel.json` |

And the four limits, which the app also states and which are real:

- **A lost passphrase is a lost journal.** The account is recoverable; the data
  is not. This is the cost of the first row, not a gap in it.
- **Auto-sync stores the passphrase in this browser in plaintext** (`bujo:sync`)
  — unless a passcode is set, in which case it moves to `bujo:sync.enc`, sealed
  under the passcode, plus an in-memory copy that dies with the tab. Manual Push
  and Pull store nothing.
- **Google learns that you use this app.** Inherent to using them for identity.
- **When you wrote is not secret; what you wrote is.** `id` and `updated_at` are
  columns in the clear, because the server has to route and order writes.

One thing the UI does **not** say, and should be read alongside: the blob-sync
path code uses a **fixed context salt** (`crypto.ts` CODE_CONTEXT), because the
server has to find the row with no account to key off. That is the real ceiling
of the no-accounts design and is written down in the source rather than hidden.
The account path does not have it — there, the row is found by `auth.uid()`.

---

## 6. The fix list, in order

| # | Where | Action | Blocks |
|---|---|---|---|
| 1 | Supabase dashboard | Site URL → `https://bujo-journal.vercel.app`; add `https://bujo-journal.vercel.app/**` to Redirect URLs | every production sign-in |
| 2 | Vercel | add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` to Production and Preview, **then redeploy** | the sign-in button existing at all |
| 3 | Google Cloud console | confirm `https://bujo-journal.vercel.app` is an Authorized JavaScript origin, and the consent screen is **Published** (or your account is a Test user) | the consent screen |
| 4 | the app, per device | set a sync passphrase; erase the demo if `explore`/`demoSeeded` is set | anything uploading |
| 5 | code (small) | make the Sync status bar subscribe instead of reading `localStorage` once | nothing; it only misreports |
| 6 | code (judgement call) | decide whether sign-out should clear `bujo:sync` | shared-device hygiene |

Re-run the §1b probe after 1, and re-check the §1a `grep -c 'supabase.co'`
after 2. Neither fix is believable without its measurement — the whole reason
this page exists is that §1b has been *documented as fixed* in two places since
COD-293 while remaining true.

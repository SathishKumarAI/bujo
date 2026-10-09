# STATUS

**Stopped:** 2026-10-08. `main` at `fee85a7`, clean tree. **Five PRs merged this
session** (#348–#352). `npm run verify`: 124 files, **1740 tests**, exit 0.
`a11y` 173/173 with no serious or critical, `smoke` 24/24, `clipped` clean at
1440/1024/390, `design` 419 files, `contrast` 5 themes — all green on `main`.

## Security, as of 2026-10-09

| | |
|---|---|
| **COD-228** | **Closed.** The passcode lock had a back door: the sync passphrase sat in plaintext at `bujo:sync`, and because the cloud copy is encrypted with the *same* passphrase and its path *derived* from it, a locked device handed over a byte-identical journal without the passcode being attacked. `lib/syncSecret.ts` seals it under the passcode now. Cost: auto-sync does not run while locked, which is the feature being honest. |
| **CSP** | `connect-src` had no `supabase.co`. Vercel headers do not apply to `vite preview`, so accounts worked locally and would have been **dead in production** — every call blocked, console warning only. Fixed. |
| **Key guard** | A test failing the build on a hardcoded project URL or `service_role` existed only in an agent worktree, i.e. not at all. Now in `auth.contract.test.ts`, proven to fail on a planted canary. |
| **Secret audit** | History, not just the tree: no env file ever committed except `.env.example`; no tracked secret-shaped files; `dist/` untracked; 0 hits for `sb_secret_`, `vercel_blob_rw_`, `GOCSPX-`, private keys. All 24 `service_role` hits are prose warning against it. |

**Still open and yours:** turn off `anonymous_users` in Supabase (anyone can
mint a session with no email; nothing in the app uses it), and drop the
`?code=` arm of `api/sync.ts` one release on — that is the path that put a
secret in a query string.

## What this session did

Started as "the design pass, phase 5" and became a shell rebuild plus a domain
bug that mattered more than any of it.

| | |
|---|---|
| **The shell is a row** #348 | The rail is back, and the frame turned on its side. Chrome before content **152px → 58.8px** (17.2% → 6.7%), identical on all ten views, and **zero chrome bands crossing the window**. The header lives *inside* the content column now. |
| **The app stopped asking you to drink** #349 | `seedJournal` set no polarity, so Caffeine, Sugar and Alcohol shipped as *build* habits. The banner read **"Log Alcohol today to keep your 3-day streak alive."** Schema 4 migrates existing journals. Four readers fixed. |
| **Hide the rail, and latte** #350 | `⌘B`, persisted. Latte is the default theme for fresh journals. |
| **Rail contents, bigger cards** #351 | Wordmark out of the rail, week strip into its foot. Band padding 24→28px; masonry steps 48/80/100rem → 64/96/120rem. |
| **Mindset** #352 | Toggle moved onto the rail. Library 4.2 → 3.7 screens. Balance bars were using a *text* token as a chart fill. |
| **A refused sign-in showed nothing** #360 | COD-290. The OAuth *success* leg was handled; the *failure* leg had no handler anywhere. `grep -rn "error_description" src/ api/` returned **zero hits** while the address bar carried the reason. Reported as "the screen is not changing" — exactly right. 7 new tests, 1751 → 1758. |
| **The trap that nearly reverted it** #361 | Unregistering a service worker does not evict it from the page it already controls, so the reload meant to replace it is served *by* it. The fix looked dead: page on `index-DfwUZGbn.js`, `dist/` on `index-CMBntfQy.js`. The documented procedure was followed exactly and still gave a wrong answer. |

## Read this before trusting a number in a commit message

Three of this session's findings were **my own measurements being wrong**, and
each was caught by something other than me looking harder.

1. **I measured at my own viewport and called it the result.** Mindset's library
   got a third column at 60rem; I measured 3550px → 3038px at the 1707px window
   I had open and wrote it down. `npm run space` grades at **1440**, where that
   container is **926px** — 34px under the step. The gate reported 4.2 screens,
   *unchanged*, and it was right. **The gate disagreeing with me is the only
   reason it was not shipped as a no-op with a confident number attached.**
2. **A 15s wait on a regex that could no longer match.** `go()` in the a11y gate
   waits for a destination to exist before concluding it does not. Adding an
   `aria-hidden` keyboard hint to the rail rows changed their `textContent`, so
   that wait timed out on *every* navigation. Local (4 workers) absorbed it; CI
   at `BUJO_A11Y_WORKERS: 2` was cancelled at **15m17s with 0 of 166 scans**.
   When you change what a control's name is made of, grep the gate for every
   place that matches on its TEXT.
3. **A clean rebase is not evidence that two changes compose.** Two branches
   both moved `DEMO_VERSION` 10 → 11, so git saw identical text and merged
   without a conflict. `main` was already at 11, so the second branch's seed
   change would never have re-seeded anybody. Bumped to 12.

And one from the audit: **the first full-page sweep reported every view as
crashed.** It was not the app — the tab held an entry chunk from before a
rebuild, so its lazy chunks 404'd into the error boundary. Nineteen phantom bugs
if I had trusted it. Compare the served `assets/index-*.js` against
`dist/index.html` *before* believing a sweep.

## The space audit, and what is left of it

Screenshotted every view and measured per-zone fill. Zone fill is **94–100%
everywhere** — the emptiness is not in the zones. The real finding was six pages
rendering **a single column on a 1440px desktop**:

| page | screens | cards | state |
|---|---|---|---|
| mindset | 4.2 → **3.7** | 3 | done, #352 |
| coaching | 2.7 | 3 | open |
| reading | 1.7 | 5 | open — same shape as mindset, should be cheap |
| collections | 1.4 | 6 | open — one card at 41% fill |
| challenges | 0.9 | 1 | open, low value |
| goals | 0.9 | 2 | open, low value |

These are **not** a shared token fix. Each needs a decision about *which cards
pair* — a chart beside its legend reads differently from two unrelated charts.
Reading and collections are the next two, and they are list-shaped like mindset
was, so the container-query treatment should transfer.

## Not verified

- **The `HabitEditor` "days clean" tile has never been clicked.** Two lines, the
  same shape as `HabitDetail`'s shipped branch, typechecked, both streak
  functions unit-tested — but nobody has looked at it rendering. The habit grid
  moved onto Today's surfaces and I could not reach that editor from a probe.
- **The rail-hidden state is not gated.** Every browser gate runs with the rail
  open. Probed by hand across five themes × both states and the toggle renders
  identically in both, so nothing new is uncovered — but a probe is evidence,
  never a substitute.
- **The toggle icon is 3.47 (latte) / 3.58 (dawn)** against the header. Above
  the 3.0 floor for a graphic, under 4.5, and exactly where the microphone
  button beside it already sits. Not made worse; worth its own pass.
- **Supabase is live and RLS is proven.** Project up, `schema.sql` applied,
  Google enabled, sign-in surface rendering. The two-account test was run on
  2026-10-09 — and the "needs two Google accounts" blocker was false: two
  anonymous sign-ins are two distinct `auth.uid()`s. B could not read, patch,
  spoof or delete A’s row (403 on the spoof, 0 rows on the rest), and A’s data
  was byte-identical afterwards. Procedure in `docs/SECURITY.md` so it is
  repeatable after any schema change.

  **Owner-only, still open (COD-282):** the Google UI round trip, and cleanup
  — Authentication → Users, delete every user with no email (rows cascade,
  one step), then Providers → Anonymous sign-ins → off, in that order.

## First thing, still: 18 worktrees

`git worktree list` reports **18**. This has been flagged across several
sessions and is still not done, because pruning is a deletion and that is not
mine to take. `git worktree remove` / `git worktree prune`; the newest is
`locked` and needs `--force`.

They are not harmless: a dev server started in one is pinned to it, so a tab on
that port never shows changes made here however hard you reload — and
`vite.config.ts` excluding the path from vitest is a mitigation, not a fix.

## Next, in order

The 2026-10-09 leftovers, filed as COD-285–289 after an audit of what this
session raised and then dropped. **The pattern is worth keeping: everything
found mid-task and fixed got filed; everything found mid-task and deferred
mostly did not.** Five of these existed only in a conversation.

| # | | Why this order |
|---|---|---|
| **COD-285** | Drop the `?code=` arm of `api/sync.ts` | The only one with a security consequence — a secret in a query string, i.e. in every access log. 4 refs still present. Move `docs/AUTH.md`'s recovery `curl` to the header in the same change or recovery breaks silently. |
| **COD-286** | Type scale is 8 steps, documented as 5 | COD-283 carried two findings, the serif half shipped in #358 and the ticket was closed **taking the other half with it**. 12px x4 is a real outlier; 22 and 32 are real tokens the doc never recorded. Fix the code AND the doc, in opposite directions. |
| **COD-287** | Let `PageHeader` scroll away | 67px back on every long page. Recommended when asked about hiding the top bar, then dropped. Not a one-word change: `LibraryBar` and `SectionRail` park against `--header-h` and must re-park at 0. |
| **COD-288** | Coaching is not the band-pairing shape | A **negative** result, filed so nobody repeats the half hour. Its 2.7 screens is a 1676px act column, not wide-and-underfull bands. Needs folding, which is a content decision. |
| **COD-289** | Two gaps the gates miss | Every browser gate runs with the rail OPEN; and the toggle icon is 3.47:1 on latte (above the 3.0 graphic floor, so not a violation — same as the mic beside it). |

### Owner-only, and genuinely blocked on an account

**0. Google sign-in is broken right now, and the fix is one field.** Supabase →
Authentication → Sign In / Providers → **Google** → re-paste the **client
secret** from the Google Cloud credential of the same client. Evidence it is
that field and not another: `authorize` presents
`70992319956-…apps.googleusercontent.com` and the callback
`https://ueahhgqxshfvkjgcwtnh.supabase.co/auth/v1/callback`, and Google issued a
code (`4/0A…`) — which it only does after validating both. The exchange sends
those two plus the secret and is what failed, so one variable is left. Google
shows a secret once; add a new one on that client if it is not visible. **Do not
paste it into a session with an assistant.** Taxonomy and the one-line probe are
in [`docs/AUTH.md`](docs/AUTH.md#signing-in-with-google-the-setup-and-reading-a-failure).

Then, in this order:

1. Supabase → Authentication → **URL Configuration** → Redirect URLs must list
   `http://localhost:4173/**` and the Vercel origin. This is the *next* failure
   after the secret is fixed, and it looks like success — you sign in and land
   on the Site URL with the session on the wrong origin.
2. Supabase → Authentication → **Users**: delete every user with no email —
   the anonymous ones from the RLS test. Journal rows cascade with them.
3. Supabase → Providers → **Anonymous sign-ins → off**. In that order.
4. Click **Continue with Google** once, to confirm the UI round trip (COD-282).
   Only meaningful after 0 — until then it exercises the failure path, which is
   now at least legible.

### Closed this session rather than carried

**#306** (`feat/page-contract-rollout`) was closed, not merged: **81 commits**
behind, and it deletes `src/components/mod/Band.tsx`, which **13 files now
import** and which carries the `BandRow` context COD-284 is built on. Rebasing
60 files across 81 commits is a re-implementation, and the conflict resolution
is where the real decisions would get made silently. The branch still exists;
`git diff main...feat/page-contract-rollout` still reads.


## Open, deliberately

- **#306** — an old PR still open, "finish the page contract and retire the
  Modernist design world". Not touched this session; decide whether it survives
  the shell rebuild.
- **COD-228** — auto-sync keeps the passphrase in plaintext, defeating the
  passcode lock. Disclosed on screen.
- **COD-270** — 24 unreachable subtitles, all `hideInfo` cards. Gate budgeted
  at 24; lower it as they go.
- **COD-273/274** — the gate install recipe lived only in CI; the base-layer
  anchor blue fails on a raised panel.
- **`?code=` still accepted** by `api/sync.ts` for bundles cached before #323.
- One pre-existing lint warning: `src/App.tsx:131:6` `react-hooks/exhaustive-deps`
  (was `:120:6`; COD-290 inserted eleven lines above it — the warning did not move).

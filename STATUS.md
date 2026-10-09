# STATUS

**Stopped:** 2026-10-09, after a short session on top of the long one.
`main` at `534aa81`, clean tree. **Three PRs merged this session: #379, #380,
#381.** (The fifteen before them, #363–#377, are below.)

`npm run verify`: **138 files, 1861 tests**, exit 0. `eslint` 0 errors (the one
pre-existing `App.tsx` exhaustive-deps warning). `design` 434 files, `contrast`
5 themes / 14 accents. Browser gates (`a11y`, `clipped`, `smoke`, `space`) were
**not** re-run this session — the three PRs are UI, so run them before the next
deploy; the numbers quoted lower down are from the previous session.

## This session, in one line each

- **#379 · the rail takes a gesture.** Click its empty column, or over-scroll
  it past the end (120px of travel), and it hides. `railGestures.ts` holds both
  decisions as arithmetic with 7 assertions — jsdom's zero-size rects mean a
  render test cannot see the geometry that makes the click correct.
- **#380 · the week, at a size you can read.** The habit week strip was 6px
  dots and `hidden sm:flex`, so a phone showed **no history at all**; now 10px
  cells there, 14px from `sm`, as squares, with no `opacity` anywhere. And
  "Weekly goals" moved into the **278 × 340px hole** the focused Today grid
  leaves in its left column, at 64px rings — it had been rendering only in
  `TodayClassic`. Avoid and `limit` habits are filtered out of it, because a
  ring filling toward a cap says "keep going" (Caffeine drew 4/5, 80% full, for
  the fourth coffee against a limit of five). Seed gained five positive goals;
  `DEMO_VERSION` 12 → 14.
- **#381 · charts.** Mood/Stress/Sleep had no legend and three hues carrying
  identity alone — red↔green separate by **ΔE 5.8 under deuteranopia in latte,
  vscode and dawn**. Every three-accent trio these palettes can make was scored
  across the five themes and **none is clean**, so the fix is secondary
  encoding: a dash pattern per series plus a legend. The plan card's week strip
  stopped being a three-bucket traffic light (a real week lands in one bucket →
  seven olive blocks) and became a sequential green ramp.

- **#383 · the rail stopped hiding itself under the pointer.** #379's `atEnd`
  test is also true for a list that cannot scroll — and that is the rail's
  normal state (scrollHeight 699 = clientHeight 699 at 1503x849) — so one wheel
  flick with the cursor over the sidebar hid it. `overscrollHide` now takes
  `canScroll`.
- **#384 · every button in the app now looks clickable.** Tailwind v4 dropped
  v3's preflight `cursor: pointer` on `button`, so **37 of 37 buttons on Today
  computed `cursor: default`** against 28 of 28 anchors at `pointer`. One rule
  in `@layer base`; 261 enabled buttons on a fully-unfolded Today now read
  `pointer`, and the 269 disabled ones deliberately do not.

**Open, filed: COD-306.** An avoid habit with a `weeklyGoal` now draws nothing
at all — the field is accepted and never shown. It needs a ceiling mark, not a
floor one, beside the rings rather than among them.

**Traps worth carrying:** the preview's service worker handed back a stale
bundle twice during this session — compare the served `assets/index-*.js`
against `dist/index.html` before believing a screenshot. And port 4173 was
already held by another session's `vite preview` of this same repo.

---

## START HERE · two things, both yours, both blocking everything above

Everything below shipped to `main` and **none of it is live.** Production still
serves the **27 September** build.

```
! npx vercel promote bujo-bdyge3g4a-sathish-s-pickleball-cards.vercel.app
```

**1 · Promote (COD-292).** `vercel --prod` already built `main` successfully —
`dpl_3gygHvzWEu6japMoTQHx1Nxt5Dgf`, target production, Ready. Its bundle was
verified to contain the project ref, "Continue with Google" and "not syncing
yet". Only the **alias** still points at the old deployment. `vercel promote`
is blocked by this sandbox's classifier, so the one command is yours.

Correction to what this file said yesterday: the Vercel **env vars are not
missing**. `vercel env ls` shows `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` set for Production (Secret, 118d) and Development.
Only *Preview* lacks them, and that was left alone deliberately — preview URLs
are shareable, and giving them the real keys lets any preview write to the real
`journals` table.

**2 · The Supabase redirect allow-list (COD-293).** Authentication → URL
Configuration. Measured by asking Supabase to honour a `redirect_to` it may
reject and reading the `Location` back:

| sent | came back as | |
|---|---|---|
| `http://localhost:*` | the same URL | allowed (localhost is allowed wholesale) |
| `https://bujo-journal.vercel.app/…` | `http://localhost:3000` | **rejected** |
| a preview deployment URL | `http://localhost:3000` | **rejected** |

The Site URL is `http://localhost:3000`. So **a Google sign-in from production
can never complete** — after Google the browser is sent to a dead local
address. Set Site URL to `https://bujo-journal.vercel.app` and add
`https://bujo-journal.vercel.app/**`, the preview wildcard, and
`http://localhost:4173/**` + `http://localhost:5173/**`. **Keep the localhost
entries** — they are the only reason local sign-in works.

Also worth checking: **no deployment fired for any of the fifteen merges**, so
the GitHub→Vercel integration is not deploying. That is likely the root cause
of production being stale, not any one build.

---

## What this session did

Google sign-in was reported as "I can sign in but the UI never changes". That
turned out to be **six** separate causes, found in this order. The order
matters — each fix was real and none of them was the one that mattered.

| # | Cause | Fix |
|---|---|---|
| COD-291 | Identity was `useState` inside one card. The header, the Account bar and the sync pill could not see it. | Module stores (`authUser`, `accountStatus`, `account`) |
| COD-293 | `redirectTo` is a *request*; Supabase silently substitutes the Site URL when the origin is not allow-listed | A stamp before the redirect, reported if the trip never returns |
| COD-294 | The service worker served the **previous build on every first load** | Reload once on `controllerchange`, guarded |
| COD-295 | `detectSessionInUrl` only runs if a client exists — and every component that builds one sits under `LockScreen`/`Welcome` | `initAuth()` before `createRoot` |
| COD-296 | **The actual cause.** Google issued a code; Supabase failed to exchange it. The provider's client secret was wrong. | Dashboard — fixed by the user, sign-in now works |
| COD-300 | The CSP blocked Drive sign-in, food lookup and the local model **in production** | Hosts added; a contract test now fails on drift |

**The lesson, and it is already a memory:** COD-296 was found in sixty seconds
by driving the real browser and reading the network panel. Five code PRs went
in first, each fixing something real, none of them the cause. *For "login
works, UI blank", read the redirect chain before reading the source.*

Then, on request:

- **COD-297** — one home for account/sign-in/sync. The Account page is retired
  into Settings; `?view=account` is a 301. Also `?view=settings&tab=…`, which
  closed **half of COD-232**: `a11y` now scans the three Settings panels a tab
  shell had kept out of the DOM (173 → 187 scans).
- **COD-299** — security audit. Two real fixes: "Erase everything" left the
  passphrase, the Supabase session and **every photo** behind; `settings.usdaKey`
  was leaving the device unstripped. 1302 commits scanned for eight secret
  shapes, zero hits, canary-tested first.
- **COD-298 / COD-303 / the page header** — the rail's sub-tabs ran at a 54px
  pitch under a 38px nav (Cycle fell off the bottom); five history lists had
  five different rules, two silently truncating at 12; the page header was 67px
  of stacked title and subtitle with zero controls, now 49px on one line.
- **COD-301** — the egress tripwire's four blind spots, each closed and each
  canary-proven.
- **COD-302** — the coach's 29 sessions: `docs/workouts/coach-sessions.md`
  verbatim, `lib/coachSessions.ts` typed, and loadable from Gym → Look up &
  tools.

---

## Security, as of 2026-10-09 (COD-299)

| | |
|---|---|
| **COD-228** | **Closed.** The passcode lock had a back door: the sync passphrase sat in plaintext at `bujo:sync`, and because the cloud copy is encrypted with the *same* passphrase and its path *derived* from it, a locked device handed over a byte-identical journal without the passcode being attacked. `lib/syncSecret.ts` seals it under the passcode now. Cost: auto-sync does not run while locked, which is the feature being honest. |
| **CSP** | `connect-src` had no `supabase.co`. Vercel headers do not apply to `vite preview`, so accounts worked locally and would have been **dead in production** — every call blocked, console warning only. Fixed. |
| **Key guard** | A test failing the build on a hardcoded project URL or `service_role` existed only in an agent worktree, i.e. not at all. Now in `auth.contract.test.ts`, proven to fail on a planted canary. |
| **Secret audit** | History, not just the tree: no env file ever committed except `.env.example`; no tracked secret-shaped files; `dist/` untracked; 0 hits for `sb_secret_`, `vercel_blob_rw_`, `GOCSPX-`, private keys. All 24 `service_role` hits are prose warning against it. |

| **COD-299 · erase** | **"Erase everything" did not.** It walked a hand-written list of 23 keys, so it left behind the sync passphrase, **the Supabase session** (`sb-*`, i.e. still signed in), the passcode salt, the onboarding flags, and **every photo** in the `bujo-images` IndexedDB. Now a *prefix* sweep (`bujo:`, `bujo.ui.`, `sb-`) plus both databases, returning a report of what it actually removed. A deny-list cannot be kept in step with a growing key space; an allow-list can. |
| **COD-299 · USDA key** | `settings.usdaKey` is a user's own API key and was **not** in `SYNC_SECRET_KEYS`, so it left the device in every cloud sync and every CSV export while `lmUrl` beside it was stripped. One line, and it had been wrong since the field was added. `secretKeys.contract.test.ts` now parses the `Settings` interface for credential-shaped names, so the next such field fails the build instead of leaking. |
| **COD-299 · what Google login stores** | Asked directly, and the answer is in `docs/AUTH.md`: one `sb-<ref>-auth-token` entry in `localStorage` holding the JWT and refresh token, written by `@supabase/supabase-js`, **no key material of our own**. The journal's encryption key is derived from the passphrase at use time and never persisted. No Google password, no OAuth client secret, and the anon key is a public identifier by design. |
| **History** | 1302 commits scanned for eight secret shapes; **zero hits**. The scan was canary-proven first — a planted fake key was found before the real sweep was trusted. |

**Still open and yours:** turn off `anonymous_users` in Supabase (anyone can
mint a session with no email; nothing in the app uses it), and drop the
`?code=` arm of `api/sync.ts` one release on — that is the path that put a
secret in a query string.

## The session before this one, kept for history

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

Kept and added to each session, because it is the section that has paid off
most. **Four more this time, all of them mine:**

1. **`button:has-text("Load ")` is a substring match.** A browser probe checking
   that a coach session loads clicked a *different* button whose label happened
   to contain the phrase, and reported the feature broken. Scoped to
   `/^Load \d+$/` it works — 4 inputs to 34, with "Bird dogs" present. The
   second half matters more: **I was about to assert on the row count**, and the
   count would have passed either way, because the wrong button also adds rows.
   Assert on the value, not on the shape of the result.
2. **A tripwire's regex literals can silently stop matching.** Two carriers
   dropped out of `egress.contract.test.ts`'s `SENDS` assertion while the data
   they described was unchanged. Root cause never isolated — which is the
   finding. Patterns are now `String.raw` strings compiled with `new RegExp`,
   and **each one is asserted against a known-positive sample**, so a pattern
   that stops matching fails as itself rather than as a quiet zero.
3. **Vite loads `.env.local` for vitest.** So `isConfigured()` is `true` locally
   and `false` in CI, and my first `initAuth` test asserted `=== false` — green
   on CI, red here. Assert the *relationship* ("a client exists iff configured,
   never throws, is memoised"), never either answer.
4. **An agent's list of unmapped exercises was wrong and plausible.** It named
   seven; measuring gave **fourteen**, with only one name in common. A list that
   arrives already-formatted is still a claim.

---

### From the session before

Three of that session's findings were **my own measurements being wrong**, and
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

- **Nothing in this session has been seen in production.** Every number above
  is a local `vite preview` build. The promote is step 1 at the top of this
  file for that reason.
- **Four of the nine account phases have never been on screen.** `checking`,
  `uploading`, `locked` and `error` are unit-tested through `phaseCopy` and
  `pill`, and the first two are sub-second by design. `signed-out`,
  `no-passphrase`, `synced` and `demo` were looked at.
- **The coach-session load was probed at one viewport, in one theme.** 4 inputs
  to 34 with the right exercise names present, at 1440 · mocha. The rows are
  plain `Card` content so nothing suggests otherwise, and `a11y` and `clipped`
  cover the fold — but the specific act of loading was done once.
- **`AuthReturnReport` has never fired for real.** It is unit-tested and it is
  deliberately not time-limited, so a stamp left by a browser crash reports on
  the next launch rather than expiring. Whether that reads as useful or as a
  stale warning is unknown until someone's sign-in actually gets lost.

## The 18 worktrees are gone

`git worktree list` reports **1** — this one. That item sat at the top of this
file across four sessions as "not mine to delete", and it is now done. Kept as
a heading rather than deleted so the next session does not go looking for the
problem.

The reason it mattered stays true and is in `CLAUDE.md`: a dev server is pinned
to the worktree it was started in, and vitest discovering a second copy of the
suite is what made the test count read 1474 for 743 tests.

## Next, in order

The 2026-10-09 leftovers, filed as COD-285–289 after an audit of what this
session raised and then dropped. **The pattern is worth keeping: everything
found mid-task and fixed got filed; everything found mid-task and deferred
mostly did not.** Five of these existed only in a conversation.

| # | | Why this order |
|---|---|---|
| **COD-285** | Drop the `?code=` arm of `api/sync.ts` | The only one with a security consequence — a secret in a query string, i.e. in every access log. 4 refs still present. Move `docs/AUTH.md`'s recovery `curl` to the header in the same change or recovery breaks silently. |
| **COD-286** | Type scale is 8 steps, documented as 5 | COD-283 carried two findings, the serif half shipped in #358 and the ticket was closed **taking the other half with it**. 12px x4 is a real outlier; 22 and 32 are real tokens the doc never recorded. Fix the code AND the doc, in opposite directions. |
| ~~**COD-287**~~ | ~~Let `PageHeader` scroll away~~ | **Done in #377, by not doing it.** Asked for again directly, and hiding it was the wrong answer: `LibraryBar` and `SectionRail` park against `--header-h`, so a header that moves drags two sticky bars with it, and a nav that vanishes on scroll is the COD-202 trap that killed a whole gate run. Instead the header got *shorter* — title and subtitle on one line, **67px → 49px**, 27% back on every page, and it never moves. A control that is always there beats 49px recovered sometimes. |
| **COD-288** | Coaching is not the band-pairing shape | A **negative** result, filed so nobody repeats the half hour. Its 2.7 screens is a 1676px act column, not wide-and-underfull bands. Needs folding, which is a content decision. |
| **COD-289** | Two gaps the gates miss | Every browser gate runs with the rail OPEN; and the toggle icon is 3.47:1 on latte (above the 3.0 graphic floor, so not a violation — same as the mic beside it). |

### Owner-only, and genuinely blocked on an account

**0 is fixed.** The client secret was the cause and re-pasting it was the fix —
sign-in now completes and the UI changes. That leaves:

1. **Promote the deployment** and **set the redirect allow-list** — both at the
   top of this file, because until they are done every one of this session's
   fifteen PRs is invisible to anyone but a local build, and a production
   sign-in cannot complete.
2. Supabase → Authentication → **Users**: delete every user with no email —
   the anonymous ones from the RLS test. Journal rows cascade with them.
3. Supabase → Providers → **Anonymous sign-ins → off**. In that order, because
   turning the provider off first leaves the rows behind with no way to make
   another.
4. Click **Continue with Google** on the *production* URL once, after 1. Local
   is confirmed working; production has never completed a round trip.

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
- **COD-304 — hover-to-navigate on the sidebar.** Asked for directly; filed
  rather than built, with five hazards written into the ticket — a 190px rail
  means the pointer crosses up to nine rows on its way anywhere, a navigation
  nobody asked for cannot be undone by moving the mouse back, it strands touch
  and keyboard, `?view=` is a history entry so a sweep fills the back stack, and
  the rail is the one control present on every view. **Prefetch on hover instead
  of navigating** gives the speed with none of it. Recommended, not decided.
- **Four open decisions, deliberately not guessed.** Each one is a question
  about intent, not a missing implementation:
  1. **Seal the Supabase session under the passcode**, the way COD-228 sealed
     the passphrase. A locked device is still signed in. The cost is that
     auto-sync cannot run while locked — the same honest trade COD-228 took.
  2. **Three unbounded per-day `localStorage` key families** (`bujo:focus.*` and
     two siblings) grow one key per day forever and are swept by prefix on
     erase but by nothing else.
  3. **`fscloud` writes `bujo.json` in plaintext** to a user-chosen directory,
     while `bujocloud` encrypts. Both are "cloud sync" in the UI.
  4. **`docker/initdb.sql` ships the default password `'bujo'`.** Local-only
     today, and one `docker compose` away from not being.
- **`Extension 20x5`** in coach session 27 has no muscle mapping, on purpose —
  the coach wrote no qualifier, leg extension and triceps extension are both
  plausible, and guessing puts a muscle on the body map that was never
  prescribed. `coachSessions.test.ts` holds it in `NOT_A_MOVEMENT` with that
  reason, so it is a recorded question rather than a silent gap.
- **Loading a coach session does not pre-fill its reps and sets.** `loadRoutine`
  makes one row per exercise name; the prescription (`4x12`, `pyramid`, `to
  failure`) stays visible in the expanded session and is retyped by hand. Worth
  doing, not obviously — a pre-filled target is also a target you have to clear
  when the day goes differently.

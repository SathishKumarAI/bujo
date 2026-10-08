# STATUS

**Stopped:** 2026-10-08. `main` at `fee85a7`, clean tree. **Five PRs merged this
session** (#348–#352). `npm run verify`: 124 files, **1740 tests**, exit 0.
`a11y` 173/173 with no serious or critical, `smoke` 24/24, `clipped` clean at
1440/1024/390, `design` 419 files, `contrast` 5 themes — all green on `main`.

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
- **Nothing has run against a real Supabase project** — unchanged from the last
  session. The account guards are proven as logic, not behaviour. The
  second-account RLS check is still owed.

## First thing, still: 18 worktrees

`git worktree list` reports **18**. This has been flagged across several
sessions and is still not done, because pruning is a deletion and that is not
mine to take. `git worktree remove` / `git worktree prune`; the newest is
`locked` and needs `--force`.

They are not harmless: a dev server started in one is pinned to it, so a tab on
that port never shows changes made here however hard you reload — and
`vite.config.ts` excluding the path from vitest is a mitigation, not a fix.

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
- One pre-existing lint warning: `src/App.tsx:120:6` `react-hooks/exhaustive-deps`.

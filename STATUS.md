# STATUS

**Stopped:** 2026-10-15, mid-session, on `feat/pullups-review-rail` with a PR
open. `main` at `591c096`. The branch is seven commits and one work item,
**COD-312**.

`npm run verify`: **141 files, 1928 tests**, exit 0. `eslint` 0 errors — the
one pre-existing `App.tsx` exhaustive-deps warning. `design` 441 files,
`contrast` 5 themes / 14 accents.

Browser gates **were** run this time, on the built bundle against
`vite preview` on 4173:

| gate | result |
|---|---|
| `clipped` | **0** across 23 views at 1440 / 1024 / 390 |
| `space -- pullups program` | 1.1 / 1.0 desktop, 2.6 / 1.9 phone — inside budget |
| `a11y` | 187 scans, **7 serious**, exit 1 — **all seven are on `main` too** |
| `subtitle-reach` | 25 unreachable, budget 24, exit 1 — **also red on `main`** |
| per-panel axe probe (throwaway) | **56 scans, 0 serious**, armed with a planted violation |

## Two gates are red on `main`, and that was measured, not assumed

Both were confirmed by building `main` in a throwaway worktree, serving it on
port 4199, and checking the served bundle hash (`index-C4E_uadf.js`) against
this branch's (`index-CECylirg.js`) before believing either number — the
preview-port trap in CLAUDE.md, which has cost this repo three PRs once
already.

- **`a11y`: 7 serious, identical shards on both.** Four are Cycle's
  `<span class="num w-10 text-fg-3" title="Cycle day 20">` at **4.01–4.16**;
  three are Mindset's `style="color: rgb(0,0,0)"` on a brand fill at **3.19
  latte / 3.92 dawn**. Filed as **COD-314**.
- **`subtitle-reach`: 25 against a budget of 24**, the same 25 rows on both.
  Pull-ups contributes **0**.

Neither is in `npm run verify`, which is why both could go red unnoticed —
the same shape as the `design`/`contrast` note further down this file.

## Where the Pull-ups work got to

The page is one act and one bar: zone 2 is the log form alone in the right-hand
act column, and the whole review zone is a single eight-panel `SectionRail`
rendered as a horizontal bar (`railAt="never"`). Measured at `?demo=1`, built
bundle:

| | before | after |
|---|---|---|
| desktop | 1885px · **2.09 screens** | 995–1720px · **1.11–1.91** per panel |
| phone | 3490px · **4.14 screens** | 1761–4158px per panel |
| card headers, 8 views | 23 subtitled, **1075px** | 23 subtitled, **687px** |
| program map, Pull-ups desktop | 377px, 125px cells | **298px**, 104px cells |

Panels, in the order they now appear: Today · Formats · Training set · Form ·
History · Progressions · Principles · Equipment. Ordered for someone about to
train — the leftmost row is the default, so that order decides whether arriving
means doing something or reading about it.

## The next thing

Open the PR's own checklist. Nothing is half-migrated; every commit stands on
its own. If you want one more pass on this page, the honest weak spot is the
**phone**: the bar wraps to four rows (101px) because eight labels do not fit
324px, and the two-column cards cost height on a single-column phone — Formats
went 3.68 → 4.93 screens there while desktop went 1.91 → 1.84. That trade was
taken deliberately (a bar that scrolls hides three of the eight rows), but it
is the thing a phone user would notice first.

---

## START HERE · two things, both yours, both measured today

Both block the feature this session spent the most effort on. Neither is a
code change and neither can be done from here.

### 1 · The migration has not run, and sync cannot work until it does

This is the one that matters. **`supabase/migrations/2026-10-14-journal-in-the-clear.sql`
has never been applied to the live project.** Measured read-only through
PostgREST, which answers `42703` for a column that does not exist and `42501`
for one that exists but is behind RLS:

| `select=` | status | code | means |
|---|---|---|---|
| `data` | 400 | `42703` | **absent** |
| `blob` | 401 | `42501` | present |
| `blob_legacy_20261014` | 400 | `42703` | absent — the rename never happened |
| `nonsense_col` | 400 | `42703` | the control |

The control is what makes the first row trustworthy: a column that certainly
does not exist answers exactly the way `data` does.

**Why this is a hard blocker, not a tidy-up.** `pushAccount` inserts
`{ id, data, updated_at }` and `pullAccount` selects `data, updated_at`
(`src/lib/supabase.ts:344`, `:358`, `:409`). The live table has no `data`
column. So every push and every pull fails `42703`, `AccountSync`'s catch turns
that into `phase: 'error'`, and the card reports "not reaching your account" —
**the entire plain-sync pipeline shipped in #386, #392 and #394 is dead against
the real database.** It works locally only because nothing local talks to that
table.

Run the migration in the Supabase SQL editor. It is safe to run now: #390 fixed
the guard that was blocking it (it counted any non-null `blob` as an encrypted
journal; the one row is 45 bytes with keys `v, note` and null `data`/`salt`/`iv`),
and #391 made it **rename** rather than drop, so the whole thing can be undone
with one statement.

### 2 · The Supabase redirect allow-list no longer has localhost — local sign-in is broken

A regression from the fix applied mid-session. Measured by sending a
`redirect_to` and reading back where the callback actually sends the browser
(Supabase substitutes the Site URL for anything not allow-listed and still
answers 302, so the status code tells you nothing):

| sent | came back as | |
|---|---|---|
| `https://bujo-journal.vercel.app/` | the same URL | **allowed** |
| `http://localhost:5173/` | `https://bujo-journal.vercel.app` | **rejected** |
| `http://localhost:5180/` | `https://bujo-journal.vercel.app` | **rejected** |
| `http://localhost:4173/` | `https://bujo-journal.vercel.app` | **rejected** |
| `https://evil.example.com/` | `https://bujo-journal.vercel.app` | the control |

Localhost is now treated exactly like `evil.example.com`. Production was fixed
and the local entries were removed in the same edit — the earlier version of
this file asked for both and only half survived.

Authentication → URL Configuration → Redirect URLs. **Add back**
`http://localhost:5173/**`, `http://localhost:5180/**` and
`http://localhost:4173/**`, keeping the production entry. 5180 is the port this
worktree's dev server uses; 4173 is `vite preview`, which every browser gate
drives.

---

## What this session did, one line each

**#383 · over-scroll only hides the rail when the rail can scroll.** Reported
as "I can hover on it but I can't click it". A list with nothing to scroll
satisfies `scrollTop + clientHeight >= scrollHeight` — it is at its end because
it is also at its start — and that is the rail's normal state (**699 against
699** on Body at 1503×849). One wheel flick anywhere over the sidebar hid it.

**#384 · a button says it is a button.** Tailwind v4 dropped preflight's
`cursor: pointer` on `button`. **37 of 37 buttons on Today computed
`cursor: default`** against 28 of 28 anchors at `pointer`. No gate can see this.
Fixed with one `@layer base` element rule; 261 enabled buttons verified after.

**#385 · PKCE instead of implicit, and a global sign-out.** The implicit flow
returns the access token in the URL fragment — the least private part of a
browser. `signOut()` defaulted to `scope: 'local'`, so "sign me out" left every
other device signed in.

**#386 · sign in, and the journal syncs — no second secret.** Reverses the
end-to-end encryption on the account path, as asked. The honest statement of
the trade is on screen: *a server that can hand your journal to a brand-new
device is a server that can read your journal.* The cycle log still never
leaves the device, and `egress.contract.test.ts` still fails the build if a new
target forgets.

**#387 · four panes on one screen** — and **#388 replaced it**, because #387
was a misreading. "One section per screen" is not "every section on one screen".
Four 328px columns at 1440 made every card narrower than it gets on a phone.
Rebuilt as a tab row plus `column-fill: auto`; `data @1440` went **2.03 → 1.35**
screens.

**#389 · the Vercel diagnosis was wrong.** The doc claimed the env vars were
unset. They had been set for **124 days**. The real cause was a manually pinned
alias on a 17-day-old build. The wrong answer is kept in the file because the
method that produced it is the lesson: it was reasoned from the deployed bundle
alone and fit every observation while being false. **Ask the deployment what it
is before asking the code.**

**#390 · the migration guard counted any non-null blob as a journal.** It asked
"is something there" when the question was "is this a journal somebody could
still recover". It now tests the same shape `isEncryptedBlob()` does.

**#391 · rename the legacy column instead of dropping it, and free its NOT NULL.**
The rename came from the data-engineering audit; the NOT NULL did not, and it is
the half that would have bitten — a rename carries the constraint, so every
write would have failed `23502` *after* a migration that printed success.

**#392 · give the UI meaning.** Measured across 14 views: **1,414 numbers
printed as plain text against 98 visual encodings — 14.43 to 1**, five views
encoding nothing. Fitness printed 249 numbers and drew zero shapes. The rule,
enforced by the API rather than by review: **a number gets a shape when it has
a range, and not otherwise.** Also fixed three ways sync lost data.

**#393 · the top bar stops being 81% empty.** At 1707 on Insights the strip was
**1489 × 48** holding three text leaves and zero controls, ink ending at x=487
— **1,210px dead, 81.3%**. Filled with where your journal actually is. After:
**24px dead, 1.6%**.

**#394 · the pipeline that makes "signed in" mean "synced"**, and the bar gets
out of the way while you read. It *translates*, never collapses — a collapsing
sticky bar fights Chrome's scroll anchoring and oscillates
(`44 → 39 → 25 → 24 → 15 → 9 → 20 → 35 → 24`).

**#395 · the chrome comes down, and the timer stops dying when you leave.**
21 views now render no bar at all and `--header-h` collapses to 0 on its own.
The focus timer moved to a module store keyed on a wall-clock `endsAt`, so it
survives navigation and a backgrounded tab — it used to live in a component's
`useState` and could only be used by someone sitting watching it, which is the
one thing a focus timer exists to stop you doing.

**#396 · a month is a calendar month, and a calendar shows its dates.** Month
was a trailing five weeks starting in the wrong month, with the day numbers
gated behind `week &&` so it rendered as 40 unlabelled squares.

**#397 · a lapse is not an improvement.** The headline finding of the session —
see below.

**#398 · a month has all its days, and costs a third of the height.** Month
stopped at today (Oct 1–15 on the 15th) because every range shared one
trailing-window loop. And the cells were `aspect-[4/3]`, so height tracked
width: a six-row month was **630px tall**, now **216px** at the same full width.
Pickleball lost its private 3mo/6mo/1yr toggle for the shared control.

---

## The one to read if you only read one: #397

Insights was **congratulating you for giving up**, and it is the clearest
example in this repo of a bug that typechecks, tests green, and renders
beautifully.

Delete five days from a seeded journal and the headline mood moved **5.0 → 6.5
with an up arrow**, with Momentum reporting `Mood +1.5`, `Stress −2.1`,
`Sleep +1.2` — three green improvements, every one of them "you stopped logging
the bad days". Measured in the browser with the lapse planted by hand: it read
**`8/10 ↑`**. With the same days restored, the truth is **`4.5/10 ↓`**. Not
overstated — *inverted*.

`momentumIndicator` required two readings per side and then compared a 2-day
sample against a 7-day one. `weeklyDigest` had no floor at all.

It is the `count ? sum / count : 0` trap in CLAUDE.md one level up: **not a
fabricated zero but a fabricated improvement**, which is worse, because a zero
looks wrong and this looks like progress — and it is delivered at the exact
moment someone is deciding whether to come back.

Now: 4 of 7 days on both sides before any direction is drawn; partial figures
state their coverage (`2 of 7 days`) as text on the card rather than in a
`title` tooltip that does not exist on a phone.

---

## Not verified

- **No browser gate ran this session.** `a11y`, `clipped`, `smoke` and `space`
  are all stale. `CalendarSpan` is a new layout primitive that no gate has seen,
  and removing the top bar changed `--header-h` on 21 views — exactly the kind
  of change `clipped` and `space` exist to catch.
- **Nothing here has been seen in production**, and per blocker 1 the sync half
  of it *cannot* work there yet.
- **The empty state added to Momentum in #397 was seen once**, at one theme and
  one viewport, with the lapse planted by hand.
- **The dimmed future cells in #398 were read at 1440 · latte only.** 0.4
  opacity on `surface0` is the kind of pairing `check-contrast` cannot see,
  because a faded token is not a token (the trap is in CLAUDE.md).
- **`docs/QUESTIONS.md` is from 2026-08-24** and describes a run that is long
  over. It was not touched this session; treat it as history, not as a queue.

---

## Next, in order

1. **Run the migration** (blocker 1), then confirm with the same four-row
   PostgREST probe: `data` should answer `42501`, `blob` `42703`.
2. **Re-add the localhost redirect URLs** (blocker 2), then re-run the
   authorize→callback probe and expect `http://localhost:5180/` to come back
   verbatim instead of substituted.
3. **Run the four browser gates** against a fresh `vite preview`. Install what
   they need first — `playwright` and `@axe-core/playwright` are in neither
   dependency list on purpose (CLAUDE.md).
4. **The Stats "Activity" heatmap** is the last one on a private window. It
   goes through `components/Heatmap.tsx`, buckets on *fixed* thresholds
   (`<2`, `<4`, `<6`) rather than quartiles, and owns the only `DayGridLegend`
   on screen — so converting it is a ramp change plus a legend to re-home, and
   it was deliberately not bundled into #398.
5. **The rest of the ADHD review.** `habitStreak`'s scheduled-days bug
   (`src/lib/stats.ts:215-230`) is the other correctness item and should go
   first; then the comeback line on Today, a shared `since()` relative-time
   helper, the timer end notification and count-up past zero, the phone rail
   timer, palette action commands, un-burying the comeback chip, opening one
   fold per rail view, softening the Focus/Plan shame copy, and the `?`
   cheatsheet.
6. **The typography pass.** Reported as a complaint about fonts and sizes;
   **4 of 7 adjacent type steps measured under 1.2×**, which is the measurement
   behind "it all looks the same weight". Measured, never applied.
7. **Four views still encode nothing** after #392: mindset, coaching,
   pickleball, collections.

---

## Traps this session added to CLAUDE.md's list

- **`cat()` returns mauve for a name it does not know** (`colors.ts:90`), so
  `cat('fg-1')` — a CSS custom property, not a palette key — silently painted
  every unfilled calendar date mauve on a page where mauve means "you trained".
  A fallback that returns a plausible colour hides its own misuse.
- **`maxWidth: 'max-content'` on a grid with no intrinsic content collapses
  it.** The heatmap table went to 8px cells.
- **An `sr-only` element carrying a measured class still measures.** The
  `sr-only` h1 carried `app-header`, so `--header-h` published `10px` on a
  bar-less page.
- **A test that passes on the old code is evidence of nothing.** One of the
  three tests written for #398 did exactly that and was removed rather than
  kept as reassurance, with a note on what a real one would need.

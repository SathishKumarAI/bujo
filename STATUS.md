# STATUS

**Stopped:** 2026-10-15, on `feat/homeworkout-progression-nudge` with **PR #402**
open. `main` at `96c42d4`. Two PRs merged this session, in this order:

| merged | what | item |
|---|---|---|
| `4f3b63c` (#400) | Pull-ups: one act, one bar | COD-312 |
| `96c42d4` (#401) | Home workout: a session carries structured rows | COD-315 |

Both were merged with CI `a11y` red, and that was checked rather than waved
through: the failing rows are **byte-identical to `main`'s** three
(`desktop · mocha · Cycle`, `desktop · latte · Mind · Mindset`,
`desktop · latte · Cycle` — all `color-contrast`, all **COD-314**). Neither PR
put a row on that list.

## The home-workout pass, and the number that moved

The page had 83 movements, a session builder, a 26-week calendar and a
twelve-chapter manual, and **nothing downstream could see any of it.**
`logSession` wrote `sets: ['Push-ups 3×12']` and no `setRows`, and
`fitness.parseSet` needs an `@ <weight>` a home line has never had — so it
returned `null` for every one of them and every muscle, volume and frequency
analytic counted a home session as **zero sets and zero exercises**. Nothing
failed, because zero is a plausible number for someone who does not train at
home.

Measured on the demo journal at `2026-10-15` — 19 home sessions, **270
structured rows where there were none**:

| sets per muscle, 7-day | before | after |
|---|---|---|
| Glutes | 14 | 23 |
| Quads, Hamstrings | 14 | 20 |
| Shoulders, Triceps | 13 | 19 |
| Chest | 8 | 14 |
| Abs | absent | 3 |

Neglected muscles 3 → 2. Four of the top six exercises by 28-day frequency are
home movements that were invisible before. **No count fell** — the rows are
additive, and a figure moving down would have been the bug.

On top of that, **PR #402** (open): the page now reads its own history back
through the `easier`/`harder` chain that 30 of the 83 movements have always
carried, and says what to progress to, with the evidence as text
(`3×12 met in 6 of 6 sessions · best set 12`). Floor of three met sessions, and
a session only counts when **every** set hit the target.

Gates on #402, against the built bundle (`index-Bob97hX7.js`, hash checked
against `dist/index.html` first):

| gate | result |
|---|---|
| `verify` | exit 0 — **142 files, 1945 tests**, eslint 0 errors |
| `design` / `contrast` | 443 files · 5 themes / 14 accents — neither is in `verify` |
| `clipped` | **0** across 23 views at 1440 / 1024 / 390 |
| `a11y`, 2 desktop themes + 1 phone | 3 serious, **all three are `main`'s**; Home workout **0 / 0** |

## What was withdrawn, and why that matters more than what shipped

I planned a `SectionRail` pass on the home-workout review zone, on the strength
of `npm run space` reporting **9.6 desktop screens open**, and wrote that into
#401's body as the next increment. **It was wrong, and the correction is posted
on the PR.** Decomposed per section:

| section, as shipped | desktop | phone |
|---|---|---|
| Today's session (zone 2) | 334px | 421px |
| Analytics | 375px | 388px |
| History | 162px | 162px |
| Exercise library (collapsed) | 80px | 68px |
| Manual (**one chapter of twelve**) | 1272px | 1526px |

The page ships at **2.34 desktop / 3.45 phone**. The ~10 screens is the
83-movement catalogue unfolding from 80px — a catalogue behaving correctly
behind a collapsed card. And this page **already has the rail**: `Manual.tsx`
carries a twelve-row `SectionRail`. The Pull-ups comparison was not
like-for-like, because 2.09 there was a *shipped* number.

The lesson worth keeping: `open` and `shipped` are different questions, and
quoting the first against the second's budget manufactures a fault.

## Filed on the way, all `repo:bujo`

| item | state | what |
|---|---|---|
| **COD-316** | Backlog | `fitness.musclesForExercise` returns **nothing for 32 of 83** home movements (Dead bug, Bird dog, Hollow hold, Burpees, Jump rope, Wall sit…). Four counting sites route through it. `exerciseMuscles.allMusclesForExercise` covers all 83 and already falls back to it — blocked by an import cycle, so the fix is a leaf module. This is what decides whether COD-315's rows land on the right muscle. |
| **COD-317** | Backlog | Two manual rail rows over budget: *How to train* **3.47** desktop / 5.27 phone, *Sources* **3.61** / 4.89, against 1.83–2.28 for the other ten. Also most of the phone fix — the Manual is 1526px of the page's 2911. |
| **COD-237** | open | Commented: Home workout is a **seventh** page where a rail hides its other panels from the a11y gate — 1 of 12 chapters scanned, every run, every theme. |

## The next thing

Merge #402 when CI lands (expect `a11y` red with `main`'s three rows and
nothing else). Then, in order: **COD-316** (it makes COD-315's rows land
correctly), then COD-317. The two unbuilt product pieces are a **set-by-set
execution mode** with a rest timer, and **persisting which kit you own** —
`exercisesForKit` exists and still has no call site, which is why the
progression card has to *explain* that a Goblet squat needs a kettlebell
instead of simply not suggesting it.

---

## START HERE · two things, both yours

Neither is a code change and neither can be done from here. **Re-measured
2026-10-15** rather than carried forward — server and dashboard state has no
commit, and the previous handover carried two blockers that had both already
moved.

- **1 is unchanged**, confirmed today against the live project with the same
  four-column probe below, control row and all.
- **2 could not be re-measured from this session.** The recorded method sends a
  `redirect_to` and reads the `Location` back; against the OAuth `authorize`
  endpoint that header only ever carries Supabase's own callback, and the probe
  that would settle it was declined by the sandbox. Treat it as **unverified
  today** — check it in the dashboard before spending time on either answer.

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

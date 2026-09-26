# Next session

Written 2026-09-26 at the end of the #263–#276 stretch. Read
`docs/PAGE-WORKFLOW.md` first — it is the method these tasks assume, and the
order in it is the part that saves time.

**The job in one line: finish the rollout.** Five pages are on
`SectionRail` and measured; the rest of the app has not had the same pass.
Do the same thing to the pages below, in this order, with the same gates.

---

## 1 · Recovery — the one with tickets already open

Two Plane items say the same thing the measurements do, which is the
strongest signal on the board.

| | |
|---|---|
| **COD-61** | Recovery needs an IA pass: two review sections run 1121px and 1729px, leaving a **2106px dead act column** |
| **COD-49** | Recovery's orient bar repeats the hero it sits above |
| measured | 1.7 shipped / **4.7 open**, 3 top-level groups, 17 cards |

Three groups is *below* the rail threshold (about four), so **do not reach
for the rail first**. Measure, then choose:

- The 3.0-screen shipped/open gap says content is hidden behind folds — the
  Pickleball answer (open them) may be the whole fix.
- The 2106px dead column is the act/review imbalance. **Read the workflow's
  "what does NOT work" section before touching it**: widening and stacking
  were both measured as worse this stretch. The Gym answer — put something in
  the act column that *belongs* to the act — is the one that worked.
- COD-49 is a straight duplication fix and probably ten minutes.

Close both tickets on merge.

## 2 · `focus` and `mindset` — these need a decision, not a primitive

Measured: **3.6 and 4.2 screens, zero disclosure groups, zero cards.** Flat
prose with nothing to group. A rail has nothing to put in it, and that is why
they were skipped rather than forgotten.

Someone has to say what the sections *are* before either can be restructured.
Ask before building. Options worth putting to the user:

- Mindset: the library is already tiled and grouped by category — the rail
  could be the nine categories, and the three bands above it stay.
- Focus: the timer, the log form, and the analytics are three different jobs
  sharing one scroll. The analytics half is the rail candidate.

Do not invent the grouping and ship it.

## 3 · The remaining pages, same pass

None of these is a fold-wall, so each is a measure-then-decide, not a rail:

| view | shipped / open | what the numbers say |
|---|---|---|
| `gym` | 1.9 / 1.8 | 6 groups but already open — no gap to close. Check the dead column instead |
| `today` | 2.3 / 3.2 | 3 groups, 9 cards. The capture page; be careful |
| `plan` | 2.1 / 2.2 | 4 groups, 356k px² dead column — the largest left |
| `cycle` | 2.1 / 3.0 | see item 5 |
| `reading`, `monthly`, `collections`, `nutrition`, `challenges`, `program`, `goals`, `account`, `settings`, `fitness` | all ≤ 2.1 | measured fine. Leave them |

**Do not do a pass for its own sake.** Ten of those pages measured clean; the
workflow's first stage exists to stop exactly that.

---

## Carried over, ranked

1. **`shell/TopBar`'s Quick add is `variant="primary"`** and mounts on every
   view, so it consumes every page's budget and the dev-only `[one-primary]`
   guard warns on any page with one of its own. Verified: Gym warns, Fitness
   does not. The guard is right, its scope is wrong — shell chrome should not
   count against a page. Touches every page, which is why it was filed rather
   than folded into a page PR.
2. **`npm run clipped` is red on `main`** — 9 findings, gym ×4 and cycle ×5,
   byte-identical before and after this stretch so all pre-existing. **COD-95
   claims the gym clipping was fixed**, so either it regressed or these are
   different elements. Find out which before fixing.
3. **Cycle on a phone is 4.2 screens**, ~950px of it a 30-row month list — the
   two-column split is `sm:`. Either it splits at 390 or it folds.
4. **`habitgrids` overlaps `activity` and `habitanalytics`.** Registered
   rather than deleted in #270 so the overlap stays visible; now all three are
   under one heading it wants a consolidation pass.
5. **Pickleball's win-rate forecast prints "100% projected"** from a 71%
   current rate. The maths is a clamped linear extrapolation and its test pins
   the clamp, so it is honest and reads as a promise. Copy problem, not a bug.
6. **`bujo:sync` in plaintext beside `bujo:enc`.** #268 shipped the honest
   warning; the real fix — encrypt it under the passcode key — means auto-sync
   cannot run while the journal is locked. **Product decision, ask first.**

## Board hygiene, do this early

- **Five Plane items sit "In Review" with no open PR**: COD-12, 13, 19, 20,
  21. At least three look already done — Pull-ups *is* a Body tab (COD-13),
  Pickleball *does* use `CalendarHeatmap` (COD-12), and CLAUDE.md records
  `smoke`'s Windows fix (COD-19). Reconcile them; they are distorting the
  board.
- **COD-197** says `npm run a11y` fails on `main`. It has been green on every
  run this stretch. Verify and close if stale.
- **Six findings from this stretch were never filed** — items 1–6 above. Some
  overlap existing tickets (COD-73 covers page length, COD-96 covers gym touch
  targets), so check for duplicates before creating: an empty search result
  from a wrong query reads exactly like an empty board.
- **The Plane MCP server was disconnected at the end of this session.** If it
  is still down, say so rather than assuming the board is unreachable or
  empty.

## Still open from earlier stretches

- **COD-211** intermittent blank document on `?view=settings` in CI. The
  diagnostics are in; it never reproduced locally this session.
- **COD-208** `npm run a11y` dies on "Target crashed" with no partial summary.
- **COD-136 / 137 / 139** — the sync cluster, all untouched and all
  data-integrity: self-host keys rows on `deviceId` so two devices never
  converge; the pull-then-push dance is written four times with four debounce
  values; Drive forgets its token on every reload.
- **COD-116** NoFap's 10-colour urge palette collapses (sky/sapphire dE 5.7 in
  latte).
- **COD-96** 24 controls on `?view=gym` under 44px on a phone.
- **COD-73** "five pages are flat card stacks" — mostly done by this stretch;
  `help` was the survivor and is now 1.3 screens. **Probably closeable.**

---

## Before you start

```
npm run dev -- --port 5300 --strictPort     the UI
npm run build && npm run preview            what the gates drive (:4173)
npm run space -- --all                      where the pages actually stand
```

`vite preview` serves through a service worker and will hand you a stale
bundle — unregister it or use the dev port. And check which worktree a dev
server was started in before concluding a change did not land.

Three servers were left running on 5199, 5300 and 4173 at the end of this
session; the harness stopped tracking them but the node processes survived.
Confirm what a port is serving by its `<title>`, not by it answering 200.

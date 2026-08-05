# Backlog — improvements found

> **All eight were built** on branch `feat/ui-ux-backlog` in a follow-up pass
> (2026-08-05). Each entry below keeps its original text, with the outcome
> appended — including the two places where the entry itself turned out to be
> wrong, which is the part worth reading.

Everything here was a design or feature decision, not a defect. Each entry is
written far enough that it can be picked up as a prompt without re-doing the
observation. Ranked by what it would change for a user.

---

### B-1 · Plan · Week is a migration queue, not a week (F-09)

Twenty task cards × three buttons = sixty controls before the page's second
card, on a tab called Week. Migration is a *review* activity; the week is an
*orient* activity, and the page contract this repo already uses (orient · act ·
review) puts them in different zones.

Sketch: a seven-day agenda in orient, the capture/rule form in act, migration
and chronically-deferred in review. Migration itself compresses to a list with
hover actions and one bulk control, not three buttons per row.

Not done because it is a page-contract rewrite and would collide with anything
else touching Plan. The `page-contract` skill exists for exactly this.

**Built** (`07bbccb`) — rebuilt on three zones with a real seven-day agenda.
Zone 1 carries the agenda *as well as* the fact bar, against the contract's
"one horizontal bar, ~64px": at 62% of the tier the seven columns are ~94px
each and every task title truncates to "Back up p…". The cap exists to stop a
fact bar growing into a stats card; the agenda is a different object, and it is
the thing the page was missing.

### B-2 · Two "Pages read" on one Reading page (F-17)

The top strip says 440, "2026 in books" says 320. Both are true — one counts
in-progress pages, one counts finished books — and neither label says which.
Either qualify both labels or drop one. A number that appears twice with two
values on one screen costs more trust than it gives information.

**Built** (`c113c63`) — qualified rather than dropped: the finished-books one
reads "Pages finished".

### B-3 · Zone-1 facts are set in the mono face (F-07)

Fitness and Nutrition render "203 / 150 min", "1996 / 2000" and "Whenever the
court is free" in the typewriter face while the rest of the page is sans. On
numbers this is defensible — tabular figures line up. On prose ("Target met —
anything you like") it reads as a different app. Suggested rule: mono for
figures and units, sans for sentences.

**Built** (`c113c63`) — the rule became a prop: `StatFact.prose`, set on the
five facts that are sentences. Opt-in rather than a heuristic on the value, so
a fact that is prose says so at its call site.

### B-4 · Charts whose values are all equal draw as all-equal bars (F-18)

"Exercise frequency" in Strength draws eight full-length bars because every
value is 3. Same failure family as the week strip: an encoding out of
resolution. The week strip's answer — print the number — generalises. Worth a
shared rule for the bar-list pattern rather than a per-chart fix.

**Built** (`c113c63`) — but not the way the entry proposed. The bars scale
against *training days*, not against the tallest row, so eight sessions out of
twelve days draws at two-thirds rather than full. A denominator that means
something beats printing the number on top of a saturated bar.

### B-5 · RPE 1–10 is under the touch floor (F-10)

Ten ~30px targets. The pass that met 44px met it for what it touched; this row
and `Segmented`'s default size (31px, ~30 call sites) both predate it. Needs a
visual decision about how much a ten-option row is allowed to weigh, not a sweep.

**Built, and it does not fully land** (`c113c63`) — 44px tall, **38px wide**.
Width cannot reach 44 inside a ~380px act column whatever the row asks for;
that needs a wider column or fewer segments, which is a layout decision and not
a class. Written into the code comment rather than rounded up. `Segmented`'s
~30 other call sites are untouched.

### B-6 · Masonry holes on Insights and Mindset (F-19)

Two-column grids where one column ends 400–600px above the other. Not wrong,
just loose. A column-balanced grid or an explicit `order` would close it.

**Built** (`c113c63`) — a new `MasonryGrid`, kept deliberately separate from
`CardGrid`. The two want opposite things: `CardGrid` preserves reading order,
masonry trades it for a flat bottom edge. One primitive doing both would need a
flag at every call site.

### B-7 · Nutrition's disabled primary action says nothing (F-20)

"Add food" is grey while Calories / Protein / Carbs / Fat are all pre-filled
with the day's running totals. Two problems stacked: a disabled control with no
stated reason, and a form that looks like "add an item" while holding "today's
total". Decide which of the two it is, then label it.

**Built** (`c113c63`) — it was both, so the two jobs were separated rather than
one being chosen. Each is labelled for what it does, and the disabled state now
says why it is disabled instead of leaving the user to guess.

### B-8 · Recovery is still over the two-raised-card cap

Carried from STATUS. Its cards are genuine objects with their own actions, so
the cap and the cards-are-objects rule pull against each other. Needs a call,
not a refactor.

**Built, and the entry's premise was stale** (`d931ff2`). It was written from a
screenshot as "~20 cards, needs grouping into three zones". The Stage 0 audit
found Recovery already on `PageLayout` with all three zones, its review zone
already divided into titled sections, and **ten** cards, not twenty. The
grouping the entry asked for existed before the entry was written.

What was actually left was the cap. Three reference blocks were demoted from
raised cards to plain sections — they were never objects, they were prose
pretending to be. The page still sits at five, above the cap, **on purpose**:
the contract anticipates one page per cluster whose subject really is a
collection of separately-actionable objects, and Recovery is it.

The lesson generalises past this entry: **a brief written from the outside is
often right about the intent and wrong about the nouns** — including one's own,
written yesterday, from a screenshot.

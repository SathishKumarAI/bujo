# Backlog — improvements found, deliberately not built

Everything here is a design or feature decision, not a defect. Each entry is
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

### B-2 · Two "Pages read" on one Reading page (F-17)

The top strip says 440, "2026 in books" says 320. Both are true — one counts
in-progress pages, one counts finished books — and neither label says which.
Either qualify both labels or drop one. A number that appears twice with two
values on one screen costs more trust than it gives information.

### B-3 · Zone-1 facts are set in the mono face (F-07)

Fitness and Nutrition render "203 / 150 min", "1996 / 2000" and "Whenever the
court is free" in the typewriter face while the rest of the page is sans. On
numbers this is defensible — tabular figures line up. On prose ("Target met —
anything you like") it reads as a different app. Suggested rule: mono for
figures and units, sans for sentences.

### B-4 · Charts whose values are all equal draw as all-equal bars (F-18)

"Exercise frequency" in Strength draws eight full-length bars because every
value is 3. Same failure family as the week strip: an encoding out of
resolution. The week strip's answer — print the number — generalises. Worth a
shared rule for the bar-list pattern rather than a per-chart fix.

### B-5 · RPE 1–10 is under the touch floor (F-10)

Ten ~30px targets. The pass that met 44px met it for what it touched; this row
and `Segmented`'s default size (31px, ~30 call sites) both predate it. Needs a
visual decision about how much a ten-option row is allowed to weigh, not a sweep.

### B-6 · Masonry holes on Insights and Mindset (F-19)

Two-column grids where one column ends 400–600px above the other. Not wrong,
just loose. A column-balanced grid or an explicit `order` would close it.

### B-7 · Nutrition's disabled primary action says nothing (F-20)

"Add food" is grey while Calories / Protein / Carbs / Fat are all pre-filled
with the day's running totals. Two problems stacked: a disabled control with no
stated reason, and a form that looks like "add an item" while holding "today's
total". Decide which of the two it is, then label it.

### B-8 · Recovery is still over the two-raised-card cap

Carried from STATUS. Its cards are genuine objects with their own actions, so
the cap and the cards-are-objects rule pull against each other. Needs a call,
not a refactor.

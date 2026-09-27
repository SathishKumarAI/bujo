# Recovery

`views/NoFap.tsx` wires the page: it derives every number from `lib/streak.ts`,
`lib/urge.ts` and `lib/lapse.ts`, owns the rail state, and hands each panel its
data. **`lib/recoveryCards.ts` decides which panel is in which group** — not the
order the JSX happens to be in — and `views/NoFap.test.tsx` asserts the rendered
`data-card` set equals that registry in both directions.

The view was **929 lines**. `CLAUDE.md` puts the ceiling at 500 and the target
near 300; it is **358** now, and everything that left is below.

| Change | File |
|---|---|
| Which group a panel belongs to, its search words, the group labels & blurbs | `../../lib/recoveryCards.ts` |
| The group someone lands on | `../../lib/recoveryCards.ts` (`DEFAULT_GROUP`) |
| Zone layout, the rail, the panel filter, which numbers get derived | `../../views/NoFap.tsx` |
| The hero ring, the milestone bar, the "reset today" note | `StreakRingCard.tsx` |
| The urge form — the submit, chips, intensity, technique, HALT, the log list | `UrgeSurfingCard.tsx` |
| The reset form | `LogResetCard.tsx` |
| "How many times today", per tracked thing | `DayTallyCard.tsx` |
| The in-crisis overlay: timer, breathing pacer, plan lookup | `SosOverlay.tsx` |
| Urges-vs-resets, the signature visual above the rail | `PairedSparkline.tsx` |
| Streak against best, comeback, pace, record-approach copy | `StreakVsBestCard.tsx` |
| Urges resisted as a rate | `SelfEfficacyCard.tsx` |
| Streaks saved | `StreaksSavedCard.tsx` |
| Hours reclaimed, and the hours-per-day rate | `TimeReclaimedCard.tsx` |
| Money saved, and the cost-per-day field | `MoneySavedCard.tsx` |
| Days since the last urge | `CalmStretchCard.tsx` |
| Adding, resetting, removing a tracked addiction; its cost/day | `AddictionStreaksCard.tsx` |
| Urges per week | `UrgeTrendCard.tsx` |
| The 1–5 intensity distribution | `UrgeIntensityCard.tsx` |
| Clean weeks | `CleanRollupCard.tsx` |
| Urges by hour of day, pooled | `HighRiskHoursCard.tsx` |
| The 24-hour clock grid itself — its alpha ramp and cell-text contrast | `HourStrip.tsx` |
| Resets by weekday | `RiskiestDaysCard.tsx` |
| **How many** per weekday, and its trend sentence | `LapseCountCard.tsx` |
| **One addiction's own** how-much / which-days / which-times | `AddictionBreakdownCard.tsx` |
| What a per-addiction panel can honestly claim about *time* | `AddictionBreakdownCard.tsx` docstring, `../../lib/urge.ts` (`urgesLabelled`) |
| Top reset triggers and the gap between resets | `TriggerPatternsCard.tsx` |
| Urges by addiction, and the ten-accent bar palette | `UrgeMixCard.tsx` |
| The quit-date contract and the personal "why" | `CommitmentCard.tsx` |
| If-then trigger plans | `TriggerPlansCard.tsx` |
| The coping technique wording, and their tile grid | `TechniquesBlock.tsx` (`TECHNIQUES`) |
| Which panel takes the whole `CardGrid` row | `../../lib/recoveryCards.ts` (`wide`) |
| The order of the four acts in zone 2 | `../../views/NoFap.tsx` |
| The milestone ladder | `LadderBlock.tsx` |
| The reset log | `ResetHistoryBlock.tsx` |
| A heading-and-hairline section instead of a card | `RefBlock.tsx` |
| Any number any of them shows | `../../lib/streak.ts`, `lib/urge.ts`, `lib/lapse.ts` |

## Rules

**The registry is the page.** Add a panel and you add a `CardMeta` row in
`lib/recoveryCards.ts` and an entry in the `all` map in `views/NoFap.tsx`, in
the same change. Skip either and the test fails — which is the point: on Insights
five habit grids shipped with **no card id**, so the rail could not filter them,
the search could not find them and no count included them, and nothing failed.

**A panel with no data is `false`, not an empty box.** The `all` map's values are
gated (`conversion.total > 0 && <SelfEfficacyCard …>`), the renderer skips
falsy ones, and the rail's count is computed over the same gate — so a group
heading never stands over nothing and a rail row never promises a panel that is
not there.

**Zone 2 is ordered by how often the act happens.** Ring, urge surfing, day
tally, reset. `PRODUCT.md` ranks capture as the product, and the frequent
capture here is riding out an urge — many times a day during a streak, against
a lapse tally and a reset that are rare by definition. Urge surfing used to be
third with its submit under its own four field groups, which put the
most-repeated act on the page **1130px inside a 760px scrollport** at 1440 and
at **y 1613 in an 844px viewport** on a phone. Reordering costs the day tally
its second-from-top spot, and that is the trade: it is one tap either way.

**The submit leads the urge card; the fields follow it.** Every field in that
card is optional on purpose (see its docstring), so it is not a form with a
submit — it is a button with optional annotations, and drawing it the other way
round is what buried it. It is also the page's one `primary`.

**Zone 2 is material; zone 3 is not.** The four act cards are real boxed
`Card`s — fill, radius, `--shadow-raise`, a hover lift. They all used to pass
`band`, the unboxed variant, so the one column where every item is a control
wore the chrome `DESIGN.md` reserves for text. Zone 3 keeps `band`. Act is
material, review is not; that line is the rule, not a per-card taste.

**Cards own actions; blocks do not.** A raised `Card` says *this thing has its
own state and its own actions*. The three `RefBlock`s — techniques, ladder, reset
log — have none, so they are a heading and a hairline. Recovery stays over the
two-raised-card cap on purpose: the urge form, the reset form, per-addiction
streaks, the commitment contract and the trigger plans are five separately
actionable objects, and an abstinence tracker is the one page in the cluster
whose subject really is a collection of those.

**A lapse has a date and no time, and an urge has no addiction.** Both are facts
about `types.ts`, and between them they decide what the per-addiction panel is
allowed to say. `Relapse` carries no timestamp, so "at what time did I lapse" is
not answerable from this record and is not synthesised. `UrgeWin` carries `at`
but no addiction reference — only free-text `trigger` — so the per-addiction
clock is a **name join** (`urgesLabelled`), it can legitimately match nothing,
and `AddictionBreakdownCard` prints its own coverage on every render. The preset
lists do not agree with each other (`ADDICTION_PRESETS` has "Nicotine",
`URGE_PRESETS` has "Smoking"), which is exactly the zero-match case, and the
demo seed reproduces it so both branches are on screen for every gate. Fixing
either honestly means capturing the field — COD-251, not a chart.

**Four components read the store; the rest take derived data.**
`AddictionStreaksCard`, `CommitmentCard`, `TriggerPlansCard`, `UrgeSurfingCard`
and `LogResetCard` own mutations and their own form state, so they call
`useJournal()` rather than taking six callbacks each. Everything else is a pure
function of props, which is what keeps `lib/` the only place the arithmetic
happens.

**`SosOverlay` is why folding the coping list was ever allowed.** The in-urge
version of those techniques is in the overlay, behind a fixed floating button
reachable from any scroll position and outside the three zones for exactly that
reason. A page someone opens mid-urge must not put its coping list behind a
click — so if the overlay ever goes, `techniques` has to come out of the rail and
onto the page.

**One `datalist#urge-presets` for the page, and two zones use it.**
`UrgeSurfingCard` renders it in zone 2; `TriggerPlansCard` lists against it by
id from zone 3. An `id` reference across a file boundary is the kind of link a
split breaks silently, so it is commented at both ends.

**`CardGrid`, never `MasonryGrid`, in this page's review zone.** It measures
**722px** at `tier={1180}`, which is under masonry's `@3xl` (768px) container
step — a masonry there resolves every group to a single column and the class
list cannot tell you. `docs/PAGE-WORKFLOW.md` also records the measurement
against going `tier={1440}` + `stacked` to buy the width: it works, and it costs
1.7 → 3.3 screens.

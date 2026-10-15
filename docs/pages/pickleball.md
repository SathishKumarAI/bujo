# Pickleball

`src/views/Pickleball.tsx` · nav: Body → Pickleball · `?view=pickleball`

## What this page is

Everything pickleball except coaching: log a session, then read what the
sessions add up to. Coaching owns the teaching (`?view=coaching`); this page
owns the record.

## What shipped · COD-328, 2026-10-15

It was the last sport page on the legacy `shell/Page`: a hand-rolled
1.6fr/1fr split, the history list and a practice card beside the form, and the
record on a 13rem side rail under all of it — three layout decisions on one
page, none of them shared with any other page in the app.

### Shape

`PageLayout` tier 1180, the same shell as Home Workout and Pull-ups.

| zone | holds |
|---|---|
| 1 · orient | **one bordered block**: the `nextStep` sentence, four totals, and Today's drill |
| 2 · act | Log a session, sticky 38% column, one primary button, **Hide the log** |
| 3 · review | one bar of five rows, each with its own sub-section chips |

**The rail reads in order, and the default is not the first row.**

| # | row | the question | sub-sections |
|---|---|---|---|
| 1 | Results | am I winning | Form · Margins · Days |
| 2 | Sessions | what did I log, and can I fix that score | — |
| 3 | Activity | am I playing enough, and how hard | Volume · Effort · Cadence · Badges |
| 4 | Matchups | who with, who against, where | — |
| 5 | Competition | entries, DUPR, league results | — |

The page opens on **Sessions**: the order is for finding things, the default is
for the thirty seconds after pressing Log session.

**Results and Activity replaced Performance and Trends**, which were a split by
widget — stat cards in one row, charts in the other — and could not survive the
question "what is the difference?". Each chart now sits beside the figures it
explains.

### The orient block

One line that says what to do next (`nextStep` in `lib/pickleball.ts`), by
priority: `first` → `event` (within 14 days) → `lapse` → `goal` → `milestone`.
It is a button into the panel that answers it, and a paragraph when none does.
Lapse outranks goal because the demo proved the other order wrong: ten days
quiet against a weekly goal of twelve rendered "12 more games this week and you
hit your goal of 12", which is true and useless.

Today's drill shares the block: one of Coaching's twenty-one, chosen by the
date, with the symptom it cures (`DRILL_FIXES`) and a `PracticeTick` writing
into the same key space the manual uses.

### Figures lead back to your entries

Every weekday bar, partner and venue is a button. It opens Sessions filtered to
exactly those rows, where Edit and × already live, and the filter states itself
as a chip you can take off. Asked for as *"I need to be able to edit them as
well, my entries, not the visualizations"*.

## Measured · `?demo=1`, preview server

| | before the pass | after |
|---|---|---|
| desktop landing (1440) | 2568px · 2.85 screens | **1136px · 1.26** |
| phone landing (390) | 4200px · 4.98 screens | **2598px · 3.08** |
| worst panel, desktop, log open | 2.85 | 2.90 (Activity) |
| worst panel, desktop, log hidden | — | **1.92** (Results) |
| review width, log hidden, 1440 / 1920 / 2560 | — | 1110 / 1590 / 1926 |
| cards per row, log open → hidden (1440) | 2 × 353px either way | 1 × 702 → **2 × 545** |
| orient zone | 175px | **135px** + the drill |
| `views/Pickleball.tsx` | 1233 lines | 406 |
| `<details>` in `#main` | 1 (invisible to the a11y gate) | 0 |
| `body.scrollWidth` at 390 | 414 (sideways scroll) | 390 |

**a11y per panel**: `npm run a11y:panels` drives all five rows at five desktop
themes and two phone themes — **35 scans, 0 serious, 0 critical** — and is
armed on a planted violation (`BUJO_CANARY=1` → 8 criticals), because a scan
that silently matches nothing passes. This is COD-237's answer for this page;
five more rail pages still need it.

## Files

| Change | File |
|---|---|
| The shell, zone 1, the log form | `src/views/Pickleball.tsx` |
| The bar, the sub-section chips, Sessions / Results / Activity / Matchups | `src/components/pickleball/Review.tsx` |
| Today's drill | `src/components/pickleball/TodayDrill.tsx` |
| Events, DUPR, leagues | `src/components/pickleball/CompetitionPanel.tsx` |
| The seven charts | `src/components/pickleball/TrendCharts.tsx` |
| The five rail rows and what each says about when to read it | `src/components/pickleball/panels.ts` |
| The container-query card grid | `src/components/pickleball/PanelGrid.tsx` |
| Show-if-selected | `src/components/pickleball/Facet.tsx` |
| Stat cards | `FormCards.tsx` · `SignalCards.tsx` · `MatchupCards.tsx` |
| Every aggregate, and `nextStep` | `src/lib/pickleball.ts` |

## Traps this page paid for

- **A conditional card the demo cannot reach has never been rendered by any
  gate.** Every seeded event was in the past and no session carried a location,
  opponent, level or points — so Matchups showed 1 card of 4 and Results/Activity
  7 of 9, at every theme, on every run. `DEMO_VERSION` 18 → 20.
- **A seeded generator is a shared resource.** Adding `rand()` calls to the
  pickleball seed shifted every number drawn after it and turned a *cycle
  temperature* test red. Derive from the loop index instead.
- **A container query against a missing container is silent.** The drill strip
  sat outside `@container/page`, so its two-column rule matched at no width.
- **A second `grid-template-columns` rule can undo a collapse.** `layout.css`
  caps the act at 32rem past a 1365px container; that rule did not exclude the
  collapsed state, so hiding the log left a 512px empty track at 1920 and 2560
  only — every width below looked correct.
- **A raw `<details>` is invisible to `npm run a11y`** — the third disclosure
  implementation in this repo to learn it.

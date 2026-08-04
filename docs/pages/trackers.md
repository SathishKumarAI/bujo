# Trackers

`src/views/Trackers.tsx` · nav: Habits → Trackers · `?view=trackers`

## What this page is

The habit dot-grid. Eight habits down the left, thirty-one days across the top,
tap a cell to mark a day. Grouped by category, with per-habit stats on each row
and analytics below.

## Measured (1440×900, demo data)

- **1.3 screens.** At a glance (192px) · the grid (727px) · two collapsed
  analytics strips (32px each).
- The grid is a real table: 8 habit rows × 31 day columns + a % column,
  horizontally scrollable inside its card.

## The finding that matters

**P1 · Each habit row carries six unlabelled encodings.** A single row reads:

> `● Caffeine   43%30d   ↺ back 1d ·22   ◆40   D   3/5wk`

That is: a status dot, a 30-day completion percentage, a "back 1d" recovery
marker, a `·22` count, a `◆40` diamond value, a **letter grade**, and a weekly
ratio. Seven values, no column headers, three of them glyph-prefixed
(`↺`, `·`, `◆`) with no key anywhere on the page.

Dense is fine — this is a data surface and density is the point. Dense *and
unlabelled* is not. A reader cannot learn what `◆40` means from the page, only
from the source.

**P1 · The letter grade is the loudest thing in the row and the least
explained.** `D` and `C` next to habits, in a product whose voice elsewhere is
"One thing you're grateful for today". Grading someone's caffeine intake `D` is
a strong editorial choice to make silently.

## UX / IA

**P2 · "At a glance" mixes units without saying so.** `63% today done ·
56 avg consistency · 3d Alcohol · 8 habits tracked`. The second is a score out
of 100 with no `%`; the third is a habit name with a duration and no verb (it
means three days clean). Four tiles, four different grammars.

**P3 · Day / Week / Month + Today** — four view switches above the grid, and the
grid always renders all 31 days regardless. Worth confirming what each does;
from the DOM the month grid is what you get.

## UI

**P2 · The percentage column is at the far right, 31 columns away from the habit
name.** On any screen narrower than the table, the two ends of a row are never
visible at once, so the summary is unreachable while looking at the data.

**P3 · Category headers (`▾ STIMULANT`) are all-caps micro-labels** doing the
job of a section heading inside a table. They work, but they are the only
all-caps element in the content area.

## Copy

**P2 · `↺ back 1d` is a recovery marker written as a keyboard shortcut.** It
means "you broke a streak and came back within a day", which is a genuinely
encouraging thing to say and this is not saying it.

**P3 · "August 2026, tap a cell to mark the day"** is the right subtitle: says
the scope and the interaction in eight words.

## Upgrades, ranked

1. **P1 · Add a key.** Either column headers on the stats block or one legend
   line under the grid. Seven encodings need three lines of explanation.
2. **P1 · Reconsider the letter grade** — or at least explain its scale. A `D`
   with no rubric is a judgement without evidence.
3. **P2 · Pin the habit name and the % column** so a row's label and its summary
   stay visible while the days scroll between them.
4. **P2 · Give the four "At a glance" tiles one grammar** (`56%`, not `56`;
   "Alcohol · 3 days clean", not "3d Alcohol").
5. **P3 · Spell out `↺ back 1d`** — it is a good story told in shorthand.

## Leave alone

- **The grid itself.** This is the page the product is named after and it works:
  fast to scan, fast to tap, scrolls properly on a phone.
- **Category grouping.** Stimulant / intake / practice clusters make eight habits
  legible where a flat list would not.
- **Both analytics groups collapsed.** Correct — the grid is the page.
- **Cell-level `aria-label`s**, which are already in place.

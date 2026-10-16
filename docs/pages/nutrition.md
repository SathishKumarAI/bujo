# Nutrition

`src/views/Nutrition.tsx` · nav: Body → Nutrition · `?view=nutrition`

## What this page is

What you ate, against what you were aiming for. One object — the day's intake,
stored on `DailyMetric` — with its own cadence (several times a day, not once a
week) and one question nobody else on the app answers: **2,000 calories at 30%
protein and 2,000 at 10% are the same number and completely different days.**

It is not a subsection of training, and it used to be one: folded inside the
workout page, its date silently followed whatever day the *workout form* was
set to, so logging yesterday's run moved today's food.

## What shipped · 2026-10-16

### What was wrong, measured

| | before | after |
|---|---|---|
| page, desktop 1440 | 1159px | **945px** |
| page, phone 390 | 3703px | **1380px** |
| act column, phone | 2258px | **41px** (a strip) |
| review zone | 842px, three stacked sections | one bar, three rows |

The act column was taller than the page it fed, on both axes, and the thing a
person came to do — correct the rice they logged twice — was at the bottom of
it, under a picker, a search box and a legend.

### Shape

`PageLayout` tier 1180, `actTop`, the same shell as Fitness, Strength and
Pickleball.

| zone | holds |
|---|---|
| 1 · orient | one bordered block: the `nextStep` sentence, two rings (calories, protein), the day's verdict and the in-target streak |
| 2 · act | **Log what you ate** — search, your usual, two library buttons, a custom food, or the day's totals typed directly |
| 3 · review | one bar: Today · Trend · Patterns |

**The rail reads in order and opens on Today**, which is the row you want in
the thirty seconds after tapping a food.

| # | row | the question |
|---|---|---|
| 1 | Today | what is this day made of, and what is missing from it |
| 2 | Trend | **when** — the shape of the last four weeks against target |
| 3 | Patterns | **why** — which weekday, which foods, which kind of day |

### Trend and Patterns were starting to be the same row

A fair reading, and it was reported as one: *"the trends and patterns are the
same — if so, please combine them"*. They are not the same question, but the
cards had drifted. Trend held the fortnight ledger, the targets **and** the
training/rest split — and that last one is not a movement over time at all. It
is the same fortnight cut by something about the day, which is exactly what the
weekday card does.

So the split is now one question each: **Trend is WHEN, Patterns is WHY.**

| row | holds |
|---|---|
| Trend | the wave · the calendar · the fortnight ledger · your targets |
| Patterns | by weekday · what it was made of · protein and training |

### Two pictures, three windows

| window | for | why not longer, why not shorter |
|---|---|---|
| 14 days | the cards that judge | long enough to mean something, short enough to still be about this week |
| **4 weeks** | the wave | at eight weeks the demo drew thirty points of fifty-six and two thirds of the chart was the time *before* you started logging — which is not a gap in your history, it is not your history |
| **20 weeks** | the calendar | `DayGrid` clamps a fluid cell at ~32px and centres the rest, so twelve weeks is 13 columns centred in a 678px card. Twenty-one columns fill it |

**The wave** (`Day by day`) is an area chart of calories per day with the
target drawn as a **band**, not a line — the five per cent slack the whole page
judges by, so a day one kcal over does not read as a miss. Its subtitle is the
finding: *"613 kcal between your biggest and smallest day · best run inside
target: 7 days"*, and under three logged days it says what is missing instead
of computing a spread from two.

**A break in the line is a day you did not log.** `connectNulls={false}`, and
the series carries `null` rather than `0` for an unlogged day — joining across
it would draw a straight line through a hole and call it a steady week.

**The calendar** (`Calories by day`) is the same `CalendarHeatmap` the training
pages use, with one difference stated in words under it: every other calendar
in this app fills a cell because you showed up, so darker is better. Here
darker is only **bigger**, and a 3,000 kcal day is not an achievement. The
component cannot know that; the caller has to say it.

### The day's log lives in Today, not in the act

Asked for as *"show me log today, right side or inside today… I want to show
that in the today, right before the macro split, so that I can edit them based
upon my requirements"*. It is a **read-back of the day with corrections on it**,
which is review work; in the act it sat at the furthest possible point from the
chip that put it there. It is passed as a `dayLog` slot rather than rebuilt,
because the state it edits belongs to the act and two components deciding
separately what the day holds is how they come to disagree.

The macro split renders **after** it, deliberately: the split is the
consequence, and you cannot judge a ratio you cannot correct.

### The act: four fields side by side, units outside the box

Reported as *"this total formatted well, it's going out of the screen size and
it's overflowing — keep everything side by side, all in four, and show the
calories outside of it, taking only input"*. Measured, both halves were the
same defect in two shapes:

| | before | after |
|---|---|---|
| "Or set the day's totals directly" | four full-width 416px rows, each a 144px input with its unit laid **inside** on a `pr-12` | **four 98px columns in one row** (2 × 158px on a phone), unit in the label |
| "Add a food of your own" | **five 77px columns** on a 1440 desktop, two at 158px on a phone | two at 204px, five only when the column is genuinely wide |

The custom-food grid is the sharper one: it broke on `sm:`, a **viewport**
query, inside an act column that is **424px at a 1440 viewport** — so it got
*worse the bigger the screen*, which is why the report said "going out of the
screen". Both now ask `@min-[24rem]/act` and `@min-[30rem]/act`, with the
container declared on the act `<section>`. This is the trap CLAUDE.md records
from Strength's set row, third instance.

**The title says it is a button.** `Log what you ate · Tap to hide` — a heading
that is secretly a toggle is a feature nobody finds, and a `title` attribute is
invisible on a phone.

### The picker

103 foods (was 48), each with a serving, four macros and a cuisine.

- **Search first.** Two uncapped cuisine rows measured 2,258px of act column on
  a phone. The search reads the name *and* the serving, so "cup" finds
  everything measured in cups.
- **Your usual on top**, built from `topFoods` — what you have actually logged,
  not what the library thinks is popular. This is why "eggs are my most
  favourite" needs no setting.
- **The cuisines are a filter, not two rows**: two buttons side by side with
  their counts, and opening one shows that library in full. Nothing is capped
  inside a group you asked for; the cap is for rows you did not.
- **The calorie weight is three vertical bars**, filled one/two/three, in the
  band's colour, with the band named in `sr-only` text. Height *and* colour
  *and* text — a single dot could only ever be colour, and it was carrying
  three states.
- **The calories sit in their own column**, past a hairline rule, in the mono
  face, so a row of chips is scanned down the number instead of read word by
  word.

### Every logged food can be corrected

`docs/USER-CONTROL.md` rule 1, which this page failed outright: it took input
and gave nothing back.

| affordance | does |
|---|---|
| `−` / `+` | one serving off or on — the row stays |
| `×N` | the serving count, so three helpings of rice is one row |
| Edit | the name and all four macros, inline |
| `×` | takes the food off the day, behind `useConfirm`, naming it |

**The day moves by the delta, never by a recount.** A day's totals can also be
typed by hand, and re-summing the log would silently throw that away — pinned
in `foodLog.test.ts` as *"moves the day by the delta rather than re-summing the
log"*, with a hand-typed 3,000 on it.

Tapping the same chip twice is **a second serving, not a second row**. Asked for
as *"let's say I had a lot of rice today, so I want to add more rice on top of
it"*; before, a day of rice read as three identical rows the review counted as
three foods.

### The targets are settable

They were a module constant with the comment *"a balanced default until targets
are user-settable"*, which nothing ever made true — every ring, tone and
over/under verdict on this page judged the day against a number the person could
not change. Same defect as `fitnessGoalMin` (three readers, no writer), one page
over. `targetsOf(settings)` is now the single reader, so a ring and the sentence
beside it cannot disagree about what they measure against, and `ResetField`
puts each one back.

### Two warnings, and they are different verbs

| when | what | why not the other one |
|---|---|---|
| a food takes the day past the calorie target | `notify.info`, once, on the crossing | going over is a fact about the day, not a mistake — blocking it would be moralising, and the sentence in zone 1 already says it happens |
| a single food claims more than `IMPLAUSIBLE_KCAL` | a confirm that must be answered | that is a typo, and a typo poisons the fortnight's mean |

Asked for as *"try to give me a warning if I exceed the total number of
calories"*. It fires on the crossing only — a warning on every chip after it is
a warning nobody reads.

## The arithmetic

`src/lib/nutritionReview.ts`, 16 tests, armed against a planted violation.

| export | answers | floor |
|---|---|---|
| `targetsOf` | what this person is aiming at | — |
| `loggedDays` | the fortnight, days actually logged | — |
| `averages` | daily mean, days inside target | **`null`** when nothing is logged |
| `weekdayIntake` | which weekday goes wrong | — |
| `topFoods` | what you eat most | — |
| `inTargetStreak` | days in a row inside target | today-not-yet-logged does not break it |
| `trainingBalance` | what training days ate vs rest days | **3 days each side** |
| `nextStep` | the one sentence at the top | total — always returns one |

Two floors worth naming. `averages` returns `null` rather than `0`, because
`count ? sum / count : 0` makes "no data" indistinguishable from "you ate
nothing" — the trap CLAUDE.md records from Insights. `trainingBalance` needs
three days on **both** sides, because a two-day sample compared against a
twelve-day one is the fabricated-improvement bug from the same file.

## Gates

| gate | covers this page |
|---|---|
| `npm run verify` | tsc, 2051 tests, eslint, build |
| `npm run design` / `contrast` | both green; neither can see a wash under an accent |
| `npm run clipped` / `smoke` | 23 views at 1440, 1024, 390 |
| `npm run a11y:panels` | **all three rows** — a rail row has no `aria-expanded`, so `openFolds` cannot reach the other two, and `clipped-text` cannot either: the truncated food names on Patterns were found by hand, not by a gate |

The last one is COD-237's shape: putting a page on a rail makes the a11y gate
cover *less*, and the fold count reads it as an improvement. Arm the panel gate
for a page's rows in the same change that gives it a rail.

## Where to look

| Change | File |
|---|---|
| the one sentence, the rings, the day's verdict | `views/Nutrition.tsx` |
| any arithmetic, any floor | `lib/nutritionReview.ts` |
| the food library, a serving, a cuisine | `lib/foods.ts` |
| add / edit / remove a logged food | `lib/foods.ts` (`withFood*`) |
| the chips, the search, the band bars | `components/nutrition/FoodPicker.tsx` |
| the day's rows and their editor | `components/nutrition/DayLog.tsx` |
| which row holds which card | `components/nutrition/{panels.ts,Review.tsx}` |
| a card's internals | `components/nutrition/Cards.tsx` |
| the macro bar | `components/nutrition/DayCards.tsx` |
| the wave or the calendar | `components/nutrition/Charts.tsx` |
| the series behind them, and its windows | `lib/nutritionSeries.ts` |
| a food of your own | `components/nutrition/CustomFood.tsx` |
| the barcode / external lookup | `components/nutrition/FoodSearch.tsx` |

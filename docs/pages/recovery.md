# Recovery

`src/views/NoFap.tsx` · nav: Wellbeing → Recovery · `?view=nofap`

## What this page is

An opt-in abstinence tracker. A main streak with a milestone ladder, an
urge-surfing tool (pick the urge, rate the intensity, choose a coping action),
a HALT check, a judgement-free relapse log, and a full-screen SOS overlay.

This is the most sensitive page in the product and, on the whole, the most
carefully written. The notes below are about structure, not tone.

**It is also the only page with a privacy mode.** `Settings → Account →
Discreet labels` swaps the explicit words for neutral ones on screen; see the
section below for what that is and — more importantly — what it is not.

## What shipped · COD-334, 2026-10-16

The three-zone contract pass, plus nine rounds of reported changes while it was
open. Measured at `?demo=1` before and after, with the served bundle hash
checked against `dist/index.html` each time.

| | before | after |
|---|---|---|
| page, desktop 1440 | 1,653px · 1.84 screens | **1,129px · 1.25** |
| page, phone 390 | **5,116px · 6.06 screens** | **1,581px · 1.76** |
| act column, phone | **2,822px** | **41px** (a strip) |
| zone 1 | 53px of four bare figures | one card: sentence, ring, four facts |
| `Patterns` row, desktop | 4,063px · 4.51 screens, 9 cards | one card at a time |
| `views/NoFap.tsx` | 416 → **613** lines mid-pass | **433**, zone 3 its own module |

### Shape

`PageLayout` tier 1180, **`actTop`**, the same shell as Nutrition, Fitness and
Strength.

| zone | holds |
|---|---|
| 1 · orient | one card: the `nextStep` sentence, the ring, and the four facts the ring does not say |
| 2 · act | **one card, three tabs** — An urge · It happened · A reset |
| 3 · review | one bar: Win or loss · Progress · Patterns · Plan · Reference |

**`actTop` was one change that answered two reports.** Without it zone 1 spans
the full 1,180px shell and the act begins below it, so the hero is a wide strip
and the logging panel is a scroll down on every visit. With it, zone 1 takes
only the review column's width and the act runs from the top of the page —
*"shrink it to the left side, and move the log to the top"* is a single prop.

### The act is one card, not three

It was three stacked cards: an urge form with ~20 chips, a day tally with four
streaks and five quick-amounts each, and a reset form. All open, all the time,
three borders and three headings deep.

They are three **different** acts and in the moment they are mutually
exclusive. `LogCard` is one card with one chooser, opening on the urge —
`PRODUCT.md` ranks capture as the product and the frequent capture here is
riding one out. The card carries no title: the zone-2 heading above it already
says "Log an urge or a reset", and that heading is the toggle that hides the
column, so it cannot move.

**One picker, not two that overlapped.** "Which one?" listed the addictions you
track (binding the streak — COD-251) and "What is it?" listed twelve generic
presets, with `Nicotine`, `Porn` and `Doomscrolling` in **both**. The most
common answers were asked for twice and the difference between the rows — one
sets an id, one sets text — was invisible. Now one row, tracked things first,
and the streak is **inferred** from what you pick.

**Intensity is five buttons.** A range input needs a drag to the right pixel to
say "4" and reports the answer in a readout beside it; five targets need one
tap and show it on the thing you pressed. Each carries its word — *Faint ·
Mild · Moderate · Strong · Overwhelming* — because a 1–5 nobody was told the
ends of is a number on no scale.

### One card at a time, in the review

`CardDeck` (§30) — native scroll-snap, one card in view, the rest a swipe away.
Measured on `Patterns`, nine cards:

| | review | screens |
|---|---|---|
| grid | 4,063px | 4.51 |
| a deck per category | — | **worse: 4,583px page** |
| one deck, chips narrow it | — | **1,130px page · 1.35** |

The middle row is the finding: *show one card* means **one track**, with the
categories deciding what is in it.

### Discreet mode

A display swap behind a toggle nested under the Recovery switch: `Porn` →
`Pattern A`, `Nicotine` → `Habit N`. It is the one privacy idea that changes
whether somebody logs honestly at all — this page asks people to record the
worst ninety seconds of their day, and a person who has to check the room first
logs vaguely or not at all.

**It says what it is not.** Nothing stored changes, exports keep the real
names, habits you named yourself are left alone, and the hint points at the
passcode for actual security. A privacy control that oversells itself is worse
than none.

### The coping content

`lib/coping.ts`, points not paragraphs, every claim carrying a reachable
source — the only content in the app that makes a claim about the world rather
than about the reader's own numbers.

| | what the evidence says |
|---|---|
| **Surf the urge** | Marlatt's Relapse Prevention, formalised into MBRP. College smokers cut how much they smoked by about a quarter *while their cravings stayed just as strong* — the skill changes what you do, not what you want |
| **Cyclic sighing** | the Stanford trial that beat two other breathing patterns *and* mindfulness meditation on mood and resting breathing rate, measurable after one five-minute session. Shipped as a working timer |
| **Move, right now** · **HALT check** | the same relapse-prevention literature |

**"Is it okay to start again" has a named mechanism, not reassurance.** The
*abstinence violation effect*: what turns one slip into a relapse is the
response to it — self-blame, then giving up — rather than the slip. Which is
also why this app logs a reset *with a reason* and keeps your total clean days:
both point at the situation instead of at the person.

**`What a reset costs today`** shows the run you would give up, the milestone
that moves and the record you were chasing — beside, at the same size and in
green, the clean days you keep regardless. Both halves always: a card that
shows only the loss is the abstinence violation effect with a chart on it.

### Six defects found on the way, all pre-existing

1. **`Math.max(undefined, …)` is NaN.** A journal with no stored `best`
   rendered **"Personal best NaN"**, and every comparison against NaN being
   false made `recordApproach` report `far` on a streak that was a record.
2. **"Past your old record" would have been permanent and false** for anyone
   who has never reset — `best` is `max(stored, current, longestGap)`, so with
   no relapses current IS best, every day.
3. **The signature chart drew bars only where there was no data.** A percentage
   height against a flex child with no height resolves to 0, so every real bar
   computed to **0px** while the zero-weeks' absolute `6px` stubs were the only
   thing that drew.
4. **The ring read 13% at 16 days** under a line saying "One month · 14 days to
   go": it measured from the *previous* milestone. It now measures to the
   milestone the card names — **53%** — which also stops it jumping backwards
   on the day you reach a rung.
5. **"Lonely most often · 6×"** printed above `Lonely 6 · Tired 6`. The
   headline read `rows[0]` of a descending sort, so the winner was decided by
   declaration order. There is no honest tie-break: it says `Lonely & Tired
   tied on 6×`.
6. **The reset history was read-only**, on the page's most consequential
   record — a `×` that deleted on the first click, which is word for word the
   failure `USER-CONTROL.md` was written after.

### And one duplicate chart

"Urges logged vs resets" sat above the rail on every row and drew
`urgeTrend.weeks` — the series `UrgeTrendCard` already draws, over the same
eight weeks. Reported as *"move it, it's a waste of space"*; moving a near-copy
would have kept the duplication. Its one extra signal, a marker on weeks
containing a reset, is a `ReferenceDot` on that card now, and
`PairedSparkline` plus `lib/sparkBars.ts` are deleted.

Its y axis existed and was invisible — `width={30}` behind a `left: -24` margin
puts the ticks off the canvas.

## Gates

| gate | covers this page |
|---|---|
| `npm run verify` | tsc, 2,129 tests, eslint, build |
| `npm run a11y:panels` | **all five rows, and every card of every deck** — the gate presses Next to the end of each one, printing `9/9` beside the fold count |
| `npm run a11y` | 187/187 across 12 shards |
| `design` · `contrast` · `clipped` · `smoke` | all green |

**Arming the panel gate for this page was overdue.** COD-237 named Recovery as
one of six pages a rail made *less* visible to `npm run a11y`, and it stayed
unarmed through its own rail pass — so five groups had been graded by the one
the page opens on. It found 32 `label-content-name-mismatch` violations the
main gate could not see.

## Where to look

| Change | File |
|---|---|
| the sentence at the top | `lib/recoveryStep.ts` |
| which card is in which group, and the Patterns facets | `lib/recoveryCards.ts` |
| the rail, the filter, the chips, the deck | `components/recovery/Review.tsx` |
| the three logging acts | `components/recovery/LogCard.tsx` |
| an urge's form | `components/recovery/UrgeSurfingCard.tsx` |
| the urge record, its tallies and its editor | `components/recovery/UrgeHistoryCard.tsx` |
| the reset record and its editor | `components/recovery/ResetHistoryBlock.tsx` |
| what a reset costs, and the coping content | `components/recovery/{ResetCostCard,CopingChapter,BreathingCard}.tsx` + `lib/coping.ts` |
| the label swap | `lib/discreet.ts` |
| where a streak restarts after an edit | `lib/streak.ts` → `restartFrom` |

## What shipped · COD-23, 2026-08-28 — superseded by the pass above


Recovery became the census outlier once Coaching was rebuilt: **6.33 screens at
1440 and 6.33 at 1600**, the tallest page in the app.

| | Before | After |
|---|---|---|
| Height @1440 | **6.33 screens** (5,696px) | **4.15** (3,733px) |
| zone 3 blocks, open | 18 | 15 |

**The fix was not the one the census implied.** Its "0 folds" reading was read
— by me, in a handover note — as "no structure at all". That was wrong.
Recovery was already on `PageLayout` with three zones, and zone 3 was already
grouped into four named sections. Nothing was restructured here.

What was actually wrong is that two of those four sections had no business
being open:

- **Setup · 724px.** The commitment contract (292px) and the if-then trigger
  plans (432px) — configuration you write once and read back rarely. Something
  you told the app, not something it learned about you.
- **Reference · 869px.** The coping list, the milestone ladder and the reset
  log. Static guide content.

Both are now closed `CollapsibleSection`s with a `stickyKey`. The 13 analytics
cards between them stay open, which is the rule this directory states.

**Folding the coping techniques does not touch the crisis path**, and that was
checked before doing it rather than assumed: the in-urge version lives in
`SosOverlay`, behind a fixed floating button that is reachable from any scroll
position and deliberately sits outside the zones. Were that not true this fold
would be wrong — a page someone opens mid-urge must not put its coping list
behind a click.

**A real contrast bug fell out of it.** `HighRiskHoursCard` drew its hour labels
in `overlay0` on the empty-cell `surface0` at 10px: **2.57:1**, against a 4.5
floor. Same pairing, same number and same cause as the Stats mood calendar and
this page's own milestone chips — the fourth instance. Only the four
`hour % 6 === 0` cells print a digit, so it showed as 12pm and 6pm whenever
those hours had no urges.

`npm run a11y` had reported this page clean for its entire existence, because
**the gate seeds an empty journal** (`scripts/a11y-axe.mjs:177`) and the card is
behind `{peakHour && …}` — it never rendered. Filed as **COD-28**; that hole
covers most of the analytics in the app, not just this card.

Verification: `node scripts/verify-folds.mjs nofap`, which loads `?demo=1`,
opens every fold and re-runs axe at 1440 and 390.

## Measured (1440×900, demo data) — **2026-08-02, superseded**

- **2.3 screens.**
- **One top-level block, 2,059px tall.** The entire page is a single card.

## The finding that matters

**P1 · The page has no structure — it is one 2,059px card.** Streak ring, four
stat tiles, milestone preview, ten urge chips, an intensity control, four action
buttons, a HALT check with four toggles, and the resisted-urges log all live in
one container. There is no visual break between "here is how you are doing" and
"here is what to do right now", which are two very different moments.

Someone opening this page mid-urge has to scroll past their own statistics to
reach the tool that helps. Splitting into *Where you are* / *Right now* /
*History* would take nothing away and would put help first.

**P2 · Ten urge chips of very different weight, side by side.** Porn ·
Masturbation · Smoking · Vaping · Alcohol · Junk food · Sugar · Doomscrolling ·
Gaming · Caffeine. Presenting a pornography compulsion and a caffeine habit as
peer options in one row flattens the seriousness of the first and inflates the
second. Grouping, or letting the user choose which appear, would respect both.

## UX / IA

**P2 · Only the SOS overlay is reachable fast.** SOS is at the very top, which
is right — but everything else that helps in the moment (urge surfing, HALT,
"delay 10 min") is 800px down. In a crisis the page's structure is the
intervention.

**P3 · "Other urges (smoking, scrolling…) are logged + planned below"** — the
page explains its own information architecture to the user, which is usually a
sign the architecture needs the explaining.

## UI

**P2 · The streak number is the page's best asset and shares a screen with
everything else.** `16 · DAYS CLEAN · since Fri, Jul 17` with a ring, then
immediately four more numbers (`16 Current · 24 Personal best · 58 Total clean
days · 8 Urges resisted`). The 16 appears twice within 200px.

**P3 · "Intensity 3/5"** sits between the chips and the actions with no anchors,
unlike Focus's sliders which say `0 scattered · 10 deep flow`. What does 5 mean.

## Copy

**Excellent, and the reason this page works.** *"Feeling an urge? Pick what it
is and mark the win, it crests and passes in minutes."* — accurate, calm,
actionable, no shame. *"Confidence and motivation climb noticeably"* as a
milestone preview gives the streak a reason beyond the number. The HALT check
(Hungry / Angry / Lonely / Tired) is a real technique, correctly used.

**P3 · "Your main streak"** implies secondary streaks that the page then says
are "logged + planned below" — two sentences to explain a hierarchy the layout
could show.

## Upgrades, ranked

1. **P1 · Split the single card into three sections** — *Where you are*,
   *Right now*, *History* — and put *Right now* first when an urge is logged
   recently.
2. **P2 · Group or curate the urge chips** rather than listing ten as equals.
3. **P2 · Show the streak number once.**
4. **P3 · Anchor the intensity scale** (`1 passing · 5 overwhelming`).
5. **P3 · Let the layout express the main-streak hierarchy** so the explanatory
   sentence can go.

## Leave alone

- **The tone.** Judgement-free, specific, practical. This is the hardest writing
  in the app to get right and it is right.
- **SOS at the top**, always reachable.
- **The HALT check.** Real technique, correctly implemented, no embellishment.
- **Milestone previews with a quoted benefit** — this is what makes a streak
  mean something.
- **Opt-in, local-only.** Correct default for this content.

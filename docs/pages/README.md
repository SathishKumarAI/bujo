# Page audits

One file per page. Each was written while looking at the page in a browser with
the demo dataset loaded — not read out of the source — so the findings are about
what the product *feels* like, not what the code says.

**The question each file answers:** what stands between this page and something
a person would pay for?

## How to read a file

| Section | What it holds |
|---|---|
| **What this page is** | One paragraph. If this is hard to write, that is itself the finding |
| **Measured** | Numbers from the live page: height in screens, block order, counts |
| **Copy** | Wording, tone, voice, labels, empty states |
| **UI** | Type, spacing, colour, density, hierarchy — how it looks |
| **UX / IA** | Order, flow, what is where, what a user is trying to do |
| **Upgrades** | Ranked P1 / P2 / P3, each with the reason |
| **Leave alone** | What already works, so a later pass does not "fix" it |

**P1** = a person notices this on first visit · **P2** = noticed by a returning
user · **P3** = polish, worth doing when nearby.

## Method

- Demo data (`?demo=1`), desktop 1440×900 and phone 390×844.
- Navigate by clicking the real nav. This router ignores `popstate`, so a
  URL-driven sweep silently re-measures whatever view is already mounted.
- Numbers come from the DOM, not from estimating against a screenshot.

## Pages

| Cluster | Pages |
|---|---|
| Journal | [Today](today.md) · [Plan](plan.md) · [Monthly](monthly.md) |
| Fitness | [Fitness](fitness.md) · [Pull-ups](pullups.md) · [Home Workout](home-workout.md) |
| Sports | [Pickleball](pickleball.md) · [Coaching](coaching.md) |
| Habits | [Trackers](trackers.md) · [Challenges](challenges.md) · [Focus](focus.md) |
| Wellbeing | [Mindset](mindset.md) · Cycle¹ · [Recovery](recovery.md) |
| Library | [Collections](collections.md) · [Reading](reading.md) · [Goals](goals.md) |
| Review | [Insights](insights.md) · [Stats](stats.md) |
| System | [Settings](settings.md) · [Account](account.md) · [Help](help.md) · [Welcome](welcome.md) |

¹ Cycle is opt-in via Settings → Profile and is absent from the nav on a default
profile, so it has not been audited.

---

## The patterns that repeat

Twenty-one pages in, the same handful of problems account for most of what is
wrong. Fixing them as *patterns* is worth more than fixing them page by page.

### 1 · Reference content is open, personal content is collapsed

Pickleball keeps ~1,000px of static physio notes and format playbook expanded
while collapsing all four analytics groups built from the user's own data.
Stats — subtitled "Charts at a glance" — renders **zero charts** because all six
chart groups are shut. Focus keeps a near-empty History open and its analytics
closed. The rule to apply everywhere: **what the app learned about you outranks
what the app can tell everybody.**

> **All three examples are now fixed** (census, 2026-08-27): Pickleball 4 folds
> / 4 open / 5 charts, Stats 6 / 6 / 6, Focus has no folds at all. The rule
> still holds and is worth keeping; the evidence for it is gone, and it was
> being read as a work queue. The one page that still matches the *shape* is
> **Coaching** — fourteen folds, none open — but not the substance: what is
> folded there is technique reference, not the user's own data, so it is
> pattern 3 rather than this one.

### 2 · The same number, said several different ways

Challenges reports progress four times with four numbers (`Day 4 of 75`, `5 of
75 days done`, `70 to go`, `9/75 Elapsed`). Goals says "1 of 7 on track" and
"53%" in one card. Recovery prints the streak twice within 200px. Each is
individually defensible and collectively reads as an app that cannot count. In a
paid product, numbers agreeing *is* the trust.

### 3 · Rows of identical collapsed drawers

Insights has seven, Coaching six, Pickleball four. Same height, same chrome,
names that do not predict their contents ("Deeper signals", "Domain digests",
"Mood views"). Collapse is the right instinct; an undifferentiated stack of
drawers is not navigation.

> **Re-counted 2026-08-27, and it moved in both directions.** Insights has
> **none** — its nine analytics panels moved to Stats in `733df32` and the
> drawers went with them. Pickleball's four are all open. **Coaching has
> fourteen, all shut, across 5.8 screens** — the audit recorded six, so the one
> page this pattern still describes is more than twice as bad as the number
> being quoted for it. It is the largest single instance left in the app and
> nothing has been filed against it.

### 4 · Density without a key

Trackers packs seven encodings into every habit row — `43%30d ↺ back 1d ·22
◆40 D 3/5wk` — with no legend anywhere. Monthly layers dots, a ribbon, a star
and a mood tint under a subtitle that explains one of them. Dense data surfaces
are correct for this app; unexplained ones are not.

### 5 · Empty cards at full height

Pickleball's DUPR card is 266px of "nothing logged yet". Goals' Custom goals is
411px of empty, larger than the roll-up above it. Home Workout is *entirely*
empty in the demo — the shop window — and its one instruction points at a
collapsed drawer 500px away.

### 6 · Two voices

"Nine-Tails Sprint Protocol · Legendary" and letter-grading someone's caffeine
`D`, against "One thing you're grateful for today" and Recovery's careful,
shame-free writing. Both voices are executed well. A premium product picks one.

---

## What is already excellent

These are the app's assets. Any redesign should protect them and copy them
outward, not sand them down.

| Where | What |
|---|---|
| Coaching | `Today: Rest or wall` — one specific instruction plus the week's shape. The best pattern in the product; Today itself does it worse |
| Reading | `On pace for 2 · behind goal`, and `At this pace, done by Tue, Aug 11` — the only place that closes the loop from what you did to where it lands you |
| Settings | The encryption, weather and backup paragraphs. Mechanism, trade-off and consequence, no hedging |
| Insights | "A 1-minute Sunday ritual: clear overdue tasks, see what slipped, and write one reflection" |
| Collections | "Inbox zero. Nothing dateless waiting to be sorted. ✨" |
| Stats | "Every day you showed up" |
| Focus | Sliders with anchors — `0 scattered · 10 deep flow` |
| Recovery | The whole tone, and the HALT check |
| Fitness | The weekly ring — `382 / 150 min · Goal met 🎉` |

## Layout system

Content flows into a **three-column card grid** — see
[`../redesign/12-three-column-grid.md`](../redesign/12-three-column-grid.md).
1 column on phones, 2 to 1535px, 3 above; `SPAN_2` for tables and wide charts.
(`SPAN_ALL` is gone — see the correction in `12-three-column-grid.md`.)

**The "4.2 → 2.6 screens" claim for Pickleball did not survive re-measurement.**
It is 5.92 at 1440 and 5.15 at 1600 (census, 2026-08-27) — taller than the 4.2
the grid was supposed to have reduced. Mindset, quoted as 2.4 → 2.0, is 3.29.
Both pages gained content after the conversion, so the grid is not necessarily
failing; the *claim* is, because it was written as a permanent result rather
than a measurement of one afternoon. Any height in this directory that is not
dated to a census run should be treated as folklore.

## Page census — **measured 2026-08-27**, `node scripts/page-census.mjs`

Every routable view, demo data, tallest first. `folds` counts section headers
with `aria-expanded`; `open` is how many of them are open before you touch
anything; `charts` is Recharts surfaces in the DOM on first paint.

**Re-run it rather than quoting it.** The table this replaces was quoted for
weeks and had drifted by up to 4.3 screens — it sent a session at Today (listed
3.5, actually 1.2) and left Coaching alone (listed 1.5, actually 5.8).

| @1440 | @1600 | Page | Folds | Open | Charts |
|---|---|---|---|---|---|
| **6.33** | 6.33 | Recovery (`nofap`) | 0 | – | 3 |
| **5.92** | 5.15 | Pickleball | 4 | **4** | 5 |
| **5.80** | 4.27 | Coaching | **14** | **0** | 0 |
| **5.21** | 4.38 | Stats | 6 | **6** | 6 |
| **4.67** | 4.67 | Gym | 3 | 3 | 4 |
| **4.47** | 4.47 | Help | 1 | 1 | 0 |
| **3.29** | 3.29 | Mindset | 0 | – | 0 |
| **3.04** | 3.04 | Focus | 0 | – | 0 |
| **2.74** | 2.74 | Trackers | 7 | 5 | 2 |
| **2.65** | 3.00 | Home workout | 0 | – | 0 |
| **2.22** | 2.22 | Cycle | 1 | 0 | 1 |
| **2.10** | 2.10 | Pull-ups | 6 | 0 | 0 |
| **2.08** | 2.08 | Plan | 4 | 1 | 0 |
| **1.96** | 1.96 | Monthly | 2 | 1 | 0 |
| **1.82** | 1.82 | Reading | 3 | 0 | 0 |
| **1.62** | 1.62 | Program | 0 | – | 0 |
| **1.52** | 1.52 | Collections | 1 | 0 | 0 |
| **1.41** | 1.41 | Challenges | 1 | 1 | 0 |
| **1.30** | 1.28 | Insights | **0** | – | **0** |
| **1.22** | 1.22 | Nutrition | 0 | – | 0 |
| **1.21** | 1.21 | Today | 2 | 0 | 0 |
| **1.06** | 1.06 | Goals | 0 | – | 0 |
| **1.03** | 1.03 | Fitness | 1 | 0 | 0 |
| **1.00** | 1.00 | Account · Settings | 0 | – | 0 |

Height is not quality, but the outliers are still where the structural problems
live. On this census the outlier is **Coaching**: fourteen folds, none open, and
5.8 screens of chrome to scroll past to reach any of them.

The two columns differ only where a page has enough cards to use the third grid
column at ≥1536px. Where they are equal, the page is a single stack and the grid
is doing nothing for it — Mindset, Focus, Recovery and Help are each over three
screens with that column unused.

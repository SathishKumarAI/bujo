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

## Page heights, for reference

Shortest to longest, at 1440×900 with demo data. Height is not quality, but the
outliers are where the structural problems live.

| Screens | Page |
|---|---|
| 0.9 | Reading · Plan · Challenges · Home Workout · Settings |
| 1.0 | Goals · Account |
| 1.3 | Trackers · Monthly · Collections · Stats · Help |
| 1.5 | Insights · Coaching |
| 1.7 | Fitness · Pull-ups · Focus |
| 2.3 | Recovery *(one 2,059px card)* |
| 2.4 | Mindset *(one 1,575px card)* |
| 3.5 | Today |
| 4.2 | Pickleball *(12 blocks)* |

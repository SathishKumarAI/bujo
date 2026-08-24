# 17 · What Insights is for

**Date:** 2026-08-24 · **Ticket:** BUJO-281 · **Decision:** split by question

BUJO-281 read as "Insights has too many cards". The audit found something
larger, and it is the reason the ticket said *decide before coding*.

## The audit

Insights' zone 3, as shipped:

| Fold | Cards | Has its own actions? |
|---|---|---|
| *(open)* | Weekly digest, Coach digest | no · link-out only |
| Correlations | Patterns, Momentum | no |
| Mood analytics | Best & worst day, Weekday vs weekend, Mood stability | no |
| Habit analytics | Habit mood impact, Consistency score, Month over month | no |
| Domain digests | Pickleball | link-out only |
| Lifetime | Year in review, Index, Personal records | Index navigates |
| Tag manager | TagManager | **yes** — merge, rename, retire |

**Eleven of the sixteen have no actions at all.** By the contract's own test — *a
raised card wraps a thing with its own actions and its own state; a region of a
page gets a heading and a hairline* — those are regions wearing card chrome. So
most of the count is a rendering mistake rather than sixteen real objects.

## The finding the ticket did not have

**`Stats` is also a six-drawer cabinet**, and it holds the same subjects:

| Insights fold | Stats fold |
|---|---|
| Mood analytics | Mood views · Sleep & mood |
| Habit analytics | Habit timing |
| Lifetime → Personal records | Achievements |

Stats' own subtitles already say what it is — "see Trackers for live metrics",
"see Fitness for live logging" — and the nav already files Stats *underneath*
Insights. Two read-only analytics pages, six folds each, overlapping subjects.

Restructuring Insights alone would have moved drawers between two cabinets and
reported the count as fixed.

## The decision

**Each page answers one question.**

- **Insights — "what changed, and what do I do next?"** The weekly digest, the
  coach, correlations, and search. Things the app worked out that you did not
  already know.
- **Stats — "what is the record?"** Every chart and every total, read back.

Everything else leaves:

| What | Where | Why |
|---|---|---|
| Tag manager | Settings → Data | It is a bulk edit, not an analysis |
| Mood / Habit / Lifetime analytics | Stats | They are the record |
| Pickleball digest | *deleted* | The Pickleball page has all four numbers, richer |

Rejected: **merging Stats into Insights.** It removes the duplication outright
and the nav already nests them, but it makes one very long page and needs a
route redirect. The split costs no nav change and gives each page a question you
can answer in one sentence — which is the test that failed in the first place.

## Rollout

Three increments, each shippable alone:

| # | What | Status |
|---|---|---|
| 281a | Tag manager → Settings → Data | ✅ done |
| 281b | Mood / Habit / Lifetime analytics → Stats | ✅ done |
| 281c | Drop the Pickleball digest; dissolve the four remaining action-less cards into headed regions | 🔜 |

**281b's constraint, stated up front and held:** the three groups merge into
Stats' existing folds. Moving them across unchanged would take Stats from six
drawers to nine, which is the failure this document exists to avoid.

**Where each landed.** Mood analytics into Stats' *Mood views* fold; Habit
analytics into *Habit timing*, renamed *Habits*; Lifetime **open** beside
Achievements, because lifetime totals are the subject Achievements already
covers. **Insights went 6 folds → 2. Stats stayed at 6.**

They were extracted to `components/stats/{MoodAnalytics,HabitAnalytics,
LifetimeCards}.tsx` rather than pasted into `Stats.tsx`, which would have taken
it past the 500-line ceiling. Each reads `useJournal()` itself and gates on its
own data, so the host fold degrades cleanly on an empty journal.

**How the move was proved.** Each panel's rendered HTML was dumped from Insights
on the parent commit and from Stats on this one, and diffed: **all nine
byte-identical**. Worth doing rather than eyeballing — the first draft of
`SplitCol` silently dropped its two accent icons while being "the same markup",
which is exactly the failure `CLAUDE.md` records about extracting a duplicated
banner and replacing a phone number with 911.

The end state is Insights at **2 cards and 0 folds** — Weekly review and Search,
both of which genuinely have their own state — with the digests, the coach and
the correlations as open headed regions above the fold, where the thing you did
not already know should have been all along.

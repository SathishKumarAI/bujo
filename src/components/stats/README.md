# `components/stats`

Panels that belong to the Stats page — the cluster's *record*. They live here
rather than in `views/Stats.tsx` because that file is already near the 500-line
ceiling, and each of these is one self-contained subject.

| Change | File |
|---|---|
| Weekday mood chart, weekday/weekend split, mood stability | `MoodAnalytics.tsx` |
| Habit mood impact, consistency score, month-over-month | `HabitAnalytics.tsx` |
| Year in review, month index, personal records | `LifetimeCards.tsx` |
| Which fold each sits in | `../../views/Stats.tsx` |

All three arrived from Insights under BUJO-281 — see
`docs/redesign/17-insights-ia.md` for why. Rules that keep them honest:

- **Each reads `useJournal()` itself** and returns `null` when it has no data,
  so the fold hosting it degrades to whatever else is in there rather than
  rendering an empty frame.
- **They do not add folds.** `MoodAnalytics` and `HabitAnalytics` render inside
  Stats' existing sections; `LifetimeCards` renders open. Stats had six folds
  before this move and has six after — that was the point of the move.
- The deep-dives in `HabitAnalytics` are anchored to the top of the streak
  leaderboard, and print that habit's name in every subtitle. Without the name
  they read as an app-wide figure, which they are not.

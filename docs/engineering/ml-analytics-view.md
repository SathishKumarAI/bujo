# 🤖 ML / analytics view

## Today: deterministic analytics, not ML
bujo's "intelligence" is currently **explainable, rule-based** — pure functions
over `JournalData`. No model, no training, no inference. This is deliberate:
local-first + private + offline + testable. The pieces:

| Capability | Where | Method |
|---|---|---|
| **Coach** ("do this next") | `lib/coach.ts` | priority-ordered heuristics: missing check-in, behind-pace weekly habit, movement-goal gap, active plan phase |
| **Correlations** | `lib/correlations.ts` | Pearson *r* (e.g. sleep ↔ mood), rolling averages |
| **Insights / patterns** | `lib/stats.ts` (`insights`, `personalRecords`) | thresholded rules over streaks, completion, bests |
| **Recommendations** | `lib/recommend.ts`, `lib/suggest.ts` | next-split, suggested values, smart-capture routing |
| **Smart capture (NLU-lite)** | `lib/capture.ts` | rules + fuzzy exercise/food matching + spoken-number normalisation |
| **Forecasts/targets** | `lib/fitness.ts`, `lib/milestones.ts` | 1RM (Epley), pace, streak milestones |

All of the above are unit-tested and render identically all day (deterministic).

## The dataset that *is* available for ML
Per user, longitudinal and multi-modal — a rich training set if/when desired:
- **Time series:** daily mood/stress/sleep/energy, habit completion, calories,
  body weight, workout volume, focus minutes, win-rate.
- **Events:** workouts (structured sets), pickleball games, reading progress.
- **Text:** entries, notes, gratitude, memories, per-habit notes, book learnings
  (tagged with `#tags`).
- **Labels already present:** ratings, RPE, mood — natural supervision signals.

## Where real ML/DS could go (roadmap, honest)
1. **Adaptive coach** — replace the static heuristics in `coach.ts` with a
   personalised model: predict habit-slip risk (logistic/gradient-boosted on the
   per-day features) and surface the highest-leverage action. Biggest product win
   (see [`../WHY.md`](../WHY.md)).
2. **Correlation → causation hints** — beyond Pearson: lagged correlations
   (does poor sleep predict *next-day* mood?), simple Granger-style checks.
3. **Forecasting** — exponential-smoothing / Prophet-style projection of weight,
   volume, or streak trajectories; "on track for 12 books?" with a confidence band.
4. **NLU on entries** — embeddings to cluster journal themes, sentiment over time,
   auto-tagging — candidate for **on-device** models to keep the privacy promise.
5. **Anomaly detection** — flag unusual dips (mood, training load) for the coach.

## Constraints any ML must respect
- **Local-first & private:** prefer on-device inference (WASM/transformers.js) or
  explicit opt-in cloud; never silently ship journal data off-device.
- **Explainable:** the coach must justify a suggestion from the user's own data.
- **Small data per user:** favour robust, low-variance methods + priors over
  deep nets; cold-start matters (the rule-based coach is the fallback).
- **Deterministic tests:** keep a pure, testable core even behind a model.

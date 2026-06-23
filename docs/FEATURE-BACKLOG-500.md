# Feature backlog — 572 ideas (auto-generated, ranked)

_Generated 2026-06-22 by a 10-agent fan-out workflow, deduped, scored, and ranked. 572 unique features. Value 1–5, effort S/M/L, risk low/med/high._

## How this was made

10 category strategist agents each generated ~55 grounded ideas against the real app surface (25 views, ~50 lib modules). Deduped by normalized title → 572. Ranked by value desc, then effort (S<M<L), then risk (low<med<high). A final selector agent picked the **top 10 buildable-now** features (low-risk, additive, unit-testable). See `## Top 10 selected to build` below.

## Category counts

| Category | Count |
|---|---:|
| Habits & trackers | 57 |
| Fitness, gym & workouts | 58 |
| Pickleball & coaching | 56 |
| Recovery, streaks & motivation | 57 |
| Reading, focus & goals | 61 |
| Journaling, bullets, collections & planning | 58 |
| Data, sync, privacy, export & backup | 56 |
| UI, UX, shell, navigation, theming & a11y | 56 |
| Insights, stats, analytics & coaching engine | 57 |
| Platform, desktop, mobile, integrations & automation | 56 |
| **Total** | **572** |

## Top 10 selected to build

| # | Feature | Why | Build plan |
|---:|---|---|---|
| 1 | **Previous-set ghost prefill** | High value (saves typing on every Gym set, the most repeated action) and near-zero risk: lastSetFor() already exists and is pure, so this is read-only placeholder wiring with no reducer changes. Trivially unit-testable. | lib/fitness.ts already exposes lastSetFor(data, exercise, beforeDate). In src/views/Gym.tsx, when rendering an exercise's next set-row inputs, call lastSetFor for that exercise and render a 'last: 60kg x5' chip whose tap fills the weight/reps state used by the existing add-set handler. No new reducer action. Add a fitness.test.ts case asserting lastSetFor returns the most recent working set before a date and null when none. |
| 2 | **PR celebration toast** | Pure detection on top of existing personalRecords() makes it additive and isolated; high motivational value with no flow change — just a transient toast after a set is logged. Easy to unit-test the 'beats PR' predicate. | Add isNewPR(data, exercise, weight, reps) to lib/fitness.ts comparing against personalRecords()/epley1RM. In src/views/Gym.tsx, after the existing save-set call, compute isNewPR on the just-saved row and fire the app's existing toast/notification (same mechanism CommandPalette/Today use). New unit tests in fitness.test.ts for the predicate (ties, first-ever set, lower weight). |
| 3 | **Per-side plate visualizer** | platesPerSide() already returns the disc list, so this is a pure presentational SVG with no logic risk and clear IPF color mapping. Self-contained component, high value for barbell users. | lib/fitness.ts platesPerSide already returns number[] per side; add an IPF plate->color map (reuse src/lib/colors.ts palette) as a small helper. New presentational component src/components/PlateStack.tsx renders a stacked-disc SVG from that array. Wire it into the existing plate-calculator card in src/views/Gym.tsx. Tests: assert platesPerSide output and the color-map lookup are deterministic. |
| 4 | **Negative/quit habit streak counter** | Reuses the battle-tested streakStatsFor() engine on avoid:true habits, so it's additive and consistent with Recovery's milestone ladder. Schema already has habit.avoid; pure derivation, no reducer change. Strong value for quit-habits. | Add habitCleanStreak(data, habit, today) to lib/streak.ts that maps an avoid:true habit's logged 'slip' days into the relapses shape and calls streakStatsFor. In src/views/Trackers.tsx render a clean-day chip + nearest STREAK_MILESTONES badge on each avoid habit. New cases in streak.test.ts covering no-slips, mid-streak, and a recent slip resetting the count. |
| 5 | **Per-habit completion percentage** | Respecting activeDays makes it a meaningful, correct metric and the data is all local; pure function + one badge = minimal surface area and trivial tests. Common, expected feature with high glanceable value. | Add completionRate30(data, habit, today) to lib/streak.ts (or a new lib/habitStats.ts) counting scheduled days via activeDays/recurrence over the last 30 days vs done days. Render a percent badge per habit in src/views/Trackers.tsx. Unit-test the scheduled-vs-done math including activeDays exclusion and partial windows. |
| 6 | **Habit-to-mood impact ranking** | Leverages existing day.mood and correlations.ts patterns; cross-domain insight that's genuinely novel to the app, fully derived (read-only), and isolated to the Insights view. Pure ranking function is highly testable. | Add moodImpactRanking(data) to lib/correlations.ts: for each habit compute avg day.mood on done vs skipped days and a lift delta, sorted desc. Render a ranked list card in src/views/Insights.tsx. Tests in a correlations test file: habit with clear lift ranks first, ignores habits with too few mood-paired days. |
| 7 | **Coach: declining-habit early warning** | Builds on the existing coachTips() pipeline so it slots into the current Today/coach surface with no new UI plumbing; pure 7-day-vs-30-day comparison is isolated and testable, and the early-warning value is high. | Add a decliningHabit detector inside lib/coach.ts (a new CoachTip emitter) comparing each habit's 7-day completion rate to its 30-day baseline and emitting a recovery-action tip when the drop exceeds a threshold on scheduled days. Surfaces automatically wherever coachTips() already renders (Today/Coaching). New coach.test.ts case: sharp drop emits a tip, stable habit does not. |
| 8 | **Urge intensity slider + technique tracker** | UrgeWin and resistUrge are clean extension points — adding optional intensity/technique fields is fully backward-compatible (old logs just lack them). High recovery value, isolated to NoFap, and the aggregation is unit-testable. | Extend UrgeWin in src/lib/types.ts with optional intensity?:1..5 and technique?:'surf'|'delay'|'halt'|'reach-out'. Thread them through resistUrge in src/store.tsx (optional, defaults undefined). In src/views/NoFap.tsx add a 1-5 slider + technique chips to the urge-surf form and show a most-effective-technique tally. Add a pure techniqueRanking(urgeLog) to lib/streak.ts with tests; existing logs without fields are ignored gracefully. |
| 9 | **Trigger-plan match prompt on urge** | Closes the analysis-to-action loop exactly when needed using data already present (nofap.plans with trigger/coping). Pure matcher + inline render, no reducer change, low risk and high recovery impact. | Add matchPlanForTrigger(plans, triggerText) to lib/streak.ts doing case-insensitive substring/keyword match against TriggerPlan.trigger. In src/views/NoFap.tsx, as the user types/selects an urge trigger, render the matched plan's coping line inline above the 'I resisted it' button. Unit-test the matcher: exact, partial, and no-match cases. |
| 10 | **Bodyweight-progress chart** | BodyMetric.weight time series already exists; a chart with a 7-day moving average reuses correlations.rollingAverage and existing viz components, so it's additive and low-risk. Clear fitness value and the smoothing logic is easy to test. | Add bodyweightSeries(data) to lib/fitness.ts pulling dated weights, then smooth via correlations.rollingAverage(values,7); include the user goal line from settings (fitness/weight goal). Render with the existing chart/viz helper (src/lib/viz.ts) as a card in src/views/Fitness.tsx (or Insights). Tests: series ordering, gaps handled, moving-average values. |

## Full backlog by category

### Habits & trackers (57)

| Rank | Feature | Value | Effort | Risk | Description |
|---:|---|:--:|:--:|:--:|---|
| 5 | At-risk streak warning | 5 | M | low | On Today, flag habits whose streak will break if not logged today ('3 hrs left to keep your 12-day streak'), gated to scheduled days. |
| 19 | Habit correlation with mood/sleep | 5 | M | med | Extend correlations.ts to surface 'on days you did X, mood averaged +1.2' per habit in Insights. |
| 35 | Bulk-log a missed past day | 4 | S | low | Tap a past Trackers cell to backfill a completion, with a long-press range select to fill a span (e.g. 'I did read every day last week'). |
| 38 | Comeback streak tracking | 4 | S | low | After a break, show 'back on track — 4 days' and track number of comebacks per habit, framing relapses as recoverable. |
| 39 | Count-habit increment buttons | 4 | S | low | +/- and quick-step buttons (e.g. +1 glass, +250ml) on count habits in Today/Trackers instead of typing a number. |
| 48 | Negative/quit habit streak counter | 4 | S | low | Show a clean-day streak chip on each avoid:true habit in Trackers, reusing the streak.ts engine so quit-habits get the same milestone ladder as Recovery. |
| 52 | Per-habit completion percentage | 4 | S | low | Show a 30-day completion-rate badge per habit in Trackers, computed from scheduled-vs-done days respecting activeDays. |
| 72 | Target-met vs partial distinction in grid | 4 | S | low | Render count habits that hit target as a full dot and partial progress as a half/ring fill, so the grid shows degree not just done. |
| 77 | Weekly goal progress ring on Today | 4 | S | low | Surface each habit's weeklyGoal progress as a small ring on the Today view so weekly-cadence habits aren't forgotten. |
| 85 | Best day-of-week analysis per habit | 4 | M | low | In Insights, show which weekdays a habit succeeds vs fails most, derived from the habit log, to inform rescheduling. |
| 93 | Cumulative count goal ('this month') | 4 | M | low | Support a monthly cumulative target for count habits (e.g. 100 km this month) with a running total ring, distinct from the daily target. |
| 109 | Habit detail / drill-down sheet | 4 | M | low | Tapping a habit opens a sheet with its streak, completion %, best day, notes, and a mini heatmap — a single home for one habit. |
| 110 | Habit pause/vacation mode | 4 | M | low | A pause toggle on a habit that suspends scheduling and streak counting for a date range (travel/illness) without archiving it. |
| 111 | Habit templates gallery | 4 | M | low | A starter gallery (hydrate, meditate, stretch, no-sugar) with preset type/unit/target/color so new users seed Trackers in one tap. |
| 112 | Habit weekly review card | 4 | M | low | A Sunday 'week in review' card summarizing completion %, best/worst habit, and streaks gained/lost from the week's logs. |
| 129 | Negative-habit slip log with trigger | 4 | M | low | For avoid habits, logging a slip prompts an optional trigger (reusing Recovery's urge-log UI) to build a per-habit trigger breakdown. |
| 146 | Skip/rest day without breaking streak | 4 | M | low | Let users mark a day as a planned rest in Trackers so the streak in streak.ts treats it as neutral rather than a miss. |
| 181 | Habit chain / stack sequencing | 4 | M | med | Link habits into an ordered stack via the existing cue field so completing one suggests the next ('after coffee → meditate → journal'). |
| 182 | Habit target ramp / progression | 4 | M | med | Schedule a target to increase over time (e.g. 10→50 pushups over 8 weeks) so count goals auto-progress. |
| 183 | Habit-specific reminder times | 4 | M | med | Per-habit reminderTime field surfaced as a local browser notification (extending the existing global reminderEnabled plumbing) so each habit can nudge at its own time. |
| 212 | Streak recovery grace window | 4 | M | med | Allow logging yesterday until a configurable cutoff (e.g. noon next day) before a streak counts as broken, for late-night journalers. |
| 217 | Timer habit live stopwatch | 4 | M | med | For timer-type habits, an in-app start/stop stopwatch that writes the elapsed minutes to the day, instead of manual number entry. |
| 245 | Auto-archive stale habits | 3 | S | low | Suggest archiving habits untouched for 30+ days via a gentle Insights prompt, to keep the grid focused. |
| 276 | Habit archive with restore | 3 | S | low | A dedicated archive drawer listing archived habits with their last stats and a one-tap restore, instead of the show-archived toggle only. |
| 277 | Habit color-by-completion heat tint | 3 | S | low | Tint each habit's heatmap cells by intensity/target fraction for count habits, not just done/not-done, in the activity layout. |
| 278 | Habit goal completion badge | 3 | S | low | Award a permanent badge when a habit hits a target like 100 total completions, stored in achievements, shown on its detail sheet. |
| 279 | Habit goal narrative prompt | 3 | S | low | An optional 'why' field per habit shown when motivation dips (long miss streak), surfacing the user's stated reason. |
| 280 | Habit minimum 'floor' vs stretch target | 3 | S | low | Add an optional floor target (the non-negotiable minimum) shown distinctly from the stretch target on count habits. |
| 281 | Habit-level data CSV export | 3 | S | low | Extend csv.ts with a per-habit daily-log export (date, value, target, done) so users can analyze a single habit externally. |
| 290 | Longest-streak leaderboard across habits | 3 | S | low | A small ranked list in Insights of your top habits by current and all-time best streak for motivation. |
| 301 | Per-habit notes timeline | 3 | S | low | Surface the existing per-day habit reflective notes as a scrollable timeline on a habit's detail view, not just inline. |
| 302 | Per-habit weekend behavior | 3 | S | low | A per-habit 'weekdays only' / 'weekends only' quick toggle building on activeDays, distinct from the global hide-weekends setting. |
| 314 | Quick-pick emoji + color on create | 3 | S | low | A compact emoji/Catppuccin-color picker in the create-habit form so habits get a visual identity without extra steps. |
| 328 | Snooze a habit for today | 3 | S | low | A 'not today' action that removes a habit from Today's list without counting it as a miss when it's optional. |
| 332 | Streak milestone celebration toast | 3 | S | low | Fire a confetti/toast when a habit crosses a milestone (7/30/100 days), reusing achievements.ts, for build habits not just Recovery. |
| 382 | Every-N-days scheduling | 3 | M | low | Add an 'interval' schedule (every 2/3 days) to Habit alongside activeDays/weekdays for habits that aren't weekly-aligned, like watering plants or deep-clean. |
| 392 | Habit completion calendar in monthly view | 3 | M | low | Overlay per-habit completion dots onto the Monthly view's day cells so habits show up in the calendar context. |
| 393 | Habit completion time-of-day histogram | 3 | M | low | In Insights, a histogram of when (hour) a habit is usually completed, from log timestamps, to reveal real routines. |
| 395 | Habit consistency score (0-100) | 3 | M | low | A single rolling consistency index per habit weighting recency, shown as a trend in Insights to capture momentum. |
| 397 | Habit reminder via calendar (.ics) | 3 | M | low | Export habit reminders as recurring .ics events using the existing ics.ts so reminders work in the user's external calendar. |
| 398 | Habit reorder via drag and drop | 3 | M | low | Drag-to-reorder habits within a category in Trackers, persisting the existing order field instead of editing it manually. |
| 399 | Habit value sparkline in grid | 3 | M | low | For count/rating/timer habits, render a tiny inline sparkline of the last 14 days beside the habit name in Trackers. |
| 407 | Monthly habit completion bar chart | 3 | M | low | Add a per-habit monthly bar chart in Insights showing completions per month over the trailing year using existing habit log data. |
| 411 | Part-of-day routine timeline polish | 3 | M | low | Enhance the existing routine layout with collapsible morning/afternoon/evening sections and per-block completion counts. |
| 432 | Streak freeze tokens | 3 | M | low | Award a limited number of streak-freeze tokens that auto-protect a missed day, shown as a small shield icon in the Trackers grid. |
| 459 | Habit folders / custom categories | 3 | M | med | Allow user-defined category names beyond the fixed stimulant/food/movement/wellness/custom enum so sections match the user's vocabulary. |
| 465 | Month-grid heatmap export as image | 3 | M | med | Export a single habit's year heatmap as a shareable PNG via the existing image store, like a GitHub contribution graph. |
| 470 | Pair / anti-habit linking | 3 | M | med | Link a build habit to a quit habit ('replace doomscroll with reading') and show substitution success in Insights. |
| 492 | Adaptive reminder timing | 3 | L | med | Suggest moving a habit's reminder to the time of day it's most often completed, derived from completion timestamps. |
| 523 | Habit completion sound / haptic | 2 | S | low | Optional satisfying tick sound and vibration on logging a habit, toggleable in Settings, to reinforce the action. |
| 524 | Habit difficulty / effort tag | 2 | S | low | Tag each habit easy/medium/hard so the weekly review can show you're balancing low- and high-effort habits. |
| 525 | Habit duplicate / clone | 2 | S | low | Clone an existing habit's full config as the start point for a new one, speeding up creating variants. |
| 526 | Habit unit conversion presets | 2 | S | low | Offer common unit presets (glasses↔ml, min↔hrs, steps, km/mi) for count habits so the unit field is a picker, respecting the app's weightUnit/distanceUnit setting. |
| 542 | Seasonal / date-bounded habits | 2 | S | low | Start/end dates on a habit so seasonal goals (e.g. 'cold showers Dec–Feb') auto-archive when the window closes. |
| 550 | Two-sided rating habit polarity | 2 | S | low | For rating-type habits, let high or low be 'good' (e.g. screen-time rating where lower is better) so trends color correctly. |
| 553 | Bulk habit actions | 2 | M | low | Multi-select habits to archive, recolor, or recategorize at once, for users with many habits to tidy. |
| 554 | Custom milestone ladders per habit | 2 | M | low | Let users define their own milestone days/labels for a habit rather than only the fixed STREAK_MILESTONES set. |

### Fitness, gym & workouts (58)

| Rank | Feature | Value | Effort | Risk | Description |
|---:|---|:--:|:--:|:--:|---|
| 1 | Bodyweight-progress chart | 5 | S | low | Plot BodyMetric.weight over time with a 7-day moving average and goal line in the Fitness/Insights view. |
| 3 | Previous-set ghost prefill | 5 | S | low | Use lastSetFor to pre-populate weight/reps placeholders for an exercise's next set in Gym, showing 'last: 60kg x5' as a one-tap fill. |
| 13 | Start-workout-from-routine flow | 5 | M | low | Tapping a saved Routine seeds an empty Gym session with its exercises pre-listed and target rows ready to fill. |
| 20 | kg/lb unit toggle for all lifts | 5 | M | med | A global weight-unit setting in Settings that converts displayed weights, plate denominations, PRs and 1RM across Gym/Fitness without re-storing data. |
| 24 | Progressive-overload suggestion | 5 | M | med | After logging, compare to lastSetFor and nudge +2.5kg or +1 rep when last session hit all target reps, surfaced inline in Gym. |
| 29 | Active-minutes weekly goal ring | 4 | S | low | A progress ring for weeklyActiveMinutes against a user goal (e.g. 150 min) in the FitnessHub header. |
| 31 | Auto warm-up set generator | 4 | S | low | In Gym, given a working weight, generate a warm-up ramp (e.g. bar, 40/60/80%) as kind:'warmup' setRows one tap before the working set. |
| 49 | Next-split smart banner | 4 | S | low | Surface nextSplit's recommendation as a 'Today: Pull day' banner in FitnessHub with a one-tap start. |
| 50 | No-equipment quick routines | 4 | S | low | Preset bodyweight routines (7-min, core blast, leg burner) built from HOME_EXERCISES for one-tap home sessions. |
| 53 | Per-side plate visualizer | 4 | S | low | Render the platesPerSide output as a stacked-disc SVG on each side of a barbell in the Gym view's plate calculator card, color-coded by IPF plate colors. |
| 57 | PR celebration toast | 4 | S | low | Detect when a freshly logged set beats personalRecords for that exercise and fire a celebratory toast with the new weight x reps. |
| 62 | Rest timer auto-start on set log | 4 | S | low | Wire the RestTimer component to auto-start its countdown the moment a working set row is saved in Gym, with per-exercise default rest durations. |
| 63 | Rest timer vibration + sound alert | 4 | S | low | Fire navigator.vibrate and a short beep when the RestTimer reaches zero so users don't watch the screen between sets. |
| 64 | Session volume summary card | 4 | S | low | On finishing a Gym session, show sessionVolume, total sets, and top set per exercise as a shareable recap. |
| 79 | Workout templates from history | 4 | S | low | Offer to save a just-completed Gym session as a reusable Routine, capturing exercises and target reps. |
| 86 | Body-measurement trend lines | 4 | M | low | Chart each BodyMetric.measurements key (waist, arms, chest) as its own sparkline to visualize recomposition. |
| 101 | Estimated-1RM progression chart | 4 | M | low | Extend exerciseProgression to plot best epley1RM per day instead of raw top weight, giving a strength-trend line in Insights. |
| 102 | Exercise-history drill-down | 4 | M | low | Tap any exercise to see all past sets, best set, volume trend, and est-1RM in one detail sheet. |
| 115 | Home-workout AMRAP/EMOM timer | 4 | M | low | A round/interval timer for HOME_EXERCISES circuits (EMOM, Tabata, AMRAP) with auto-advance and cues. |
| 116 | Home-workout circuit builder | 4 | M | low | Let users sequence HOME_EXERCISES into a saved circuit with set/rest config, runnable as a guided session. |
| 142 | Routine builder from library | 4 | M | low | Let users assemble a custom Routine by picking from EXERCISE_LIBRARY + wger search, beyond the three PPL_PRESETS. |
| 144 | Set-completion checkboxes | 4 | M | low | Convert routine target sets into tickable checkboxes during a live session so users track progress mid-workout. |
| 158 | Weekly sets-per-muscle counter | 4 | M | low | Count hard sets per muscle group this week against hypertrophy landmarks (10–20 sets) using musclesForExercise mapping. |
| 160 | Weekly training summary digest | 4 | M | low | A Monday recap card: sessions, total volume, new PRs, muscles hit, active minutes — assembled from existing fitness helpers. |
| 162 | Workout heatmap calendar | 4 | M | low | A GitHub-style year calendar of training days (intensity by volume) for the Fitness/Stats view. |
| 168 | Body-part volume heatmap | 4 | M | med | Aggregate working-set volume by muscle (via musclesForExercise) over the week into a body-map heat overlay in Insights. |
| 199 | Progress-photo attachment | 4 | M | med | Let a BodyMetric snapshot store a progress photo (via the existing image lib) for side-by-side before/after comparison. |
| 211 | Smart-capture set parsing into rows | 4 | M | med | Extend the NL capture so 'bench 5x5 @60' parsed by parseSet creates structured setRows directly, not just legacy strings. |
| 242 | 1RM percentage table per exercise | 3 | S | low | On an exercise's PR, show a %1RM loading table (50–95%) derived from epley1RM so users can pick training weights. |
| 249 | Body-fat & lean-mass estimate | 3 | S | low | From weight + bodyFat%, compute and trend fat mass vs lean mass over time in the body-metrics card. |
| 251 | Cardio PB badges | 3 | S | low | Render cardioPBs (longest km, most minutes, most calories) as achievement badges with date earned in Fitness. |
| 254 | Closest-loadable weight warning | 3 | S | low | Use barExceedsTarget + plate rounding to warn when a target isn't exactly loadable and show the nearest achievable weight. |
| 267 | Drop-set quick logger | 3 | S | low | A 'drop' button in Gym that clones the last working row at a reduced weight and tags kind:'drop' for fast drop-set entry. |
| 269 | Exercise demo image inline | 3 | S | low | Show the cached wger image/thumbnail next to each exercise name in Gym/Routine pickers using the existing catalog. |
| 273 | Form-cue tooltip on every exercise | 3 | S | low | Attach exerciseInfo cue + watch-out as an info popover on exercise rows across Gym/Home/Pullup views. |
| 297 | Neglected-muscle alert | 3 | S | low | Flag muscle groups with zero sets in the last 7–10 days from the muscle map, nudging balanced training in the FitnessHub. |
| 299 | Pace/split readout for runs | 3 | S | low | Show pace() per cardio workout and a personal pace-trend line, with unit-aware min/km or min/mi. |
| 306 | Plate-availability customization | 3 | S | low | Let users edit their available plate set + bar weight in Settings so platesPerSide matches their actual gym. |
| 310 | Pull-up ladder/pyramid generator | 3 | S | low | Surface the existing ladder/pyramid helpers as a tappable rep-by-rep workout guide in the Pullups view. |
| 311 | Pull-up program rest-day timer | 3 | S | low | Add a between-sets rest timer to the Pullups program tracker tuned to the ability ladder's prescribed rest. |
| 353 | Wger video demos inline | 3 | S | low | Embed the wger-hosted clip (when WgerExercise.video exists) in the exercise detail sheet for proper-form reference. |
| 359 | Big-three total tracker | 3 | M | low | Sum best squat/bench/deadlift PRs into a powerlifting total with a trend line and Wilks-style score. |
| 360 | Bodyweight-lift relative strength | 3 | M | low | Divide an exercise PR by current BodyMetric.weight to show strength-to-weight ratios and common strength standards. |
| 361 | Bodyweight-rep progression suggester | 3 | M | low | Suggest a harder HOME_EXERCISES variant (knee→full→pike push-up) once a rep target is consistently hit. |
| 391 | Grease-the-groove pull-up tracker | 3 | M | low | A GtG mode in Pullups that logs frequent sub-max sets through the day and tallies daily/weekly volume vs ability targets. |
| 419 | Quadrant strength radar | 3 | M | low | A push/pull/legs (or muscle-group) radar chart of recent volume to spot imbalances at a glance in Insights. |
| 426 | Rep-PR tracking (not just weight) | 3 | M | low | Track best reps at each weight per exercise alongside the heaviest-weight PR, so high-rep gains register as records. |
| 455 | Estimated calories from session | 3 | M | med | Estimate calories burned from activity type, duration and bodyweight (MET tables) to autofill Workout.calories. |
| 458 | Goal-weight forecast | 3 | M | med | From the bodyweight moving-average trend, project the date a target weight will be reached and weekly rate of change. |
| 467 | Muscle-recovery readiness map | 3 | M | med | Color each muscle by hours since last trained (via muscle map + dates) to show what's recovered and ready. |
| 474 | Rest-day recommendation | 3 | M | med | Use activeDayStreak + muscle recency to recommend a rest day when training the same group on consecutive days. |
| 475 | RPE/RIR autoregulation hint | 3 | M | med | Use logged rpe to suggest adding or holding load next session (RPE<7 → go heavier), shown per exercise in Gym. |
| 479 | Stalled-lift detector | 3 | M | med | Flag exercises whose top weight hasn't improved over N sessions from exerciseProgression and suggest a reset/variation. |
| 483 | Superset grouping in set rows | 3 | M | med | Add an optional group tag to WorkoutSet so A1/A2 supersets render together and the rest timer triggers only after the last in the group. |
| 485 | Volume-trend deload prompt | 3 | M | med | Watch weeklyVolumeSeries for 3 weeks of rising volume + high RPE and suggest a deload week in Insights. |
| 536 | Personal-record leaderboard export | 2 | S | low | Export personalRecords + cardioPBs to CSV via the existing csv lib for sharing or spreadsheet tracking. |
| 547 | Tempo notation per set | 2 | S | low | Optional tempo field (e.g. 3-1-1) on WorkoutSet with a one-line explainer, for users training eccentric control. |
| 551 | Waist-to-height ratio readout | 2 | S | low | Compute WHtR from waist measurement + a stored height and show a simple health-band indicator. |

### Pickleball & coaching (56)

| Rank | Feature | Value | Effort | Risk | Description |
|---:|---|:--:|:--:|:--:|---|
| 4 | Academy level self-assessment checklist | 5 | M | low | Make each skill bullet in ACADEMY_LEVELS individually checkable so a player can tick mastered skills and see a percent-complete bar per level toward DUPR progression. |
| 8 | DUPR rating tracker & projection | 5 | M | low | A Pickleball-view widget to log your DUPR (and self-rating) over time, charting the trend and projecting toward the next academy level (2.0→4.5+) from logged match results. |
| 23 | Per-drill rep/score logger with PRs | 5 | M | med | A lightweight logger for benchmark drills (e.g. consecutive cross-court dinks, 0-to-60 drops) that records best results and shows personal-record progress against the plan's numeric goals. |
| 25 | Skill-gap recommendation engine | 5 | M | med | Analyze logged shot-quality scores and match metrics to recommend which academy level skill or drill to focus on next, surfaced in the existing Coaching view. |
| 28 | 75-day plan progress dashboard | 4 | S | low | For the active pickleballPlanStart, show current phase, day N of 75, days remaining, and a phase-by-phase progress bar in the Pickleball view. |
| 45 | Match intention & post-game review | 4 | S | low | Before a session set one tactical intention; after, rate execution and jot a lesson, building a coachable learning log per match. |
| 46 | Match-day mindset focus picker | 4 | S | low | Pick one MINDSET principle as today's tactical/mental intention (e.g. 'every 3rd shot is a drop') and log whether you held it, reusing the mindsetFocus pattern. |
| 47 | Mental-game pre-point routine builder | 4 | S | low | Let the player assemble a personal pre-point routine (breath + ritual + target cue) from the MINDSET principles and pin it as a match-day reminder card. |
| 51 | Partner chemistry stats | 4 | S | low | A doubles-partner leaderboard in the Pickleball view computing win% and games played per partner from PickleballSession.partner to reveal who you play best with. |
| 54 | Pickleball stats on the Insights view | 4 | S | low | Surface pickleball KPIs (win% trend, weekly games, play streak, format split) as cards in the cross-domain Insights view alongside other trackers. |
| 55 | Point-differential & close-game analysis | 4 | S | low | Using pointsFor/pointsAgainst already in the schema, compute average margin and a 'clutch' record in close games to show whether you close out tight matches. |
| 81 | 12-week academy week tracker | 4 | M | low | Track which TWELVE_WEEK academy week you're on with per-week goal check-off (e.g. 'sustain a 25+ dink rally') and a completion timeline. |
| 84 | Benchmark re-test reminders | 4 | M | low | Schedule periodic re-tests of the Phase 5 assessment battery (dink test, drop test, return-depth test) and chart each re-test score over months. |
| 99 | Drill-of-the-day done/streak tracking | 4 | M | low | Let the user mark the daily rotated practice focus in Pickleball.tsx as completed and build a practice-completion streak, mirroring the existing playStreak logic. |
| 108 | Goal-linked pickleball benchmarks | 4 | M | low | Let plan goals (50 consecutive dinks, 90% drop success) become trackable customGoals with manual progress, tying the academy into the Goals view. |
| 131 | Opponent & rivalry record book | 4 | M | low | An opponents tab that aggregates head-to-head W/L and win% per opponent name already captured in PickleballSession.opponent, surfacing your rivals and best/worst matchups. |
| 145 | Shot-quality scorecard per session | 4 | M | low | Quick 1-5 sliders after a session for third-shot drop, reset, dink consistency, serve depth, and hands, stored on the session for a radar chart of your game's shape. |
| 151 | Unforced-error & rally-length match metrics | 4 | M | low | Add optional per-session fields for unforced errors and average rally length (the Phase 5 match metrics) and trend them over time as the key 4.0 indicators. |
| 161 | Win-streak & milestone achievements | 4 | M | low | Pickleball-specific milestones (first 50-dink rally, 10-game win streak, 100 sessions logged) wired into the existing achievements/milestones engine. |
| 171 | Coaching-engine pickleball recommendations | 4 | M | med | Feed pickleball session data into the existing coach/recommend engine so the Coaching view produces concrete pickleball next-actions (e.g. 'your reset score dropped, drill catch-the-drive'). |
| 185 | Load management & overuse warning | 4 | M | med | Compute weekly play minutes and RPE load (from session durationMin and rpe) and warn when volume spikes sharply week-over-week to prevent overuse injury. |
| 194 | Per-game score breakdown logging | 4 | M | med | Extend the session log form in Pickleball.tsx so a session captures each individual game's score (e.g. 11-9, 11-7) instead of only aggregate gamesWon/gamesLost, enabling point-differential and close-game stats. |
| 195 | Pickleball quick-capture via NL input | 4 | M | med | Extend the smart capture parser so a note like 'played 4 doubles games, won 3, 90 min with Sam' creates a PickleballSession directly from natural language. |
| 196 | Pickleball-specific rehab & mobility tracker | 4 | M | med | A rehab tab logging common pickleball injuries (pickleball elbow, Achilles, knee, rotator cuff) with rest/ice/load-management notes and return-to-play status. |
| 204 | Return-to-play graduated plan after injury | 4 | M | med | After logging a rehab injury, generate a staged return plan (wall → dinks-only → skinny singles → full play) gating intensity until cleared. |
| 222 | Weekly practice plan scheduler | 4 | M | med | Turn WEEKLY_TEMPLATE into a schedulable week where each focus day can be assigned to a calendar date and exported via the existing ICS generator to your calendar. |
| 260 | Court / venue log with map of where you play | 3 | S | low | Aggregate PickleballSession.location into a venues list with games played and win% per court, surfacing your home-court advantage. |
| 266 | Drill library filter & search | 3 | S | low | Add skill-category filter chips and text search over ACADEMY_DRILLS so players can quickly find drills for a target skill (e.g. all reset drills). |
| 287 | Level-up celebration & next-level unlock | 3 | S | low | When a player completes an academy level's skill checklist, show a celebratory unlock of the next level's skills and recommended drills. |
| 291 | Mental-game journaling prompts | 3 | S | low | After a tough loss, prompt a short reflection tied to the relevant MINDSET principle (tilt, short memory) to build emotional resilience over time. |
| 304 | Pickleball CSV export | 3 | S | low | Extend the existing CSV exporter to emit sessions and events as their own sheets so players can analyze match history in a spreadsheet. |
| 323 | Rolling form indicator | 3 | S | low | A last-10-games form string (W-L-W…) and recent-win% momentum badge so players see if they're trending up or in a slump. |
| 326 | Session RPE & recovery recommendation | 3 | S | low | After a high-RPE session, recommend the WEEKLY_TEMPLATE rest/wall day next and flag back-to-back hard days for recovery. |
| 329 | Solo / wall practice mode | 3 | S | low | A dedicated solo-practice card surfacing only the wall and footwork drills with a touch counter (target 200+ touches) for days without a partner. |
| 341 | Technique video links per technique | 3 | S | low | Attach a curated reference video URL to each entry in TECHNIQUES so the technique library can deep-link to a demonstration, reusing the existing external-resource link pattern. |
| 343 | Tilt / on-court breathing tool | 3 | S | low | A box-breathing animation tied to the 'Control tilt' and 'Breathe' mindset principles, launchable mid-session for between-game reset. |
| 345 | Tournament prep checklist & countdown | 3 | S | low | For each upcoming PickleballEvent, show a days-until countdown plus a packing/prep checklist (paddles, water, tape, mental routine) on the Pickleball view. |
| 378 | Drill rotation customization | 3 | M | low | Let users favorite or hide drills so the deterministic daily rotation only surfaces drills relevant to their current level and goals. |
| 381 | Event result detail & bracket notes | 3 | M | low | Expand PickleballEvent logging with per-round results and a post-event reflection field, building a tournament history timeline with placements and medals. |
| 414 | Practice session timer with phase cues | 3 | M | low | An on-court timer that walks through the 0-60 minute SESSION_TEMPLATE activities with audible transitions, turning the static template into a runnable session. |
| 415 | Practice-vs-play balance gauge | 3 | M | low | Compute the drilling-to-match ratio from logged drill sessions vs match sessions and nudge toward the plan's ~65% drilling target. |
| 416 | Pre-match warm-up routine timer | 3 | M | low | A guided countdown stepping through the SESSION_TEMPLATE warm-up blocks (dink warm-up, fast hands, etc.) so the player runs a structured warm-up before play. |
| 429 | Specialty-shot progression tracker | 3 | M | low | Track learning of advanced shots (Erne, ATP, lob, spin serve) from the Advanced/Pro levels with attempt/success counts toward a 'shot unlocked' status. |
| 431 | Stacking & positioning cheat-sheet | 3 | M | low | An interactive diagram explaining stacking, switching, and poaching from the curriculum, with calls to make, as a reference card before doubles. |
| 436 | Warm-up & cool-down stretch library | 3 | M | low | A pickleball-tailored mobility routine (wrist, shoulder, hip, ankle) drawn from the homeExercises pattern, surfaced as pre/post-play cards in the Pickleball view. |
| 446 | Correlate pickleball with sleep/recovery | 3 | M | med | Use the existing correlations engine to relate pickleball win% or RPE against habits like sleep, NoFap streak, or fitness to surface performance drivers. |
| 449 | Daily practice reminder / streak nudge | 3 | M | med | An optional notification or in-app banner reminding you of today's WEEKLY_TEMPLATE focus and your practice streak at risk. |
| 462 | Injury-aware drill substitution | 3 | M | med | When a rehab/injury flag is active, filter ACADEMY_DRILLS to low-impact options (wall dinks, soft-game) and hide high-intensity firefight/footwork drills. |
| 477 | Shot-tracking quick-log during play | 3 | M | med | A minimal in-match tally (winners, errors, drops made/missed) with big tap targets for courtside use that rolls up into the session record. |
| 478 | Skill-level matchup adjustment | 3 | M | med | Weight win% by opponent level (from session.level) to show performance against stronger vs weaker players, a truer skill signal than raw win%. |
| 491 | Drill demonstration diagrams | 3 | L | low | Add a simple court-with-arrows SVG diagram to key drills (figure-8, slinky, nine-point) so the static 'how' text is visually clear. |
| 500 | Serve & return depth heatmap logger | 3 | L | med | A tap-the-court grid to log where serves/returns land during a drill, building a placement heatmap to expose depth and direction weaknesses. |
| 522 | Format-specific strategy cards | 2 | S | low | Pair each PICKLE_FORMATS entry with a short tactical tip (seeding, when to sandbag a pool, losers-bracket pacing) shown when logging an event of that format. |
| 556 | Paddle & gear log | 2 | M | low | Track paddles, grips, and shoe mileage with purchase dates and a 'time to replace' nudge (e.g. shoe wear by play hours) in a gear tab. |
| 566 | Match-pace conditioning tracker | 2 | M | med | Log on-court conditioning metrics (heart-rate zone or perceived endurance late-game) to flag fitness as a losing factor in long matches. |
| 568 | Weather-aware play log | 2 | M | med | Capture wind/sun conditions per outdoor session (reusing the weather lib) and correlate conditions with win% to learn how you adapt to elements. |

### Recovery, streaks & motivation (57)

| Rank | Feature | Value | Effort | Risk | Description |
|---:|---|:--:|:--:|:--:|---|
| 12 | Panic / SOS button | 5 | M | low | A persistent floating SOS button in NoFap that opens a focused full-screen overlay with the 10-minute timer, breathing pacer, and the user's own trigger-plan coping line. |
| 14 | Trigger-plan match prompt on urge | 5 | M | low | When logging an urge whose trigger matches an existing if-then plan, surface that plan's coping response inline so the pre-decided action appears exactly when needed. |
| 37 | Comeback badge | 4 | S | low | An achievement that fires when a new streak exceeds the length of the streak that preceded a relapse, rewarding resilience over perfection. |
| 43 | HALT quick-check on urge log | 4 | S | low | Optional Hungry/Angry/Lonely/Tired toggles when logging an urge, building a dataset of which unmet need most often precedes cravings. |
| 59 | Recovery-specific achievement badges | 4 | S | low | Add abstinence badges (30/90/365 clean, 10 urges resisted, first trigger plan, comeback after relapse) to the derived ACHIEVEMENTS catalogue. |
| 60 | Relapse-reason tagging taxonomy | 4 | S | low | Offer a normalized tag picker (boredom, stress, loneliness, alcohol, late-night, social media) on reset logging so trigger analytics aren't fragmented by free text. |
| 61 | Replacement-activity menu | 4 | S | low | A user-curated list of healthy go-to activities (walk, push-ups, call a friend) shown on the SOS overlay so the user picks an action instead of dwelling. |
| 67 | Streak comparison vs. personal best | 4 | S | low | A ghost progress bar overlaying the current streak against the personal-best length, gamifying the push to beat your own record. |
| 68 | Suggested trigger plans from top triggers | 4 | S | low | In the trigger-patterns card, offer a one-tap 'create a plan for this' on the most common relapse reasons, closing the analysis-to-action loop. |
| 74 | Urge intensity slider | 4 | S | low | Add a 1-5 intensity rating to each urge-surf log in NoFap so the urge timeline shows not just frequency but how strong each craving was. |
| 75 | Urge-surfing technique tracker | 4 | S | low | When resisting, let the user tap which technique worked (surf/delay/HALT/reach out), building a personal ranking of most-effective coping strategies. |
| 76 | Urge-to-relapse conversion rate | 4 | S | low | A StatTile in NoFap showing what percent of logged urges ended in a reset vs. were resisted, turning the urge log into a self-efficacy metric. |
| 78 | Why-I-quit reasons list | 4 | S | low | A user-editable list of personal reasons for quitting, surfaced prominently on the SOS overlay and the relapse-log screen as a motivational anchor. |
| 80 | Relapse pre-commitment delay | 4 | S | med | Insert a 60-second reflective countdown plus the user's why-list before the 'Log reset & restart' button confirms, creating a friction speed-bump. |
| 87 | Box-breathing pacer for urges | 4 | M | low | An animated breathing-circle component in the Beat-the-urge card that paces inhale/hold/exhale to physiologically settle a craving in the moment. |
| 114 | High-risk hour heatmap | 4 | M | low | A 24-hour clock/heatmap in NoFap derived from urge-log timestamps showing which hours of day urges and relapses cluster, so users can pre-plan defenses. |
| 120 | Letter to future self | 4 | M | low | Let the user write a note from their committed self that auto-surfaces during an urge or before logging a reset, leveraging cold-state decision making. |
| 122 | Milestone confetti + toast on day rollover | 4 | M | low | Wire the existing MilestoneToast/milestoneEmoji into NoFap so crossing a streak milestone (3/7/30/90d) fires a celebration the first time it's viewed that day. |
| 123 | Money saved counter | 4 | M | low | For substance addictions (smoking, vaping, alcohol, caffeine), let the user set a per-day cost and show cumulative money saved across the clean streak. |
| 138 | Recovery streak calendar grid | 4 | M | low | A GitHub-style year calendar in NoFap coloring clean days green and reset days red, giving an at-a-glance view of the whole journey. |
| 139 | Recovery widget on Today view | 4 | M | low | A compact streak + 'log urge' chip on the Today view so recovery stays present in the daily flow without opening the NoFap tab. |
| 140 | Relapse aftermath checklist | 4 | M | low | After a reset, show a guided recovery checklist (forgive, identify trigger, update a plan, remove the cue, set next milestone) to rebuild momentum fast. |
| 152 | Urge countdown timer | 4 | M | low | A built-in 10-15 min 'ride the wave' countdown launched from the urge card that auto-logs a resisted win when it completes, replacing the manual 'delay 10 min' tip. |
| 202 | Recovery coach tips integration | 4 | M | med | Feed recovery state (rising urges, recent reset, approaching milestone) into the existing coaching engine so daily coach suggestions address the streak. |
| 203 | Recovery mood correlation | 4 | M | med | Use the correlations engine to relate clean days to logged mood/energy metrics, showing the user data evidence that abstinence improves how they feel. |
| 218 | Trigger-plan effectiveness tracking | 4 | M | med | Track which trigger plans were attached to resisted urges vs. relapses, then rank plans by success so users double down on what works. |
| 233 | Relapse early-warning score | 4 | L | med | A simple risk indicator combining recent urge frequency, missed habits, and low mood to flag 'high-risk day - lean on your plan' proactively. |
| 236 | Trigger plan reminder scheduling | 4 | L | med | Schedule a notification before a known recurring trigger time (e.g. nightly 11pm) reminding the user of their plan before the urge hits. |
| 237 | Urge-trigger correlation with sleep/exercise | 4 | L | med | Cross-reference urge frequency against sleep, workouts, and HALT factors via correlations to surface lifestyle drivers of cravings. |
| 238 | Accountability partner via E2E sync | 4 | L | high | Let a user share a read-only recovery summary (current streak, last reset date) with a chosen partner through the existing encrypted sync channel. |
| 248 | Blocker / cue-removal checklist | 3 | S | low | A setup checklist of environment changes (site blocker installed, phone out of bedroom, accounts deleted) the user can tick to reduce relapse cues. |
| 257 | Cold-shower / cold-water habit link | 3 | S | low | A one-tap 'I took a cold shower instead' action on the urge card that both logs a resisted win and the cold-exposure habit, reinforcing replacement behavior. |
| 262 | Daily check-in pledge | 3 | S | low | A once-a-day 'I commit to staying clean today' tap that builds a visible pledge streak, leveraging consistency and self-commitment. |
| 263 | Day-of-week relapse pattern | 3 | S | low | A weekday bar chart in NoFap built from relapse dates showing which days are riskiest (e.g. weekends), surfacing a behavioral pattern. |
| 270 | Flatline / withdrawal phase indicator | 3 | S | low | Flag the known 'flatline' window (roughly weeks 2-6) with reassurance copy so users expecting low mood/libido don't mistake it for failure. |
| 298 | Pace-to-record projection | 3 | S | low | Show the calendar date you'll match/break your best streak if you stay clean, giving a concrete near-term target. |
| 316 | Quit-date and commitment contract | 3 | S | low | Let the user formalize a start with a typed commitment statement and chosen quit date, anchoring the streak in an intentional decision. |
| 319 | Recovery data CSV export | 3 | S | low | Extend CSV export to include the urge log, reset reasons, and per-addiction streak history so users can analyze or back up their recovery data. |
| 321 | Relapse-free streak insurance reminder | 3 | S | low | When the current streak nears the personal best, escalate the pre-reset warning copy ('you're 2 days from your record') to raise the cost of slipping. |
| 322 | Relapse-free week/month rollup | 3 | S | low | Stats showing count of fully clean weeks and months across all streaks, rewarding sustained windows rather than single days. |
| 334 | Streak-saved counter | 3 | S | low | A motivational tile showing 'urges resisted = N streaks you might have lost', framing each resisted urge as protecting current progress. |
| 344 | Time / life reclaimed estimate | 3 | S | low | Estimate hours reclaimed (per-addiction time-cost × clean days) shown as a tile, e.g. 'You've reclaimed ~36 hours', for non-financial motivation. |
| 348 | Urge frequency trend sparkline | 3 | S | low | A small sparkline showing weekly urge counts trending down over time, giving evidence that cravings genuinely weaken with abstinence. |
| 349 | Urge journaling prompt | 3 | S | low | After resisting, optionally answer 'what were you really feeling?' to capture the emotion behind the urge, building emotional-awareness data over time. |
| 354 | Penalty tied to a relapse | 3 | S | med | Offer to assign an anime training penalty as a self-chosen consequence when a reset is logged, integrating the penalties engine with recovery accountability. |
| 363 | Brain-rewiring education timeline | 3 | M | low | Expand the recovery ladder with collapsible evidence-based explanations (dopamine downregulation, sleep, anxiety) per milestone for deeper motivation. |
| 374 | Custom personal milestones | 3 | M | low | Let users add their own labeled milestone days (e.g. '21 - wedding', '45 - my old record') that appear on the recovery ladder alongside the defaults. |
| 401 | Honesty / self-report integrity streak | 3 | M | low | Track a separate 'days I logged honestly' streak that survives relapses, reinforcing that showing up to the journal matters more than perfection. |
| 408 | Multi-addiction overview dashboard | 3 | M | low | A combined summary card ranking all tracked addictions by current streak, total clean days, and reset count for an at-a-glance recovery portfolio. |
| 412 | Penalty completion log + redemption | 3 | M | low | Let users mark assigned penalties as completed and track a 'penalties cleared' count, turning consequences into earned redemption points. |
| 424 | Recovery summary on Insights view | 3 | M | low | Surface a recovery section in the Insights view combining clean days, urge trend, top trigger, and mood correlation for a periodic reflective review. |
| 428 | Shareable milestone card image | 3 | M | low | Generate a privacy-safe milestone image (days + badge, no sensitive detail) the user can save/share to celebrate, reusing the app's image export. |
| 439 | Accountability check-in nudge | 3 | M | med | An opt-in reminder to message your accountability partner after a reset, with a prefilled honest update template. |
| 481 | Streak freeze / sick-day token | 3 | M | med | A limited pool of 'freeze' tokens that pause the clean counter for a logged exception day (illness, prescribed meds) without resetting, reducing all-or-nothing quitting. |
| 490 | Distinguish slip vs. full relapse | 3 | M | high | Add a severity to resets (minor slip vs. full relapse) that optionally preserves part of the streak, matching the app's existing 'a slip is a stumble' framing. |
| 518 | Daily motivational quote / reframe | 2 | S | low | A deterministic daily recovery quote or cognitive reframe in NoFap (date-seeded like the penalty picker) for a consistent daily lift. |
| 549 | Total lifetime urges-resisted leaderboard vs self | 2 | S | low | Track all-time urges resisted with monthly bests, so the user competes against their own prior months rather than other people. |

### Reading, focus & goals (61)

| Rank | Feature | Value | Effort | Risk | Description |
|---:|---|:--:|:--:|:--:|---|
| 34 | Books-read pace projection | 4 | S | low | On the Reading yearly-goal card, show 'on pace for N books' from finishedThisYear vs day-of-year, like a burn-down hint. |
| 56 | Pomodoro task label | 4 | S | low | Let the focus timer take a 'what are you working on' label that flows into the auto-logged DevSession project field. |
| 89 | Challenge progress on Today | 4 | M | low | Surface today's active-challenge rule checkboxes inline on the Today view so users don't forget to log them. |
| 94 | Currently-reading nudge on Today | 4 | M | low | Surface the active reading book with a quick page-update field on the Today view to prompt daily reading. |
| 95 | Custom goal deadline + pace | 4 | M | low | Add an optional due date to CustomGoal and show 'X/day needed to hit it' so manual goals have urgency. |
| 100 | Estimated finish date per book | 4 | M | low | On each reading BookCard, project a finish date from recent pages/day pace versus pages remaining. |
| 104 | Future-log quick scheduler | 4 | M | low | In Collections' Future log, add an inline composer to schedule a task/event on a future date without leaving the page. |
| 127 | Monthly review ritual | 4 | M | low | A month-scoped sibling of WeeklyReview summarizing the month's books, focus hours, goals hit, and one reflection. |
| 130 | Next-week intentions | 4 | M | low | Add a 'set 3 intentions for next week' step to the weekly review, saved as scheduled tasks in the future log. |
| 135 | Pomodoro daily focus-block goal | 4 | M | low | Set a target number of focus blocks per day and show today's completed-blocks progress on the Focus view. |
| 137 | Reading wrapped / year in books | 4 | M | low | A year-end summary card on Reading: total books, pages, avg rating, top-rated, longest book, like a Spotify-Wrapped recap. |
| 154 | Weekly focus-minutes goal | 4 | M | low | A configurable weekly deep-work minutes target with a progress bar on Focus and a row in the Goals rollup. |
| 155 | Weekly review reminder & cadence | 4 | M | low | A gentle Sunday prompt (and 'last reviewed N days ago' badge) nudging users to run the existing WeeklyReview. |
| 157 | Weekly review wins auto-summary | 4 | M | low | Pre-fill the review with auto-detected wins (habits hit, books finished, focus hours) so reflection starts from data. |
| 169 | Challenge reminder/notification | 4 | M | med | Optional daily reminder for incomplete challenge rules, especially valuable for strict reset-on-miss challenges. |
| 175 | Daily pages-read goal | 4 | M | med | Add a per-day pages target in Settings and a small progress ring on Reading driven by today's currentPage deltas across reading books. |
| 180 | Focus vs sleep/mood correlation | 4 | M | med | In Insights, correlate session focus scores against daily sleep or mood metrics to surface what fuels deep work. |
| 198 | Pomodoro sound/notification on phase change | 4 | M | med | Optional chime + Web Notification when a work/break block ends so users can look away from the tab. |
| 201 | Reading session log | 4 | M | med | Add a lightweight 'I read X pages for Y minutes today' logger per book, storing dated page sessions to compute reading speed and minutes. |
| 205 | Roll future-log items into the month | 4 | M | med | When a new month begins, prompt to pull that month's future-log entries into the active monthly spread. |
| 234 | Smart-capture for reading & focus | 4 | L | med | Teach the NL capture parser phrases like 'read 30 pages of Dune' or 'focused 90m on bujo' to log without forms. |
| 261 | Custom goal units & step size | 3 | S | low | Let custom goals define a stepper increment (e.g. +50 for dollars) instead of always +1. |
| 271 | Focus time by project breakdown | 3 | S | low | Add a 'by project' bar chart on Focus alongside the existing tags chart, summing durationMin per project. |
| 275 | Future-log month grouping | 3 | S | low | Group the Future log by month with headers and counts so a long list of upcoming items stays scannable. |
| 307 | Pomodoro long-break cycle | 3 | S | low | Add the classic every-4th-block long break to PomodoroCard so cycles match standard Pomodoro technique. |
| 309 | Promote read-later link to a book | 3 | S | low | Convert a saved book-page link into a want-to-read Book entry in one click, carrying the title over. |
| 318 | Reading streak counter | 3 | S | low | On Reading, a consecutive-days streak from dated book learnings/page-progress edits, mirroring the focusStreak mechanic in src/lib/focus.ts. |
| 352 | Weekly review history timeline | 3 | S | low | List past #review reflections in one place so users can read their week-over-week notes as a journal. |
| 362 | Book genre/tag filter | 3 | M | low | Add an optional genre tag to Book and chips on Reading to filter shelves and break down finished books by genre. |
| 365 | Challenge calendar grid | 3 | M | low | A day-by-day grid view of a challenge's completed days, like a habit calendar, instead of just a percentage. |
| 366 | Challenge rule-completion breakdown | 3 | M | low | On a ChallengeCard, show per-rule completion rates so users see which rule they keep skipping. |
| 373 | Custom goal history log | 3 | M | low | Record dated value updates for a custom goal and render a tiny sparkline of progress over time. |
| 376 | Deep-work calendar heatmap | 3 | M | low | A GitHub-style year heatmap of daily coding minutes on Focus, complementing the 14-day bars. |
| 377 | Distraction tally during a Pomodoro | 3 | M | low | A one-tap 'got distracted' counter during a running block that pre-fills the interruptions field on the auto-logged session. |
| 383 | Export book learnings to a collection | 3 | M | low | One tap to push a book's learnings/quotes into a Collections page so insights live alongside other notes. |
| 384 | Focus session templates | 3 | M | low | Save common session presets (project + tags + typical duration) for one-tap logging on the Focus form. |
| 389 | Goal categories/grouping | 3 | M | low | Group the Goals rollup by area (health, learning, finance) with collapsible sections instead of one flat grid. |
| 390 | Goal milestones & celebration | 3 | M | low | Fire a confetti/achievement when any Goals-rollup row crosses 100%, reusing the achievements engine. |
| 400 | Highlights/quotes capture per book | 3 | M | low | Extend book notes with a dedicated dated quotes list (separate from 'learnings') for saving memorable passages. |
| 405 | Learning log across books | 3 | M | low | An aggregated view of all book 'learnings' across the library, searchable, as a personal knowledge feed. |
| 421 | Read-later tags and aging | 3 | M | low | Tag saved links and surface 'oldest unread' so the read-later queue doesn't silently rot. |
| 422 | Reading goal as monthly breakdown | 3 | M | low | Show finished-books-per-month bars on Reading so the yearly goal is paced visibly across months. |
| 423 | Reading minutes in weekly active total | 3 | M | low | Optionally fold logged reading minutes into the Insights/weekly-review wellbeing rollups as a 'reading time' stat. |
| 442 | Best focus time-of-day insight | 3 | M | med | In Focus, bucket sessions by hour to show when your focus scores peak, reusing time-of-day analysis patterns. |
| 450 | Decreasing/target-down goals | 3 | M | med | Support custom goals where lower is better (e.g. 'screen time under 2h'), inverting the progress fill. |
| 451 | DNF (did-not-finish) shelf | 3 | M | med | Add a fourth BookStatus 'abandoned' with its own column so dropped books leave the active shelves without faking 'finished'. |
| 473 | Reading + focus combined 'deep time' goal | 3 | M | med | A single weekly target combining reading minutes and deep-work minutes for an overall 'intentional time' metric. |
| 482 | Streak-freeze / grace day | 3 | M | med | Allow non-strict challenges an optional grace day so one miss doesn't end momentum. |
| 497 | Quarterly/OKR goal periods | 3 | L | med | Add a period field (week/month/quarter/year) to custom goals so targets reset on the chosen cadence. |
| 502 | Yearly review / annual recap | 3 | L | med | A once-a-year recap pulling books, focus hours, challenges completed, and top habits into a single shareable page. |
| 510 | Average days-to-finish stat | 2 | S | low | On Reading, compute mean days between startedOn and finishedOn across finished books as a pacing insight. |
| 516 | Custom-duration challenge templates | 2 | S | low | Let users save their own challenge presets beyond 75 Hard/90-day for reuse. |
| 528 | Interruptions trend chart | 2 | S | low | Plot interruptions-per-session over time on Focus to show whether your environment is getting quieter. |
| 538 | Re-read marker | 2 | S | low | Allow marking a finished book as re-read with a count, so favorites can be re-logged without distorting the yearly first-read count. |
| 539 | Read-later auto-title fetch | 2 | S | low | When saving a read-later link, derive a title from the URL slug (offline heuristic) so bare links aren't unlabeled. |
| 541 | Review reflection prompts rotation | 2 | S | low | Rotate the weekly-review reflection placeholder through varied prompts (gratitude, lesson, blocker) to deepen entries. |
| 555 | Goal progress photo/note checkpoints | 2 | M | low | Attach a dated note or photo to a custom goal at milestones to capture the journey, reusing ProgressPhoto. |
| 559 | Reorder & pin goals | 2 | M | low | Let users drag or pin custom goals to the top of the Goals rollup so the most important targets lead. |
| 565 | Idle-aware Pomodoro pause | 2 | M | med | Pause the running timer when the tab is hidden for long, optionally, so accidental away-time isn't logged as focus. |
| 567 | Reading vs rating correlation | 2 | M | med | In Insights, correlate book length or genre with your ratings using the existing pearson helper. |
| 570 | Challenge buddy/shared link | 2 | L | high | Generate a shareable read-only snapshot of challenge progress to send an accountability partner. |

### Journaling, bullets, collections & planning (58)

| Rank | Feature | Value | Effort | Risk | Description |
|---:|---|:--:|:--:|:--:|---|
| 11 | Monthly migration ritual | 5 | M | low | An end-of-month wizard that walks every open task, asking migrate-forward / schedule / drop, the canonical BuJo monthly reset the app doesn't yet guide. |
| 88 | Brain-dump / inbox bucket | 4 | M | low | A dateless quick-capture inbox (entries with empty date) for unsorted thoughts, triaged later into days or collections. |
| 97 | Day templates | 4 | M | low | Save a set of starter bullets (e.g. morning routine, standup) as a named template and one-tap stamp it onto any day's log from the CaptureBar. |
| 105 | Global entry search | 4 | M | low | A command-palette search across all entries by text, tag, type, and status with jump-to-day, beyond per-month views. |
| 124 | Monthly & yearly recurrence rules | 4 | M | low | Extend Recurrence (currently daily/weekly only) with monthly (day-of-month / nth-weekday) and yearly freq so rent, birthdays, and annual reviews auto-populate the daily log. |
| 125 | Monthly goals as checklist | 4 | M | low | Turn the free-text MonthlyMeta.goals into trackable checkable goal items with progress shown in the month summary bar. |
| 143 | Schedule entry into Future Log | 4 | M | low | Add a 'scheduled' action on EntryRow that sets status='<' and moves a task to a chosen future date, wiring up the unused 'scheduled' status the type system already defines. |
| 148 | Tag pages (auto-collections) | 4 | M | low | A Collections sub-view that lists every #tag and opens a filtered page of all entries bearing it across all days, turning tags into navigable index pages. |
| 156 | Weekly review template card | 4 | M | low | A guided weekly-review spread (wins, misses, next-week tasks) that stamps a structured collection each Sunday. |
| 159 | Weekly spread view | 4 | M | low | A 7-day horizontal spread between Monthly and Today showing each day's tasks/events side by side, the classic weekly log the app lacks. |
| 178 | Due dates & overdue badges | 4 | M | med | Add an optional dueDate to tasks (separate from the day they live on) so a task logged today but due Friday shows a countdown and surfaces in Migration when late. |
| 190 | Natural-language dates in capture | 4 | M | med | Parse 'call mom friday' or 'gym tomorrow' in parseQuickCapture to auto-schedule the entry on that date rather than today. |
| 216 | Timeboxed event times | 4 | M | med | Add optional start/end time to event entries so the daily log can show a scheduled agenda and feed an hourly day plan. |
| 231 | Nested sub-tasks / checklist children | 4 | L | med | Let an Entry have a parentId so tasks can hold indented sub-items in the daily log, with parent completion gated on children done. |
| 244 | Anniversary recurrence from birthdays | 3 | S | low | Auto-generate event entries on the daily/future log from the Birthdays collection so they appear in the journal flow, not just the list. |
| 252 | Carry-forward all overdue from Today | 3 | S | low | Extend the existing yesterday-carryover banner to optionally pull every overdue open task forward, not just yesterday's. |
| 258 | Collection item checkboxes | 3 | S | low | Render task-type entries inside a custom collection as checkable items with a progress bar (e.g. packing list 7/12), not just text rows. |
| 259 | Convert note ↔ task ↔ event | 3 | S | low | A one-tap type switcher on EntryRow so a captured note can become a task (or event) without deleting and retyping. |
| 268 | Entry threading view | 3 | S | low | Surface the existing originId chain as a 'history' popover on a migrated task showing every day it moved through. |
| 296 | Move entry to a collection | 3 | S | low | A per-entry action to reassign its collection field, letting a daily bullet be filed into a project/list page without retyping. |
| 315 | Quick-template manager UI | 3 | S | low | A Settings editor for the existing settings.quickTemplates snippets (add/edit/reorder/delete) instead of them being opaque. |
| 327 | Smart daily migration nudge | 3 | S | low | On opening Today with overdue tasks, a dismissible inline prompt to run a quick migrate-or-drop pass for just those items. |
| 339 | Tag autocomplete in capture | 3 | S | low | As the user types '#', suggest existing tags from across the journal to keep tag vocabulary consistent. |
| 364 | Bulk-select entry actions | 3 | M | low | Checkbox multi-select in the daily log to migrate, drop, tag, or move-to-collection many entries at once. |
| 368 | Collection folders / grouping | 3 | M | low | Add an optional group field to Collection so many pages can be organised under headings (Work, Travel, Home). |
| 369 | Collection templates | 3 | M | low | Prebuilt collection blueprints (packing list, project tracker, meeting notes, weekly review) that scaffold a new Collection with seed entries. |
| 375 | Custom signifier glyphs | 3 | M | low | Let users define extra signifiers (e.g. ☆ idea, $ money, ✈ travel) mapped to a key prefix in parseQuickCapture and rendered in glyphFor/legend. |
| 380 | Entry notes / expand | 3 | M | low | An optional longform note body on an Entry, expandable under the one-line bullet for context without cluttering the log. |
| 386 | Future Log year grid | 3 | M | low | Upgrade the flat future list into the traditional 6-month / 12-month gridded Future Log spread with per-month buckets and inline add. |
| 402 | Index / table of contents | 3 | M | low | A classic BuJo Index page auto-listing every collection and notable spread with page jumps, the navigational backbone of analog BuJo. |
| 404 | Keyboard-first rapid logging | 3 | M | low | Hotkeys to add a bullet, cycle status, mark important, and jump days entirely from the keyboard for fast journaling. |
| 406 | Migration analytics | 3 | M | low | An Insights card counting how often each task was migrated, surfacing chronically-deferred tasks ('migrated 4×') to prompt drop-or-do. |
| 417 | Print / PDF a spread | 3 | M | low | A print-friendly stylesheet to export a month, weekly spread, or collection as a clean printable page. |
| 425 | Recurring task skip/snooze | 3 | M | low | Let a single generated occurrence be skipped or pushed a day without editing the underlying rule. |
| 427 | Saved searches / smart filters | 3 | M | low | Persist queries like 'open !important #work tasks' as named filters in the sidebar for one-tap recall. |
| 433 | Tag rename / merge | 3 | M | low | A Settings tool to rename a tag everywhere or merge two tags, fixing typos like #wrk vs #work across all entries. |
| 438 | Weekly intentions on Monthly | 3 | M | low | Per-week intention/theme fields in the month view (one line per week row) for lightweight weekly planning inside the monthly spread. |
| 452 | Drag entry across days | 3 | M | med | Drag a bullet from one calendar day to another in Monthly/Weekly to reschedule it via migrateEntry. |
| 453 | Drag-to-reorder daily entries | 3 | M | med | Add an explicit order field and drag handles in the daily log so users can prioritise bullets manually instead of strict insertion order. |
| 457 | Goal-to-task linking | 3 | M | med | Link a monthly goal to its supporting daily tasks via tag/id so completing tasks advances the goal's progress. |
| 472 | Priority levels beyond important | 3 | M | med | Replace the single important boolean with a 0-3 priority so the Migration sort and daily log can rank tasks more granularly. |
| 484 | Trash / undo for deleted entries | 3 | M | med | A soft-delete recycle bin so accidentally removed bullets (and dropped collections) can be restored within a window. |
| 493 | Day plan hourly grid | 3 | L | med | An optional time-blocked agenda strip on Today populated from timed events, the classic 'daily plan' column. |
| 495 | Kanban board for a collection | 3 | L | med | A To-do / Doing / Done column view of any project collection's task entries, driven by status, as an alternate Collections layout. |
| 496 | Link entries to each other | 3 | L | med | Let an entry reference another entry/collection by id ([[ ]] style) to build a lightweight wiki of journal links. |
| 509 | Archive collections | 2 | S | low | An archived flag on Collection to hide finished project pages without deleting their entries. |
| 512 | Calendar event tooltips & filtering | 2 | S | low | On the Monthly grid, filter the event dots by tag/type and show a hover list, making a busy month readable. |
| 514 | Collection cover / description | 2 | S | low | Add an optional description and cover note to a Collection so project pages carry context and goals at the top. |
| 515 | Collection-level CSV export | 2 | S | low | Export a single collection's entries to CSV (e.g. a project task list) rather than the whole journal at once. |
| 517 | Daily log time-stamping | 2 | S | low | Optionally show the createdAt time beside each entry so the daily log doubles as a timeline of the day. |
| 519 | Duplicate / repeat an entry | 2 | S | low | Copy an existing entry to another day or as a one-off repeat, faster than retyping a recurring-ish task. |
| 521 | Entry color highlight / washi | 2 | S | low | Let a bullet be highlighted with a background color/washi-tape style for visual emphasis in the daily log. |
| 534 | Pause a recurrence | 2 | S | low | An active toggle on Recurrence so a daily rule can be paused (vacation) and resumed without losing its config. |
| 537 | Pin / favourite collections | 2 | S | low | Let users pin key collections to the top of the Collections view and optionally the sidebar for fast access. |
| 544 | Tag color coding | 2 | S | low | Let users assign a Catppuccin color to specific tags so #work / #health chips and calendar dots are visually distinct. |
| 546 | Templated capture chips | 2 | S | low | Tappable chips above CaptureBar that pre-fill common bullets ('· water plants', '○ ') so frequent entries are one tap. |
| 557 | Per-collection sort & layout | 2 | M | low | Let each collection choose its render mode (checklist, plain list, grid) and sort (manual, alpha, status) and remember it. |
| 558 | Recurring collection refresh | 2 | M | low | A collection (e.g. weekly groceries) that can be reset/regenerated from its template each period, keeping a fresh checklist. |

### Data, sync, privacy, export & backup (56)

| Rank | Feature | Value | Effort | Risk | Description |
|---:|---|:--:|:--:|:--:|---|
| 2 | Full JSON export/import | 5 | S | low | Add a one-click download of the entire JournalData blob as bujo-backup.json plus a re-import file picker in Settings, independent of CSV. |
| 21 | Last-write-wins timestamps per entry | 5 | M | med | Add updatedAt to Entry/Habit/metric records so conflict.ts merges by most-recent edit rather than winner-first union, reducing stale-revival of deleted items. |
| 26 | Tombstone-aware deletion sync | 5 | M | med | Track deleted ids in a tombstones array so union-merge in conflict.ts stops resurrecting items deleted on another device. |
| 32 | Auto-backup nudge banner | 4 | S | low | Use settings.lastBackup to show a dismissible 'You haven't backed up in N days' banner on Today when the gap exceeds a threshold. |
| 33 | Backend health check & validation | 4 | S | low | A 'Test connection' button that validates selfHostUrl/token, gist token scope, or Drive client id before relying on them. |
| 40 | Encrypted JSON backup file | 4 | S | low | Offer an AES-GCM-encrypted variant of the JSON export using crypto.ts with a passphrase, for safe storage in untrusted locations. |
| 69 | Sync now button | 4 | S | low | A manual 'Sync now' action per backend in Settings that forces an immediate push+pull, bypassing the save debounce. |
| 70 | Sync settings export exclusion | 4 | S | low | Ensure exports/backups strip selfHostToken, gist token, and Drive client id by default so secrets don't leak in shared backups. |
| 71 | Sync status indicator in shell | 4 | S | low | Surface the existing bujo:sync CustomEvent (syncing/synced/error) as a small persistent badge in the app shell header across all views. |
| 91 | Conflict detection via content hash | 4 | M | low | Store a hash of the last-pushed blob; on pull compare hashes to detect divergence and only run conflict-merge when they differ. |
| 103 | Export to Markdown daily logs | 4 | M | low | Generate per-day Markdown files (Obsidian-friendly) from entries/gratitude/metrics, zipped for download. |
| 117 | ICS export of events/tasks | 4 | M | low | Extend ics.ts (currently parse-only) with a writer that exports scheduled tasks/events as a .ics calendar feed. |
| 118 | Import preview & dry-run | 4 | M | low | Before applying an imported JSON/CSV, show a summary diff (X entries added, Y habits changed) and require confirm, preventing accidental overwrite. |
| 141 | Rotating local backup snapshots | 4 | M | low | Keep the last N JournalData snapshots in IndexedDB with timestamps, restorable from a Settings list, as an undo safety net. |
| 174 | CSV import for metrics/habits | 4 | M | med | Add reverse of csv.ts: parse metrics.csv and habits.csv back into the journal so users can bulk-load from spreadsheets. |
| 179 | Encrypted blob at rest for self-host | 4 | M | med | Optionally E2E-encrypt the JournalData before serverSync pushes to PostgREST, so even the self-host DB stores only ciphertext. |
| 186 | Merge-on-import vs replace toggle | 4 | M | med | Let import run through conflict.ts union-merge or do a clean replace, chosen via a radio in the import dialog. |
| 188 | Multi-device list & naming | 4 | M | med | Track deviceId()+a user-set device name per sync push so Settings shows 'which devices have synced', aiding multi-device confidence. |
| 191 | Offline sync queue | 4 | M | med | Queue failed pushes (network down) and retry on reconnect via the online event, instead of silently dropping the keepalive flush. |
| 197 | Point-in-time restore picker | 4 | M | med | Build a UI over rotating snapshots to preview and roll back the whole journal to a chosen date/time. |
| 200 | QR-code device pairing | 4 | M | med | Show the bujocloud passphrase (or a transfer token) as a scannable QR so a new device can join sync without typing. |
| 207 | Scheduled auto-backup to active backend | 4 | M | med | Add a daily debounced auto-push to whichever backend is configured (gist/drive/folder/cloud), gated by a Settings toggle. |
| 209 | Schema-version migration on import | 4 | M | med | Run imported blobs with older SCHEMA_VERSION through a migration chain before merge so old backups load cleanly. |
| 210 | Selective field-level conflict for metrics | 4 | M | med | For keyed daily metrics, merge non-null fields from both sides instead of whole-row winner, so mood from one device and sleep from another both survive. |
| 219 | Two-way ICS calendar import to tasks | 4 | M | med | Extend the ics.ts parser path to import VEVENTs as scheduled bujo events/tasks on the matching dates, not just one-off reads. |
| 224 | Passphrase change with re-encryption | 4 | M | high | Let bujocloud/crypto users rotate their sync passphrase: decrypt with old, re-upload under new pathCode, migrating the blob. |
| 230 | Manual conflict review modal | 4 | L | med | When conflict.ts detects diverging snapshots on pull, show a side-by-side diff modal in Settings letting the user pick which side wins per collection instead of auto-union. |
| 232 | Progress-photo backup handling | 4 | L | med | Include IndexedDB-stored images (imageStore/imageStore) in JSON/Drive backups as base64 or referenced blobs so photos survive restore. |
| 239 | App-lock passcode for data at rest | 4 | L | high | Encrypt the localStorage blob with crypto.ts behind an unlock passcode on app open, so a borrowed device can't read the journal. |
| 246 | Backup integrity checksum | 3 | S | low | Append a checksum to JSON/encrypted exports and verify on import, rejecting truncated/corrupted backup files. |
| 282 | Image export size guard | 3 | S | low | Warn and offer to downscale when an image-heavy journal export exceeds a size threshold, given the known fromCharCode stack issue. |
| 285 | Last-synced timestamp readout | 3 | S | low | Show 'Last synced 3m ago' per active backend in Settings using lastSync fields, so users know data is current. |
| 289 | Local-only lock mode | 3 | S | low | A Settings switch that disables all network sync backends and asserts local-only, for privacy-sensitive periods. |
| 300 | Per-collection export selection | 3 | S | low | In CSV/JSON export, checkboxes to include only chosen data domains (e.g. fitness only, journal only) for sharing subsets. |
| 308 | Privacy/redaction export filter | 3 | S | low | On export, optionally strip Recovery (NoFap), Cycle, and free-text note fields so a shared backup omits sensitive domains. |
| 331 | Storage-quota usage meter | 3 | S | low | Show localStorage/IndexedDB bytes used vs browser quota in Settings, warning before the journal hits quota limits. |
| 335 | Sync conflict notification toast | 3 | S | low | When a pull triggers a non-trivial merge, surface a toast 'Merged changes from another device' so users notice silent reconciliation. |
| 336 | Sync diagnostics log | 3 | S | low | Keep an in-app rolling log of recent sync attempts (backend, time, status, error) viewable in Settings for troubleshooting. |
| 337 | Sync passphrase strength meter | 3 | S | low | Add a zxcvbn-style strength indicator and minimum-length guard on the bujocloud passphrase input, since it's the only key. |
| 338 | Sync pause/resume control | 3 | S | low | A toggle to temporarily pause auto-sync (e.g. while bulk editing) and a queued flush on resume, avoiding mid-edit pushes. |
| 357 | Wipe-and-reset with confirmation backup | 3 | S | med | A 'Reset app data' action that forces a JSON export first, then clears localStorage/IndexedDB, preventing irreversible data loss. |
| 358 | Backup reminder via PWA notification | 3 | M | low | Use the existing reminder/notification plumbing to fire a weekly 'back up your journal' local notification when lastBackup is stale. |
| 379 | Drive backup version history | 3 | M | low | Keep dated copies in the Drive appDataFolder (not just overwrite bujo.json) so users can restore prior Drive snapshots. |
| 387 | Gist revision restore | 3 | M | low | Use the GitHub gist history API in github.ts to list and restore previous bujo.json revisions of the secret gist. |
| 418 | Print/PDF archive export | 3 | M | low | A print-styled, paginated full-journal view that exports to PDF via the browser print dialog for a physical archive. |
| 435 | Verify-restore self test | 3 | M | low | After a backup, optionally round-trip decode it back and diff against live data, confirming the backup is actually restorable. |
| 440 | Auto-lock on idle | 3 | M | med | Re-lock the app-lock passcode after N minutes of inactivity, clearing the decrypted blob from memory. |
| 441 | Backend migration wizard | 3 | M | med | A guided flow to move from one backend to another (e.g. gist → self-host) that pulls, verifies, then switches storageMode. |
| 469 | One-tap multi-backend mirror | 3 | M | med | Allow more than one backend active at once (e.g. folder + gist) with a single save mirroring to all configured targets. |
| 471 | PBKDF2 iteration upgrade path | 3 | M | med | Store the iteration count in EncryptedBlob (bump v:2) so crypto.ts can raise iterations over time and transparently re-encrypt older blobs. |
| 476 | Selective restore by domain | 3 | M | med | From a backup, restore only chosen domains (e.g. just workouts) onto the current journal rather than full replace. |
| 494 | Import from generic habit-tracker CSV | 3 | L | med | A mapping step that lets users map columns of an arbitrary exported CSV (Loop, Strava) onto bujo habits/metrics on import. |
| 498 | Read-only shared snapshot link | 3 | L | med | Publish an encrypted read-only snapshot to /api/sync with a share code so a coach can view (not edit) the journal. |
| 501 | Subscribable ICS feed URL | 3 | L | med | Expose a read-only encrypted .ics endpoint via the existing /api/sync so users can subscribe to their bujo events in Google/Apple Calendar. |
| 508 | Remote-wipe a lost device | 3 | L | high | Let a user mark a deviceId as revoked in the synced blob so that device clears local storage on next pull. |
| 563 | Device clock-skew guard for merges | 2 | M | med | Detect large clock differences between devices using server time on push and warn, since timestamp-based merge depends on clocks. |

### UI, UX, shell, navigation, theming & a11y (56)

| Rank | Feature | Value | Effort | Risk | Description |
|---:|---|:--:|:--:|:--:|---|
| 7 | Command palette deep actions | 5 | M | low | Extend the Ctrl-K palette beyond nav/export to run any in-app action (toggle theme, start fast, add habit, mark today done, open settings section) as fuzzy-matched commands. |
| 16 | Command palette entry search | 5 | M | med | Let Ctrl-K search across journal entries, collections, habits and goals by text, jumping straight to the matching item/date. |
| 30 | App-wide undo/redo toast with shortcut | 4 | S | low | Surface the existing undo/redo via Ctrl-Z/Ctrl-Shift-Z everywhere plus a transient 'Undo' toast after destructive edits. |
| 41 | Floating quick-add FAB | 4 | S | low | A persistent mobile floating action button that opens CaptureBar/SmartInput from any view to log a thought instantly. |
| 44 | Hide unused views from nav | 4 | S | low | Per-view visibility toggles in Settings so someone who never uses Reading/Cycle can declutter the Sidebar and BottomNav. |
| 58 | Recent + frequent commands in palette | 4 | S | low | Surface a recents/most-used section at the top of the Ctrl-K palette so common jumps (Today, Trackers) are one keystroke. |
| 65 | Skip-to-content + landmark a11y | 4 | S | low | Add a skip-to-main link, proper ARIA landmarks/roles on Sidebar/TopBar/main, and an aria-current on the active nav item. |
| 96 | Customizable bottom-nav slots | 4 | M | low | Let mobile users choose which 4-5 views appear in the BottomNav, with a 'More' sheet for the rest. |
| 98 | Density mode (compact/cozy/comfortable) | 4 | M | low | A Settings toggle that sets a data-density attribute scaling padding/row-height across EntryRow, lists and cards for power users vs. relaxed reading. |
| 106 | Global keyboard shortcut map | 4 | M | low | Add single-key shortcuts (g+t Today, g+m Monthly, n new entry, / focus capture) with a '?' overlay cheat-sheet listing them. |
| 113 | High-contrast accessibility theme | 4 | M | low | A WCAG-AAA high-contrast variant (stronger text/border contrast, no low-contrast surfaces) selectable in Settings for low-vision users. |
| 134 | Pinned/favorite views in sidebar | 4 | M | low | Let users star views (e.g. Pickleball, Gym) to a Favorites group at the top of the Sidebar and reorder the rest. |
| 153 | Visible focus-ring audit | 4 | M | low | Ensure every interactive element (RadialTracker, Heatmap cells, sticker buttons, custom fields) has a visible keyboard focus indicator. |
| 166 | Back/forward view history | 4 | M | med | Track view navigation history so browser back (and an in-app back arrow) returns to the previous view/date, not just the last route. |
| 177 | Deep-linkable URLs for views/dates | 4 | M | med | Encode active view + date in the URL hash so a specific day or tracker can be bookmarked and shared/reopened. |
| 187 | Mobile swipe between day/month | 4 | M | med | Horizontal swipe gesture on Today/Monthly to move to the previous/next day or month, matching the existing prev/next buttons. |
| 206 | Roving-focus arrow nav for lists | 4 | M | med | Arrow-key navigation through entry lists, habit rows and the Monthly calendar grid with Enter to open and Space to toggle. |
| 214 | Swipe-to-complete entry rows | 4 | M | med | Swipe an EntryRow right to mark a task complete and left to reveal migrate/schedule/delete actions on touch devices. |
| 235 | Today/home dashboard customization | 4 | L | med | Drag-to-reorder and show/hide the Today cards (habits, fasting, reflection, coach) so each user's home matches their priorities. |
| 243 | Adjustable base font size | 3 | S | low | A text-size slider (separate from chart zoom) that scales rem-based typography app-wide for readability. |
| 250 | Breadcrumb / sub-view header | 3 | S | low | A consistent breadcrumb under TopBar for nested views (FitnessHub → Gym → session) so users know where they are and can step back. |
| 272 | Focus/zen reading mode | 3 | S | low | A distraction-free toggle that hides nav chrome and centers content for journaling, exitable via Esc. |
| 274 | Full accent color picker | 3 | S | low | Replace the limited accent override with a swatch grid of all Catppuccin accent tokens plus a live preview of buttons/links. |
| 284 | Keyboard date navigation | 3 | S | low | Arrow/PageUp-PageDown and 't' for today on Today/Monthly to move between dates without reaching for buttons. |
| 288 | Loading skeletons for heavy views | 3 | S | low | Show skeleton placeholders while Insights/Stats/correlations compute or sync hydrates, instead of layout shift/blank. |
| 295 | More Catppuccin flavors | 3 | S | low | Add Frappé and Macchiato as theme choices alongside Mocha/Latte, since the token system already supports flavor swaps. |
| 303 | Per-view scroll-position restore | 3 | S | low | Remember scroll position per view so switching tabs and returning lands you where you left off in a long spread. |
| 313 | PWA install + offline status chip | 3 | S | low | A subtle TopBar chip prompting Add-to-Home-Screen and showing offline/online state for the local-first app. |
| 320 | Reduced-motion mode | 3 | S | low | Honor prefers-reduced-motion plus an explicit Settings toggle that disables MilestoneToast/StickerBar/transition animations across the app. |
| 324 | Screen-reader live region for toasts | 3 | S | low | Route MilestoneToast, sync and penalty notifications through an aria-live region so screen readers announce them. |
| 330 | Sticky date/section headers | 3 | S | low | Make the day and section headers stick to the top while scrolling long Today/Collections spreads for constant context. |
| 342 | Theme + density quick-toggle in TopBar | 3 | S | low | A one-click dark/light and density toggle in the TopBar for fast switching without opening Settings. |
| 346 | True dark/light/system auto by time | 3 | S | low | Option to switch mocha/latte automatically on a schedule (e.g. light 7am, dark 8pm) independent of OS setting. |
| 355 | Pull-to-refresh sync | 3 | S | med | Pull-down gesture on the main scroll area to trigger a manual cloud/folder sync with a spinner, mirroring SyncIndicator state. |
| 370 | Color-blind safe palette mode | 3 | M | low | An option that swaps the green/red habit-polarity colors for a color-blind-safe pairing plus shape/icon cues. |
| 403 | Inline keyboard quick-actions row | 3 | M | low | When an entry is focused, show a hint bar of one-key actions (x complete, > migrate, < schedule, # tag) like a real bujo key. |
| 410 | Onboarding-aware empty states | 3 | M | low | Replace blank views (empty Trackers/Goals/Reading) with friendly illustrated empty states and a primary 'add your first…' CTA. |
| 413 | Per-tracker accent colors | 3 | M | low | Let users assign a color to each habit/tracker that flows into its RadialTracker, Heatmap and chart for at-a-glance distinction. |
| 420 | Quick-switcher recent views | 3 | M | low | A Ctrl-Tab style overlay cycling the last few visited views for fast back-and-forth between two areas. |
| 430 | Spotlight onboarding coach-marks | 3 | M | low | Contextual one-time tooltips highlighting new UI (command palette, swipe gestures, FAB) the first time a view is opened. |
| 434 | Tap targets & thumb-zone tuning | 3 | M | low | Audit and enlarge mobile tap targets to 44px minimum and move primary actions into the bottom thumb zone. |
| 454 | Edge-swipe to open sidebar | 3 | M | med | Swipe in from the left screen edge on mobile to open the nav drawer, swipe out to close, instead of relying on the menu button. |
| 463 | Keyboard-accessible heatmap/charts | 3 | M | med | Make Heatmap and viz charts focusable with a tab-readable text summary/tooltip per cell for non-mouse and SR users. |
| 464 | Long-press context menu on entries | 3 | M | med | Touch long-press (and right-click on desktop) on an EntryRow opens a context menu of migrate/schedule/tag/delete actions. |
| 499 | Responsive two-pane desktop layout | 3 | L | med | On wide screens show a master list (days/collections) beside the detail pane instead of full-width single column. |
| 520 | Dyslexia-friendly font option | 2 | S | low | Toggle an OpenDyslexic/Atkinson typeface for body text, complementing the existing handwriting realism font. |
| 527 | Haptic feedback on mobile actions | 2 | S | low | Light vibration on completing a habit, hitting a milestone or finishing a Pomodoro on supporting devices. |
| 532 | Numbered quick-jump in palette | 2 | S | low | Show 1-9 number badges on the first palette results so a user can jump with Ctrl-K then a digit. |
| 535 | Persisted collapsed sidebar state | 2 | S | low | Remember the collapsed/expanded Sidebar choice in Settings so it survives reloads instead of resetting per session. |
| 540 | Resizable sidebar width | 2 | S | low | Let desktop users drag the Sidebar border to widen/narrow it, persisted in Settings. |
| 543 | Sidebar search/filter box | 2 | S | low | A type-to-filter input at the top of the Sidebar to quickly find a view when many are enabled. |
| 548 | Toast/notification stacking & dismiss | 2 | S | low | Stack multiple MilestoneToast/penalty toasts with a dismiss-all and a per-toast close button instead of overlap. |
| 552 | Animated view transitions | 2 | M | low | Subtle slide/fade between views (respecting reduced-motion) to give the SPA navigation a polished native feel. |
| 561 | Tablet sidebar rail mode | 2 | M | low | An icon-only rail Sidebar on medium widths (tablet) that expands on hover, between full sidebar and mobile drawer. |
| 562 | Theme preview thumbnails | 2 | M | low | Show small live mini-mockups for each theme/flavor in Settings instead of plain names so users see the look before applying. |
| 564 | Editable keyboard shortcut bindings | 2 | M | med | A Settings panel to remap the global shortcuts, persisted in Settings, with conflict detection. |

### Insights, stats, analytics & coaching engine (57)

| Rank | Feature | Value | Effort | Risk | Description |
|---:|---|:--:|:--:|:--:|---|
| 6 | Coach: declining-habit early warning | 5 | M | low | Detect a habit whose 7-day rate dropped sharply vs its 30-day baseline and coach a recovery action before the streak dies. |
| 9 | Goal pace projection | 5 | M | low | On Goals, show whether each goal is ahead/behind the linear pace needed to finish by its deadline, with a colored pace bar. |
| 10 | Habit-to-mood impact ranking | 5 | M | low | For each habit, compare average mood on days done vs days skipped and rank habits by their mood lift on Insights. |
| 15 | Weekly digest summary | 5 | M | low | Auto-generate a text recap of the past 7 days (streaks, completion %, mood trend, biggest win/slip) inside the Weekly Review. |
| 27 | Unified dashboard view | 5 | L | med | A new top-level Dashboard assembling the most important widgets (streaks, today's coach tips, mood trend, goal pace) into one scannable screen. |
| 36 | Coach digest as a daily card | 4 | S | low | Bundle the top coach tips, one insight and one forecast into a single dismissable 'Today's brief' card on Today. |
| 42 | Habit completion calendar heatmap (per habit) | 4 | S | low | A single-habit GitHub-style heatmap on the Trackers detail using habitIntensity levels. |
| 66 | Sleep debt tracker | 4 | S | low | Compute cumulative deficit vs a target sleep hours setting and chart running sleep debt over time in Stats. |
| 73 | Trend arrows on stat tiles | 4 | S | low | Add up/down/flat arrows with % change vs the prior period to the four Big tiles at the top of Insights. |
| 82 | Anomaly day detector | 4 | M | low | Highlight days where a metric deviates >2 SD from its rolling mean (unusually bad sleep, mood crash) as flagged dots in Stats charts. |
| 90 | Coach: optimal time-of-day nudge | 4 | M | low | Use checkin peakHour per habit to suggest the time window when the user is most likely to actually complete each habit. |
| 92 | Consistency score (0-100) | 4 | M | low | A single composite index from streaks, weekday consistency and completion %, shown as a headline number with history on Insights. |
| 107 | Goal burndown chart | 4 | M | low | A burndown line for quantitative goals showing remaining work vs ideal trajectory on the Goals view. |
| 119 | Insight feed with dismissal & history | 4 | M | low | Turn one-off insights into a scrollable, timestamped feed users can dismiss or pin, persisted in settings. |
| 126 | Monthly review report | 4 | M | low | A month-scoped version of the weekly digest with month-over-month deltas, shown on Monthly and Insights. |
| 132 | Personal-record auto-detection feed | 4 | M | low | Detect and announce new PRs (longest streak, best mood week, most active week, top lift) as a chronological achievements feed. |
| 133 | Pickleball win-rate trend & forecast | 4 | M | low | Chart games-won ratio over time with a trend line and project rating-readiness on Pickleball/Insights. |
| 136 | Reading pace & finish forecast | 4 | M | low | On Reading, project finish date for each in-progress book from recent pages/day and flag stalled books. |
| 147 | Sparkline behind each habit row | 4 | M | low | Render a 30-day mini completion sparkline inline on every habit row in Trackers for at-a-glance trend. |
| 149 | Time-allocation pie | 4 | M | low | Aggregate logged durations (workouts, focus, reading, pickleball) into a where-your-tracked-time-goes pie in Stats. |
| 163 | Workout volume progression chart | 4 | M | low | Chart total weekly tonnage / sets per muscle group over time in Gym to visualize progressive overload. |
| 164 | 7-day mood forecast band | 4 | M | med | Extend rollingAverage into a simple linear/EWMA projection drawing a dashed forecast with confidence band on the mood chart in Stats. |
| 165 | Adaptive weekly-goal suggestion | 4 | M | med | Recommend raising or lowering a habit's weekly goal based on the trailing 4-week actual completion rate. |
| 170 | Coach: habit stacking suggestion | 4 | M | med | When two habits are usually done together (high co-occurrence), the coach suggests stacking the lagging one onto the reliable one. |
| 172 | Compare two periods side by side | 4 | M | med | A 'this month vs last month' toggle that overlays or twins each chart for direct comparison in Stats. |
| 173 | Correlation matrix across all trackers | 4 | M | med | Extend correlations.ts beyond mood/stress/sleep to pairwise-correlate every numeric habit, fitness, focus and metric series, shown as a sortable matrix on Insights. |
| 176 | Date-range picker for all charts | 4 | M | med | Add a shared range control (week/month/quarter/year/custom) that filters every Stats and Insights chart. |
| 184 | Lagged (next-day) correlations | 4 | M | med | Compute correlation between a metric today and another tomorrow (e.g. sleep tonight vs mood tomorrow) so the Patterns card surfaces lead/lag effects, not just same-day. |
| 189 | Multi-metric overlay chart | 4 | M | med | Let users pick 2-3 normalized metrics to overlay on one time-series chart to eyeball relationships in Stats. |
| 213 | Streak-break risk forecast | 4 | M | med | On Today/Insights, predict which active streaks are statistically most likely to break tomorrow based on weekday consistency and recent misses. |
| 223 | Cycle-phase performance overlay | 4 | M | high | For users tracking Cycle, overlay phase bands on mood/energy charts to reveal cycle-linked patterns (privacy-gated). |
| 225 | Trigger analysis for recovery slips | 4 | M | high | On Recovery, correlate urge-log context tags and weekday/time with relapse days to surface personal trigger patterns. |
| 227 | Customizable dashboard widgets | 4 | L | med | Let users add/remove/reorder dashboard cards and persist layout in settings. |
| 241 | What-if simulator | 4 | L | high | Interactive control: 'if I slept +1h, predicted mood change' computed from the user's own regression slope, in Insights. |
| 247 | Best-day / worst-day insight cards | 3 | S | low | Surface the single best and worst day of the week/month with the metrics that made it stand out, in Insights. |
| 255 | Coach: backup/sync health insight | 3 | S | low | Surface sync staleness and data-loss risk as an actionable insight card rather than only a settings nudge. |
| 256 | Coach: streak milestone forecast | 3 | S | low | Tell the user the exact date they'll hit the next round milestone (30/50/100 days) for their top streak. |
| 283 | Insight confidence/sample badges | 3 | S | low | Annotate every analytic with the number of data points behind it so users know when an insight is preliminary. |
| 293 | Momentum indicator | 3 | S | low | A simple rising/falling momentum badge per tracked area based on recent slope vs baseline, shown on Trackers and Dashboard. |
| 294 | Mood volatility metric | 3 | S | low | Compute standard deviation of mood over a window as a stability score and chart volatility trend in Stats. |
| 305 | Plain-language confounder warning | 3 | S | low | Flag correlations with low sample size or possible reverse causation in the Patterns card so users don't over-trust a spurious r-value. |
| 325 | Seasonal / monthly mood pattern | 3 | S | low | Aggregate mood by calendar month across all years to reveal seasonal trends in Stats. |
| 333 | Streak-recovery encouragement | 3 | S | low | After a streak breaks, coach shows how the prior streak compared to average and frames the restart positively. |
| 351 | Weekday vs weekend behavior split | 3 | S | low | Insight card contrasting habit completion, mood and activity on weekdays vs weekends. |
| 367 | Coach prioritization scoring | 3 | M | low | Replace the fixed coach tip ordering with a value-weighted score (streak length, goal gap, recency) so the most impactful tip leads. |
| 371 | Completion funnel by time-of-day | 3 | M | low | Show what fraction of daily habits are typically done by morning/afternoon/evening using habitTimes, in Insights. |
| 385 | Focus/flow vs stress dashboard | 3 | M | low | Dedicated chart pairing focus-session flow rating against stress for dev sessions, with the correlation called out. |
| 394 | Habit consistency forecast to goal | 3 | M | low | Project when a habit will hit a target streak or weekly-goal cadence at current pace and show an ETA on the Trackers detail. |
| 396 | Habit correlation heatmap | 3 | M | low | Visualize the all-habit correlation matrix as a Catppuccin-tinted heatmap grid in Insights. |
| 443 | Challenge difficulty insight | 3 | M | med | Compare a challenge's completion rate to the user's normal habit rate and warn if a new challenge looks over-ambitious. |
| 444 | Coach: overcommitment warning | 3 | M | med | Flag when too many habits are scheduled on one weekday with low historical completion and suggest redistributing. |
| 445 | Coach: rest-day recommendation | 3 | M | med | From workout load and recovery metrics, suggest a rest day when training volume spikes, on FitnessHub/Coaching. |
| 456 | Goal contribution breakdown | 3 | M | med | For each goal, show which habits/activities contributed to progress this period in a stacked bar on Goals. |
| 460 | Habit half-life / decay metric | 3 | M | med | Estimate how many days after a miss a habit typically takes to recover, surfaced as resilience insight per habit. |
| 466 | Mood word cloud from notes | 3 | M | med | Tally words/tags from entries on high-mood vs low-mood days and show what you write about when you feel best/worst. |
| 487 | Weather-mood correlation | 3 | M | med | Use the existing weather lib to correlate logged weather with mood and energy and surface it in Patterns. |
| 489 | Year-in-review shareable card | 3 | M | med | Generate an exportable image summary (top stats, streak, mood arc) from the existing year-in-review data for sharing. |

### Platform, desktop, mobile, integrations & automation (56)

| Rank | Feature | Value | Effort | Risk | Description |
|---:|---|:--:|:--:|:--:|---|
| 17 | Desktop system tray with quick-capture | 5 | M | med | Add a Tauri tray icon (system-tray plugin) with a menu to open a global quick-capture popover that drops a bullet into Today without focusing the full window. |
| 18 | Global hotkey quick-add | 5 | M | med | Register a Tauri global-shortcut (e.g. Ctrl+Shift+J) that pops a tiny always-on-top capture window feeding the existing capture.ts NL parser. |
| 22 | Native desktop notifications for reminders | 5 | M | med | Wire the Tauri notification plugin so scheduled bullets, habit reminders, and fasting windows fire OS-level toasts even when the window is closed. |
| 83 | Apple Health / Google Fit CSV importer | 4 | M | low | Add a lib/healthImport.ts that maps exported Health/Fit CSV (steps, sleep, weight, HR) onto existing trackers so wearables data backfills charts. |
| 121 | Markdown/Obsidian vault export | 4 | M | low | Export collections and daily logs as linked Markdown files (one per day, [[wikilinks]]) for drop-in use in Obsidian vaults. |
| 128 | Native filesystem export/import (Tauri) | 4 | M | low | Use the Tauri fs/dialog plugins to save CSV/JSON backups to a real file path and re-import, replacing the browser download-only path. |
| 150 | Two-way calendar (.ics) round-trip | 4 | M | low | Extend ics.ts to also export scheduled bullets/events as a subscribable .ics feed file, complementing the existing import parser. |
| 167 | Background fasting-window notifications | 4 | M | med | Fire start/end fasting-window alerts from fasting.ts via Tauri notifications + web push so users don't need the app open. |
| 192 | Offline write queue with sync badge | 4 | M | med | Buffer Supabase/serverSync writes made while offline and replay them on reconnect, showing a pending-sync count badge in the shell. |
| 193 | OS share-target intake | 4 | M | med | Register a PWA share_target + Tauri deep-link handler so text/links shared from other apps land in an inbox collection via capture.ts. |
| 208 | Scheduled automatic local backups | 4 | M | med | A background job (Tauri timer or SW) that writes timestamped encrypted JSON snapshots to a chosen folder/Drive on a cadence with retention. |
| 215 | Tauri native auto-updater | 4 | M | med | Configure the Tauri updater plugin with a signed release feed so the desktop app self-updates instead of needing manual reinstalls. |
| 220 | Voice command grammar | 4 | M | med | Layer intent parsing over speech.ts so spoken phrases like 'log water' or 'mark gym done' trigger tracker updates, not just transcription. |
| 221 | Voice journaling dictation mode | 4 | M | med | Build a full-screen dictation view on speech.ts that streams long-form spoken entries into a collection, with pause/resume and per-pause bullet splitting. |
| 226 | Automation rules engine | 4 | L | med | A Settings-defined if-this-then-that engine (local) e.g. 'if mood<3 for 3 days, surface a Mindset prompt' wiring existing lib signals. |
| 228 | Google Calendar event import via Drive auth | 4 | L | med | Reuse the existing gdrive OAuth scope to pull upcoming Calendar events into the Plan/Today timeline as read-only context blocks. |
| 229 | macOS/Windows menubar mini-window | 4 | L | med | A compact Tauri panel window showing today's open tasks + a one-line add box, toggled from the tray for glanceable use. |
| 240 | Web Push reminders in the PWA | 4 | L | high | Add a service-worker push subscription + notification flow so installed PWA users get habit/streak reminders without the tab open, gated behind explicit permission. |
| 253 | Close-to-tray instead of quit | 3 | S | low | Intercept the Tauri window close event to hide to tray, keeping reminders alive, with a Settings option to fully quit. |
| 264 | Do-Not-Disturb quiet hours | 3 | S | low | A Settings schedule that suppresses all notifications during user-defined quiet windows across web push and Tauri. |
| 265 | Drag-and-drop file/photo intake | 3 | S | low | Accept dropped images/files into entries via the existing image.ts/imageStore, with Tauri drag-drop events on desktop. |
| 286 | Launch-on-login autostart toggle | 3 | S | low | Use the Tauri autostart plugin with a Settings switch so the desktop app opens minimized to tray at boot. |
| 292 | Menu bar / taskbar streak counter | 3 | S | low | Show the current top habit streak as a tray tooltip/badge that updates live for at-a-glance motivation. |
| 312 | PWA app shortcuts (jump list) | 3 | S | low | Add manifest 'shortcuts' for New Bullet, Today, Trackers, and Focus so long-press/right-click on the installed icon jumps directly. |
| 317 | Read-aloud daily briefing (TTS) | 3 | S | low | Use SpeechSynthesis to read out today's tasks, habit streaks, and coach suggestion as a hands-free morning briefing. |
| 340 | Tauri single-instance focus | 3 | S | low | Add the single-instance plugin so re-launching or opening a deep link focuses the existing window instead of spawning duplicates. |
| 347 | Update-available in-app prompt | 3 | S | low | Surface vite-plugin-pwa's updatefound event as a non-blocking 'New version — reload' toast via the existing sonner toaster. |
| 350 | Weather-aware morning context | 3 | S | low | Use weather.ts to inject today's forecast into the briefing and auto-suggest indoor vs outdoor workout (HomeWorkout vs Pickleball). |
| 356 | PWA file-handler for .csv/.ics/.json | 3 | S | med | Register manifest file_handlers so double-clicking an exported bujo file opens the app and routes it to the importer. |
| 372 | Cross-platform deep-link routing table | 3 | M | low | A single router that normalizes bujo://, https share-target, and PWA shortcut entry points to one capture/route dispatcher. |
| 388 | GitHub Gist export upgrade | 3 | M | low | Extend github.ts to push a daily markdown journal export to a private Gist/repo on a schedule for a versioned paper trail. |
| 409 | Multi-window detached Focus timer | 3 | M | low | Open the Focus view in a separate always-on-top Tauri window so the Pomodoro/focus timer stays visible over other apps. |
| 437 | Wearable sleep import drives Cycle/Recovery | 3 | M | low | Map imported sleep data into the Cycle and Recovery views to correlate rest with mood and streaks via correlations.ts. |
| 447 | Cross-device handoff via sync deep-link | 3 | M | med | A 'continue on phone' QR that encodes the current view+entry so the encrypted-synced session resumes on another device. |
| 448 | Custom URL scheme deep links | 3 | M | med | Add a bujo:// scheme handler in Tauri (and ?capture= web route) so external automations/shortcuts can open straight to a prefilled capture. |
| 461 | IFTTT/Zapier-style outbound webhooks | 3 | M | med | Fire a user-configured webhook on events (habit completed, streak broken, goal hit) so external automation can react. |
| 468 | Notification snooze and action buttons | 3 | M | med | Add 'Done / Snooze 1h' action buttons on habit notifications that mutate state directly from the notification handler. |
| 480 | Strava/wger workout import | 3 | M | med | Extend the existing wger.ts integration with a Strava activity import that creates Fitness/Gym log entries from exported activity files. |
| 486 | Wake-time adaptive reminder scheduling | 3 | M | med | Use timeofday.ts patterns to schedule each habit reminder at the user's historically most-likely completion time. |
| 488 | WebDAV/Nextcloud backup target | 3 | M | med | Add a WebDAV sync target alongside gdrive/github so self-hosters can back up encrypted snapshots to their own cloud. |
| 503 | Android home-screen widget (TWA) | 3 | L | high | Ship a Trusted Web Activity wrapper exposing a today-tasks + quick-add widget on Android home screens. |
| 504 | Background periodic sync | 3 | L | high | Use the Periodic Background Sync API (with Tauri timer fallback) to push the encrypted journal to Supabase on an interval without opening the app. |
| 505 | Email-to-journal forwarding | 3 | L | high | Provide a per-user forwarding address that parses inbound email into inbox bullets via capture.ts (server-side, opt-in). |
| 506 | Inbound webhook intake endpoint | 3 | L | high | A lightweight serverSync endpoint that accepts signed POSTs to append bullets/tracker values, enabling automation from any service. |
| 507 | Offline AI coach via local model fallback | 3 | L | high | Let coach.ts run a small on-device/WebGPU model so suggestions work offline without the cloud LLM path. |
| 511 | Battery/network-aware sync throttling | 2 | S | low | Use the Battery and Network Information APIs to defer heavy sync/backups on low battery or metered connections. |
| 513 | Calendar feed of habit completions | 2 | S | low | Generate an .ics feed where each completed habit/workout is an all-day event, viewable in any external calendar. |
| 529 | iOS/Android lockscreen complication via shortcuts | 2 | S | low | Document and ship a Shortcuts/Tasker recipe that hits the deep-link/share-target so mobile users can quick-log from widgets and Siri. |
| 530 | Native app menu + keyboard accelerators | 2 | S | low | Add a real Tauri application menu (File/Edit/View/Go) with accelerators for view switching and new-bullet. |
| 531 | Native print / PDF daily log | 2 | S | low | Use Tauri print or browser print stylesheet to produce a clean printable daily/weekly journal page. |
| 533 | Offline-first asset precache audit panel | 2 | S | low | A Settings diagnostics card showing cache size, last SW update, and a 'clear cache' button so users can troubleshoot offline state. |
| 545 | Tauri OS theme + accent sync | 2 | S | low | Follow the OS dark/light and accent color via Tauri window theme events, complementing next-themes for a native feel. |
| 560 | Smartwatch quick-log companion page | 2 | M | low | A stripped, large-tap watch-friendly route (/w) that logs the day's top 3 trackers, installable as its own PWA scope. |
| 569 | Clipboard quick-capture watcher | 2 | M | high | Optional Tauri clipboard monitor that offers 'save to bujo' when you copy text, gated behind an explicit toggle. |
| 571 | Location-based habit reminders | 2 | L | high | Optional geofence (web Geolocation / Tauri) to nudge 'log workout' near the gym, fully local and opt-in. |
| 572 | Voice-to-tracker on mobile lockscreen | 2 | L | high | Combine speech.ts dictation with the share-target so a phone shortcut records a quick spoken log without unlocking into the full app. |

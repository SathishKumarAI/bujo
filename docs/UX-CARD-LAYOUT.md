# UX / Information-Architecture — card layout recommendation

_Generated 2026-06-23. A per-card arrangement plan for all **272 cards** across every view (7-agent inventory + design synthesis). Full spreadsheet: **[`UX-CARD-LAYOUT.csv`](./UX-CARD-LAYOUT.csv)** (Excel/Sheets). REVIEW doc — nothing implemented yet._

## How to read the spreadsheet

| Column | Meaning |
|---|---|
| **Tier** | primary-action (logging/input) · daily-glance (quick status) · analytics (charts/derived) · reference (static) · redundant (duplicate) |
| **Action** | keep · promote · move · collapse · merge · cut |
| **Default state** | always-visible · expanded · collapsed |
| **Priority** | P0 (fix overload/redundancy first) → P3 (nice-to-have) |

## Priority + action summary

| Priority | Cards | | Action | Cards |
|---|---:|---|---|---:|
| P0 | 23 | | cut | 5 |
| P1 | 60 | | merge | 19 |
| P2 | 89 | | promote | 10 |
| P3 | 100 | | collapse | 44 |
|  |  | | move | 19 |
|  |  | | keep | 175 |

## Guiding principles

- Daily-use-first: every view leads with logging + today's status; analytics never sits above the primary action. The 'log it / see where I stand today' job must be reachable without scrolling on mobile.
- Three-tier hierarchy on every view: (1) Act now (always-visible logging + today's glance), (2) This week / recent trends (expanded but scannable), (3) Deep analytics + reference (default-collapsed). Apply the same tier vocabulary everywhere so muscle memory transfers across views.
- Progressive disclosure: any card that is a chart, distribution, heatmap, or correlation lives inside a collapsible section that is default-collapsed unless it drives a daily decision. Domain views keep ONE 'This week' trend visible; everything deeper folds.
- Single source of truth: a metric appears in exactly one canonical home. Domain views own the live/loggable version; the Insights view becomes a cross-domain digest that LINKS to the domain rather than re-rendering the same chart. Cut or merge every duplicate.
- Group by job-to-be-done, not by data type: logging surfaces cluster together, 'how am I doing this week' clusters together, deep/historical analysis clusters together, and static reference/how-to content sinks to the bottom in collapsed accordions.
- Mobile-first ordering: right-rail cards are reordered into the single-column flow by priority (primary-action first, glance second), never stranded below a wall of charts. Reference and deep-stats render last in DOM so they cost nothing on small screens.
- Reference and educational content (guides, playbooks, libraries, static tip cards) is valuable but evergreen — collapse it by default and move it beneath interactive content so it never competes with daily logging.
- Reduce per-view card count by merging sibling stat cards into combined panels and by demoting one-number 'vanity' cards into a single stat strip; aim for <=3 always-visible cards per view above the fold.

## Recommended top-to-bottom order per view

### Today

1) Today command centre (TodayPlanCard + CoachCard, conditional PenaltyCard) -> 2) Daily actions: unified Habits (TodayHabits + Count + at-risk chips) + Wellbeing (+ gated Fasting) -> 3) The day: Daily log -> 4) Reflect 2-col: Gratitude/Reflection/Daily memory -> 5) This week (collapsed): Weekly goal rings -> 6) Memories (collapsed): On this day -> 7) Decorate (collapsed): Stickers

### Plan

1) Migration (Aging collapsed inside) -> 2) Chronically deferred (canonical) -> 3) Setup (collapsed): Recurring tasks, Import .ics

### Monthly

1) Summary bar -> 2) Calendar grid (full-width) -> 3) Month inputs 3-col: Location, Goals, Photo -> 4) Month analytics (collapsed): Month pulse (weekday+streaks nested), Entries per month

### Collections

1) Index -> 2) Brain-dump inbox + Future log -> 3) Custom collections -> 4) People (collapsed): Friends, Birthdays -> 5) Auto-pages (collapsed): Memories, Tags

### Trackers

1) At a glance strip -> 2) Today strip -> 3) Habit & intake grid (quick-add collapsed in footer) -> 4) This week / Trends (collapsed): Mood-Stress-Sleep, Category consistency(+roll-up merged) -> 5) Deep analytics (collapsed): heatmap, streak leaderboard, monthly trend, best weekdays, perfect days -> 6) Manage (collapsed): Archived

### Cycle

1) Daily entry (log) -> 2) Cycle & temperature chart

### Goals

1) Goals roll-up -> 2) Custom goals

### FitnessHub

1) Tab switcher -> 2) Unified this-week status (active-minutes ring + next-split banner) -> then the selected Cardio/Strength view

### Fitness (Cardio tab)

1) Log a workout + History (main column) -> 2) This-week status (shared with hub) -> 3) Nutrition (collapsed, Calorie trend inside) -> 4) Cardio analytics (collapsed): At a glance, Cardio bests, Training calendar -> Bodyweight lives in shared Gym card

### Gym (Strength tab)

1) Today's session (+ PR toast / session rollup) -> 2) Bodyweight (canonical, collapsed) -> 3) Program / Progress photos (collapsed) -> 4) Training insights (collapsed): volume, muscle balance, movement radar, recovery, frequency, needs-attention, stalled -> 5) Deep analytics (collapsed): big-three, relative strength, RPE -> Right rail tools (collapsed): rest timer, plate calc, anatomy, saved routines, wger, PRs

### HomeWorkout

1) Today's session builder + Recent home workouts (main column) -> 2) Exercise library (collapsed)

### Pullups

1) Training program -> 2) Your training set (calculator, with ability ladder) -> 3) Reference (collapsed): workouts, progressions

### Pickleball

1) At a glance + this-week goal (conditional Upcoming events) -> 2) Log a session + History -> 3) DUPR / Leagues (collapsed) -> 4) Improve (collapsed): practice drills -> 5) Form & momentum (collapsed) -> 6) Opponents & venues (collapsed) -> 7) Deeper signals (collapsed) -> 8) Charts (collapsed, ex-rail) -> 9) Reference (collapsed): play-safe, format playbook, 75-day plan moved to Coaching

### Coaching

1) Program hero -> 2) Today's focus -> 3) Roadmap (collapsed) -> 4) Reference (collapsed): skill ladder, shot guide, drills, 75-day plan, knee rehab, mental game

### Focus

1) This-week status -> 2) Timer + Log a session (main column) -> 3) Typing (collapsed) -> 4) Focus analytics (collapsed): coding minutes, cumulative, heatmap, weekday(volume+quality merged), project, interruptions, languages -> 5) History (collapsed)

### NoFap

1) Always-on SOS button -> 2) Streak status: hero ring + lifetime tiles -> 3) Cope & log: Urge surfing, Log a reset, Per-addiction streaks (Recovery portfolio merged in) -> 4) Setup (collapsed): commitment, trigger plans -> 5) Insights & progress (collapsed) -> 6) Deep analytics (collapsed) -> 7) Reference (collapsed): recovery ladder, reset history

### Mindset

1) Your focus (chosen principles) -> 2) Principle library

### Challenges

1) New-challenge header -> 2) Active challenges grid (ring + headline + today's rules check-in + stats; calendar collapsed inside) -> 3) Completed & archived (collapsed)

### Insights

1) Weekly Review ritual + Search utility -> 2) Big-stat row -> 3) This-week digest (Weekly digest + Coach digest, expanded) -> 4) Correlations (collapsed): Patterns, Momentum -> 5) Mood analytics (collapsed) -> 6) Habit analytics (collapsed) -> 7) Domain digests (collapsed, link out): Pickleball -> 8) Lifetime (collapsed): Year in review, Personal records, Index -> 9) Tag manager (collapsed). Removed: Open task aging, Chronically deferred, Streak leaderboard (now live only in Plan/Trackers)

### Stats

1) Activity heatmap + Achievements -> 2) This week (collapsed, links to Trackers) -> 3) Sleep & mood (collapsed): sleep-vs-mood, sleep debt, focus-vs-sleep -> 4) Mood views (collapsed): merged Mood calendar/Year-in-pixels toggle -> 5) Fitness stats (collapsed): workout minutes, workout split -> 6) Tasks (collapsed): task breakdown -> 7) Habit timing (collapsed): check-in times. Removed: Mood by weekday, Tags (duplicates)

### Reading

1) Stat strip + Yearly goal -> 2) Add a book + Shelves -> 3) Stalled books (expanded) -> 4) Learnings (collapsed): Learning log -> 5) Reading analytics (collapsed): Finished by month, Year in books (rating dist nested) -> 6) Read later (collapsed)

### Settings

Tabs unchanged. Data tab order: 1) Data at a glance -> 2) Backup & data + Demo & reset -> 3) Sync: Account + Cloud sync (recommended, visible); Passcode (Security) -> 4) Advanced sync (collapsed): Self-host, Your cloud storage + Google Drive merged -> 5) Journal summary (collapsed)

### Help

1) Intro + Getting around + Rapid-logging cheat sheet (visible) -> 2) Per-view help as a single collapsed accordion (all section cards)

## Highest-impact themes (P0/P1)

- **Kill cross-view redundancy:** weekday/mood/streak metrics appear in BOTH domain views and Insights/Stats → one canonical home, cut/merge the rest.
- **Promote primary actions:** Reading shelves, Insights search, logging forms sit below analytics in places → raise above charts.
- **Consolidate Settings sync:** 6 overlapping sync cards → Account+Cloud as recommended, rest under one collapsed **Advanced sync** accordion.
- **Progressive disclosure:** deep-analytics groups default collapsed so daily-use controls stay above the fold.

Tell me which views/priorities to implement; I'll do it behind the usual verify+deploy gate.
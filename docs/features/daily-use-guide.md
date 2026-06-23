# bujo — feature guide & day-to-day use

A practical tour: what each feature is, **why it matters**, and **how to use it
day to day**. Verified against the demo data (`?demo=1`) on 2026-06-18.

> Tip: press **⌘K / Ctrl+K** anywhere to jump to any view or action. Tap the **?**
> in the top bar for context help on the current page.

---

## The daily loop (the 2-minute habit)

bujo is built around one short ritual you repeat each day:

1. **Capture** — open **Today**, type one line per thought into the capture bar.
   Bullet grammar routes it: `t` task · `e` event · `n` note · `*` important ·
   `^` memory · `#tag`. The **smart capture bar** also understands plain
   sentences ("ran 5k", "bench 80x5", "slept 7h") and files them to the right
   tracker automatically.
2. **Track** — tick today's habits (one tap each, or **Mark all**), drag the
   mood / stress / sleep / energy sliders, log a workout or a reading session.
3. **Review** — carry forward unfinished tasks, write a gratitude line and a
   one-line memory. Done.

**Why it matters:** the whole point of a bullet journal is low-friction capture +
honest review. Everything else (charts, streaks, goals) is computed *from* this
daily loop — you never double-enter data.

---

## Core views

### Today — your daily log
- **What:** capture bar, today's habits, wellbeing sliders, gratitude, memory,
  a "what you covered yesterday" summary, and a training-penalty card for slips.
- **Day-to-day:** your home base. Capture as the day happens; review at night.
- **Significance:** turns scattered notes into one timestamped, searchable record.

### Plan — recurring tasks & migration
- **What:** clear overdue open tasks, define daily/weekly routines, import `.ics`
  calendar events.
- **Day-to-day:** Sunday planning + a quick weekday triage of what slipped.
- **Significance:** real BuJo "migration" — deciding what's still worth doing.

### Trackers — habit dot-grid
- **What:** tap a cell to mark a day; count habits (e.g. *Water 8 glasses*)
  increment toward a target. Heatmaps, streaks, weekday-consistency charts below.
- **Day-to-day:** the visual "don't break the chain" you glance at each morning.
- **Significance:** consistency beats intensity; the grid makes consistency visible.

### Reading — your book log *(new)*
- **What:** three shelves — **Want to read → Reading now → Finished**. While
  reading, track pages (`currentPage / totalPages`) with a progress bar; when
  finished, give it 1–5 stars. A stat strip shows *reading now*, *finished this
  year*, *pages read*, *avg rating*, plus a **yearly book goal**.
- **Day-to-day:** add a book the moment someone recommends it; bump your page
  count when you put the book down; star it when done. Move a book between
  shelves with the `→ Reading` / `→ Finished` buttons.
- **Significance:** a reading list you actually *finish*. The yearly goal +
  "books read this year" (also on **Goals**) turns vague intentions into a number
  you can hit. Great for a "read 12 books this year" resolution.

### Fitness / Gym / Pull-ups / Home Workout / Pickleball
- **What:** cardio + structured strength logging, a 12-week program, bodyweight
  routines with video demos, and pickleball session tracking with win-rate.
- **Day-to-day:** log a set or a session in seconds; it feeds weekly
  active-minutes and your streak automatically.
- **Significance:** progressive overload and win-rate only improve what you measure.

### Focus — deep-work tracker
- **What:** log coding/work sessions (time, flow, stress, interruptions, languages).
- **Day-to-day:** start-stop around focus blocks; review weekly hours + the
  focus↔stress insight.
- **Significance:** protects deep work by making distraction visible.

### Goals — every active target in one place
- **What:** a cross-view roll-up — habit weekly goals, active minutes, pickleball
  games, challenges, training-program days, the abstinence streak, and now
  **books read this year**. Tap a row to jump to its home view.
- **Day-to-day:** your 10-second "am I on track this week/year?" dashboard.
- **Significance:** one screen answers "what am I actually committed to?".

### Insights & Stats — reflection
- **Insights:** streaks, task completion, correlations, full-text search, a
  guided **Weekly Review**, personal records, and tag management.
- **Stats:** activity heatmap, weekly radar, sleep↔mood scatter, mood calendar,
  year-in-pixels, tag cloud, workout split.
- **Day-to-day:** a weekly sit-down to spot patterns ("mood dips when sleep < 6h").
- **Significance:** the payoff of daily logging — evidence-based self-knowledge.

---

## Accounts, login & sync

### Real login page *(new)*
- **What:** the top-bar account menu opens a dedicated, branded **sign in / sign
  up** screen — Google + email, show/hide password, **Forgot password?**, and a
  guest option. Not the old buried Settings form.
- **Day-to-day:** sign in once; your journal syncs across devices in real time.

### Auth gate *(new)*
- **What:** while signed out on the login page, the app goes **full-screen with
  no sidebar/top bar** — the sign-in page can't wander into other views.
- **Escapes (so you're never trapped):** "explore as a guest" or "continue on
  this device without an account" both drop you straight into the journal.
- **Significance:** a clean, focused sign-in like a real product — while keeping
  bujo's local-first promise (you can always use it with no account).

### Email validation *(new)*
- **What:** before any sign-in/up, the email is format-checked and obvious typos
  get a one-tap fix ("Did you mean **me@gmail.com**?"). The 6-char password
  minimum is enforced with a clear message.
- **Significance:** fewer failed logins and "I never got the email" support pain;
  real deliverability is still confirmed by Supabase's confirmation link.

### Sync mechanics
- **Save now** (account page) — pushes your whole journal to your cloud row
  immediately, instead of waiting for the ~4 s debounced auto-sync. Handy before
  closing a tab.
- **Storage choices** (Settings → Data & Cloud): this device only, your own
  cloud folder (Drive/Dropbox/OneDrive), a GitHub gist, or a self-hosted endpoint.
- **Google sign-in:** code is ready; enable the provider once via
  `docs/auth/google-oauth-setup.md` (Google Cloud + Supabase, ~10 min).

---

## A realistic day with bujo

| Time | You do | Feature |
|---|---|---|
| Morning | Tick habits, set today's intent, glance at streaks | Today, Trackers |
| Midday | "bench 80x5", "ran 5k" into the bar | Smart capture → Fitness |
| Commute | Bump *Deep Work* to page 140 | Reading |
| Evening | Carry forward 2 tasks, rate mood/sleep, gratitude line | Today |
| Sunday | Weekly Review, check Goals, plan recurring tasks | Insights, Goals, Plan |

Capture takes seconds; the dashboards build themselves.

# bujo — Complete Feature Guide

A start-to-end manual of every screen, tab, category, and sub-feature, with a
detailed explanation of each so you know exactly what it does and how to use it.
bujo is a **local-first** bullet journal + health tracker: everything lives in
your browser, works offline, and never touches a server unless you opt in.

> Legend used below: **What** (what it is) · **Use** (how to drive it) ·
> **Why** (when it helps) · **Notes** (edge cases / privacy).

---

## 1. The app shell (always on screen)

### 1.1 Top bar
The sticky bar at the top of every screen. It shows the current view's title and
a short subtitle so you always know where you are. On date-driven views (Today,
Monthly, Trackers, Cycle) it grows a `← date →` control to step through days or
months without leaving the page. On the right sit the global **Quick add**, the
**⌘K** command-palette trigger, a **recommendations** lightbulb (with a count
badge), the theme switch, a settings gear, and an overflow `⋯` menu holding zoom,
undo/redo, and the paper/handwriting/book toggles. It stays fixed while content
scrolls so capture is always one tap away.

### 1.2 Sidebar (desktop)
The left navigation rail, grouped into **Journal · Health · Review · System** so
related views cluster together. You can **collapse** it to an icon-only rail that
expands on hover (pin toggle at the top), or fully **auto-hide** it for maximum
screen, revealing it by nudging the left edge. The active view is highlighted in
your accent colour. Opt-in views (Cycle, Streak) only appear when enabled in
Settings, keeping the rail focused on what you actually use.

### 1.3 Bottom tab bar (mobile)
On phones the sidebar is replaced by a thumb-friendly bottom bar with the five
most-used destinations — **Today · Trackers · Fitness · Pickleball · Pull-ups** —
spread equal-width across the bar. There is **no centre FAB**: quick-add lives in
the top bar, so the bottom bar is purely for navigation. It is hidden on tablets
and desktops (≥ md width) and **auto-hides on scroll-down** (re-appears on
scroll-up). Content gets extra bottom padding so the fixed bar never covers
anything, and it respects the phone's safe-area inset (notches / home indicators).
Every other view is still reachable from the hamburger drawer.

### 1.4 Command palette (⌘K / Ctrl-K)
A fuzzy launcher you can open from anywhere with the keyboard. Start typing to
jump to any view by name, or run an action — toggle the theme, paper texture,
handwriting font, export a backup, or load demo data. It is keyboard-first
(arrow keys + Enter) so power users never need the mouse. It mirrors the same
navigation the sidebar offers, just faster. Great for quickly hopping between
Today and Stats, or firing a one-off command.

### 1.5 Quick add (global capture)
A capture field reachable from the top bar and the mobile FAB, so you can log a
thought from any screen. It understands the rapid-logging grammar (see §2.1),
shows a **live preview** of exactly what will be created, suggests `#tags` and
recent entries as you type, and warns about same-day duplicates. It also has a
**microphone** button for voice dictation and a row of **saved templates** you
can tap to insert. Whatever you add lands on the currently-selected day.

---

## 2. Journal group

### 2.1 Rapid-logging grammar (used everywhere you capture)
bujo uses Ryder Carroll's one-pen bullet system. Prefix a line to choose its
kind: `t` task, `e` event, `n` note; stack signifiers `*`/`!` important and `^`
memory; add `#tags` inline. Example: `* t book the campsite #travel` creates an
important task tagged *travel*. Tasks carry a status you cycle by clicking the
glyph: open `·` → done `✕` → migrated `>` → dropped `~`. Events render `○`, notes
`–`, memories `▲`. This same grammar works in Quick add and on the Today page.

### 2.2 Today
Your daily log and the heart of the app. The main column holds the day's bullets
(add, inline-edit by double-click, cycle status, carry forward yesterday's open
tasks). The right rail rates **mood / stress / sleep** on 0–10 sliders, marks how
you broke your fast, and captures one **gratitude** line plus one **daily memory**
(optionally with a downscaled photo). An **On this day** card resurfaces entries
from the same date in earlier months. Two summary cards sit at the top: the
**training penalty** (if you skipped things yesterday) and the **daily coverage**
strip (what you covered yesterday + the week).

### 2.3 Daily coverage summary (on Today)
A compact "did I actually do my day?" rollup. It shows yesterday as a checklist —
habits done vs scheduled, whether you journaled, logged mood, and worked out —
and names exactly which habits were **missed**. Below that, a 7-day strip colours
each day green/amber/grey by how complete it was, with today outlined. A "week N%"
figure in the header summarises the last seven days. It stays hidden until you
have habits or mood history to summarise, so new users aren't nagged.

### 2.4 Training penalty (on Today)
A light, gamified consequence for slipping. If yesterday had missed habit
streaks, overdue tasks, or an unfinished challenge day, Today surfaces an
**anime-style "training penalty"** (e.g. "Kamehameha Protocol — 30 burpees")
scaled in severity from Light to Legendary by how badly you slipped. There are
300 drills in the catalogue; you can **re-roll** for a different one or **dismiss**
it for the day. It's bodyweight/discipline flavoured and purely motivational —
never punitive of data.

### 2.5 Monthly
A month-at-a-glance calendar. Events show as coloured dots on their day; a thin
ribbon under each cell reflects that day's habit-completion ratio; mood tints the
cell. **Click any day to jump straight to it** in Today. The header carries a
compact one-line "this month" summary. Below the grid, **Location · Goals · Photo
of the month** sit in a three-across panel — handy for travellers logging where
they are, what they're aiming at, and a memento image for the month.

### 2.6 Plan
The bullet-journal "migration" workhorse plus recurring rules. The **Migration**
card lists overdue open tasks; sort them by **Date or Priority**, **star** the
important ones, and move each to today/tomorrow or drop it — laid out two columns
wide so you clear the backlog fast. The **Recurring** card defines daily/weekly
tasks or events that auto-appear on the days they apply (edits propagate to future
occurrences). An **.ics import** brings events from Google/Apple Calendar onto
your Monthly.

### 2.7 Collections
Free-form pages and reference lists. The **Future Log** automatically gathers
every entry dated ahead of today. **Friends** is a contacts list (see §7).
**Birthdays** keeps recurring dates handy with a cake marker. **Custom
collections** are blank pages you name (book lists, packing, projects) that use
the same bullet grammar as the daily log. Everything here is searchable from
Insights and counts toward your data summary.

---

## 3. Health group

### 3.1 Trackers
A habit dot-grid: rows are habits/foods/stimulants by category, columns are days;
tap a cell to mark it (count-habits increment toward a target). You can **drag a
grip to reorder** habits, rename/remove them, set an emoji, a weekly goal, and
scheduled weekdays. A **detail drawer** shows a habit's streak, 30/90-day
consistency, best weekday, and skip-days. Charts pair **mood·stress·sleep** with
a **category-consistency radar**. A **visualizations row** adds a 13-week
completion heatmap, a streak leaderboard, weekday consistency, and a monthly
trend. Archived habits get their own restore card at the bottom.

### 3.2 Goals
A single cross-view rollup that answers "am I on track?" without hopping around.
It auto-collects every active target you've set — per-habit **weekly goals**, the
**fitness** active-minutes goal, running **challenges**, **training-program**
completion, and the **abstinence streak vs. your best** — and renders each as a
whole-number progress bar with a ✓ when hit. **Tap any row** to jump to that
target's home view. It stays empty (zero clutter) until you actually have goals,
and the header tallies how many are on track.

### 3.3 Fitness
Cardio and general-workout logging. The right rail holds the **log form** (date,
activity, duration, distance, calories, RPE, free-form sets, notes) with a
**repeat-last** shortcut, and the full **history** beneath it (tap to edit;
show-all/less). The main column shows a weekly **active-minutes goal ring** with
an 8-week trend and active-day streak, a compact **6-tile at-a-glance** card
(totals + personal bests, no scrolling), a **14-day calorie trend**, and the
**Nutrition** card. Distance honours your km/mi setting throughout.

### 3.4 Nutrition (inside Fitness)
A lightweight macro diary for the day. Type calories and protein/carbs/fat
directly, or **add foods** from a built-in database focused on **American and
Indian** staples — picking a food adds its macros to the running total. A
**"Sample day"** button fills a realistic ~1800 kcal template, and an
**online-lookup** link covers anything not in the list. A stacked bar shows the
macro split; three **target rings** show protein/carbs/fat against a balanced
default. The separate **calorie-trend** card plots the last 14 days with a
logged-day average.

### 3.5 Gym
Structured strength training. Log sessions with a **searchable exercise picker**,
per-set **weight/reps/RPE/type** (warm-up/working/drop), with **previous-session
and live-1RM hints**. The right rail pins an **anatomy lookup** (muscle map +
**form-cue and injury-watch guidance** per exercise), a **rest timer**, a
**unit-aware plate calculator**, **personal records**, and saved routines. The
main area carries PPL split selection + next-day suggestion, the **12-week
hypertrophy program tracker**, **training-volume + progression charts**, a
**body-weight chart with a 7-day moving average**, an **RPE effort trend**, and
**progress photos**.

### 3.6 Progress photos (inside Gym)
Private physique tracking. Add a dated photo (auto-downscaled to a small JPEG so
it doesn't bloat storage); the gallery shows them newest-first, and a **Compare**
toggle puts your **first and latest** side by side with dates and body weight.
Remove any photo on hover. Everything stays on your device — these never leave the
browser. It's built for the "share a weekly physique update" habit from coaching
plans, minus the sharing.

### 3.7 Home Workout
No-equipment, bodyweight training for days you can't get to a gym. Log a
**home/bodyweight session** (the exercises you did, duration, notes) and it's
saved as a normal workout under the hood — it reuses the same **`Workout` type**
as Fitness/Gym with `activity = 'Home'`, so home sessions roll into your overall
totals, active-minutes goal, and history rather than living in a silo. Tap a
**saved session** to open its detail and review/edit what you logged. It lives in
the **Fitness area** of the Health group (its own nav entry, "Home Workout"), and
suits travel days, rest-day mobility, or anyone training without weights.

### 3.8 Pull-ups
A dedicated pull-up hub. The headline is the **"Starting From Zero" program
tracker** — pick a week and day, check off each exercise (partial days are fine),
and load the day's work. A right-rail **calculator** turns your max strict
pull-ups into a training set with ladder and pyramid rep schemes plus daily/weekly
volume targets, and an **ability ladder** table shows every level. Two libraries
round it out: **workout formats** (Ladders, Pyramids, EMOMs, Elevators, Sally…)
and **progression exercises** (negatives, partials, dead-hangs…) each with why/how
form cues.

### 3.9 Challenges
Fixed-length discipline challenges — 75 Hard/Soft, 90-day, 30-day, or custom. Each
challenge lists daily rules you check in against; a **progress ring** and a
**week-grouped calendar** show how far you've come, with the current streak. In
**strict** mode (75 Hard rule) missing a day resets you to Day 1. Progress is
whole-number and a challenge surfaces in Goals and in the penalty/coverage
summaries so a missed day is impossible to ignore.

### 3.10 Focus (developer work tracker)
Log deep-work / coding sessions: duration, project, **flow** (0–10), **stress**
(0–10), interruptions, and language/tool tags. The view summarises **weekly
hours** and a day streak, a **14-day minutes** bar chart, a **cumulative
coding-hours** line (all-time momentum), **language bars** by time logged, and a
focus↔stress **insight** line that tells you which conditions produce your best
work. It's aimed at engineers who want the same habit rigour applied to their
craft time.

### 3.11 Cycle *(opt-in)*
A neutral, private basal-temperature and cycle chart with free-form flags
(period, spotting, etc.). It's off by default and auto-suggested by the profile
gender field; enable it in Settings. The chart honours your °F/°C unit. Nothing
here is shared or analysed beyond your own view — it's a calm, judgement-free
record, not a prediction engine.

### 3.12 Streak / NoFap *(opt-in)*
An abstinence streak journal: current streak, personal best, milestone markers,
and a judgement-free **relapse log** (date, trigger, reflection). It also has an
**urge-surfing** counter so resisting an urge is itself a logged win. Off by
default, auto-suggested by the profile field. Like Cycle, it stays entirely on
your device.

---

## 4. Review group

### 4.1 Insights
The reflection hub. **Patterns** surfaces correlation insights (e.g. sleep↔mood).
**Year in review** summarises your journal so far. The **Index** lists every month
that has data — click to open it in Monthly. **Search** does full-text across
entries, memories, gratitude and workouts, with each result clicking through to
its day. The **Tag manager** lists every `#tag` with usage counts and lets you
**rename or merge** tags across all entries in one move. Big stat cards click
through to their source view.

### 4.2 Stats
A wall of charts. An **activity heatmap** (3/6/12-month range picker), a weekly
**radar**, a **sleep↔mood scatter**, weekly **workout-minute** bars, a **task
donut**, a **mood calendar** (with weekday header, monthly average/best-day
summary, and a 0–10 legend), **mood-by-weekday** bars, a **workout-split** donut,
a **year-in-pixels** mood grid, and a **tag cloud**. Every chart carries a
screen-reader text alternative. It's the place to spot long-term trends at a
glance.

---

## 5. System group

### 5.1 Help
An in-app guide written in clean, readable "GitHub-pages" prose. It walks through
the bullet legend, the quick-capture grammar, and every view in plain language —
a lighter companion to this document. New sections cover Gym, Pull-ups,
Challenges, Focus, penalties and nutrition. It's the fastest on-ramp for someone
opening the app for the first time, and it lives one tap away in the System group.

### 5.2 Settings
Four tabs. **Profile**: gender (gates Cycle/Streak), and a tidy 2-column grid for
weight, distance, week-start, and temperature units. **Journal feel**: paper
texture, handwriting font, book frame, reflection prompts, and an **accent-colour**
picker that recolours the whole app. **Reminders**: a daily nudge time and opt-in
weather/location. **Data & Cloud**: a "your data at a glance" summary with a
**storage-quota meter** and near-full warning, JSON/Markdown export + import,
**per-section CSV export**, **print/PDF**, a **passcode lock** (client-side
encryption), and cloud-storage options.

---

## 6. Data, privacy & sync

### 6.1 Storage & encryption
Everything is one JSON object in your browser's `localStorage`. Turn on a
**passcode** and it's encrypted at rest with AES-GCM (PBKDF2 from your passcode,
Web Crypto); a lock screen then gates the app. A **wrong passcode never wipes**
your data, and the passcode never leaves the device — which also means there's no
recovery, so keep a JSON export. Images are downscaled before storage, and a
quota meter warns you before photos fill the ~5 MB budget.

### 6.2 Backup, export & import
Export a full **JSON** backup (restorable on any device) or a portable
**Markdown** copy, and re-import JSON to restore. For analysis, export individual
sections as **CSV** (entries, habits, metrics, workouts). Any view can be sent to
**print / Save-as-PDF** — the app chrome is hidden automatically and cards lay out
cleanly. The app reminds you to back up if you never have, since browser storage
can be cleared.

### 6.3 Optional cloud (bring your own)
Three opt-in, still-client-side options: sync to a **cloud folder** you pick
(File System Access API), to **Google Drive**'s appDataFolder (your own OAuth
client), or to a private **GitHub gist**. The app is served as a static site, so
the host never sees your data — you bring your own storage. A true multi-user
account/sync backend is intentionally out of scope to keep the privacy promise.

---

## 7. Friends / contacts (in Collections)

A manual contacts list with **opt-in** enrichment. Add a name, an optional
**birthday** (shown with a countdown 🎂 marker), and links you paste. Optionally
enter a **GitHub username** to pull that person's **public** profile — avatar,
bio, company, profile link — via GitHub's official API. There is **no scraping
and no people-search**: only data the person chose to publish, fetched on demand,
degrading gracefully if offline or rate-limited. A "refresh" action re-pulls the
public profile later.

---

## 8. Cross-cutting niceties

- **Themes**: Dark (Mocha), Light (Latte), and a futuristic **Neon** palette, plus
  an accent-colour override — all Catppuccin-based and switchable from the top bar.
- **Units everywhere**: kg/lb, km/mi, °F/°C, and week-start (Sun/Mon) read from
  Settings and apply consistently across calendars, Gym, Fitness and Cycle.
- **Undo/redo**: global history with Ctrl+Z / Ctrl+Shift+Z (rapid edits coalesce
  into one step); also runnable from the command palette.
- **Motion**: subtle staggered card entrance and a gentle 3D hover/press, all
  disabled automatically if your OS prefers reduced motion.
- **PWA**: installable to your home screen with an offline app shell, so the whole
  journal works with no connection.
- **Voice input**: dictate entries with the mic button where the browser supports
  the Web Speech API (it simply hides where it doesn't).
- **Recommendations**: dismissible smart-default chips suggest backups, reminders,
  weekly goals, or turning a streak into a challenge.

---

## Update — Fitness & Gym are now one view

Fitness and Gym have been combined into a single **Fitness** nav entry with two
tabs — **Cardio** (general sessions, totals, history, nutrition) and **Strength**
(structured lifting, programs, anatomy, body weight, progress photos). They share
the same workout store, so there's one place to log and one shared history; the
Strength tab loads on demand. Pull-ups remains its own dedicated view. Read the
Fitness (§3.3), Nutrition (§3.4) and Gym (§3.5) sections above as the two tabs of
this single hub.

## Onboarding & reset (appended)

**First run** offers, top to bottom: **Sync with an account** (guest or email
login), **Use my own cloud** (folder), **This device only**, and a highlighted
**"Try it with sample data"** box — load a demo month and learn by doing
(press ⌘K to jump anywhere, tap the **?** on any page, or open **Help**).

**Resetting / opting out** — anytime in **Settings → Data & Cloud**:
- **Back to start screen** — keeps your data, returns to the first-run gate so
  you can re-pick guest / account / device.
- **Clear all data** — wipes everything (export a backup first).
- **Account → Log out / switch** / **Sign out** — leaves the account; local data stays.

## How & where data is stored (appended)

- **In the app (always):** one JSON object `JournalData` in the browser's
  `localStorage` under `bujo:data` (or `bujo:enc` when a passcode is set). When
  signed in, the Supabase session token sits in `sb-<ref>-auth-token`.
- **In Supabase (when signed in):** one row per user in `public.journals`
  (`user_id uuid` PK · `data jsonb` · `updated_at`). **Row-level security**
  scopes every read/write to `auth.uid()` — a user can only ever touch their own
  row. Auto-sync upserts on change, pulls on load, and updates live (realtime).
- **In Vercel Blob (passphrase sync):** ciphertext only, at `sync/<hash>.json` —
  the server never sees plaintext or the key.

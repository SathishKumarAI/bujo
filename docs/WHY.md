# Why bujo — research, direction & critical thinking

A candid product memo: the landscape, the taste-driven calls that shape this
app, an honest case for why it's real (and where it isn't yet), and the open
options — including how the tracker could be redesigned.

---

## 1. The landscape (research)

The personal-tracking space splits into camps, each with a weakness bujo can
exploit:

| Camp | Examples | Strength | Weakness bujo exploits |
|---|---|---|---|
| **Mood/wellbeing** | Daylio, Bearable, Reflectly, Stoic | Fast mood logging, charts | Single-purpose; your fitness, reading, focus live elsewhere |
| **Habit streaks** | Streaks, Habitify, Finch, Loop | Beautiful streak loops | Just checkboxes — no journaling, no reflection, no *why* |
| **Notes / second brain** | Notion, Obsidian, Logseq | Infinitely flexible | Heavy; you *build* the tracker before you use it |
| **Fitness** | Strong, Hevy, Strava | Deep strength/cardio logging | Siloed from mood, sleep, habits, life |
| **Paper BuJo** | the Ryder Carroll method | Calm, intentional, yours | No analytics, no sync, no nudges |

**The gap:** nobody owns *"one calm place for the whole self — journal + habits +
fitness + reading + reflection — that's private by default and reads like a
paper notebook, not a SaaS dashboard."* That's the bujo wedge.

## 2. The taste-direction calls (the opinions that make it bujo)

These are deliberate, defensible choices observed across the build — the app's
point of view, not accidents:

- **Local-first, no account required.** Data lives in the browser; cloud sync is
  *opt-in*. Privacy is the feature, not the upsell. (See `docs/DECISIONS.md`.)
- **One-pen minimalism + Catppuccin.** It should feel like a real notebook
  (paper texture, handwriting, open-book mode), not a corporate analytics tool.
- **Account-to-use, guest-to-explore.** A focused, gated login (not a buried
  Settings form); guests and local users are never blocked from the app.
- **Coach, not just tracker.** Workouts, pickleball, and habits ship with
  *guidance* — drills, a 75-day 3.5→4.0 plan, injury notes, form cues — so the
  app tells you *what to do next*, not just what you did.
- **Visualizations support, never dominate.** Charts sit in a side rail and are
  enlarge-on-demand; the main column leads with capture and action.
- **Capture beats configuration.** Smart capture bar parses one typed/spoken
  line into the right tracker — no forms to fill.

## 3. Why this app is real

- **It works and it's shipped.** Live at `bujo-journal.vercel.app`, 219 passing
  tests, ~20 feature areas, real auth + sync. Not a mockup.
- **A real wedge, not a feature.** "Whole-self, private, notebook-feel" is a
  positioning no incumbent holds — single-purpose apps can't follow without
  diluting their focus.
- **Zero-marginal-cost distribution.** Local-first + static hosting means it
  scales to many users at ~no server cost; the privacy story is honest because
  there's literally no server to leak.
- **A builder who is the user.** The feature set (pickleball, focus/coding,
  fitness, abstinence streak, reading) maps to one person's real life — that
  authenticity is hard to fake and tends to produce features others want too.

## 4. Critical thinking — where it's *not* real yet

Being honest about the risks keeps the direction sharp:

- **Scope sprawl.** 20 views is a lot; breadth can read as "unfocused" to a new
  user. The daily loop (Today → track → review) must stay the obvious spine.
- **Onboarding cliff.** A powerful tool with many surfaces needs a guided first
  five minutes or people bounce. The demo + guest path help; a true onboarding
  tour is still missing.
- **No moat in code.** The moat is taste, cohesion, and the privacy stance — not
  any single feature. Execution and feel are the defensibility.
- **"Coach" must be trustworthy.** Drill/plan content is research-backed but
  generic; to truly coach it needs to adapt to *your* data (see options below).
- **Retention unproven.** Trackers live or die on the daily-return habit;
  reminders + streak nudges exist, but real retention needs measurement.

## 5. Options & open directions

Concrete forks, roughly ordered by leverage:

1. **Make the coach adaptive.** Today the plans are static. Use the data already
   logged (win-rate trend, mood↔sleep correlation, habit consistency) to surface
   *"here's your weakest skill this week; drill X"* — turning trackers into a
   feedback loop. Highest-leverage differentiator.
2. **Tighten the spine.** Promote the daily loop; let everything else be
   opt-in modules a user enables, so new users see a calm core, power users keep
   the depth. Reframes "20 views" from sprawl into a personalized kit.
3. **Onboarding tour.** A 5-step guided first run that seeds one habit, one
   tracker, and one reflection — the missing retention lever.
4. **Templates / "starter kits".** "Athlete", "Student", "Recovery", "Reader" —
   one tap configures the relevant views, solving the blank-slate problem.

### Tracker redesign directions (the open question)

The habit tracker is the heart, and it's the most worth rethinking:

- **From grid to system.** Today it's a dot-grid (consistency view). A redesign
  could foreground *habit stacking and cues* (already in the data model:
  `cue`, `timeOfDay`) — show habits as a **daily routine timeline**
  (morning → evening) rather than a month grid, matching how people actually run
  a day.
- **Identity-based framing (Atomic Habits).** Group habits under *identities*
  ("I'm a healthy person", "I'm a writer") and show progress toward the identity,
  not just the streak — far stickier than checkboxes.
- **Adaptive difficulty.** When a habit is missed repeatedly, the app proposes
  shrinking it ("2-min rule") instead of guilt-tripping a broken streak.
- **One unified "today" surface.** Merge habits, metrics, and the capture bar
  into a single calm Today canvas; relegate the grid/heatmaps to the
  enlarge-on-demand analytics rail (the pattern already adopted on Pickleball).
- **Keep what works.** The dot-grid, streaks, and weekly-goal meters are loved
  by power users — any redesign should be an *additional* lens, toggle-able, not
  a replacement. (Locked architecture: see `docs/DECISIONS.md` before big moves.)

**Recommendation:** pursue **#1 (adaptive coach)** + the **routine-timeline**
tracker lens next — together they convert bujo from "a place to record" into "a
place that helps," which is the actual reason to choose it over Daylio or Notion.

---

*This is a living memo — opinions to argue with, not gospel. Update it when the
direction shifts.*

# The manual

Everything a person needs to use this journal well, in the order they need it.

> This file holds the **method** — why it works this way, and the ritual that
> makes it stick. The **per-feature reference** is
> [`FEATURE-REFERENCE.md`](FEATURE-REFERENCE.md), generated from the same data
> the in-app guide reads, so it cannot drift from the app. If you want the
> reference with working "take me there" buttons, open the app and press **?**
> in the top bar → *Open the full guide*.

| Question | Where |
|---|---|
| Why does this exist? | [Why](#why) below |
| What is it, exactly? | [What it is](#what-it-is) below |
| How do I start today? | [Your first five minutes](#your-first-five-minutes) |
| What do I do every day? | [The ritual](#the-ritual) |
| What does this screen do? | [`FEATURE-REFERENCE.md`](FEATURE-REFERENCE.md) |
| What do the glyphs mean? | [The bullets](#the-bullets) |
| Where is my data? Can I lose it? | [Your data](#your-data-and-how-to-not-lose-it) |
| Something looks wrong | [When something looks wrong](#when-something-looks-wrong) |

---

## Why

**Most journalling apps are a subscription with your life inside it.** You write
for three years, and the things you wrote live on someone else's server, in
someone else's format, behind someone else's login, priced at whatever they
decide next year. Export, where it exists, is partial. That is a bad deal for a
record that is supposed to outlast the software.

**Paper has the opposite problem.** A paper bullet journal is genuinely yours
and genuinely calm, and it cannot search, cannot count a streak, and cannot tell
you that your stress is highest on the days you slept under six hours. You
either flip pages for twenty minutes or you never find out.

This app refuses that trade:

- **Local-first, no account.** Your journal is one JSON object in this browser's
  storage. There is no sign-up, no server that holds a copy, and nothing to
  cancel. Sync exists, is off by default, and is end-to-end encrypted when on.
- **The real method, not a skin.** Rapid logging, signifiers, collections, the
  future log, and — the part everyone skips — **migration**. The ritual is what
  makes a bullet journal work, and it is built in rather than mentioned.
- **The things paper cannot do.** Full-text search, streaks and consistency,
  correlation between sleep, mood and stress, and one-click export to JSON or
  Markdown you can read in Obsidian.
- **Free, MIT, and yours to fork.**

The honest cost of that position: **nobody is backing this up for you.** See
[Your data](#your-data-and-how-to-not-lose-it), which is the most important
section in this file.

## What it is

A single-page app — a bullet journal at the centre, with tracking built around
it. Five sections:

| Section | Holds | The question it answers |
|---|---|---|
| **Today** | The daily log: entries, mood, stress, sleep, gratitude, memory | What happened today? |
| **Plan** | The week, the month, goals, recurring tasks, migration | What happens next, and what do I drop? |
| **Body** | Fitness, habits, strength, programs, nutrition, sport, challenges | What did I do with this body? |
| **Mind** | Mindset, reading, collections, focus time | What did I put in my head? |
| **Insights** | Streaks, search, correlations, charts | What does all of it add up to? |

Plus **Settings** (theme, units, backups — the important one) and **Account**
(which exists mostly to tell you there is no account).

Twenty-four surfaces in total. You are not supposed to use all of them. The
sections you ignore cost you nothing; the ones you use are there because someone
wanted that specific thing recorded properly rather than squeezed into a notes
field.

---

## Your first five minutes

The goal of this five minutes is to have **one real day in the journal** and
**one backup on disk**. Everything else can wait.

1. **Load the demo and look around.** Settings → Demo & reset → *Load demo data*
   fills about thirty days of samples so every chart has something in it. Do this
   *before* you write anything of your own — it replaces the journal.
2. **Write three lines in Today.** One task, one event, one note:
   `t buy milk`, then `e dentist 3pm`, then `n slept badly`. Enter after each.
3. **Close a task.** Click the `·` glyph beside it; it becomes `✕`. Click again
   to cycle through migrated and dropped. **The status is the glyph** — there is
   no separate checkbox anywhere in this app.
4. **Rate the day.** Mood, stress, sleep, on 0–10 scales. Three taps. These three
   numbers are what every chart and correlation is built from, so a day without
   them is a blank in Stats.
5. **Export a backup.** Settings → Data → *Export JSON*. Do it now, while it
   costs nothing, so the habit exists before the journal is worth losing.

## Your first week

*About a minute a day. The goal is a loop that survives a bad day.*

1. **Pick two habits. Two.** Trackers → add habit. Two is not a soft start, it
   is the right number — a grid with eleven rows is a grid you stop filling in
   on day four.
2. **Anchor the log to something you already do.** With coffee, or before bed. A
   journal with no fixed time is one you do at 1am once a week and then stop.
3. **Tick the grid and rate the day, every day.** Under a minute. Skipping the
   written entries is fine; skipping the three numbers is what leaves holes in
   every chart later.
4. **Log one session of whatever you train.** Fitness for anything timed,
   Strength for sets and reps. One session makes the week view mean something.
5. **On day seven, run the Weekly Review.** Insights → Weekly Review walks
   migrate → review → reflect. This is the step that turns a pile of entries
   into something you have actually read.

## Your first month

*Twenty minutes at month end.*

1. **Migrate, and drop things on purpose.** Plan → work the overdue list. Move
   each task to today or tomorrow, or drop it. Dropping is not failure: a task
   carried for five weeks was never going to happen, and cost you attention
   every time you read past it.
2. **Read the heatmap before anything else.** Stats → activity heatmap. The
   empty weeks are the finding; the rest of the page is detail about the weeks
   that were not empty.
3. **Check the sleep↔mood scatter.** Thirty days is roughly where this becomes
   readable, and most people are confidently wrong about their own answer.
4. **Set the new month up.** Monthly → where you are, what you want from the
   month, and the photo. Two minutes, and it makes the month findable a year
   from now.
5. **Export again, and keep the file.** JSON always; Markdown too if you want it
   readable in Obsidian or Logseq.

---

## The ritual

The method is four loops at four speeds. Skip the bottom three and this is a
notes app with charts.

| Loop | When | What you do | Where |
|---|---|---|---|
| **Capture** | Whenever a thought lands | One line. Do not organise it, do not decide about it. | Today, or Quick add from anywhere |
| **Close the day** | Once, at a fixed time | Cycle the glyphs, rate mood/stress/sleep, one gratitude line, one memory | Today |
| **Review the week** | Sunday-ish | Migrate → review → reflect | Insights → Weekly Review |
| **Migrate the month** | Month end | Decide on every open task: move it or drop it. Set the new month up. | Plan, then Monthly |

**Migration is the load-bearing one and it is the one people skip.** Copying a
task forward by hand is deliberately a small cost, because that cost is the
filter: a task you will not spend three seconds re-typing is a task you were
never going to do. An app that silently rolls everything forward forever
produces a list nobody reads. This one makes you answer.

## The bullets

One glyph per line, and the glyph carries the state.

| Glyph | Means |
|---|---|
| `·` | Task, open |
| `✕` | Task, done |
| `>` | Task, migrated to next month |
| `<` | Task, scheduled into the future log |
| `○` | Event |
| `–` | Note |
| `!` | Important |
| `▲` | Memory |
| `~` | Dropped |

Type a prefix to choose the kind as you write:

| Type this | Get |
|---|---|
| `t` | task |
| `e` | event |
| `n` | note |
| `*` | important |
| `^` | memory |
| `#tag` | filed under that tag |

So `* t book the campsite #travel` logs an important task tagged travel.

You can also just write a sentence. **Relay** reads plain language and files it:
`bench 80x5` becomes a strength set, `mood 7` sets the mood, `played two games`
becomes a pickleball session. It tells you what it wrote and offers an Undo.

## Getting around

| Thing | Where | Does |
|---|---|---|
| Section rail / bottom bar | Left on desktop, bottom on phone | The five sections |
| Tab row | Under the header | The surfaces inside a section |
| Date arrows | Top bar, on date screens | Move through days or months |
| **Quick add** | Top bar | Capture from anywhere, without leaving the page |
| **⌘K / Ctrl-K** | Anywhere | Jump to any view, or run a command |
| **?** | Top bar | What this page is for, plus suggestions from your own data — and the full guide |
| **⋯** | Top bar | Theme, zoom, undo/redo, paper and handwriting toggles |
| **⛶** | On any chart | Enlarge it |

Every view has an address: `?view=today`, `?view=stats`, `?view=help`. Days too
(`?day=2026-09-16`), so you can bookmark or share a specific day with yourself.

---

## Your data, and how to not lose it

**Read this part twice.**

Your journal is a single JSON object in this browser's `localStorage`, under the
key `bujo:data`. That is the whole storage model. It means:

- Nobody else can read it. There is no server copy, no analytics, no account.
- **It dies with the browser profile.** Clearing site data, "reset browser",
  some privacy extensions, some "clean up disk space" tools, and using a
  different browser or a private window all mean *no journal*.
- There is nobody to email for a copy. This is the price of the privacy
  position, stated plainly rather than buried.

So:

| Do | How often |
|---|---|
| **Export JSON** (Settings → Data) | Monthly, and before anything drastic |
| **Export Markdown** if you want it readable elsewhere | Whenever |
| Keep the exports somewhere that is itself backed up | — |
| **Import** to restore, on this or any device | When you need it |

Optional, all off by default: a **passcode** with client-side encryption
(Settings → Sync & privacy), and **end-to-end encrypted sync** with a single
passphrase (Account) if you want the journal on a second device.

## When something looks wrong

| Symptom | Almost always |
|---|---|
| Charts are empty | Nothing rated yet. Mood/stress/sleep on Today feed nearly every chart; without them the data does not exist. Or: load the demo to see what a full month looks like. |
| A whole section is missing | Cycle and Recovery are opt-in — Settings → Profile. |
| Habits show 0% | Consistency is over 30 days. A habit added on Tuesday has a small denominator on Wednesday, not a broken one. |
| "Monthly trend" shows nothing for early months | Correct. Months before your first habit started return *no data* rather than 0% — a zero there would read as a total failure that never happened. |
| The journal is empty on another device | Expected. It never left the first one. Export there, import here. |
| The app looks stale after an update | A service worker is holding an old bundle. Hard-reload, or clear site data *after* exporting. |

---

## Where the rest of it is

| You want | Read |
|---|---|
| Per-feature reference, all 24 surfaces | [`FEATURE-REFERENCE.md`](FEATURE-REFERENCE.md) — generated, `npm run manual` |
| The same thing with buttons that take you there | The app: **?** → *Open the full guide* |
| Day-to-day feature notes | [`features/daily-use-guide.md`](features/daily-use-guide.md) |
| Why it is built this way | [`DECISIONS.md`](DECISIONS.md), [`WHY.md`](WHY.md) |
| Privacy and threat model | [`SECURITY.md`](SECURITY.md) |
| How the code is laid out | [`ARCHITECTURE.md`](ARCHITECTURE.md), and the repo `README.md` |

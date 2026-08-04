# Focus

`src/views/Focus.tsx` · nav: Habits → Focus · `?view=focus`

## What this page is

A developer work tracker. A pomodoro timer, a manual session log (minutes,
project, flow, stress, interruptions, tags), weekly totals, a typing drill, and
analytics.

## Measured (1440×900, demo data)

- **1.7 screens · 6 blocks.**

| Block | Height | State |
|---|---|---|
| This week | 244px | open |
| Focus timer | 352px | open |
| Log a session | 560px | open |
| Typing · speed & accuracy drills | 32px | collapsed |
| Focus analytics | 32px | collapsed |
| History | 77px | open |

## The finding that matters

**P1 · Two ways to record the same thing, both open, 912px of the page.** The
Focus timer runs a session live; "Log a session" records one after the fact.
They produce the same kind of record and neither knows about the other — the
timer does not offer to fill in the log when it finishes, so a user who runs a
25-minute block still types "25" into a form underneath.

Wiring the timer's result into the log (prefill minutes and project, ask only
for flow and stress) collapses two 350–560px cards into one flow, and turns the
page's biggest redundancy into its best feature.

## UX / IA

**P2 · Typing drills are a different product.** "Typing · speed & accuracy
drills" inside a coding-time tracker is scope drift — it is neither focus nor
time. Collapsed, so it costs little, but it dilutes what the page is.

**P3 · History is open and nearly empty (77px)** while analytics — built on the
same records — is collapsed. Same inversion as Pickleball, smaller stakes.

## UI

**P2 · The timer's presets are unlabelled ratios.** `15 / 3`, `25 / 5`,
`50 / 10` next to a `Start` button. Anyone who knows pomodoro reads them
instantly; anyone who does not sees six numbers and three slashes. "25 min work
· 5 min break" costs one line.

**P3 · `WORK` in caps under the countdown** is doing the job of a phase label
without saying it is one. When a break starts it presumably reads `BREAK`, which
only becomes obvious after you have seen it change.

**P3 · The two 0–10 sliders are the good pattern here** — each carries its
anchors underneath (`0 scattered · 10 deep flow`, `0 calm · 10 high`). Today's
Wellbeing sliders do the same. This is the app's best small form idea.

## Copy

**P2 · "This week · Coding time & wellbeing"** then four tiles: `4h 0m This
week · 0 Day streak · 7/10 Avg focus · 3/10 Avg stress`. "This week" is both the
card title and a tile label, 200px apart.

**P3 · "🏆 Longest session: 3h 49m on work · Sun, Jul 19"** is a genuinely good
line — a specific personal record, dated, with a trophy that is earned rather
than decorative. More of this.

**P3 · "Project"** as a field label in a personal journal is unexplained. Free
text? A list? It is the field most likely to be left blank.

## Upgrades, ranked

1. **P1 · Connect the timer to the log.** When a block ends, prefill the session
   and ask only for the two ratings.
2. **P2 · Label the timer presets** in words.
3. **P2 · Swap History and Focus analytics** — collapse the near-empty list,
   open the charts.
4. **P3 · Move typing drills out**, or rename the page to admit it is a
   deep-work hub rather than a focus tracker.
5. **P3 · Rename the "This week" tile** so the card title is not repeated.

## Leave alone

- **The anchored sliders.** `0 scattered · 10 deep flow` is how every rating
  control in this app should be labelled.
- **The personal-record line.** Specific, dated, earned.
- **Interruptions as a tracked field** — an unusual, genuinely diagnostic thing
  to record.
- **Both analytics groups collapsed by default.**

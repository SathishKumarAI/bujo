# Challenges

`src/views/Challenges.tsx` · nav: Habits → Challenges · `?view=challenges`

## What this page is

Fixed-length disciplines — 75 Hard, 90-day, custom. Each has a rule list you
check off daily, a progress ring, a week calendar, and an optional strict mode
that resets you to Day 1 on a miss.

## Measured (1440×900, demo data)

- **0.9 screens** — fits without scrolling. Two blocks: the header/new-challenge
  card (118px) and the active challenge (571px).

## The finding that matters

**P1 · The card states your progress four times, with four different numbers.**
From one screen:

| Where | What it says |
|---|---|
| Header | `Day 4 of 75` |
| Ring area | `5 of 75 days done` · `70 to go` · `7%` |
| Above the rules | `Day 4 of 75` (again) |
| Stats row | `70 Days left` · `9/75 Elapsed` |

Day 4, 5 done, 70 left, 9 elapsed, 7%. Each is presumably correct under its own
definition — current day, days completed, days remaining, days since start — but
the page never distinguishes them, so they read as contradictions. A user
counting on their fingers will find that 4, 5 and 9 cannot all be true.

This is the clearest "premium" gap on the page: a paid product is trusted
because its numbers agree.

**P2 · `3 Current streak` and `3 Best streak` sit side by side**, along with
`🔥 3 streak` above them. The same 3, three times, in one card.

## UX / IA

**P2 · The rules checklist is the daily job and it is in the middle.** Ring,
stats, "Day 4 of 75", *then* `Today's rules (3/5)`. The thing you open the page
to do — tick five boxes — is below the thing that reports on having done it.

**P3 · "New challenge" is a button in the header of a card titled
"Challenges"**, above an active challenge. When you already have one running,
starting another is the rarer action and it is the most prominent control.

## UI

**P2 · Two stat rows for one challenge.** `3 · 7% · 5 of 75 days done · 70 to
go · 🔥 3 streak` and then `3 Current streak · 3 Best streak · 70 Days left ·
9/75 Elapsed`. Merging them into one row of four would remove a whole band and
make the numbers comparable.

**P3 · The rules are switches, and switches read as settings.** Ticking off
"Workout 1" for today is an event, not a preference. Checkboxes — or the same
bullet-glyph the journal uses — would match the act better.

## Copy

**P2 · "strict · resets on a miss"** is excellent — six words, states the stake
plainly. Keep exactly.

**P3 · "Fixed-length discipline challenges, 75 Hard, 90-day & more"** —
"discipline challenges" is one noun too many, and "& more" is filler in a
subtitle with room for a real third example.

## Upgrades, ranked

1. **P1 · Pick one progress number and one denominator.** If day, elapsed and
   completed genuinely differ, label them so the difference is visible; if they
   do not, show one.
2. **P2 · Merge the two stat rows.**
3. **P2 · Put "Today's rules" first**, under a single progress line.
4. **P3 · Switches → checkboxes** for daily rule completion.
5. **P3 · Demote "New challenge"** while a challenge is active.

## Leave alone

- **Strict mode** and how it is described. The whole reason 75 Hard works is the
  reset, and the page says so without moralising.
- **Fitting in one screen.** A challenge check-in should never need a scroll.
- **The rule list as the unit** — five short strings, tick them, done.

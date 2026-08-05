# Findings — flat ranked list

Severity: **S1** breaks a task or writes wrong data · **S2** misleads or blocks
a user · **S3** friction, inconsistency, polish.

Status: `fixed` · `backlog` (improvement, not a defect) · `withdrawn` (looked
like a defect, was a documented decision — the reason is recorded, because a
finding that gets re-raised next pass has cost the same twice).

| # | Sev | Page | Finding | Status |
|---|---|---|---|---|
| F-01 | S1 | Fitness | `?view=fitness&activity=run` leaves an impossible form: the draft takes `run` (distance field, "Best pace", Coaching companion) while the mode toggle keeps the *stored* mode, so the activity `<select>` holds `run` and displays `Pickleball` — the first option of a list `run` is not in. Logging from it saves one activity as another. | **fixed** |
| F-02 | S2 | Today · Morning | The week strip cannot resolve a real week: 32px track against a 70–100% range is a 9px spread, so it drew seven identical bars — the defect the previous pass recorded as fixed. No accessible text either: `div`s with a `title`. | **fixed** |
| F-03 | S2 | Plan · Week | "Move all 20 → Today" and `drop` fire with no confirmation. | **withdrawn** — undo is in the top-bar menu and the palette, the forEach coalesces into one history step, and the code states the trade. Not a defect. |
| F-04 | S2 | Plan · Goals | Goal tiles share no baseline; a two-line label pushes its bar ~23px below its row-mates. | **fixed** |
| F-05 | S3 | Today · Day | Priority `!` renders ~700px from its entry text. | **withdrawn** — deliberate: moving it right reclaimed a permanent indent column on every row and grouped the row's controls. Documented in `EntryRow.tsx`. |
| F-06 | S2 | Fitness | Empty mode draws three `—` tiles and twelve blank heatmap weeks — reads as a failed load, not as "nothing logged". | **fixed** |
| F-07 | S3 | Fitness · Nutrition | Zone-1 facts render in the mono face while the app is sans. | backlog |
| F-08 | S2 | demo data | No `avoid`, `count` or `timer` habits, so three of four habit renderings are unexercised by the fixture. | **fixed** |
| F-09 | S3 | Plan · Week | The Week tab is a migration queue — 20 task cards × 3 buttons = 60 controls, and no week agenda. | backlog |
| F-10 | S3 | Fitness | RPE 1–10 is ten ~30px targets, under the 44px floor met elsewhere. | backlog |
| F-11 | S2 | Trackers | Habit names truncate to "W.", "Vi…", and one row renders with no name at all — up to seven `shrink-0` badges against a name that is the only shrinkable child. | **fixed** |
| F-12 | S2 | Stats · Insights | Card titles clip to "M…", "Workout mi…", "Best & worst d…" — same shape as F-11, in `Card`'s header. | **fixed** |
| F-13 | S2 | Reading | A 5-star book draws five hollow stars, identical to unrated: `fill-yellow` on an outline glyph cannot fill it, and the icon system ships no fill weight. Rating is also silent to a screen reader. | **fixed** |
| F-14 | S2 | Collections | Birthdays lists the same person twice when they are both a friend and a birthday entry. | **fixed** |
| F-15 | S2 | Challenges | "Day 5 of 75", "7 of 75 days done" and "Elapsed 9/75" on one card read as three contradictory counts. They are three different facts; the label was missing. | **fixed** |
| F-16 | S3 | Collections · Challenges | Two folds still collapsed by default after the pass that opened eighteen: a *controlled* `QuietSection` and a hand-rolled caret button. | **fixed** |
| F-17 | S3 | Reading | "Pages read 440" in the top strip vs "Pages read 320" in 2026-in-books — same label, two numbers, one page. | backlog |
| F-18 | S3 | Gym | "Exercise frequency" draws eight full-length bars because every value is 3 — F-02's failure mode in another chart. | backlog |
| F-19 | S3 | Insights · Mindset | Two-column masonry leaves a column-height hole on both pages. | backlog |
| F-20 | S3 | Nutrition | "Add food" is disabled with no stated reason while every numeric field is pre-filled with the day's totals. | backlog |

## Method note — one trap this pass hit

**A full-page screenshot does not capture a lazily-rendered chart.** Pickleball,
Trackers and Stats all appeared to ship empty chart bodies; every one of them
drew correctly once scrolled into the viewport. Four findings were nearly filed
against charts that work. Verify a suspected-empty chart with a *viewport*
screenshot after `scrollIntoView`, never a full-page one.

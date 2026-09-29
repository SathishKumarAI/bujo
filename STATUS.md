# STATUS

**Stopped:** 2026-09-29, on `main` at `a207616`, clean apart from the untracked
`docs/life-schedule-v3-final.html` that predates this session. **Four PRs merged
(#307–#310).** COD-262 and COD-263 Done, COD-261 filed.

## What this stretch was

A prompt review that became a feature and then a layout. The ask was to improve a
pasted "redesign the Today screen" prompt; checked against the repo it asserted
five things that are not true here — hardcoded hex against a five-theme palette
written in two files, the wrong font variables, a `Trends`/`Archive` nav that
does not exist, a bottom tab bar that already exists, and an invented
`check / count / limit` habit taxonomy.

The taxonomy was invented. **The gap it described was real**, so it shipped, and
then the Today layout it was written for shipped too.

| PR | What | The finding |
|---|---|---|
| 307 | `limit` habit type | An unrecorded day is not a win — three states, not two |
| 308 | Handover + a trap | A theme probe that measured the previous theme's colour |
| 309 | Three missed call sites | My own #307 sweep was a grep truncated at 40 lines |
| 310 | Today's three zones | 2.5 → 1.4 screens desktop, 4.4 → 2.9 phone |

## The three worth re-reading

**A limit habit's hard problem is the unlogged day, not the comparison.**
Flipping `count`'s comparison gives `v <= target`, which looks right and is
catastrophic: `habitValueOn` returns 0 for a day nobody recorded, and 0 is under
every limit, so every day before install and every day you forgot scores as
willpower. Three states — under / over / not logged — and only a logged-under day
counts. Second time the `count ? sum / count : 0` shape has decided a design
here.

The cheap half: `habitDoneOn` is the chokepoint (`habitStreak` calls it, and so
do at-risk, weekly goals, comeback, longest-ever), so **one branch** made every
streak limit-aware and the seven-dot history row needed no change at all.

**A helper only helps where it is called, and my sweep for the call sites was
truncated.** #307 said "nine call sites, that was all of them". The grep behind
it ended in `head -40`. Three more sites each had their own opinion about what a
habit type means, and each dropped `limit`: it never rendered on Today's classic
layout, the CSV exported every limit day as not-done (that one predates #307 and
hits timer and rating habits too), and the sparkline drew **taller the worse the
day**. Fixed in #309, with both tests confirmed to fail against the old code
before being believed.

**A packing grid optimises the wrong thing.** `CardGrid` places by card *height*,
so Today's capture box and check-in could land in either column on any given day.
Three columns assigned by role instead, with DOM order as the *phone* order and
the desktop columns as `col-start`/`row-start` placements over it.

## Numbers

```
tests     1391 pass / 102 files
a11y      173 of 173 scans · 12 of 12 shards · 0 serious · 0 critical
clipped   clean at 1440 · 1024 · 390 across 24 views
contrast  5 themes · 14 accents · both palettes agree

today     desktop 2.5 -> 1.4 screens shipped   (3.6 -> 3.4 open)
          phone   4.4 -> 2.9 screens shipped   (6.0 -> 6.3 open)
          folds   3 -> 5, which is COVERAGE UP — see below

over-limit warning per theme, measured on real re-renders:
          mocha 9.79 · latte 5.81 · neon 11.54 · vscode 7.36 · dawn 5.98
```

**Today's fold count going 3 → 5 is the load-bearing number.** COD-237's failure
mode is a fold count *dropping* when a fold is introduced, because the gate
stopped reaching the content. A rise is the evidence that the new
`CollapsibleSection` is being opened and scanned — which is why it is a section
and not a `SectionRail`, since a rail has no `aria-expanded` for `openFolds()` to
find.

**The brief's one-screen target was not met and was not faked.** 1.4 screens.
The three columns measure 554 / 699 / 861px and the check-in alone is 627 of
that. 880px was available by deleting a field.

## Traps added to CLAUDE.md this stretch

- **Setting `data-theme` does not re-theme an inline style.** The CSS variables
  repaint, so the background changes, but `cat()`/`onRaised()` resolve at render
  time — so the measurement compares the new ground against the *old* foreground.
  A probe here reported latte at 1.68:1 for a pairing that is 5.81. The tell is
  that the foreground comes back identical for every theme probed.
- **A sweep piped through `head` is a sweep you did not do.** It truncates
  silently and the exit code is 0, so the claim "that was all of them" reads as
  verified when it was cut off. Count the matches first.

## Environment, on the way out

- A dev server is on **5180** (this worktree), a preview on **4173**, and a
  Chrome on debug port **9333** with a throwaway profile in
  `%TEMP%\claude-chrome-9333`. Kill them freely; none holds state that matters.
- Confirm what any preview port serves by its **asset hash**, never its title —
  every worktree here serves an identical `<title>`.
- The nine agent worktrees under `.claude/worktrees/` from the 2026-09-27
  handover were not touched and still need a decision, including the 770MB plain
  checkout at `agent-afa93cdc840c582e9` that is not a git worktree at all.

## Next

See `docs/NEXT-SESSION.md`. The short version: **`mindset` is 8.8 screens on a
phone** and is the worst page in the app; **COD-232** has a second head (a rail
page's space number describes one group, across seven pages); the sync cluster
(COD-136 / 137 / 139) is still the only data-integrity work on the board. Newly
on the pile: **COD-261**, and limit habits render with generic numeric copy
everywhere outside the habit row.

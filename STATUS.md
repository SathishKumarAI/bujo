# STATUS

**Stopped:** 2026-09-29, on `main` at `678aa43`, clean apart from the untracked
`docs/life-schedule-v3-final.html` that predates this session. **One PR merged
(#307).** COD-262 Done, COD-261 filed.

The file this replaces was the 2026-09-27 twelve-PR handover. Its six
"worth re-reading" lessons are all still true and all still live in `CLAUDE.md`,
which is where they belong — this file is where the *work* stopped, not the
permanent trap ledger.

## What this stretch was

A prompt review that turned into a feature. The ask was to improve a pasted
"redesign the Today screen" prompt; reading it against the actual repo found it
asserting five things that are not true here (hardcoded hex against a five-theme
palette written in two files, the wrong font variables, a `Trends`/`Archive` nav
that does not exist, a bottom tab bar that already exists, and an invented
`check / count / limit` habit taxonomy). The last of those was the interesting
one: the taxonomy was invented, but **the gap it described was real**.

## The one thing worth re-reading

**A limit habit's hard problem is the unlogged day, not the comparison.**
Flipping `count`'s comparison gives you `v <= target`, which looks right and is
catastrophic: `habitValueOn` returns 0 for a day nobody recorded, and 0 is under
every limit, so every day before the app was installed and every day you forgot
scores as willpower. A limit day therefore has **three** states — under / over /
not logged — and only a logged-under day counts. This is the same family as
`count ? sum / count : 0` making "no data" indistinguishable from "you scored
zero", already in `CLAUDE.md`; it is now the second time that shape has cost a
design decision here.

The cheap part was finding the chokepoint. `habitDoneOn` is called by
`habitStreak`, and therefore by at-risk, weekly goals, comeback and
longest-ever — **one branch there** and every streak in the app went
limit-aware, with no per-caller patching and no change at all to the seven-dot
history row.

## Two things the change surfaced

**The shipped `Coffee` preset was a limit wearing a target's clothes.**
`{ type: 'count', target: 2, unit: 'cups' }` told the app that two cups was a
goal to *reach*, so a 2-cup day scored as a win and a 4-cup day scored as a win
with room to spare. Nothing could have caught this: a goal and a ceiling are
both `target: 2`, and the type system had no way to tell them apart until this
PR gave it one.

**Nine call sites had each retyped the same union.** `type === 'count' || type
=== 'timer' || type === 'rating'` meaning "numeric", written out nine times, so
adding a fifth member to `HabitType` meant nine chances to silently drop it.
They now call `isNumericHabit` / `isSteppableHabit`. Same shape as the retired
`BottomNav` `PRIMARY` list trap, one layer down.

## The trap this session added

**Switching `data-theme` without forcing a re-render measures the previous
theme's colour.** A probe here reported latte at **1.68:1** and was wrong by
3.5x — the CSS variables repainted the background, but React never re-ran, so
the inline `style={{ color: onRaised('peach') }}` was still holding mocha's hex
against latte's ground. The real number is **5.81**. Now written into
`CLAUDE.md`'s wait-before-assert table, because it produces an arithmetically
perfect failure describing a pairing that does not exist — exactly the shape
that cost three separate investigations in the mid-fade-blend case.

Set the theme the way the app does (`settings.theme`, then reload) and measure
after the reload.

## Numbers

```
tests     1389 pass / 102 files          (+11 over main, all in habitLimit.test.ts)
a11y      173 of 173 scans · 12 of 12 shards · 0 serious, 0 critical
clipped   clean at 1440 · 1024 · 390 across 24 views
contrast  5 themes · 14 accents · both palettes agree

over-limit warning, per theme, measured on real re-renders:
          mocha 9.79 · latte 5.81 · neon 11.54 · vscode 7.36 · dawn 5.98

demo seed, 90 days of the new type:
          52 under · 17 over · 21 left unrecorded on purpose
```

The a11y summary now reads **"173 of 173"**; the previous handover recorded it
printing "173 of 166", so that arithmetic was fixed on `main` in the meantime.

## Environment, on the way out

- A dev server is on **5180** (this worktree) and a preview on **4173**, both
  still running, plus a Chrome launched with `--remote-debugging-port=9333`
  against a throwaway profile in `%TEMP%\claude-chrome-9333`. Kill them when you
  are done; none holds state that matters.
- Confirm what any preview port serves by its **asset hash**, never its title —
  every worktree here serves an identical `<title>`.
- The nine agent worktrees under `.claude/worktrees/` noted in the previous
  handover were not touched and still need a decision, including the 770MB plain
  checkout at `agent-afa93cdc840c582e9` that is not a git worktree at all.

## Next

Unchanged from the previous handover, none of it addressed here: **`mindset` is
8.8 screens on a phone** and is the worst page in the app; **COD-232** has a
second head (a rail page's space number describes one group, across seven
pages); the sync cluster (COD-136 / 137 / 139) is still the only data-integrity
work on the board.

Newly on the pile, both small:

- **COD-261** — the clean-day ✓ on an *avoid* habit is `cat('overlay0')`,
  measured live at **3.55:1** on mocha. The documented overlay0-as-text trap,
  still shipping on a path this PR did not touch.
- Limit habits render with generic numeric copy everywhere outside the habit
  row. Insights and Trackers will describe one as though its target were a goal.
  Nothing is wrong on screen; nothing is limit-aware either.

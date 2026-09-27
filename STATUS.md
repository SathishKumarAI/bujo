# STATUS

**Stopped:** 2026-09-27, on `main` at `34f7a1d`, clean. **Twelve PRs merged
(#287–#298)**, every one verified by re-running its gates here rather than by
reading its handback.

The file this replaces was a *branch* handover for PR #293 that opened with
"Nothing is merged and nothing is half-applied". #293 merged some hours later,
and four agents in a row then declined to touch this file because three of them
held branches at once. That is how the most-read doc in the repo ends up being
the one sentence that is no longer true — the same shape as the "environmental,
not a regression" note in `CLAUDE.md`. **A shared handover with several branches
in flight needs an owner, not everyone's restraint.**

## What this stretch was

Two requests, then a run of small precise ones. First: *Insights got a
modernisation pass and Cycle and Recovery were missed — and the code is not
nice.* Then, read off the rendered pages: the act column is a dump, the legend is
a hash log, "3/5" is not aligned, no addiction has visualisations, Focus needs
restructuring, and **it must work from an iPhone to a 4K monitor**.

| # | What | The finding |
|---|---|---|
| 288 | Cycle had four shut folds | 2.5 / 4.8 → **1.0 / 1.0** desktop · 4.4 / 10.6 → 2.4 / 3.6 phone · folds 4 → 0 |
| 289 | Recovery was a 929-line view | **929 → 332 lines** · folds 3 → 0 · `open` now equals `shipped` on both viewports |
| 290 | **`a11y` CI had been red since #285** | My own merge. Four workers starved the runner; one dead worker discarded 8 of 12 shards |
| 291 | The flag legend was a run of prose | The hue moved onto the word; two columns once the container has room |
| 292 | The log button sat 805px past the fold | And 1130px down a *nested* scrollport at 1440, which no screenshot can show |
| 293 | The app drew 1180px of a 4K screen | Unused 69% → 50% at 3840 · 54% → **25%** at 2560 · **1440 unchanged by identity** |
| 294 | "3/5" ended 14px past its own slider | `input[type=range]` is an input, so the 380px cap caught it; its label row was uncapped |
| 295 | No addiction had its own numbers | How much / which days / which times — and one of the three cannot be answered |
| 296 | Focus was 3.5 flat screens, zero groups | 3.5 → **1.4** desktop · 5.7 → 3.7 phone · two seed holes underneath |
| 297 | A transparent sticky rail, and links with no affordance | Plus a 4.48:1 that fixing the first one exposed |
| 298 | Mood was a number with no "why" | The week around a lapse: **−1 3.9 → 0 3.4 → +1 5.8** against a 5.2 baseline |

## The six worth re-reading

**The rail generalises; the width does not — measured four times now.**
`tier={1440}` + `stacked` was re-tested *after* each rail landed and lost every
time: Cycle **+732px**, Recovery **1.7 → 3.3 screens**. Insights can stack
because its act zone is a 291px search box; Cycle's is a 760px day editor and
Recovery's is 1296px. `max(act, review)` becomes `act + review`, and the act
column is the whole bill. The paragraph is in `docs/PAGE-WORKFLOW.md` — **do not
run this experiment a fifth time.**

**A tier cap is a floor, not a ceiling.** #293 is one fluid expression, and 1440
is unchanged *by identity* rather than by promise: `--shell-gutter: 260px` is
exactly what a 1180 shell leaves at 1440, so the fluid term equals the floor
there. `space --all` diffs to **zero lines** across 24 views — the crux claim,
verified here rather than taken. The ~1926px ceiling is deliberate, because a
2600px row of cards is unreadable, which is why 3840 is still half empty on
purpose.

**Opacity on text is how you get a colour no gate can check.** `SectionRail`'s
count badge was `opacity-70` on `fg-2`: **3.82 / 3.40 / 3.55 / 3.45 / 3.08**
across the five themes on the selected row — five of five under 4.5, for as long
as the component has existed. `check-contrast` cannot see it because a faded
token is not a token; axe could not see it because the rail was **transparent**,
so there was no resolvable background to fail against. Giving the rail a ground
turned a silent failure into a red one. The gate was blind, not happy.

**`space-audit` measures the group the rail opens on, and nothing else.** Every
space number quoted for a rail page is that one group. Recovery's `patterns`
group is +1.5 phone screens after #295 and no gate reaches it; Insights' `mood`
domain is 2.65 screens at 1440 while the page reports 1.7. This is COD-232's
tab-shell blindness in a second shape, and it now covers **seven** pages.

**Three agents independently found the same two bugs**, which is the useful
signal here: the transparent sticky rail and the faded count badge were each
reported by two or three separate passes, on different pages. A defect in a
shared primitive gets found once per adopter, not once.

**Two capture gaps are now the limit on the analytics**, both named rather than
faked. `Relapse` has a date and **no time**, so there is no hour-of-day reading
for a lapse. `UrgeWin` has a timestamp but **no addiction field** — it carries
free text, so a per-addiction clock is a name join, and `ADDICTION_PRESETS`
offers "Nicotine" while `URGE_PRESETS` offers "Smoking", so the default
vocabularies do not match each other. The card prints its coverage fraction and
names the missing label instead of drawing an empty grid. **COD-251.**

## Numbers, before → after

```
folds     insights 0 · cycle 4 → 0 · nofap 3 → 0
          still standing: coaching 20 · pickleball 8 · gym 5 · plan 4 · today 3

space     cycle    desktop 2.5/4.8 → 1.0/1.0   phone 4.4/10.6 → 2.4/3.6
          nofap    desktop 1.9/4.8 → 1.7/1.7   phone 4.8/8.2  → 5.0/5.0
          focus    desktop 3.5/3.5 → 1.4/1.4   phone 5.7/5.7  → 3.7/3.7
          mindset  desktop 4.2/4.2 unchanged   phone 8.8/8.8  ← worst in the app

width     unused screen  1440 18% (unchanged) · 1920 39% → 14%
                         2560 54% → 25% · 3840 69% → 50%
          review column  722 → 1132 at 1920 → 1398 at 2560
          insights masonry 2 → 3 at 1920 → 4 at 2560, height 1653 → 1326

gates     a11y     8m07s → 2m48s at 4 workers · CI pinned to 2 · 166 → 173 scans
          tests    1181 → 1378 in 101 files
          clipped  0 across 24 views at 1440, 1024 and 390px
          contrast 5 themes, 14 accents, both palettes agree
```

**`nofap` phone went 4.8 → 5.0 and that is honest** — #295 added content that was
asked for. `today` and `trackers` rose for the same reason (a new mood field, a
3× larger metric seed). Nothing was hidden behind a new fold to flatter a number.

## What I got wrong, recorded because it cost time

**I attributed a 4.48:1 to the wrong cause, publicly.** `#7c8195` is exactly
`fg-2` at 70% over `ink-0`, which fits both "a faded badge" and "axe read a
`page-enter` fade mid-animation" — and the fade had already produced three
phantom investigations that day, so I picked the familiar story. Adding a
`settle()` before axe did not clear it, which is what proved the colour stable.
The settle fix is kept because it is correct on its own terms — `openFolds` and
`revealLazy` restart animations *after* the existing settle — not because it
fixed this.

**Two throwaway probes of mine reported confidently and were wrong.** One swept
for label/control overshoot and returned 14 hits across six views; twelve were
noise, because it compared each control against the previous *section* rather
than its own label row. Another checked a claimed critical a11y violation across
five Settings tabs and found none — because its tab click matched the same
control every time, so it scanned **one tab five times**. Adding the precondition
I had been demanding of every agent ("assert the thing is actually in the DOM")
is what exposed it. **A probe written to check a gate is not exempt from being
checked.**

**I told agents to confirm a preview port by its `<title>`, and that is wrong
here** — every worktree serves an identical title, and one agent found 4195
serving a different worktree's bundle. Compare the served `assets/index-*.js`
against your own `dist/index.html`.

## Environment, on the way out

- **Nine agent worktrees under `.claude/worktrees/`**, each holding a merged
  branch, which is why `gh pr merge --delete-branch` could not remove the local
  ones. One, `agent-afa93cdc840c582e9`, is **not a git worktree at all** — a dead
  agent left a 770MB plain checkout plus `node_modules`, and git resolves its
  working tree to the repo root. Nothing has been deleted; it needs a decision.
- Preview servers were left on 4173 and several of 4181–4198. Confirm what one
  serves by its **asset hash**, not its title.
- `docs/life-schedule-v3-final.html` is untracked and predates this session.
- `a11y`'s summary now prints **"173 of 166 scan(s)"** — the planned total does
  not count the newly-armed rail-domain scans. Cosmetic, but a gate whose own
  arithmetic reads wrong is one people learn to skim.

## Next

`docs/NEXT-SESSION.md`, rewritten. The short version: **`mindset` is 8.8 screens
on a phone** and is now unambiguously the worst page in the app; **COD-232 has
grown a second head** (a rail page's space number is one group, across seven
pages); and the sync cluster (COD-136 / 137 / 139) is still the only
data-integrity work on the board.

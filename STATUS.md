# STATUS

**Stopped:** 2026-09-30, on `docs/session-cycle-recovery`. **`main` is at
`e666099`** and there is **an open stack of three PRs that must merge in
order** — see below, this is the first thing to deal with.

## The stack, bottom first

```
main
 └── #317  feat/cycle-stage67-goals-guide   Cycle stages 6+7, design pass, feelings, charts
      └── #318  feat/recovery-feedback       Recovery ledger, outcomes, units
           └── (this branch)  docs/session-cycle-recovery
```

Merge **#317, then #318**, retargeting each child before its parent merges —
squash-merging the bottom of a stack permanently closes the child, and GitHub
will not reopen a closed PR whose base branch is gone (the trap is in
`CLAUDE.md`; it cost two re-created PRs in an earlier stretch).

`#306` is also open and is **not from this stretch** — left alone.

## What this stretch was

Two requests that turned out to be one subject. Cycle came as a seven-stage
brief; Recovery came as "do the same for men, for addictions". Both pages had
the same failure: **they recorded the data and never said what it meant.**
Cycle printed "Luteal · estimate" whether it had measured a temperature shift or
not. Recovery knew every resisted urge and every slip and could not tell you
whether watching porn counted for you or against you.

## The three worth re-reading

**A promise with a toggle beside it is not a promise.** The Cycle page tells the
user their data is "never uploaded, synced, or sent to us or anyone else", and
that was **false when written**: `cycle` is a field of `JournalData` and every
sync path took the whole object, including a self-hosted PostgREST that posts in
plaintext. My first fix gated it on a `settings.cycleSync` switch — wrong, for
exactly the users who most needed the sentence to be true. `forNetwork` strips
unconditionally and a test asserts no setting can change that.

Its other half: stripping on the way out means this device uploads `cycle: []`,
and without a guard the next device to pull reads that as *deleted*. Withheld is
not deleted. The guard is in `resolveIncoming`, where every pull funnels.

**A seed test that passes and a browser that shows nothing are not a
contradiction.** `cycleSeed.test.ts` asserted mood and energy were seeded and
passed; the browser showed 100 days with zero. `?demo=1` only seeded an EMPTY
journal, so a demo opened once was frozen forever and every field added
afterwards was invisible — which reads exactly like the feature being broken.
`DEMO_VERSION` now re-seeds a demo journal (never a real one) and has already
moved three times in a day.

**A ratio must compare like with like.** Once lapse amounts carried units, the
recovery ledger divided resisted *events* by slipped *minutes* and rendered "2%
of the pulls you logged, you did not follow" for a month with five wins and two
bad evenings. `lapseDays` carries events; `lapses` carries the amount.

## Numbers

```
tests     1573 pass / 112 files
a11y      173 of 173 · 12 of 12 shards · 0 serious · 0 critical
clipped   clean at 1440 · 1024 · 390 across 24 views
contrast  5 themes · 14 accents · both palettes agree

per-group axe probe · 28 scans · 0 serious
  and it found what the real gate structurally cannot — see below
```

**The per-group probe is the load-bearing number.** `npm run a11y` reported
173/173 green while everything added in Cycle Stages 5–7 sat outside it: a
`SectionRail` shows one group at a time and `openFolds()` has no `aria-expanded`
to find (COD-237). Driving the four groups by hand found a real
`scrollable-region-focusable` — a 30-column table in an 8-column viewport with
no keyboard route to the other 22. **Any new card in a rail group is unchecked
until someone drives it per group.**

## Traps added to CLAUDE.md this stretch

- **A sweep piped through `head` is a sweep you did not do.** It truncates
  silently and exits 0. "Nine call sites, and that was all of them" came from a
  grep cut at 40 lines; three more each dropped the new habit type.
- **Setting `data-theme` does not re-theme an inline style** — `cat()` resolves
  at render time, so a probe that does not force a re-render measures the new
  ground against the old foreground.

## Environment, on the way out

- Dev server on **5180**, preview on **4173**, Chrome on debug port **9333**
  with a throwaway profile in `%TEMP%\claude-chrome-9333`. Kill freely.
- Confirm what a preview port serves by its **asset hash**, never its title.
- The nine agent worktrees under `.claude/worktrees/` from 2026-09-27 are still
  there and still need a decision.

## Next

`docs/NEXT-SESSION.md`. The short version: **merge the stack first**, then
`mindset` is still 8.8 phone screens and still the worst page in the app.

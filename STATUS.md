# STATUS

**Stopped:** 2026-09-26, on `main`, clean. **Nine PRs merged (#278–#286)**, each
squash-merged with its gates read rather than assumed.

## What this stretch was

Two requests. First: work the `docs/NEXT-SESSION.md` queue and fix whatever bugs
turned up on the way. Then, mid-run: make the two gendered pages carry their own
domain knowledge, stop the app speaking in abbreviations nobody can expand, use
the width in Settings, import the data an iPhone already holds — and run it with
agents, planned up front.

The plan is `docs/sessions/2026-09-26-platform-pass/PLAN.md`, written before any
of it, with the measured baseline it started from.

| # | What | The finding |
|---|---|---|
| 278 | `npm run clipped` was red on `main` | 9 findings, byte-identical across the whole previous stretch. Gym's rows lost the exercise name to a `shrink-0` set strip; `min-w-0` was also why the row never wrapped. Cycle's `table-fixed` gave each of 31 columns 8px against a 12px label. |
| 279 | The app spoke in abbreviations | `src/data/glossary.json`, 20 terms, 10 with credited links. One file read by both the inline ⓘ and Help's list, so they cannot disagree. |
| 280 | The `[one-primary]` guard blamed the wrong page | The header's Quick add registers once, under whichever view loaded first, and sits in that view's budget forever. "Gym warns, Fitness does not" was load order, not a fact about Gym. |
| 281 | **Data loss** | `logRelapse` rebuilt `nofap` from three fields with no spread, deleting six. See below. |
| 282 | Settings' 0.9 screens was a lie by omission | The space audit walks the DOM and a tab shell holds one panel at a time. Per tab: 2.7 screens over five tabs, three under half a screen. |
| 283 | Recovery could log a lapse but not how much | `Relapse.count?`, one row per streak per day. Ten cigarettes is one lapse day of ten, not ten streak resets. |
| 284 | The a11y gate took 8m07s, so it stopped being run | Sharded by theme. **2m48s**, same 166 scans. |
| 285 | Apple Health was typed in by hand | A streamed zip/XML reader with no new dependency. 817MB of XML at a **116.7MB peak heap**. |
| 286 | Cycle could not explain itself | A drive counter read back by phase, a legend built from the one hue map, an ovulation diagram, and per-phase food with five credited sources. |

## The five worth re-reading

**`logRelapse` deleted the rest of the streak, and nothing could catch it.**
One missing `...d.nofap` took `urgeLog`, `urgesResisted`, `plans`,
`addictions`, `costPerDay` and `commitment` with every relapse — every resisted
urge ever logged, every if-then trigger plan, every independently-tracked
addiction with its own personal best, the money figure and the quit-date
contract. All six are **optional** on `Streak`, so dropping them is not a type
error; the page then re-renders with empty lists, which is indistinguishable
from "you have not logged any yet"; and it fires only on the one action a user
takes immediately after relapsing. All ten other writers of `nofap` spread
correctly, including the newer per-addiction twin — which is exactly why the
original path was never revisited. `store.nofap.test.tsx` was run against the
unfixed reducer to prove it fails there.

**A gate cannot grade a tab it never opens.** Settings measured 0.9 shipped /
0.9 open for its whole existence, and that was the Profile tab, five times over.
The per-tab numbers are what the "empty, and width going spare" report was
about, and no gate could see them. **It still reports 0.9 on `main`** — COD-232
is open for the gate half.

**An unseeded field is a subject the gates silently do not check, and it kept
being true.** `demo.ts` had no `addictions` at all, so a whole card of Recovery
had never been rendered by anything; seeding two turned `clipped` red on
"Nicotine" truncated to "Nicotin" and `a11y` red on a **4.14:1** Reset button.
Separately, three device-only metric fields (`steps`, `restingHR`,
`activeKcal`) had been on `DailyMetric` since the ingest pipeline landed with
the seed writing none of them — and `energy` was missing from *both* sides of
the CSV round-trip, a field the app writes and the export dropped.

**The fold-count column was never comparable between themes.**
`CollapsibleSection` persists its open state, so themes 2–5 of the serial a11y
walk found mocha's folds already open and counted 0 clicks where mocha counted
2. Coverage never differed — the content was open either way — but the number
was wrong, and sharding would have made it depend on which worker got the
shard.

**Two of my own measurements were wrong, and both were caught by the rules in
this file.** A script written to sweep `store.tsx` for other missing spreads
reported **zero against the file containing the bug**; it was discarded and all
ten writers read by hand. And a browser probe written to check a *claimed*
critical a11y violation reported "none" on five tabs because its tab click
matched the same control every time — it scanned one tab five times. Adding the
precondition ("assert the fields are actually in the DOM") is what exposed it.
A gate that is green on a known defect is worse than no gate, and that applies
to the throwaway probe as much as to the committed one.

## Numbers, before → after

```
gates   clipped   9 findings → 0, across 24 views at 1440, 1024 and 390px
        a11y      8m06.956s → 2m48.648s · 166 scans either way · 4 workers
        tests     1181 → 1287 in 96 files
        contrast  passed · 5 themes, 14 accents, both palettes agree

space   settings  per tab: 2.7 screens over 5 tabs → 4 tabs, Sync 504 → 790px
        nofap     desktop 1.8 → 1.9 shipped / 4.7 → 4.8 open
                  phone   4.2 → 4.8 shipped / 7.7 → 8.2 open
        cycle     desktop 1.9 → 2.5 shipped / 2.8 → 4.8 open
                  phone   4.1 → 4.4 shipped / 6.3 → 10.6 open
        help      desktop 1.1 → 1.2 shipped / 1.5 → 2.5 open

health  817.9MB XML streamed · 116.7MB peak heap · −4.5MB retained after gc
        3,317 records reached the planner — bounded by days, not samples
```

**Read the pairs honestly: three pages got longer and that was the point.**
Cycle's open number nearly doubled because a ~1,400px sourced document, a
legend, a diagram and a drive card arrived on a page that had none of them.
Nothing was hidden behind a new closed fold to flatter the shipped figure —
which is the only reason the numbers are worth printing.

## Where the agents were used, and what it cost

Five parallel agents, each in its own git worktree on its own preview port,
each handed its area's traps up front. **All five were killed mid-flight by a
session rate limit** and resumed from their transcripts; one had lost its
worktree and was restarted from scratch.

Two things that would have gone wrong without the isolation, and are worth
keeping as the pattern:

- **Two agents were editing `scripts/` at once** because I scoped it badly. One
  was told to revert and report its finding instead; `scripts/` had a single
  owner from then on.
- **Two branches were cut from different points and both added fields to
  `demo.ts`, `demo.test.ts` and `types.ts`.** Both needed a rebase before
  merging, and `git diff main <branch>` was actively misleading about it — it
  showed the whole Settings restructure being reverted. `git diff $(git
  merge-base …) <branch>` is what a squash actually applies. Check that one,
  not the other.

## Environment, on the way out

- **Five agent worktrees are still under `.claude/worktrees/`**, each holding
  its now-merged branch, which is why `gh pr merge --delete-branch` could not
  delete the local branches. One of them, `agent-afa93cdc840c582e9`, is **not a
  git worktree at all** — a dead agent left a 770MB plain checkout plus
  `node_modules` there, and git resolves its working tree to the repo root.
  Nothing has been deleted; it needs a decision.
- Preview/dev servers were left on 4173, 5199 and 5300, all from this worktree.
  Confirm what a port serves by its `<title>`, not by it answering 200.
- `docs/life-schedule-v3-final.html` is untracked and predates this session.

## Next

`docs/NEXT-SESSION.md`, rewritten. The short version: **`mindset` is 8.8
screens on a phone** and is now the worst page in the app by a wide margin;
Settings' gate blindness (COD-232) is open with the cheap half of the fix
identified; and the sync cluster (COD-136/137/139) is still untouched and still
the only data-integrity work left on the board.

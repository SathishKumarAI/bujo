# STATUS

**Stopped:** 2026-08-28 (fourth session that day). On `main`, clean, nothing in
flight. Two PRs opened, CI green, squash-merged: **#173, #174**. `main` is at
`094ad86`.

## What this session did

`?view=program` — "optimise, more UI, add features if needed".

| PR | What | Ticket |
|---|---|---|
| #173 | Program onto the three-zone contract; `ProgramTracker` split into `components/program/` | COD-76 |
| #174 | Rest timer, driven by the block's own rep-range rule | COD-77 |

## The one thing to carry forward

**A rule that reads correctly over one dataset is not a rule about the domain.**

`restSeconds(qty)` started global: parse the rep target, apply the block's
"12+ → 30s · 8–10 → 120s · <8 → 180s". Every hypertrophy quantity gave a
sensible answer. But the *pull-up* program has `5 reps` scapular retractions and
`1 rep` jumping pull-ups, so the same function offered three-minute rests inside
a circuit whose source prescribes no rest at all — a prescription nobody wrote,
presented with a countdown clock.

The rest rule is a fact about **one program**, and it now lives on the record
(`restRule: 'rep-range'`); `restSeconds(program, qty)` returns `null` for anyone
who has not opted in. The test asserts both directions *and* asserts that
several pull-up quantities do parse as rep targets, so it cannot pass for the
wrong reason.

It was the test that found this, before the UI rendered once. Same family as the
`help ?? subtitle` and `aria-label ?? textContent` traps already in `CLAUDE.md`:
the sweep that keys on the wrong thing reports clean.

## Measured

Dev server 5199, demo journal seeded, `#main` scroll height.

| | before | after |
|---|---|---|
| program · 1440 | 1354px | **894px** |
| program · 390 | 1512px | 1635px |
| pullups · 1440 | 1439px | 1683px |
| pullups · 390 | 2513px | 2745px |

Program was a single `Card` in the 820 tier — 820px of content in a 1392px
container, 572px of empty page, the body map below the fold. Now:

- **ORIENT** — focus, set count, day and block progress. Fact 1 is a button
  while browsing; that is the old "Continue" row.
- **ACT** (sticky) — load into session, mark all done, the rest timer, the
  program map.
- **REVIEW** — the exercises, then the body map last.

Both pages grew where the **program map** lands (246px on a phone): eighteen or
thirty days of progress in place of two rows of bare numbers that could not
answer "how much of block 2 is left".

## Two defects the gates caught in this session's own code

- `rounded-full` is not a token here — `npm run design` blocked it.
- `truncate` on the map's focus label: **30 clipped strings** on Pull-ups at
  390px, from a gate that had been at zero. A phone gives a five-day week 43px
  per cell and "Conditioning" needs 60; wrapping does not help one long word,
  and a wider cell puts the hypertrophy grid back to 377px. The phone cell is
  the day number now, and the focus reads from the day header.

## Next

- **COD-61** — Recovery needs a real IA pass. 3734px, two review sections at
  1121 and 1729px.
- **COD-73** — flat card stacks: pickleball 5379px (18 cards), stats 4685, gym
  4207, help 4021, nofap 3734.
- **Pull-ups' zone balance.** Its review column was already the taller one and
  #173 added 244px to it. Worth a look with the page-contract method.
- **The store persists the whole journal on every change, undebounced.** #173
  stopped the Program page provoking it once per keystroke by keeping the
  actual-result field local until blur, but `store.tsx` is untouched and every
  other write-through field in the app still does it. Not filed — decide
  whether a debounce plus a `visibilitychange` flush is worth the data-loss
  surface before opening a ticket.

## Environment traps

- **Ports:** 5199 is this repo's dev server, 4173 its preview, and **5173
  belongs to `interview_prep/frontend`**. Verify the preview is serving the
  current build before believing a browser result:
  `curl -s localhost:4173 | grep index-` against `dist/index.html`.
- **`npm run a11y` cannot see the rest timer.** It walks the rendered page and
  the timer is not in the DOM until an exercise is ticked — the closed-fold
  blind spot, one level in. Checked this session with a throwaway script that
  ticks one and runs axe in all five themes (0 serious/critical). Anything else
  that only appears after an interaction has the same hole.
- Screenshots need `localStorage['bujo:onboarded'] = '1'` before load, and
  `?demo=1` seeds only into an empty journal.

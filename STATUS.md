# STATUS

**Stopped:** 2026-08-28 (third session that day). On `main`, clean, nothing in
flight. Four PRs opened, CI green, squash-merged: **#168, #169, #170, #171**.
`main` is at `2c32a42`.

## What this session did

Started from "fix `?view=fitness` — space, UI optimisation, no duplication", and
turned that into a measured sweep of every routable view rather than a look at
one page.

| PR | What | Ticket |
|---|---|---|
| #168 | Fitness: the review column fills, four duplicate doors deleted | COD-60 |
| #169 | The other three stranded day grids — Stats, Mindset, Pickleball | — |
| #170 | Dead zone columns on Coaching and Pull-ups | — |
| #171 | **Smoke was testing a different application**, + header rhythm | COD-74 |

## The one thing to carry forward

**A browser gate that does not check what it is pointed at prints the same
number whether it is covering everything or nothing.**

`npm run smoke` defaulted to `http://localhost:5173` — Vite's *dev* default,
which belongs to whichever project on the machine booted first, while every
sibling script defaults to 4173 (`vite preview`, what CI starts). On this box
5173 was `interview_prep/frontend`, so smoke drove **"PrepForge — AI/ML
Interview Prep"** through all 25 `?view=` URLs and printed `25/25 views OK ·
All views rendered clean`. Three PRs quoted it as evidence before the fourth
caught it — from one stray console error naming `StudyCard.tsx`, a file this
repo does not contain.

The port was the smaller half: the pass condition was "`main` or `#root` has
more than five characters of text", which any page in the world satisfies. It
now asserts identity (`document.title` starts with `bujo` **and** `#main`
exists) before scoring a single view, and runs in CI beside `a11y`. Written up
in `CLAUDE.md`.

**If a gate passes, confirm what it was pointed at.** Cheapest version: compare
the served `index-*.js` hash against `dist/index.html` before believing any
browser result — that check is what proved the *other* gates in those PRs were
correctly aimed, so their results stand.

## The sweep, and what it found

Two scripts, both in the scratchpad rather than the repo (they answer a
question, they are not gates): one measuring every view for a visual materially
narrower than its container, one measuring both zone columns and repeated
strings.

**Stranded visuals — all fixed.** `DayGrid` gained `fluid`: `table-fixed` with
no declared column widths divides the container, so cell size falls out of the
layout at every width with no breakpoint and no ResizeObserver.

| | Before | After (1440 / 390) |
|---|---|---|
| Fitness | 188 of 708px | 708/708 · 324/324 |
| Pull-ups | 188 of 708px | full |
| Stats | 384 of 580px | 580/580 · 398/398 |
| Mindset | 331 of 613px | 613/613 · 299/299 |
| Pickleball | 202 of 580px | 580/580 · 324/324 |

Fluid changes what the *window* control means: it now sets cell size, not
width. So Pickleball's default moved 3mo → 6mo (13 fluid columns are 35.5px,
a month calendar) and Stats' `SPAN_2`-at-1yr survives with its reason inverted.

**Dead zone columns — two fixed, one refused, one wasn't a defect.**

| View | act/review gap | Outcome |
|---|---|---|
| coaching | 1438px | `stacked` — no two-column split balances one tall thing and two short ones |
| pullups | 951px | `ProgramTracker` moved to review; page 1891 → **1539px** |
| nofap | 2107px | **Refused**, COD-61 — the only way under the sticky threshold is folding away a 650px urge-coping tool |
| plan | 814px | **Not a defect** — act column is 568px, so it is `data-sticky=true` and follows you |

**Duplication — clean outside Fitness.** Fitness's `CompanionTool` linked to
four views that had since become Body tabs (a second door to a room already on
screen); a test now fails if a companion becomes a tab. Everything else the
sweep flagged is legitimate: per-row action buttons, and the Collections index
and Settings nav, which are tables of contents by design.

## Next

- **COD-61** — Recovery needs a real IA pass. 3734px, two review sections at
  1121 and 1729px.
- **COD-73** — five pages are still flat card stacks: pickleball 5379px (18
  cards), stats 4685, gym 4207, help 4021, nofap 3734. Compare fitness 931,
  goals 950, pullups 1539, coaching 1967.
- Neither is a one-liner; both want the page-contract method, and neither should
  be solved by folding things away — a closed fold is invisible to `npm run
  a11y` as well as to the user.

## Environment traps hit this session

- **A leftover `vite preview` held 4173** across sessions and survived a
  `TaskStop`. Harmless once verified (it serves `dist/` from disk), but verify:
  `curl -s localhost:4173 | grep index-` against `dist/index.html`.
- **Ports on this machine:** 5199 is this repo's dev server, 4173 its preview,
  and **5173 belongs to `interview_prep/frontend`** — do not point anything here
  at 5173.
- Screenshots need `localStorage['bujo:onboarded'] = '1'` set before load, or
  the first-run tour covers the page; and `?demo=1` seeds only into an empty
  journal.

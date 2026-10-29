# 2026-10-28/29 — The phone pages: production audit, the shell, and every page on a phone

Written to be read cold. What shipped, what it measured, what the owner said,
and what is still open. The rules this produced live in `CLAUDE.md` ("A phone
logs, a desktop reads"); the reusable pieces in `docs/REUSABLE-PATTERNS.md`
§28–§33; the prompt for the next phone page in `docs/MOBILE-BRIEF.md`; the
step-by-step in `.claude/skills/phone-page/SKILL.md`.

## The ask, in the owner's words

- "Only for mobile version … not trying to disturb the desktop."
- "No chance for any visualizations" on a phone — desktop only, decided by
  screen width, not a mode.
- "All the input should be taken only in one screen" — "try not to make them
  scroll down again and again."
- iOS-style, "futuristic", no card frame and no page-turn behind pages.
- Program: "week and day … side by side, like a selection bar … so that we
  have a lot of space remaining and all fit in one space."
- Program: "include previous weight … if I input 35 lb for the past workout,
  now I want to know that 35 … or I can increase."
- "Usability is more important" (the shell: no logo, no search, no mic,
  Account in a hamburger, tab rows that scroll).

## The PR stack — merge IN ORDER

Every PR is based on the one before it. Squash-merging the bottom one deletes
its branch and **auto-closes the child** (trap in `CLAUDE.md`), so retarget
each child to `main` (`git rebase --onto main <old-base-sha> <branch>`) before
merging its parent, or merge with "delete branch" off.

| # | branch | what | ticket |
|---|---|---|---|
| #438–#447 | (see `STATUS.md`) | Pickleball, Fitness, Strength, Program v1, contrast fixes, phone primitives | COD-450…461 |
| #439 | `chore/dev-server-port` | dev pinned to `127.0.0.1:5199 --strictPort` — independent | — |
| #449 | `feat/phone-shell-menu-v2` | ☰ menu sheet, one-row top bar, scrolling tabs. **Replaces #448 — close #448** | COD-462 |
| #450 | `feat/phone-program-log` | Program: log the day on the page, no hand-off to Strength | COD-464 |
| #451 | `feat/phone-plan-week` | Plan · Week: day strip + one day you can edit | COD-466 |
| #452 | `fix/phone-act-open` | `useActColumn` opens on a phone (6 pages); Cycle charts off | COD-467 |
| #453 | `feat/phone-today` | Today: no repeated date, no rings, `.phone-frame` tighter bands | COD-468 |
| #454 | `feat/phone-sweep-pages` | Mindset one shelf · Coaching one week · Home Workout log first | COD-468 |
| #455 | `feat/phone-focus-reading` | Focus and Reading keep what you act on | COD-468 |
| #456 | `feat/phone-program-compact` | Program: week/day selection bar, one row per lift | COD-464 |
| #457 | `feat/phone-program-last-weight` | Program: last time's weight, − / +, "try 40 lb" | COD-464 |
| this | `docs/phone-handoff` | Log button 44px pill + date chip in the dock (two commits), then these documents | COD-464 |

## What each page measured (390×664, `?demo=1`, demo banner included)

| page | before | after |
|---|---|---|
| Program (Push day) | 4.13 screens, log hand-off to Strength | **1.13**, log on the page, Log pill + date chip above the nav, any day loggable |
| Plan · Week | 5.21, 4.5 of 7 columns visible | **2.12** |
| Mindset | 11.32 | **2.98** |
| Coaching | 4.48 | **2.95** |
| Cycle | 4.03, no visible input, 1 chart | **2.88**, form open, 0 charts |
| Nutrition | no visible input | first input y527 |
| Focus | 4.85 | **3.77** |
| Reading | 4.12 | **3.09** |
| Today | Habits at y744 | **y389** |
| Home Workout | first input y893 | **y433** |
| Monthly | 1.97, a charts-only analytics fold | **1.88**, fold off on a phone (COD-486) |
| Collections | 2.98, an Index repeating the two bands below it | **2.42**, Index off on a phone (COD-486) |
| Challenges | 2.70, two stat blocks, a 75-cell calendar | **1.97**, one stat block, calendar in a "Past days" fold (COD-486) |
| Recovery | 3.46, a ring chart above the log; SOS over the Insights tab | **3.27**, one stat row, log at y362 (was 491); SOS above the nav (COD-486) |
| Pull-ups | 3.27, Log button below 7 fields | **2.87**, effort/duration/notes in a bottom sheet (COD-486) |
| Settings | 4 paragraphs over 140 chars | **0**, points on a phone via `PhonePoints` (COD-484) |
| Nutrition (2nd pass) | 2.69, two rings above the log, a macro bar chart | **1.81**, log y380 → y272, figures row, Today panel only (COD-491) |
| Home workout (2nd pass) | 3.04, tiles + month heatmap above the sessions | **1.93** (COD-491) |
| Recovery / Pull-ups (rail) | 3.27 / 2.87, chip rail on 2 lines | **2.54 / 2.23**, one select (COD-491) |
| Coaching | chapter chips on 3 lines, ~140px | one 44px select (COD-491) |
| Cycle (2nd pass) | 2.08, three totals above the log | **1.97** (COD-491) |

Every changed page: axe 0 violations at mocha + latte (Plan and Program also
dawn); desktop 1440 re-probed and unchanged. Full `npm run a11y` NOT re-run
after #443 (memory pressure) — first thing to do once the stack is merged.

## COD-479 — queued by the owner for next session

"Watch how" on YouTube for every named thing, phone and desktop. Plan in
`docs/NEXT-SESSION.md` §1; rule in `CLAUDE.md` ("Next up"). Links only — no
embedded player.

## Phone navigation, the third pass (COD-487)

Owner: "unable to navigate from body to … mind", then, seeing the grid:
"if I have this, why do I need the top navbar with these options?"

| tried | why it went |
|---|---|
| tab strip + "All 11" sheet of one section | Body → Reading was still three taps, and the strip showed 2.5 of 11 with the third cut to "Pro…" |
| every page as list rows | Body's 11 rows filled the sheet; Mind started below the fold — the scroll the sheet exists to remove |
| grid with the current section first | groups moved on every page; a fixed order keeps each page in one place |

Shipped: title button (section over page) → 3-column grid of all 20 pages,
624px, no scroll; bottom bar remembers each section's last page. Cost: a
neighbouring page is two taps, not one — the memory covers the common hop.

## What was tried and thrown away

- **Program steppers** (‹ Week 1 › ‹ Day 1 ›, 175×60 each, a picker sheet
  behind each face) — shipped in #450, rejected by the owner the next morning:
  two boxes plus a title row spent the space the day needed, and 22 set rows
  still made 4.13 screens. Replaced by a 44px bar of two native selects and
  one row per lift (#456).
- **A long grouped form**, iOS-styled and fully open — Pickleball, 2.62
  screens, rejected: "try not to make them scroll down again and again."
- **A Program day as 22 set rows** — correct data, wrong shape. The unit a
  lifter thinks in is the LIFT; a set is a tap on its counter.

## Findings outside the ask, and where they went

| finding | where |
|---|---|
| Supabase project NXDOMAIN — Google sign-in dead in prod and dev | COD-434 — **owner action** |
| Journal synced in plaintext vs "no user data collected" | COD-436 — **owner decision** |
| Feedback form publishes the sender's email to a public repo | COD-435 |
| `/api/sync` unauthenticated, no rate limit | COD-437 |
| Hardening list | COD-438 |
| `useActColumn` hid the form on every stacked phone page | fixed, COD-467 |
| Desktop axe is blind under the `.book` cover | COD-455 |
| Dead TopBar rows after the shell change | COD-463 |

## Environment, as left

- Dev server **127.0.0.1:5199**, started by this session from the main
  checkout, which is on `docs/phone-handoff` (stacked on #457). Another
  session may stop it; restart with
  `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5199 --strictPort`.
- A second dev server on **5200** ran from `.claude/worktrees/agent-ad6e641093cd2c2e0`.
- Probes live in the session scratchpad; the ones worth keeping are
  described in `.claude/skills/phone-page/SKILL.md` (sweep, flow, axe).

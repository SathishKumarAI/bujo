# STATUS

**Stopped:** 2026-08-16, after opening PR #119 — the last of the seven-phase
Modernist redesign.

## Where things are

Seven stacked PRs, oldest first. Each is green on every gate; each depends on the
one below it.

| PR | Branch | What |
|---|---|---|
| #113 | `feat/modernist-mindset` | Mindset rebuilt on hand-written bands · practice log · `components/mod/` primitives |
| #114 | `feat/modernist-mind-rest` | Reading, Collections, Focus · 8 folds removed · 2 components absorbed |
| #115 | `feat/modernist-today-plan` | `<Card band>` variant · Today + Plan |
| #116 | `feat/modernist-body` | Body cluster (10 views, 3 component folders) |
| #117 | `feat/modernist-data` | Insights, Stats, Trackers, Challenges, Goals, Monthly |
| #118 | `feat/modernist-chrome` | Settings, Help, Account, Welcome · KitchenSink documents both looks |
| #119 | `feat/modernist-shell` | Shell + radius 0 app-wide · the rail's week strip |

Source: `~/Downloads/Luke's redesign scope/design_handoff_mindset_redesign`.
The plan they were built from is `docs/sessions/2026-08-16-modernist-redesign/PLAN.md`.

Nothing is half-migrated. The staged seam — flat bands containing rounded
controls — closed in #119 when `--radius-control/card/pill` all went to 0.

## Next action

**Merge the stack bottom-up: #113 → #114 → #115 → #116 → #117 → #118 → #119.**
Squash-merging one retargets the next automatically on GitHub, but re-check each
base before merging.

Then, in a new branch:

- **Screenshots.** `npm run shots` has not been re-run since the redesign; every
  image in `docs/screenshots` is pre-Modernist.
- **The handoff's palette question.** This pass deliberately kept the five
  themes and dropped the handoff's `#f3f2f2` / `#201e1d` / `#ec3013` + Archivo.
  If pixel-fidelity to the handoff matters more than the themes, that is a
  separate decision and a separate branch.

## Traps found this session, worth carrying forward

- **An apostrophe in a CSS comment inside `@theme` fails the Tailwind build**
  with `CssSyntaxError: Unterminated string` — and `tsc -b`, `vitest` and
  `npm run design` all pass while it is broken. Only `npm run build` catches it.
  A prose comment in `tokens.css` is not free text.
- **`activeDays()` includes future-dated entries**, because a task dated Friday
  makes Friday "active". The new rail week strip lit Friday's cell on a Sunday
  until `loggedWeek()` excluded future days. Scheduling is not logging.
- **A grid wide enough to overflow finds bugs a small one hides.** Raising
  `CalendarHeatmap`'s cell to 22px made it scroll at phone width, which exposed
  `serious: scrollable-region-focusable` on a wrapper that had shipped for
  months — the region was unreachable by keyboard.
- **`tailwind-merge` does not drop a responsive class for a base override.**
  `className="gap-0"` against `Page`'s `gap-4 sm:gap-5` leaves `sm:gap-5` alive,
  so every band page needs `gap-0 sm:gap-0`.
- **A `<Card>` variant beats rewriting card markup.** Phases 4–6 converted ~28
  views by adding one prop per call site; nothing inside a card could be lost,
  which is the failure mode this repo already has a scar from.

## Environment

- Dev server: `npm run dev` — **it picked :5174 this session**, because :5173 was
  already held by another worktree's server. Check the port in the Vite banner
  rather than assuming.
- Preview for the a11y gate: `npm run preview` took **:4174** for the same
  reason, so the gate needs `BUJO_URL=http://localhost:4174 node
  scripts/a11y-axe.mjs`. Left at the default it silently scans a *different
  build* served by the other worktree.
- Browser driving: `chrome-devtools` MCP.

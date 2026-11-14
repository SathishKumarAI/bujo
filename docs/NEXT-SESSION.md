# Next session

This was written on 2026-11-13, at the end of the workout cards, timers and habit
cards session (`docs/WORKLOG.md`, and
`docs/sessions/2026-11-13-workout-cards-and-timers.md`). Rewrite this file once it
has been picked up.

## 0 · Environment first

- **Production** runs the #553 build, which was deployed and checked against the
  bundle hash. #554 and #555 changed docs only, so there is nothing to deploy.
- **Gate dependencies were wiped by the deploy.** Reinstall them before you run
  `a11y`, `smoke`, `clipped` or `space`:
  `npm i -D --no-save playwright @axe-core/playwright`.
- **Dev server** (`127.0.0.1:5199`) was stopped by the system for low memory.
  Restart it with `npm run dev`. List the listening ports first.
- **Debug Chrome** on 9333 may still be running. If it is not, see the memory
  note "Chrome DevTools MCP on 9333".

## 1 · COD-590: the remaining phone pages as cards

The owner's rule:
- no subparts: nothing opens in place;
- no symbols;
- no week or month;
- one row per item;
- check each page's desktop too.

Fold counts are those measured at `?demo=1`. Do the pages in this order:

| Page | Folds | Start from |
|---|---|---|
| Recovery | 8 | §34 one-row card for urge rows; sheets for the reading panels |
| Insights | 6 | phone has no charts, so cards hold the one number each |
| Trackers | 4 | §37 habit cards already exist (`trackers/HabitCards.tsx`) |
| Nutrition, Challenges, Cycle, Monthly | 3 each | Nutrition already has `FoodRow`; keep it |
| Coaching, Focus | chip rails | one select bar (`.select-pill`) |

The procedure is `.claude/skills/phone-page/SKILL.md`, and its fix table now
lists §34–§37.

**Ask the owner first.** Should "no month" also cover the Monthly page and the
Trackers month layout on the phone? It changes what those two pages are.

## 2 · COD-575: sheets on the phone pages are not scanned

`scanSheets()` in `scripts/a11y-axe.mjs` opens `#main [aria-haspopup="dialog"]`,
but only on Settings. This session added more sheets on phone pages, all
unscanned: the Pull-ups History and guide rows, Home workout's Change, Program's
Edit sets, `HoldTimer` and `IntervalTimer`. Run the pass on those surfaces and
keep the zero-scanned failure. Prove it works by planting a violation.

## 3 · Owner actions still blocking

- **COD-434:** the Supabase project does not resolve. Google sign-in stays dead
  until it is restored.
- **COD-436:** journal sync is plaintext. The owner must choose between
  encrypting before upload and dropping cloud sync.

## 4 · Audit tickets: check their state on the board first

These are still on the list from 2026-11-08:

| Ticket | Problem |
|---|---|
| COD-435 | the feedback form publishes the email publicly |
| COD-437 | `/api/sync` auth and rate limit |
| COD-438 | hardening |
| COD-455 | desktop axe is blind under the book cover |
| COD-463 | dead TopBar rows |

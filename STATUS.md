# STATUS

**Stopped:** 2026-09-03 evening. Three branches shipped and squash-merged
today — #197 (COD-141, Body cluster polish), #198 (COD-142, Strength tools +
animated barbell), and `feat/panel-scroll-lazy` (COD-143, panels + lazy
mounting; PR open or just merged — check `gh pr list`). All gates green,
outputs quoted per-entry in `docs/WORKLOG.md` (three 2026-09-03 entries).

## What today's session did

1. **COD-141** — surveyed all 11 Body tabs in-browser before touching code;
   fixed seven measured defects (Cycle's 180-control wall → day editor,
   month labels on all day grids, Challenges missed-day encoding, Home
   workout layout + emoji removal, Nutrition legend, Trackers unit, Gym
   clipped placeholders / 0lb PRs). Cycle added to the a11y COMPANIONS list.
2. **COD-142** — Look up & tools moved beside the session logger (used
   *during* the act); plate calculator rebuilt as a full symmetric barbell
   with staggered plate-load animation and thumb steppers.
3. **COD-143** — split pages: an act column taller than the viewport becomes
   its own scrollport (independent left/right scrolling, focusable region);
   `LazyMount` defers below-fold chart stacks (Recovery, Pickleball) until
   the reader heads there.

## Decisions that will surprise you later

- **`LazyMount` mounts on `bujo:reveal-lazy`**, and both scanning gates
  (`a11y-axe`, `clipped-text`) dispatch that event before measuring. This is
  load-bearing: unmounted content cannot be scanned, so removing the arm
  turns both gates green-but-blind. Do not "simplify" it away.
- **A scroll-walk reveal was tried and reverted** — scrolling bottom-and-back
  left the hide-on-scroll header intercepting the a11y script's own clicks.
- **`.zone-act :is(input…)` (0-1-1) beats Tailwind width utilities** on
  inputs inside act columns; the plate calculator uses inline `style` widths
  for exactly this reason.
- **Pickleball and Recovery IA restructures still deliberately not done**
  (page-contract scale). LazyMount trims their cost, not their length.

## Environment traps hit this session

- **Editing `NoFap.tsx` via the path `Nofap.tsx` renamed the file** on this
  case-insensitive filesystem — tsc TS1261, git `D`+`??` pair. Match tracked
  casing exactly; renamed back through a temp name.
- `vite preview`'s service worker served a stale bundle repeatedly —
  unregister + clear `caches` + reload before believing any screenshot.
- Debug Chrome on 9333 with a temp profile works for browser verification;
  `resize_page` cannot shrink the window below ~500px (min window width) —
  use the gates' own 390px emulation for phone truth.

## Next action

Confirm COD-143's PR merged and move it to Done. Then the standing queue:
COD-137 (sync-effect consolidation, clears the two eslint warnings) or the
Pickleball/Recovery page-contract conversation (COD-73 adjacent).

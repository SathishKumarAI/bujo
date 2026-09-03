# STATUS

**Stopped:** 2026-09-03 late. Five PRs shipped and squash-merged today, all
gates green each time, outputs quoted per-entry in `docs/WORKLOG.md` (five
2026-09-03 entries): #197 COD-141 Body polish · #198 COD-142 Strength tools +
animated barbell · #199 COD-143 panels + LazyMount · #200 COD-144 reference
reading → Coaching, Cycle tab default-on · #201 COD-145 Cycle page rebuild.
`main` is pushed; test count 939.

## What today's session did (short form — WORKLOG has the detail)

1. **COD-141** — surveyed all 11 Body tabs in-browser; fixed seven measured
   defects; Cycle joined the a11y COMPANIONS list.
2. **COD-142** — Look up & tools beside the logger; plate calculator is a
   full animated barbell; the zone-act input-width specificity trap found.
3. **COD-143** — tall act columns become their own scrollport; `LazyMount`
   defers below-fold chart stacks; **both scanning gates dispatch
   `bujo:reveal-lazy` before measuring — load-bearing, do not remove.**
4. **COD-144** — Play safe + Format playbook are Coaching Manual folds;
   `cycleTrackerEnabled` defaults true (existing journals keep their stored
   value — one Settings toggle is the migration).
5. **COD-145** — Cycle page: two 15-day boxes side by side, period days
   red-washed, "Cycle day N · phase · estimate" from `lib/cycleInsights`
   (null-not-zero throughout), tracking guide from `lib/cycleGuide` with a
   medical disclaimer; 17 new tests pin both modules.

## Decisions that will surprise you later

- **Cycle's phase/next-period lines are estimates by design** — ovulation is
  placed 14 days before the *next* period scaled to the personal average,
  and nothing renders until a logged period anchors the count. Do not turn
  them into predictions or fertility claims; the disclaimer says why.
- **`avgCycleLength` drops gaps outside 15–60 days** — a 200-day gap is
  lapsed logging, not a cycle. Tests pin this.
- **The gates arm lazy content via `bujo:reveal-lazy`** (COD-143). A
  scroll-walk was tried and reverted — the hide-on-scroll header intercepted
  the a11y script's own clicks.

## Environment traps hit this session

- **Editing `NoFap.tsx` via the path `Nofap.tsx` renamed the file** on this
  case-insensitive FS (tsc TS1261, git `D`+`??` pair). Match tracked casing.
- The preview service worker served stale bundles repeatedly — unregister +
  clear `caches` + reload before believing any screenshot.
- `.zone-act :is(input…)` (specificity 0-1-1) silently beats Tailwind width
  utilities on inputs inside act columns; use inline `style` widths there.

## Next action

Standing queue, in rough order of leverage: COD-137 (sync-effect
consolidation — clears the two long-standing eslint warnings), the
Pickleball/Recovery page-contract restructure (COD-73 adjacent; LazyMount
trimmed their cost, not their length), and extending LazyMount/panels to
Insights/Stats if their eager chart stacks start to hurt.

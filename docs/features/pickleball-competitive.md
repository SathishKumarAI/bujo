# Pickleball — leagues, tournaments & the 3.5→4.0 plan

Session 2026-06-18. Extends the Pickleball view (bottom of the page) with
competitive-play tracking, richer per-game logging, and a research-backed
75-day improvement plan. Content compiled from USA Pickleball, DUPR, and
reputable coaching sources (The Dink, Better Pickleball, PrimeTime, Selkirk).

## Richer per-game logging (`PickleballSession`)

The "Log a session" form now also captures: **opponent**, **location**,
**level** (e.g. 3.5), **points for / against** (point differential), and the
**scoring format** (to 11 / 15 / 21, or rally-to-21). All optional and additive
— existing sessions are unaffected.

## Leagues & tournaments (`PickleballEvent`, new)

A separate log for competitive events (distinct from casual sessions):

- Fields: name, date, **kind** (league / tournament), **format**, division,
  W–L record, placement (e.g. *Gold*, *2nd of 8*), partner, notes.
- Stat tiles: events entered, overall event record, medals (auto-detected from
  the placement text).
- Store actions: `addPickleEvent` / `removePickleEvent`; persisted under
  `JournalData.pickleballEvents`.

### Formats (the "Format playbook" card)

`src/lib/pickleballPlan.ts → PICKLE_FORMATS`:

| Format | Gist |
|---|---|
| Round Robin | Everyone plays everyone; ranked by W–L. Fairest seeding. |
| Pool Play → Bracket | Pools round-robin, then a medal elimination bracket. The workhorse. |
| Single Elimination | One loss out; fast, often with a consolation bracket. |
| Double Elimination | Winners' + losers' brackets; two losses to be out. |
| Swiss | Fixed rounds pairing similar records; no rematches/eliminations. |
| Ladder League | Ongoing; winners move up a court, losers drop; weekly rankings. |
| Box League | Skill "boxes" of 4–5 with promotion/relegation. |
| King of the Court | Fast rotation toward a top court; high-energy. |

## 75-day 3.5 → 4.0 plan (`PICKLE_PLAN`)

Start it (sets `settings.pickleballPlanStart`); the card then shows **Day N of
75**, a progress bar, and highlights the active phase ("You're here").

| Phase | Days | Focus |
|---|---|---|
| 1 | 1–18 | Soft game & resets |
| 2 | 19–36 | Third-shot drop |
| 3 | 37–54 | Transition zone, serve & return depth |
| 4 | 55–72 | Net battles, selective offense & strategy |
| 5 | 73–75 | Assessment & integration |

Each phase lists 4 concrete drills (figure-8 dinks, nine-point drop, slinky,
0-to-60, drive-drop-reset, skinny singles, etc.) and a measurable goal
(e.g. ~90% drop success, ~83% transition success). A collapsible section lists
the 11 skills that separate a 3.5 from a 4.0 (consistency + shot selection, not
new strokes).

**Caveats (from research):** 75 days is the aggressive end — most players take
6–18 months. "Hitting 4.0 benchmarks" ≠ an automatic official DUPR/UTPR change,
which depends on rated-match results. MLP scoring and UTPR's official status
have shifted recently; verify current rules.

## Files

- `src/lib/pickleballPlan.ts` — formats, plan phases, skills (pure data).
- `src/lib/types.ts` — `PickleballEvent`, `PickleballFormat`, extended `PickleballSession`.
- `src/store.tsx` — `addPickleEvent` / `removePickleEvent`.
- `src/views/Pickleball.tsx` — three new cards at the bottom + richer log form.
- `src/lib/demo.ts` — seeds two events + a mid-plan start for the demo.

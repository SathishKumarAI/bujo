# Cycle

`views/Cycle.tsx` wires the page; every part here takes derived data and
renders it. None of them reads the store, which is what keeps
`lib/cycleInsights.ts` the only place the arithmetic happens.

| Change | File |
|---|---|
| A flag, its colour, or what the mark means | `flags.ts` |
| The swatch-and-meaning list under the chips | `FlagLegend.tsx` |
| The ring, phase arcs, the "you are here" marker | `CycleWheel.tsx` |
| The ovulation / fertile-window timeline | `FertileWindow.tsx` |
| Drive averages per phase | `DriveByPhase.tsx` |
| Cravings, food and its sources | `PhaseNutrition.tsx` + `../../lib/cycleGuide.ts` |
| Cycle-length bars, the normal band, the average line | `CycleHistoryChart.tsx` |
| Temperature, coverline, period/ovulation shading | `BbtChart.tsx` |
| Which cycle day each flag lands on | `SymptomPattern.tsx` |
| The temperature field and the five chips | `DayEditor.tsx` |
| The month as a list, with its cycle-day column | `MonthList.tsx` |
| Any number any of them shows | `../../lib/cycleInsights.ts` |

## Rules

**Everything in zone 3 is keyed to the cycle, not the calendar month.** A
month boundary cuts a cycle at an arbitrary point, so the temperature chart —
whose whole subject is a shift that happens mid-cycle — used to read as two
unrelated fragments in two different months. `MonthList` is the exception and
stays month-shaped, because it is a diary you look things up in by date.

**Nothing here predicts.** Every derivation is arithmetic over what was
logged, every function returns `null` when the log cannot answer, and the
phase and next-period values are labelled estimates at every call site. The
coverline is explicitly retrospective: it says a rise *already happened*.

**One flag, one hue, everywhere.** `FLAG_COLOR` is the single map. Five
surfaces read it now — the legend included — and a second copy is a copy that
drifts. A hand-written legend would have been exactly that copy, which is why
`FlagLegend` maps over `FLAGS` and never lists them.

**Three places say something about a flag, and each says a different thing.**
`FLAG_MEANS` (here) says what the mark records; `TRACKING_TIPS` in
`lib/cycleGuide.ts` says why keeping it is worth the tap; `data/glossary.json`
defines the *term* for the two that are abbreviations. Adding a fourth
description of `pms` is how the app comes to disagree with itself.

**`phaseBands` derives from `phaseOf`, day by day.** It does not re-derive the
boundaries — ovulation is placed relative to the *next* period, and doing that
arithmetic twice in two files is how the wheel and the "you are here" pill
come to disagree by a day. A test asserts they agree on every day of 26-, 28-
and 31-day cycles.

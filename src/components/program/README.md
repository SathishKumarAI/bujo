# `components/program`

The built-in multi-week training programs, as UI. The program *data* and every
pure question about it ("which day am I on", "is this day finished") live in
`src/lib/programs.ts` — nothing here re-derives them.

## Change → file

| Change | File |
|---|---|
| Where the cursor opens, what ticking writes, any derived count | `useProgram.ts` |
| The block/day grid, the progress bar, cell states | `ProgramMap.tsx` |
| An exercise row, the actual-result field | `DayChecklist.tsx` |
| The rest countdown, its controls | `RestTimer.tsx` |
| The body map under a day | `DayAnatomy.tsx` |
| The one-card layout Pull-ups uses | `ProgramTracker.tsx` |
| The three-zone layout the Program tab uses | `src/views/Program.tsx` |
| The exercises themselves, rest rules, `resumeAt` | `src/lib/programs.ts` |

## Why the split

`ProgramTracker` was one 240-line component holding the cursor in its own
`useState`. That is fine for Pull-ups, where the program is one card in zone 3,
and impossible for the Program tab, where the same program is spread across
three zones — siblings cannot share state held inside a fourth.

So the state moved into `useProgram` and the pieces became children. Both call
sites read the *same* hook and the *same* two children; the only difference is
the arrangement. Copying the derivations into the view instead is how
`lib/pullups.ts` went dead (see the trap in the root `CLAUDE.md`).

## Traps

- **`useProgram` takes `only`, and the cursor is seeded once.** `resumeAt` runs
  in a lazy initialiser deliberately: re-deriving it every render would move the
  grid out from under you the moment you ticked the last exercise of the day you
  were looking at.
- **The actual-result field is local until blur.** The store persists the whole
  journal on every change, so a controlled write-through field serialised it
  once per keystroke. It flushes on blur *and* on unmount — the unmount flush is
  not optional, because switching day unmounts the row.
- **Cells are `flex-1` with a `min-w`, never a fixed width.** Same reason
  `DayGrid` has `fluid`.
- **Foregrounds on a fill go through `onAccent()`,** and no `opacity` on text
  that was solved against its background.
- **Rest is a fact about a program, not about exercises.** `restSeconds` takes
  the `Program` and returns `null` unless it declares `restRule`. Written as a
  global rule over quantities it read "5 reps" off the pull-up program's
  scapular retractions and offered a three-minute rest inside a circuit whose
  source prescribes none — a test asserts both directions.
- **The countdown is `end - now`, never a decrement per tick.** A background tab
  throttles `setInterval` to about once a minute.

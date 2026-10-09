# Gym components

The cards and the logger behind `views/Gym.tsx`. The view owns the state; almost
everything here is read-only and takes derived rows as props, which is why the
table below is mostly "change what it says" rather than "change what it does".

## Change → file

| Change | File |
|---|---|
| The set-logging form — what, how heavy, how many, how hard | `SessionLogger.tsx` |
| The shape of one logged set, or its defaults | `setRow.ts` |
| The coach's 29 prescribed sessions, or what "Load N" loads | `CoachSessions.tsx` (data in `lib/coachSessions.ts`) |
| "What did I lift last time on this split" | `LastSessionCard.tsx` |
| The one-row-per-lift table and its strength standards | `LiftTable.tsx` |
| Rep records at each weight for the focused lift | `RepPRCard.tsx` |
| Push/pull/legs/core volume radar | `MovementRadar.tsx` |
| Weekly hard-sets per muscle against the 10–20 landmark | `MuscleVolumeBalance.tsx` |
| "You have not trained this in 10 days" | `NeglectedMuscles.tsx` |
| Time since each muscle was last trained | `RecoveryMap.tsx` |
| "This lift has not moved in N sessions" | `StalledLifts.tsx` |
| Most-trained movements, and the train/rest ratio | `ExerciseFrequencyCard.tsx` |
| The 3D body, and which muscles a lift highlights | `BodyView3D.tsx` |
| The body's geometry — ribs, limbs, muscle groups | `bodyMesh.ts` |
| What this directory exports | `index.ts` |

## Things worth knowing before editing

**The muscle mapping lives elsewhere.** `lib/exerciseMuscles.ts` decides which
muscles an exercise name works, and four cards here plus `BodyView3D` read it.
An exercise with no mapping logs fine and then **silently stops existing** in
every rollup on this page — it is not an error anywhere. `coachSessions.test.ts`
asserts that every coach movement reaches the map for exactly that reason.

**`bodyMesh.ts` is primitives, not a model file.** No GLB, no licence, no
megabytes — and the file's own header states the trade honestly. Read it before
proposing "just ship a rigged model".

**`setRow.ts` is a separate module on purpose**, so that the only way to make a
logged set is `newSetRow()`. A second inline literal is how a field gets added
in one place and defaulted nowhere.

**`CoachSessions`'s "Load N" count is the loadable count, not the line count.**
Warm-ups and cardio finishers are shown and deliberately not loaded — a logger
asking for reps and a weight is the wrong shape for "Legs warmup cheyu". The
button carries the real number because it is smaller than the list above it.

**Most of these cards are inside `defaultOpen={false}` folds**, which means the
a11y gate reaches them only because `openFolds()` clicks every collapsed
section. If you add a card behind a *rail* group instead, read COD-237 in
`CLAUDE.md` first — a rail has no `aria-expanded`, so the gate stops seeing it.

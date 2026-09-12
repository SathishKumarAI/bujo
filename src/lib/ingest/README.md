# `lib/ingest`

One pipeline for every importer — Apple Health's export and a payload Claude
wrote go through the same validation, the same dedupe rule and (later) the same
preview. The reasoning lives in `docs/import/ingest-architecture.md`; this is
the map.

| Change | File |
|---|---|
| The transport format, the record kinds, `srcKey` | `envelope.ts` |
| What a file must look like, what a record must look like, every range | `validate.ts` |
| Turning records into a candidate journal, dedupe, conflicts | `plan.ts` |
| All of the above | `ingest.test.ts` |

```
parse/validate(text)  →  { records, rejected }   // pure, never throws
plan(records, journal) →  ImportPlan             // pure; builds the WHOLE next journal
apply(plan)            →  replaceAll(plan.next)  // one write, one undo step — branch 2
```

Rules that keep this honest:

- **Nothing writes until the whole plan is built.** `plan()` takes a journal and
  returns a new one. It holds no store reference and cannot dispatch, so a throw
  anywhere upstream leaves the journal untouched — there is no half-applied
  state, because there is no incremental write. That is the entire safety
  argument and it is testable with a literal object.
- **Identical is a no-op; different is a conflict.** Never a silent overwrite,
  never a second row. Day-keyed collections are self-deduping under that rule
  and need no stored provenance; only `workouts` does, via `Workout.src`.
- **Out of range is rejected, not clamped.** A `mood: 9999` clamped to 10 is a
  fabricated perfect day that nothing downstream can tell from a real one.
- **An import adds records, never structure.** A habit an import names but the
  journal does not have is refused, not created.
- **The machine never beats the human** — except on `steps`, `restingHR` and
  `activeKcal`, which no UI can write, so there is no human value to defend.

Not here yet, by design: any UI (branch 2), the Apple adapter and streaming
(branch 5, blocked on `docs/import/apple-health-research.md`). `plan()` already
takes an `AsyncIterable` so branch 5 does not rewrite it.

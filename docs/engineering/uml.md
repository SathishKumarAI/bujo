# UML — bujo

**Moved. The diagrams live in [`docs/diagrams/`](../diagrams/README.md).**

| Looking for | Go to |
|---|---|
| Component / container diagram | [Shell and views](../diagrams/shell-and-views.md) |
| Class / data-model diagram | [Data model and state](../diagrams/data-model.md) |
| State-mutation sequence | [Data model and state](../diagrams/data-model.md#the-reducer) |
| Sync sequences, auth, deployment | [Storage and sync](../diagrams/storage-and-sync.md) |
| CI / deploy pipeline | [Verification pipeline](../diagrams/verification-pipeline.md) |

## Why this file is a pointer

There were two UML documents in this repo — this one, linked from `README.md`,
and `docs/diagrams/uml.mdx`, linked from four rows of `docs/RULES.md` that each
said "update in the same PR". Both were hand-maintained, both carried five
diagrams, and they covered overlapping subjects with different claims.

Nothing kept them in step, and `docs-guard.yml` could not: a PR touching
*either* file counts as documented. So each contributor updated whichever they
had been pointed to, and the other rotted. By the time this was noticed,
`uml.mdx` was drawing a `Sidebar` component that does not exist in `src/` — in
a repo whose own `ARCHITECTURE.md` says "there is no rail".

Same failure as the palette written into two files (`CLAUDE.md`, COD-32): the
reader cannot tell which copy is lying, so neither can be trusted. One home now.
This file stays as a pointer rather than being deleted, because it is part of
the five-lens set in [`README.md`](README.md) and the lens index links to it.

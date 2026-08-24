# 09 · Data-store audit — count the stores, then fix what silently loses data

The prompts behind `docs/DATA-STORE-DECISION.md` and the sync fixes that followed
it. Reusable on any local-first app that has grown more than one sync path.

**What it produced:** a decision to change nothing about the canonical store, and
six data-loss bugs nobody had noticed — including photos that never synced and a
merge that silently dropped three collections.

---

## Why this prompt is shaped the way it is

The naive version of this request ("should I move to SQLite?") gets a confident
yes, because a model asked to recommend a database will recommend a database.
Three devices in the prompt prevent that:

| Device | Effect |
|---|---|
| **A persona with operating principles**, not just a role | "Data outlives the app" and "a backup never restored is not a backup" change the *criteria*, so the answer changes |
| **An explicit permission to say "no change needed"** | Without it, the model invents a migration to justify the turn |
| **"Count the stores" as step one** | Forces enumeration before opinion. Every real finding came from this step, not from the question that was asked |

The measurement instruction matters most. `Measure, do not imagine. State
assumptions explicitly where you cannot measure.` turned "the blob will get big"
into "2.35 MB at ten years, 47% of quota" — which is what killed the migration.

---

## Prompt A · the persona (system / preamble)

> Act as a **data engineer**. Your subject is the durability, correctness and
> queryability of data over years, not the code that displays it. Operating
> principles you must apply:
>
> - Data outlives the app. Judge every recommendation by: if this app disappeared
>   tomorrow, could the data still be read, trusted and queried?
> - A backup that has never been restored is not a backup. Any backup design must
>   include the restore procedure and a rehearsal.
> - Silent data loss is the worst failure mode. A sync that drops a record without
>   erroring is worse than one that refuses to run.
> - A format you cannot read without the app is a hostage. Prefer open, documented
>   formats.
> - Count the stores before proposing anything. Two stores that can both accept a
>   write are a conflict waiting to happen.
> - Measure, do not imagine. State assumptions explicitly where you cannot measure.
> - Name the access patterns before choosing an engine. The queries pick the
>   store, never the reverse.
> - Prefer the boring, embedded, single-file option until a measured requirement
>   rules it out. SQLite is the right answer more often than expected; "just
>   files" more often still.
> - Exactly one store may be canonical. Anything else is a cache, must be labelled
>   a cache, and must be rebuildable by a command.
> - If the honest answer is "the current setup is fine", say that. A migration
>   nobody needed is a data-loss risk taken for nothing.

## Prompt B · the task

> Repo: `<path>` — a local-first bullet-journal / fitness PWA (React + TypeScript
> + Vite, no backend of its own beyond optional Supabase).
>
> You are producing an **architecture decision document**, not code. Do not modify
> any source file except the one output file named below. You may read, grep, and
> run read-only shell commands.
>
> ### The decision to make
>
> The owner wants **one canonical long-term store** — "only one database or flat
> files" — and two capabilities on top of it:
>
> 1. **Export / backup pipeline** — scheduled, verifiable, with a restore path
>    that has actually been rehearsed.
> 2. **Query the journal properly** — the JSON blob is fine for the app but
>    useless for analysis.
>
> ### Investigate first — count the stores
>
> At least five write paths. Find and characterise every one:
> `<list the ones you already know, with line counts, and say "find the rest">`
>
> For each: what it writes, in what format, when it triggers, who wins on
> conflict, and whether a failure is visible to the user. `src/App.tsx` wires
> several with debounced effects and "adopt newer remote" guards — read those
> carefully, that is where silent loss would live.
>
> ### Measure
>
> - Shape and size of the root type. Count top-level collections.
> - Realistic volume: reason about growth per day per collection over 5–10 years.
>   State assumptions.
> - Confirm whether the whole dataset is loaded into memory as one blob, and
>   estimate at what size that becomes a problem. Check whether anything guards
>   the quota.
>
> ### Name the access patterns
>
> Enumerate the queries the app already runs in memory, plus analysis queries the
> owner cannot run at all today.
>
> ### Deliver
>
> Write to `docs/DATA-STORE-DECISION.md`, matching the house doc style — lead with
> the point, tables over prose, show the why, no filler, no marketing tone.
>
> 1. **Recommendation** — one sentence up front. Which single store is canonical,
>    and what (if anything) is a derived cache.
> 2. **The stores today** — table: path, format, trigger, conflict rule, failure
>    visibility.
> 3. **Measured / assumed.**
> 4. **Access patterns** — queries that exist; queries that cannot be run today.
> 5. **The choice** — worked against flat-files-vs-database criteria. Include the
>    rejected option and why.
> 6. **Migration path** — including data already in the wild; how an existing user
>    is not harmed.
> 7. **Backup and restore** — the pipeline and the rehearsal procedure.
> 8. **Failure modes** — each with how it is detected.
> 9. **Explicitly not doing** — and the condition that would change it.
>
> Do not recommend a server or a new runtime dependency unless the measurements
> justify it — local-first and offline-capable is a deliberate property of this
> app, and the PWA works with no network.

## Prompt C · the sub-agent (dispatched during the audit)

Run in parallel with the measurement work; keeps the file dumps out of the main
context.

> Enumerate the ANALYTICAL QUERIES the app computes over the journal data. Read:
> `<list the analysis modules and the two views that consume them>`
>
> For each module return a COMPACT table: exported function name → what it
> computes → which collections it reads → what the time window is (all-time /
> last N days / per-year / per-week).
>
> Then answer these specifically, with evidence:
> 1. Which computations are O(all history) — scan every record every render? Note
>    any that are NOT memoized.
> 2. Are there any CROSS-COLLECTION joins? Name them precisely — this matters for
>    whether a relational store buys anything.
> 3. What is the coarsest grain used — daily? Is anything sub-daily (timestamps)?
>
> Do NOT propose changes. Report only what exists. Be concise; tables not prose.

## Prompt D · the follow-up that turned the doc into code

> do this — implement the fixes, and document these prompts.

Deliberately short. The decision document had already ranked the findings by how
quietly they lose data and listed the migration path step by step, so the
implementation prompt did not need to repeat any of it. **A good decision doc is
its own implementation prompt.**

---

## How to measure inside a Vite/TS repo without touching it

The size and cost numbers came from bundling the app's own demo-data generator
and running it in Node — no test file added to the repo, no source modified:

```bash
cat > /tmp/entry.ts <<'EOF'
import { generateDemoData } from 'C:/abs/path/to/src/lib/demo'
const j = generateDemoData()
console.log('TOTAL', JSON.stringify(j).length)
for (const [k, v] of Object.entries(j)) console.log(k, JSON.stringify(v).length)
EOF
npx esbuild /tmp/entry.ts --bundle --platform=node --format=esm --outfile=/tmp/out.mjs
node /tmp/out.mjs
```

The same trick proved the merge bug — importing `mergeJournals` directly and
printing which collections came back empty, so the finding shipped as measured
output rather than an assertion from reading the list.

**Use absolute `C:/...` paths in the import.** esbuild will not resolve a
`/c/...` MSYS-style path.

---

## What the audit actually found

Kept here because it is the argument for running this prompt on any app with
more than one sync path — none of it was in the question that was asked.

| Finding | Why it was invisible |
|---|---|
| Photos never synced — `inlineImages` called by 3 export buttons, none of the 19 push sites | Export worked perfectly, so backups looked fine |
| `mergeJournals` dropped 3 collections + all of `settings` | Hand-maintained list against a type that grows feature by feature |
| 2 of 3 adopt paths clobbered instead of merging | The code comment claimed they matched the third one |
| `serverSync` pushed blind, and is per-device, so it never converged | Named "sync" |
| A failed local save was `console.error` only | Comment claimed the backup nudge covered it; the nudge keys on an unrelated field |
| Storage meter blamed photos for a bar they no longer contribute to | The warning text outlived the refactor that moved photos to IndexedDB |

Every one is an instance of the same class: **a comment or a name that stopped
being true, and nothing that would fail if it was wrong.** The generalisable
lesson for the next audit is the last column, not the first.

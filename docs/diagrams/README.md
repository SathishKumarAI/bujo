# Diagrams

The canonical home for bujo's architecture diagrams. Five pages, one per system,
all Mermaid so they render on GitHub and diff in a pull request.

| Page | Answers |
|---|---|
| [Storage and sync](storage-and-sync.md) | Where does a keystroke end up, and which of the seven write paths can lose it |
| [Data model and state](data-model.md) | What `JournalData` holds, what `patch` / `silent` / `set` each mean, why undo has a 900ms seam |
| [Shell and views](shell-and-views.md) | How 26 views reach the screen through 5 sections and 24 lazy chunks |
| [Verification pipeline](verification-pipeline.md) | The nine gates, and what each one **structurally cannot** catch |

## Why this folder exists twice over

There were two UML documents, and they had diverged:

| File | Pointed at by | State when this set was written |
|---|---|---|
| `docs/diagrams/uml.mdx` | `docs/RULES.md`, four rows saying "update in the same PR" | 5 diagrams, one of them drawing a component that does not exist |
| `docs/engineering/uml.md` | `README.md` | 5 diagrams, overlapping subjects, different claims |

Nothing kept them in step, and `docs-guard.yml` could not help: a PR that touches
*either* file counts as documented. So a contributor updated whichever one they
had been pointed to, and the other rotted.

Three concrete errors, each verified against the code rather than inferred:

- `uml.mdx` drew `Shell --> Sidebar`. **There is no `Sidebar` component** — the
  only match in `src/` is an icon of that name. `docs/ARCHITECTURE.md` said
  outright, in the same repo, "there is no rail".
- Its component diagram lumped eleven views into an `Others` node. `App.tsx`'s
  `VIEWS` map has **26**.
- Neither file mentioned `imageStore.ts`, `bujocloud.ts`, `crypto.ts` or
  `conflict.ts` — four of the modules that decide where your data actually goes
  and whether it comes back.

Same shape as the palette written into two files in `CLAUDE.md` (COD-32): the
reader cannot tell which copy is lying, so both become untrustworthy. One home,
and `docs/engineering/uml.md` is now a pointer to it.

## Component library

Every page uses these, so a reader who learns the vocabulary once can read all
four. Adding a new shape is a change to this list first.

### Node shapes

| Shape | Means | Example |
|---|---|---|
| `[Rectangle]` | A module — a file under `src/` that you can open | `store.tsx` |
| `([Stadium])` | A person, or the browser acting for them | `User` |
| `[(Cylinder)]` | A store that survives a reload | `localStorage` |
| `[[Subroutine]]` | A gate: something that can fail a build | `tsc -b` |
| `{Diamond}` | A decision with more than one outcome | `local newer than remote?` |
| `subgraph` | A trust or process boundary — device, network, CI | `This device` |

### Arrows

| Arrow | Means |
|---|---|
| `-->` | Synchronous. The caller waits. |
| `-.->` | **Asynchronous** — debounced, deferred, or fire-and-forget. Consistently, so the async boundary is findable at a glance. |
| `==>` | The default path, the one most journals take |
| `--x` | A path that can drop data, labelled with how |

### Labels carry the number

`localStorage — bujo:data, ~5 MB ceiling`, never `localStorage`. A label without
its constraint is a box, and a box is not worth drawing. Every number in these
pages came from the code; where one is an order of magnitude rather than a
measurement, it says so.

## Keeping them true

`docs/RULES.md` names the diagram to update for each kind of change. That is
necessary and not sufficient — it is the same instruction that failed for
`uml.mdx`. What actually helps:

- **Check a claim before you repeat it.** Every structural claim in this set was
  grepped, not remembered. The `Sidebar` that did not exist had been in a
  diagram, in a repo with a docs-guard workflow, for months.
- **Prefer the number to the adjective.** "Debounced" survives a refactor that
  changes 2500ms to 30s and is then quietly wrong; "2500ms" fails review.
- **A diagram that cannot be wrong is not saying anything.** If you can't name
  what would falsify a box, delete it.

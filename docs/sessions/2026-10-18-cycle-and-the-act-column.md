# 2026-10-18 · Cycle, the control vocabulary, and the act column

One session, four PRs, one merged. Written to be read cold — nothing here
assumes the conversation that produced it.

**Reports, in the order they arrived.** Each is quoted because each named a
real defect, and in three cases the defect was not the one it appeared to name.

1. *"These are looking quite bad… it's looking like a mere pair made by an
   undergrad… make this into a production engineer UI, UX, as well as the
   backend."* — the Cycle month list.
2. *"What is the use of that staying in this low place? If I click on it I need
   to scroll up and again make the changes."* — the calendar's position.
3. *"Could you please modernize this?"* — the optional-fields panel.
4. *"Redesign the vocabulary, the buttons, the sections — everything for the
   cycle, and after the cycle the entire site."*
5. *"A lot of places logging, it's not sticking to the top bar kind of thing —
   make sure we have all places in a similar manner."*
6. *"I think you did not fix the consistency type for the collapsible."*

## The PRs

| # | what | state |
|---|---|---|
| [#436](https://github.com/SathishKumarAI/bujo/pull/436) | the month is a calendar beside the log, and three measured defects under it | **merged** |
| [#437](https://github.com/SathishKumarAI/bujo/pull/437) | four controls, the slow path in a window, the key in the manual | open |
| [#438](https://github.com/SathishKumarAI/bujo/pull/438) | three logging columns that never collapsed on a phone, + one `ActHide` | open |

Comps, reviewed before any code was written:
[the controls](https://claude.ai/code/artifact/842ffd23-b740-49fd-9835-5df3b3631eb8) ·
[the system](https://claude.ai/code/artifact/d06fa879-3c1a-452c-849b-8aff641d74eb).
The plan they produced is `docs/DESIGN-SYSTEM.md`.

## What was actually wrong, with the numbers

### The invisible one — the detection engine read the log in edit order

`detectOvulation`'s docstring asked for entries "in date order" and trusted
it. `analyseCycles` sorted before slicing; `views/Cycle.tsx`'s `alignedCycles`
did not — and **`setCycle` appends**, so correcting a day you logged earlier,
after logging a later one, leaves `data.cycle` permanently in the order days
were *edited*. That is not an edge case; it is what editing a past entry does.

Out of order, two things break and only one is visible: `entries[0].date`
stops being day 1, so every cycle day is measured from the wrong origin; and
the 6-before/3-after window scans temperatures in insertion order, finding a
shift in a sequence nobody lived through. Measured on a clean cycle with one
day moved to the back: ovulation **Sep 6 → Sep 7**, with `day` still reading 6
— because a cycle-day number is measured from the bad origin and so cannot
report it. It fed `alignedCycles` → `patternGrid`, i.e. the whole Patterns
group.

Three guards, each where all callers route through: `detectOvulation` sorts
its own input (journals already on disk are already out of order, so fixing
the call site would not reach them); `setCycle` keeps the log ordered;
`avgCycleLength` ignores period starts after today, which `cycleDay` and
`nextPeriodEstimate` beside it already did.

### The month list drew thirteen days that had not happened

31 rows, of which **13 were future days carrying an invented cycle day** —
`19 d21` through `31 d33`, counted forward past the point the same page
estimates the next period. 42% of the list was a prediction drawn as a record,
on a page whose docstring says nothing here predicts — and each row was
pressable, which is how a `period` flag reached a future day and joined the
average above.

Replaced with `CycleMonth`, a calendar. A list has no weeks in it, so it
cannot show that the bleed ran Monday to Friday.

### Everything else, as arithmetic

| | before | after |
|---|---|---|
| the month, in the act column | 549px | **236px** |
| act card at rest | 667px | **628px** |
| act card with both folds open | **2,187px** | **628px** |
| overflow past the 868px sticky cap | 1,319px | **0** |
| the whole day, in the window at 1024 | — | **896px** |
| Cycle phone, `space` open | 5.3 screens | **3.0** |
| untoned chip border vs card, 5 themes | **1.02–1.64** | **2.51–3.20** |
| Pull-ups act column at 390 | **1,117px** | **41px** |
| Home workout at 390 | **752px** | **41px** |
| Challenges at 390 | **642px** | **41px** |
| controls offered on Cycle before you touch anything | 53 | 7 |
| controls **reachable** | 53 | **53** |

## Findings nobody reported

- **Three Tailwind v4 classes emitted no CSS at all.** `@container/more` (so a
  two-column grid queried a container that did not exist and matched at *no*
  width), `@3xl:max-w-5xl` on a dialog (it shipped 512px wide reporting
  success), and `w-[6ch]` (two separate widenings of a field changed not one
  pixel). Exit 0, no warning, every time. **The tell is always the same: a
  tweak to a number has no effect.** The check is
  `grep '<the class>' dist/assets/*.css`.
- **`REST_TONE.brand` was dead code.** The className hardcoded the same string
  beside the map, so the table looked like the single source and was not —
  editing it changed the emitted CSS and not one pixel.
- **`dayFields.ts`'s `help` keys were dead.** Five fields carry one,
  `cycleHelp.ts` has an entry with a `more:` target for each, and `InfoTip`
  rendered on exactly four facts in zone 1 and nowhere else. The ⓘ that was
  *asked for* already existed as data with no renderer.
- **`a ?? b ? c : d` parses as `(a ?? b) ? c : d`**, which made every toned
  rail paint mauve. A precedence bug that produces a *plausible* colour, so no
  type and no gate can see it.
- **`FlagLegend` had no caller** once the key moved, and nothing would have
  failed. An export nobody imports is not an error.
- **`intimacy` is write-only** — every other optional day field has an
  aggregator; that one has a single reader. COD-360.
- **Five vocabularies for one gesture.** Nine pages have an act column and shut
  it five different ways — see `ActHide`'s docstring for the table.

## Traps paid for again

- **The quietest type step is not free.** Endpoint labels went to `fg-3` and
  measured **3.78 (neon) · 3.81 (vscode) · 3.88 (mocha) · 4.49 (latte)** at
  10px; `a11y` returned six serious violations. `fg-3` is for chrome.
- **A gate can name the wrong dimension.** `clipped` reported *"37px shown of
  39px (5 chars)"* on a five-character field — `findOverflowingFields`
  measures **scrollHeight**. Three guesses were spent widening something that
  was too short; `leading-none` fixed it. Read a gate's predicate before
  believing its noun.
- **A stale preview worker makes a fixed gate keep failing.** `clipped` kept
  reporting a defect my own probe could not reproduce; a fresh `vite preview`
  on a new port settled it. Compare `assets/index-*.js` against
  `dist/index.html` in *both* directions.
- **`git checkout <file>` wipes uncommitted work**, third session running.
  Copy the file first; `git checkout` is not an undo.
- **A probe must live in the repo root**, not the scratchpad — ESM resolves
  `playwright` relative to the script.

## Decisions made without an answer

The instruction was to finish in one go, so these were taken rather than
asked. All three are cheap to reverse and are recorded in
`docs/DESIGN-SYSTEM.md`:

1. The phase ring leaves the orient zone for a band; the donut moves into
   `This cycle`. **Not yet built** — see below.
2. Tokens are 8px rectangles app-wide, not pills.
3. Primitives ship with Cycle in one branch; every other page inherits.

## What is left, in order

1. **Cycle's zone 1 is still five bands** — a banner, a month stepper, a
   four-up fact row, a three-up stat strip and a privacy line, none of them the
   page's answer. The comp's §04 rebuilds it as one card with `20` at the
   `answer` step. This is the largest remaining piece and the one with most in
   it.
2. **`ChartCard` has no `footer` slot**, so every chart's key and sample size
   sit loose in its body — which is what let a band chart's right column run
   off the panel edge.
3. **COD-364** — `--ctl-ring` still leaves every input and select at
   **1.37–1.72** against the card, and `ChipPick`'s rail border with it. Left
   because that token is also the hairline inside `--shadow-raise`.
4. **COD-360** — `intimacy` is write-only.
5. **The rest of the app** inherits the primitives already; what remains per
   page is whatever was hand-rolled instead of using them, and the browser
   gates are what find those.

## How anything here was verified

Nothing in this document was inferred from source. Every number came from a
throwaway Playwright probe against a real build on a preview server whose
bundle hash was checked against `dist/index.html` first, or from a gate:

```
npx vite build
npx vite preview --port 4310 --strictPort &
BUJO_URL=http://localhost:4310 node scripts/a11y-axe.mjs
```

`verify` · `design` · `contrast` · `a11y` · `a11y:panels` · `clipped` ·
`smoke` · `space` were run on every branch. `playwright` and
`@axe-core/playwright` are installed on this machine but still not in
`package.json` (COD-273).

Two test suites were armed on a canary before being trusted — reverting the
fix had to make them fail — because a scan that silently matches nothing
passes.

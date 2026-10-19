# The design system, and the plan to land it

**Status:** in progress on `feat/cycle-design-system`.
**Comps:** [the controls](https://claude.ai/code/artifact/842ffd23-b740-49fd-9835-5df3b3631eb8) ·
[the system](https://claude.ai/code/artifact/d06fa879-3c1a-452c-849b-8aff641d74eb)

Reported three times in one session, each time more specifically: *"these are
looking quite bad"*, *"could you please modernize this"*, *"redesign the
vocabulary, the buttons, the sections — everything for the cycle, and after
the cycle the entire site"*.

## The read

Cycle does not look bad because its colours are wrong. It looks bad for
reasons that are each a **system** fault — they recur because nothing says
which shape to use. Read off the shipped page at 1440×900 on `?demo=1`:

| Fault | What is on screen |
|---|---|
| Five bands before any content | The orient zone stacks a banner, a month stepper, a four-up fact row, a three-up stat strip and a privacy line — none of them the page's answer |
| The same count three times | `Patterns 2` in the rail, a bare `2` right of the section heading, then the panel |
| Cards with no card | Panels are a hairline and whitespace apart, so a chart, its caption and the next title read as one column of text |
| A stat whose value is two words | `seen · 97.41°` under the label "Temp shift" — two facts in one figure slot |
| Two grammars for one fact | "Symptom pattern" is a grid of coloured squares; "What lands on which day" is a band chart. Same question, same panel |
| Clipped text at the right edge | The band chart's right column runs `day 28 · 1d before your period` off the panel — a chart with no frame to clip against |
| No type scale in use | Nearly everything renders at 13–15px, so weight and colour do all the work |

## What already exists — the plan is smaller than the comp

The comp proposes a system. Most of it **is already in the repo**, which is
the single most important fact for scoping this, and the reason this is a
handful of primitive edits rather than a rewrite.

| The comp calls for | In the repo | Gap |
|---|---|---|
| Seven type steps | `styles/tokens.css` — `answer`→`micro` | None. The `answer` step is simply **unused on Cycle** |
| Colour roles | `ink-0..3`, `fg-1..3`, `line`, `line-strong`, 14 accents | `edge` is not a token — the control boundary is spelled three ways (COD-364) |
| Four buttons | `ui/button.tsx` — primary / secondary / ghost / danger | **None** |
| A stat with figure, unit, note | `ui/Stat.tsx` — and it is richer (track, sparkline, ramp, `null` ≠ 0) | **None.** Use it |
| A card | `ui.tsx` `Card` | **None** |
| A chart frame | `ui.tsx` `ChartCard` — title, subtitle, right, enlarge, labelled plot | **No footer slot**, so every chart's key and sample size are loose in its body |
| A nav rail | `page/SectionRail.tsx` | No horizontal underline variant; the count is drawn twice |
| Token (chip) | `ui/quickpick.tsx` `ChipPick` | Pill, and selected is a 15% wash |
| Rail (ordered scale) | `ChipPick` `scale` — a boxed segmented track | Not a rail, and **not available to the named ordered fields** (mucus, LH, flow) |
| Switch | — | New |
| Field without a box | `ui.tsx` `Input` / `Textarea` | Boxed, and at a 1.37–1.72 boundary |

So: **four primitive edits, two container edits, one new primitive, one page.**

## The calls I made

These were put to the reader and not answered; the instruction was to finish
in one go, so they are decided here and are cheap to reverse.

1. **The phase ring moves.** The orient zone gets a 7px phase band sized by the
   personal average; the donut moves into `This cycle`, where looking at it is
   the point. A donut spends ~260px of height to say "you are 69% through".
2. **Tokens are 8px rectangles, app-wide.** It is what buys the row back on
   dense groups — eight symptoms go from four rows to three in a 280px column —
   and a pill everywhere is the look that was reported as dated.
3. **Primitives and Cycle in one branch.** Cycle is the proof; every other page
   inherits the primitives without being touched, and what it inherits is
   checked by the gates rather than by a rewrite.

## The plan

Each step is a commit, each is verifiable on its own, and the gates run on the
whole app because every step but the last is a shared primitive.

### 1 · Foundations

- **`--color-edge`** — one token for a control's boundary, set to the value
  measured into `ChipPick` last week (`fg-3` at 60%, **2.51–3.20** against the
  card across five themes, against the toned chips' 2.61–3.11).
- Adopt it in `ChipPick`, `Input`, `Textarea` and the `border-ctl-ring` call
  sites. Closes COD-364's first half. **`--ctl-ring` itself is not touched** —
  it is also the hairline inside `--shadow-raise`, so it keeps the raised
  surfaces and `edge` takes the controls.

### 2 · Controls

- **Token** — `ChipPick`'s chip: `rounded-pill` → `rounded-control`, and
  selected becomes a **solid fill** in its tone with `onAccent()` text instead
  of a 15% wash. The wash is the thing that cannot be read on a phone in the
  dark, and it is the reason seven of ten light-theme readings sat under 4.5
  before the text was moved to `fg-1`.
- **Rail** — `ChipPick`'s `scale` mode: the boxed segmented track becomes a
  notched rail with the choice sitting on it, and **nothing chosen draws an
  empty rail**, which is how "not answered" stays visibly different from
  "answered 1".
- **Rail, for named scales** — `mucus`, `lh` and `flow` are ordered
  (dry→egg-white, not-taken→peak, light→very-heavy) and render as five
  identical pills today, which hides that the mucus progression *is* the
  fertile ramp. They move to `scale` with their own words.
- **Switch** — one new primitive for `tempDisturbed`, the only binary on the
  page and currently a bare checkbox under eleven chip groups.
- **Field** — `Input`/`Textarea` lose the box and keep a rule underneath, which
  goes `accent` on focus.

### 3 · Containers

- **`ChartCard` gains a `footer`** — where the key and the sample size go, so
  they cannot drift from the chart or run off its edge.
- **`SectionRail` counts once** — the rail row keeps its count in mono at
  `fg-3`; the duplicate beside the section heading goes.

### 4 · Cycle

- **Zone 1 is one card.** `20` at the `answer` step, the phase named and drawn
  as a band, three `Stat`s, and the month stepper in the card footer where it
  is chrome rather than a fifth band.
- **Zone 2 is the morning card.** Date and cycle day, the temperature as the
  measurement it is, five flags, drive, and one button that names what is
  already recorded and opens the day.
- **`DayMore` moves into `DayWindow`**, which goes three columns at width. The
  act column stops being a 2,187px form in an 868px sticky panel.
- **The legend moves to the manual**, whole, and every group keeps an ⓘ that
  opens it there. `InfoTip` has carried an `onMore` and eighteen targets since
  it was written with **no caller ever passing one**; moving the content is
  what gives those targets a reason to be reached.

### 5 · The rest of the app

Not in this branch. After step 1–3 every page inherits the primitives; what
remains per page is whatever was hand-rolled instead of using them, and the
browser gates are what find those.

## How it is verified

Every step but the last touches a shared primitive, so the whole app is the
blast radius and the whole app is what gets checked:

`npm run verify` · `npm run design` · `npm run contrast` · `npm run a11y` ·
`npm run a11y:panels` · `npm run clipped` · `npm run smoke` ·
`npm run space -- cycle`

Plus a throwaway probe per visual claim, because none of those gates can see a
colour that is technically legal and illegible — the chip boundary was 1.02:1
for the life of the component with every gate green.

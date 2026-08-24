# 14 · Dashboard UI patterns — inspiration reference

**Source:** ShadcnStore admin dashboard screenshot.
**Status:** reference only. **Not a build prompt.** Nothing here is content —
every pattern below needs re-skinning onto bujo's existing tokens before it goes
near an implementation.

Companion to `LAYOUT-WEIGHT-ALIGNMENT.md` (how much room a component gets and
which side it sits on) and `13-page-contract-rollout.md` (the three-zone
contract). Where this file and those two disagree, they win — they are rules,
this is evidence.

## 1. Shell

Fixed sidebar, grouped nav under small-caps section labels, active item = subtle
fill (not accent colour), account block pinned to bottom. Top bar: collapse
toggle, search input with a ⌘K hint, secondary links right-aligned, theme toggle.

→ bujo's 5-section sidebar already does this. **No change** — this confirms the
pattern rather than adding one.

## 2. KPI stat card anatomy (top row, 4-up)

Per card: label (top-left, muted) + trend delta pill (top-right, coloured icon +
%) → big bold number → bolded one-line insight with trend arrow → muted factual
caption below. The number is always the loudest element on the card, not the
label — this inverts normal reading order (glance at the number, read the label
for context).

→ Maps to a stat strip atop Insights (streak count, entries this week, avg
mood/energy) or Today's daily summary. See §2 of "What NOT to carry over" for
the limits.

## 3. Chart card header pattern

Every panel repeats one header shape: Title (bold) + subtitle (muted) left,
filter dropdown + export/action button right. Identical placement on every card
is what makes the page read as one system rather than a pile of widgets.

→ Maps to any bujo panel with a time-range filter — fitness progress, nutrition
trends.

## 4. Donut + linked legend

Centre of the donut shows the aggregate as one big number. The legend is a
row-list (dot + label + value + %), not a caption — and one row is visually
selected/pilled, tied to the dropdown above it. Picking a segment and picking
the dropdown are the same state.

→ Maps to nutrition macro breakdown, or time-allocation-by-category.

## 5. List/row anatomy

- **Variant A:** avatar/icon-circle, primary+secondary text stacked left; status
  pill + value + timestamp right; overflow menu on hover.
- **Variant B (ranked):** rank number, rating, secondary metric, price, trend
  badge, thin progress bar — all in one row without wrapping.

→ Maps to recent journal entries, habit log, book list in the reading cluster.

## 6. Segmented tabs + side-metrics split

Pill-style segmented control switches chart context. Below it: ~65% chart / ~35%
stacked "Key Metrics" mini-cards (icon+label, big number, coloured delta
caption).

→ A candidate layout for one Insights tab, given the cluster structure planned.

## 7. Colour discipline (validates a rule already in place)

Page chrome is monochrome — near-black background, one-step-lighter card
surface, white/grey text only. Colour appears **only** on data: status pills
(green/red/amber) and a fixed categorical palette for multi-series charts.
Primary buttons stay white/light, never accent-coloured.

Measured from the same template in `13-page-contract-rollout.md`: `--background`
`oklch(0.145 0 0)`, `--card` `oklch(0.205 0 0)`, `--primary` `oklch(0.922 0 0)`
— **chroma zero on every neutral.**

→ Same accent-inflation principle behind the tonal button decision. This is
evidence the approach holds at scale, not a reason to reconsider it.

## 8. Micro-copy pairing

Every number pairs with two lines: a short qualitative read first ("Strong
retention"), then a quieter factual caption ("Engagement exceeds targets").
Narrative sits above raw fact, not the reverse.

## 9. Card chrome consistency

1px border, ~12–16px radius, identical header treatment on every panel. The
repetition — not any single card — is what reads as premium.

## 10. Grid and space discipline

**This is the transferable section.** The part that reads as "no wasted space":

- Column widths are **content-weighted, not uniform**. The chart+legend row is
  not 50/50 — the line-chart panel gets ~60% because it needs room for axis
  labels and a 12-month x-axis; the donut gets ~40% because a ring plus a short
  legend needs less. The list row underneath *is* 50/50, because both panels
  hold similarly dense row content. **The ratio is decided per row by what is
  inside the cells**, not fixed in advance.
- Every card in a row shares the same top edge and the same outer gap value —
  **one spacing token reused for every gutter**, horizontal and vertical,
  everywhere on the page. That repetition, more than any measurement, is what
  reads as tight: the eye never recalibrates from row to row.
- Inside a cell, **content stretches to fill the height it is given** instead of
  top-anchoring and leaving air at the bottom. A KPI card's caption sits flush
  with the card's bottom edge; a donut's legend is vertically distributed to
  match the chart beside it.
- **Padding is constant** across every card regardless of content type (stat,
  chart, list). The variable is always what is inside — never the frame.

## What NOT to carry over

| Pattern in the screenshot | Why it does not transfer | What bujo does instead |
|---|---|---|
| **4-up KPI row as the page opener** | An admin dashboard's user glances and leaves. bujo's user came to *do* something — log, write, rate. A stat wall pushes the act zone below the fold and makes every screen open the same way | One orient bar, at most 3–4 facts, then straight into act. Weight-1 is the entry surface, not the summary |
| **Trend delta pills on everything** | A % delta needs a stable denominator. Personal habit data is sparse and self-reported — "−40% this week" off a base of 5 is noise rendered as judgement, and a red pill on a mood chart is a bad thing to hand someone | Absolute counts and streaks. Colour only where direction is unambiguous (streak alive/broken), never on mood or energy |
| **"Strong retention" narrative micro-copy** (§8) | Generated praise or blame about your own life. An analytics tool can assert what a number means; a journal cannot without inventing motivation | The number and its factual caption. The user does the reading |
| **Export/action button in every card header** (§3) | The screenshot repeats it because a dashboard is a reporting tool. Here it puts an accent-weight control on every panel — the same accent inflation the tonal-button decision rejected | Header actions only where an action exists. Export lives once, in Settings → Data |
| **Filter dropdown in every card header** | Per-card time ranges mean two panels on one page can silently show different periods | One range control per page or zone, shared |
| **Ranked-row variant B** (§5) | Six fields in one unwrapped row assumes desktop-width table. bujo is phone-first with a `BottomNav`; that row wraps into mush | Two-line row: identity left, one state value right — `LAYOUT-WEIGHT-ALIGNMENT.md` rule 2 |
| **Search with ⌘K in the top bar** | Not a shell pattern to copy — a feature. Chrome for a search that does not exist is scaffolding for later | Skip until there is something to search |
| **Near-black chrome as *the look*** | §7's *discipline* transfers; its *palette* does not. bujo ships five themes including light (`light-theme.md`), so "monochrome chrome, colour only on data" must hold in both directions via tokens — not by adopting the screenshot's values | Same rule, expressed in existing tokens |
| **Donut charts** (§4) | The aggregate-in-the-centre trick is fine; donuts under ~5 categories read proportion worse than a stacked bar. Take the linked-legend idea, not the ring | Legend-as-rowlist attached to whatever chart the data wants |

**The single transferable idea is §10** — content-weighted columns, one shared
gap token, cells filling their allotted height, constant padding. That is an
audit rule and it is compatible with the weight/alignment rules already written
down. Everything above it is a reporting product's shape, and bujo is not one.

## How to use this

Not as "rebuild the layout". As a judgment reference for a narrow pass:

> Audit `<view>`'s existing panel grid against §10 (content-weighted column
> ratios, shared gap token, cells filling their full allotted height, constant
> padding). Flag only the 2–3 cells where this is visibly off — an even split
> where content weight differs, dead space at the bottom of a card, misaligned
> top edges. Propose small targeted fixes for those cells only. No new
> components, no full redesign.

That keeps it a Stage 0 judgment pass rather than a rebuild.

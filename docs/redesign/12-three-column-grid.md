# 12 · The three-column card grid

**Branch:** `feat/today-capture-first` · **Date:** 2026-08-02

Most views were a single vertical stack of cards. That is why the tall ones got
so tall: Pickleball reached **4.2 screens over twelve blocks**, of which only two
needed the full width. A card holding four stat tiles does not need 1,344px.

Content now flows into a three-column grid.

## The primitive

`src/components/shell/CardGrid.tsx`

```tsx
<CardGrid>
  <Card title="Sessions">…</Card>
  <Card title="History" className={SPAN_2}>…</Card>    {/* a table */}
  <Card title="Heatmap" className={SPAN_ALL}>…</Card>  {/* full bleed */}
</CardGrid>
```

| Width | Columns | Why |
|---|---|---|
| < 768px | 1 | Phone. A card per row |
| 768–1535px | 2 | At `wide` (1,180px) three columns would be ~380px each — under what a chart axis needs |
| ≥ 1536px | 3 | Container is 1,344px here, so each column is ~435px |

Two escape hatches, because the grid should not try to guess which cards need
room:

- **`SPAN_2`** — tables, wide charts, anything with an x-axis.
- **`SPAN_ALL`** — heatmaps, calendars, the widest tables.

`items-start`, not stretch: a short card beside a tall one stays short rather
than growing a pocket of empty space to match its neighbour.

## The container had to grow with it

The `wide` tier was capped at 1,180px, which makes three columns 380px — narrower
than the grid's own rule allows. Past 1536px it now grows to **1,344px**, the
same step the `aside` variant already took, so three columns land at ~435px.

`read` (820px) deliberately does **not** grow. A longer measure does not help
prose, and the journal, Plan and Reading all live there.

## Applied so far

| Page | Before | After | What changed |
|---|---|---|---|
| Pickleball | 4.2 screens | **2.6** | Twelve stacked blocks → three across; "At a glance" spans 2; the six charts inside *Form & momentum* became two rows of three |
| Mindset | 2.4 screens | **2.0** | The 1,575px principle wall became seven category cards, three across |
| Insights | 1.5 screens | **1.4** | The two existing two-column groups take a third column at 2xl |
| Fitness | 1.7 screens | **1.1** | Not the grid — see below |
| Today | 3.5 screens | **2.1** | Not the grid — the rail, in doc 11 |

Sweep of all 18 views afterwards: **0 pages overflow horizontally**, and no page
grew.

### Mindset is the clearest case for it

The library was one 1,575px card: every principle in the app, uninterrupted, no
collapse, and no way to reach a category except scrolling past the ones before
it. Each theme is its own card now — which also turns seven uppercase captions
into seven real headings, and puts all seven on screen at once.

## Not the grid, but found while doing it

**Fitness had a nesting bug.** `FitnessHub` wrapped both tabs in
`mx-auto max-w-read`, but each child renders its own `<Page>` — Cardio a single
820px column, Strength a `wide` grid with a rail. So Strength's grid was capped
at 820px and, once the rail widened to 26rem, the content column was left with
**384px against a 416px rail**. The rail was wider than the thing it supported.
The wrapper now follows the active tab: 384 → **908px**.

## Still to do

- **Recovery** (2.1 screens) is a single 2,059px card. The grid cannot help until
  it is split into sections — see `docs/pages/recovery.md`.
- **Stats** (1.1) and the rest of **Insights**: the remaining stacked groups
  inside collapsed sections have not been converted.
- The audit's other Pickleball finding still stands: ~1,000px of static
  reference (physio notes, format playbook) is expanded while the four analytics
  groups built from the user's own data stay collapsed.

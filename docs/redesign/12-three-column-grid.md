# 12 · The three-column card grid

**Branch:** `feat/today-capture-first` · **Date:** 2026-08-02

> **Correction, 2026-08-24 — `SPAN_ALL` no longer exists.** It is described below
> as one of two escape hatches and it never earned that billing: it had exactly
> one call site (the Stats activity heatmap), and below 1536px it expanded to the
> same classes as `SPAN_2`, because the grid only has two columns there. So at
> the 1,180px tier every converted page actually renders at, the "full bleed"
> hatch and the "two of three" hatch were the same thing. The one card using it
> spent 432–978px of its width empty (BUJO-280). Deleted; read every `SPAN_ALL`
> below as `SPAN_2`.

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

## Applied

Every page with **five or more stacked sibling cards** was converted. Pages
already at 0.9–1.1 screens were left alone.

| Page | Before | After | What changed |
|---|---|---|---|
| Pickleball | 4.2 screens | **2.6** | Twelve stacked blocks → three across; "At a glance" spans 2; the six charts in *Form & momentum* became two rows of three |
| Mindset | 2.4 | **2.0** | The 1,575px principle wall became seven category cards |
| Pull-ups | 1.5 | **0.9** | Two 620px cards of near-identical weight, side by side |
| Coaching | 1.4 | **0.9** | Eight blocks — six of them identical collapsed drawers — became a hero spanning 2, the "Today" card beside it, and two rows of three. The whole page now fits one screen |
| Focus | 1.5 | **1.2** | Six blocks, two of them collapsed strips |
| Insights | 1.4 | **1.2** | Only the seven drawers grid — see the reversal below |
| Stats | 1.1 | **1.0** | Eight blocks; the activity heatmap takes `SPAN_ALL` |
| Home Workout | 0.9 | 0.9 | No height change, but three empty boxes stacked read as three failures; side by side they read as one starting point |
| Fitness | 1.7 | **1.1** | Not the grid — the nesting bug below |
| Today | 3.5 | **2.1** | Not the grid — the rail, in doc 11 |

Sweep of all 18 views afterwards: **0 pages overflow horizontally, 0 views
without an `<h2>`**, and no page is taller than before.

### Deliberately not converted

- **Trackers** — the 31-column habit grid is the page, and it needs the full
  width. Three columns would squeeze the thing people come here for.
- **Today, Plan** — the journal column is `read` (820px) on purpose; a grid
  would work against the measure.
- **Reading, Goals, Challenges, Collections, Monthly** — already 0.9–1.1
  screens, and Collections and Monthly already grid internally. Nothing to win.
- **Recovery** — one 2,059px card. The grid cannot help until it is split.

### One reversal worth recording

Insights got the page-wide grid first and went **1.4 → 1.7 screens — it got
taller.** Its ritual banner, search and two digests are text-heavy, and at 435px
they wrap far more than they save. Rolled back to grid *only* the seven
collapsed analytics drawers, which is where the filing-cabinet problem actually
was: **1.2 screens**, better than the original.

The lesson generalises: the grid pays off for repeated peer cards and collapsed
drawers, and works against prose.

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
- The audit's other Pickleball finding still stands: ~1,000px of static
  reference (physio notes, format playbook) is expanded while the four analytics
  groups built from the user's own data stay collapsed. The grid made the page
  shorter; it did not fix the priority.
- **Stats still shows zero charts by default** under a subtitle that promises
  "Charts at a glance". The grid tidied the drawers; it did not open them.
- Long card titles truncate in a 435px column ("Knee rehab & prehab · ACL / MC…"
  on Coaching). `Card`'s `h2` has `truncate`; worth allowing two lines.

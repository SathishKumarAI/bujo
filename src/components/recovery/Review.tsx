import { useState } from 'react'
import { Empty, Input } from '../ui'
import { CardDeck, SectionRail } from '../page'
import {
  CARDS, FACETS, FACET_LABEL, GROUPS, GROUP_BLURB, GROUP_LABEL, DEFAULT_GROUP,
  visibleCards, type Facet, type Group,
} from '../../lib/recoveryCards'
import type { ReactNode } from 'react'

/**
 * ZONE 3 · twenty panels behind one bar, and the one row that needed splitting.
 *
 * WHAT THIS FILE OWNS: which group is on screen, the panel filter, the
 * sub-section chips, and how a group's cards are laid out.
 * WHAT IT DOES NOT OWN: any card's contents, and none of the arithmetic — the
 * view builds the `cards` map and hands it over.
 *
 * Lifted out of `views/NoFap.tsx`, which had reached **613 lines** against a
 * 500 ceiling and a ~300 target. The view now derives the numbers, owns the
 * rail state and wires three zones; everything about how zone 3 is arranged
 * lives here, which is the same split `components/nutrition/Review.tsx` and
 * `components/gym/Review.tsx` already have.
 */
/**
 * The sub-section chips, module level.
 *
 * Declared inside the render it would be a NEW component type every render, so
 * React remounts the whole subtree: every chart re-enters and every fold inside
 * it snaps shut. eslint's `no-create-component-during-render` says so before
 * any of that is visible — §16 records the same rule for Pickleball's `Facet`.
 */
function ChipRow({ active, onPick, counts, total }: {
  active: Facet | null
  onPick: (f: Facet | null) => void
  counts: readonly (readonly [Facet, number])[]
  total: number
}) {
  const chip = (on: boolean) =>
    `min-h-11 rounded-pill border px-3 text-label transition-colors ${
      on ? 'border-line-strong bg-ink-3 text-fg-1' : 'border-line bg-ink-2 text-fg-2 hover:border-line-strong hover:text-fg-1'
    }`
  return (
    <>
      <button type="button" onClick={() => onPick(null)} aria-pressed={active == null} className={chip(active == null)}>
        All <span className="num text-fg-2">{total}</span>
      </button>
      {counts.map(([f, n]) => n === 0 ? null : (
        <button key={f} type="button" onClick={() => onPick(active === f ? null : f)} aria-pressed={active === f} className={chip(active === f)}>
          {FACET_LABEL[f]} <span className="num text-fg-2">{n}</span>
        </button>
      ))}
    </>
  )
}


export function RecoveryReview({ group, onGroup, q, onQ, cards, signature }: {
  group: Group
  onGroup: (g: Group) => void
  /** The panel filter's text. Lives in the view because zone 1 clears it. */
  q: string
  onQ: (q: string) => void
  /** Card id → element. Built by the view, which owns the derived data. */
  cards: Record<string, ReactNode>
  /** The summary + signature chart that sit ABOVE the bar, whichever row is on. */
  signature?: ReactNode
}) {
  /*
    SUB-SECTIONS FOR THE ONE GROUP THAT NEEDS THEM (§16).

    Not sticky, and not in the URL. A sub-section is a narrowing you do while
    reading; persist it and somebody opens the page a week later with six cards
    missing and no memory of hiding them. The rail row IS a place you return
    to, which is why that one is sticky and this is not.
  */
  const [facet, setFacet] = useState<Facet | null>(null)
  const filtering = q.trim().length > 0
  const visible = visibleCards(filtering ? null : group, q)
  const show = (id: string) => visible.has(id)
  /** Panels a group would show under the current query — the rail's counts. */
  const countOf = (g: Group) => CARDS.filter((c) => c.group === g && visibleCards(g, q).has(c.id) && cards[c.id]).length

  return (<>
    {signature}
        {/* ZONE 3 · the four groups the registry names, in its order, one heading
            each — replacing three `CollapsibleSection`s that all shipped shut
            ("Setup", "Deep analytics", "Reference") plus a fourth unfolded
            "Insights & progress" section. Four peers, each answering a different
            question about the same streak, is a table of contents; the folds
            were what was left over, and a chart behind a closed fold is a chart
            that does not exist.

            No "All" row: the four groups do not overlap, and "all of them" is
            the page this replaces. The filter below is how you cross them. */}
        {/* Two divs, and the split is load-bearing: an element cannot query
            itself, so `@container/page` and `@4xl/page:grid-cols-…` on one div
            means the grid never fires. Phone column spelled out, or the chip
            row's min-content sizes the only implicit track and the page scrolls
            sideways. Both in docs/PAGE-SHAPE.md. */}
        <div className="@container/page">
        {/* ONE COLUMN, so the rail is a horizontal bar at every width.

            Reported as "when I'm shrinking the log, the Win or loss /
            Progress / Patterns are moving to the sidebar — can you make them
            horizontal only?" — and that is exactly what happened: hiding the
            act widens this column past the `@4xl/page` step, the grid handed
            the rail an 11rem track and `SectionRail` filled it vertically. So
            the page rearranged itself as a side effect of putting the log
            away, which is a layout changing for a reason the reader did not
            ask about.

            `railAt="never"` plus a single-column grid is the one-bar-per-
            review-zone shape (§2) the other four pages on this contract
            already use. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-y-3">
          <SectionRail
            railAt="never"
            label="Recovery groups"
            groups={GROUPS.map((g) => ({ id: g, label: GROUP_LABEL[g], count: countOf(g) }))}
            value={filtering ? null : group}
            onChange={(g) => { onGroup((g as Group | null) ?? DEFAULT_GROUP); onQ(''); setFacet(null) }}
            filtering={filtering}
            onClear={() => onQ('')}
          />
          <div className="min-w-0">
            {/* The panel filter. Twenty panels over four groups, and the query
                someone types is the measure ("money", "hour", "HALT") rather
                than the heading — which is what `words` in the registry is for.
                `min-h-11` because COD-96 counts the controls under 44px on a
                phone and this is not going to be the twenty-fifth. */}
            <Input
              type="search"
              value={q}
              onChange={(e) => onQ(e.target.value)}
              placeholder="Filter these panels — “money”, “hour”, “HALT”…"
              aria-label="Filter the Recovery panels"
              className="mb-3 min-h-11"
            />
            {visible.size === 0 ? (
              <Empty>Nothing matches “{q}” on this page. Clear the filter, or pick a different group in the rail.</Empty>
            ) : (
              GROUPS.map((g) => {
                const ids = CARDS.filter((c) => c.group === g && show(c.id) && cards[c.id])
                if (ids.length === 0) return null
                return (
                  /* `data-domain`, not `data-group` — the same DOM hook Insights
                     uses, so one probe can read both pages. The registry's noun
                     is `group`; this is the shared attribute. */
                  <section key={g} data-domain={g} className="mb-6 last:mb-0">
                    <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
                      <h2 className="text-heading font-medium text-fg-1">{GROUP_LABEL[g]}</h2>
                      <p className="text-label text-fg-2">{GROUP_BLURB[g]}</p>
                      <span className="num ml-auto text-label text-fg-3">{ids.length}</span>
                    </div>
                    {/* Two columns is the ceiling here, and it is a correction
                        rather than a preference — the same one #288 made on
                        Cycle. `CardGrid` asks the *viewport*, so at 1600 its
                        `2xl:grid-cols-3` fires inside this 722px split column
                        and resolves to three tracks of **227px**: literally the
                        "cards a third of the size" half of the report this pass
                        answers. Two tracks of 350 is what 1440 already gives.
                        `MasonryGrid` is not the alternative — it breaks on its
                        *container* at 768px, so at 722 it silently draws one
                        column. `min-w-0` per cell so a wide chart cannot drag
                        the shared track. */}
                    {/* The chips, for the one group big enough to need them.
                        Counts come from the same `ids` the cards do, so a chip
                        can never offer a card that is not there — and a facet
                        whose cards are all filtered out disappears rather than
                        selecting nothing. */}
                    {g === 'patterns' && ids.length > 4 && (
                      <div className="mb-3 flex flex-wrap items-center gap-1.5">
                        <ChipRow
                          active={facet}
                          onPick={setFacet}
                          counts={FACETS.map((f) => [f, ids.filter((c) => c.facet === f).length] as const)}
                          total={ids.length}
                        />
                      </div>
                    )}
                    {/*
                      ONE DECK, NOT ONE PER CATEGORY.

                      The first attempt rendered a deck per category at `All`,
                      which is three decks stacked — and measured **4,583px**,
                      taller than the nine-card grid it replaced. "I'll just
                      show one card, and if they are interested they will go to
                      another" means ONE track: the categories narrow what is
                      IN it, and the deck shows one card of whatever is left.
                    */}
                    <CardDeck
                      label={`${GROUP_LABEL[g]} cards`}
                      items={ids
                        .filter((c) => g !== 'patterns' || facet == null || c.facet === facet)
                        .map((c) => ({ key: c.id, title: c.title, node: <div data-card={c.id} className="min-w-0">{cards[c.id]}</div> }))}
                    />
                  </section>
                )
              })
            )}
          </div>
        </div>
        </div>
  </>)
}

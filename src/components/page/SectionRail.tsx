import { Icon } from '@/components/Icon'
import { X } from '@/components/icons'

/**
 * SECTION RAIL · pick a subject instead of scrolling past five of them.
 *
 * Past about four peer groups, headings stop being enough. Insights with six
 * headings was still **6.3 screens at 1600px and 13.5 on a phone**, and
 * scroll was the only way to reach anything. Turning the group names into
 * navigation took it to **1.8 and 3.1** — the same twenty-four cards, reached
 * in a click.
 *
 * It also spends the gutter. Ten pages in this app sit at 1180px on a 1600px
 * screen; a rail is 176px of that doing work.
 *
 * Generic over `{ id, label, count }` because it now serves more than one
 * page, and because the alternative — a second rail written for the next one
 * — is how the two come to disagree about what a selected row looks like.
 *
 * Rules it is holding up, all measured on Insights first:
 *
 * - **"All" is first and is not the default.** The caller passes the group it
 *   opens on. Landing on everything is landing on the page this replaces. All
 *   stays because a search has to cross groups, and because someone who wants
 *   the wall should be able to have it.
 * - **Counts are live against whatever the caller is filtering by.** A group
 *   showing 0 is disabled rather than hidden: a rail whose rows move as you
 *   type is a rail you cannot aim at.
 * - **Sticky under the measured header.** `--header-h` is published by
 *   `useHeaderHeight` from a ResizeObserver, because the header grows by the
 *   notch on a phone and wraps at narrow widths. A constant is wrong by
 *   exactly the notch, on the devices where a mis-parked element is hardest
 *   to recover from.
 * - **Below `@4xl` it is a horizontal chip row**, because the page has no
 *   side to put it on. Same component, same state, same counts — a second
 *   implementation for phones is how the two come to disagree.
 *
 * Two mechanical traps, both of which this repo already documents and both of
 * which the first call site hit anyway. The caller must put `@container/page`
 * on an **outer** div and the grid on an inner one (an element cannot query
 * itself), and must spell out `grid-cols-[minmax(0,1fr)]` for the phone (an
 * implicit `auto` track sizes to the rail's min-content and scrolls the page
 * sideways). See `docs/PAGE-SHAPE.md`.
 */
export interface RailRow {
  id: string
  label: string
  /**
   * Shown beside the label; `0` disables the row.
   *
   * Optional, because a count is only informative when the groups hold
   * comparable things. Insights' domains hold cards and "Habits 5" tells you
   * what is down there; Coaching's chapters hold prose, and "Mental game 1"
   * would be a number about nothing.
   */
  count?: number
}

export function SectionRail({ label, groups, value, onChange, allLabel = 'All', allCount, filtering, onClear }: {
  /** Names the nav for a screen reader — "Insight domains", "Manual chapters". */
  label: string
  groups: RailRow[]
  /** `null` is All. */
  value: string | null
  onChange: (id: string | null) => void
  allLabel?: string
  /** Omit to hide the All row — a page whose groups do not overlap has no use for it. */
  allCount?: number
  filtering?: boolean
  onClear?: () => void
}) {
  const rows: { key: string; label: string; count?: number; value: string | null }[] = [
    ...(allCount == null ? [] : [{ key: 'all', label: allLabel, count: allCount, value: null }]),
    ...groups.map((g) => ({ key: g.id, label: g.label, count: g.count, value: g.id as string | null })),
  ]

  return (
    <nav
      aria-label={label}
      className="
        sticky top-[calc(var(--header-h,4rem)+0.75rem)] self-start
        -mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-2
        @4xl/page:mx-0 @4xl/page:flex-col @4xl/page:gap-0.5 @4xl/page:overflow-visible @4xl/page:px-0 @4xl/page:pb-0
      "
    >
      {rows.map((r) => {
        const on = value === r.value
        // Zero only happens under a search. Disabled, not hidden: a rail
        // whose rows move as you type is a rail you cannot aim at.
        const empty = r.count === 0
        return (
          <button
            key={r.key}
            onClick={() => onChange(r.value)}
            disabled={empty}
            aria-current={on ? 'true' : undefined}
            /* Explicit, because the two spans render as "All24" — the count
               sits flush against the label with no text node between them,
               so a screen reader reads one token and a number becomes part
               of the name. */
            aria-label={r.count == null ? r.label : `${r.label} — ${r.count} ${r.count === 1 ? 'panel' : 'panels'}`}
            className={`
              shrink-0 snap-start whitespace-nowrap rounded-pill px-2.5 py-1 text-label transition-colors
              @4xl/page:flex @4xl/page:w-full @4xl/page:items-baseline @4xl/page:justify-between
              @4xl/page:gap-3 @4xl/page:rounded-control @4xl/page:px-2.5 @4xl/page:py-1.5
              ${on
                ? 'bg-brand-wash font-medium text-brand-text'
                : empty
                  ? 'text-fg-3'
                  : 'text-fg-2 hover:bg-ink-2 hover:text-fg-1'}
            `}
          >
            <span>{r.label}</span>
            {r.count != null && <span className="num ml-1.5 opacity-70 @4xl/page:ml-0">{r.count}</span>}
          </button>
        )
      })}

      {filtering && (
        <button
          onClick={onClear}
          className="
            inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-1
            text-label text-fg-2 hover:text-fg-1
            @4xl/page:mt-2 @4xl/page:w-full @4xl/page:justify-start @4xl/page:border-t
            @4xl/page:border-line @4xl/page:pt-2.5
          "
        >
          <Icon as={X} size="sm" /> Clear filters
        </button>
      )}
    </nav>
  )
}

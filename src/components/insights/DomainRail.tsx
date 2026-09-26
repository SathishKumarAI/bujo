import { Icon } from '@/components/Icon'
import { X } from '@/components/icons'
import { DOMAINS, DOMAIN_LABEL, type Domain } from '../../lib/insightsFilter'

/**
 * THE DOMAIN RAIL · pick a subject instead of scrolling past five of them.
 *
 * Insights holds twenty-four analytics cards. Grouping them under six
 * headings made the page legible; it did not make it shorter — measured at
 * **6.3 screens** on a 1600px display, with roughly 260px of page empty down
 * the side. Scroll was the only way to reach anything, and the six domain
 * names existed as chips you had to notice.
 *
 * So the names become the navigation. One domain at a time in the pane, the
 * rail stays put, and the page is about one screen of content instead of six
 * — the same twenty-four cards, reached in a click rather than a scroll.
 *
 * Three decisions worth keeping:
 *
 * - **"All" is first and is not the default.** The default is the first
 *   domain, because landing on everything is landing on the six-screen page
 *   this replaces. All stays because a search has to be able to cross
 *   domains, and because someone who wants the wall should be able to have
 *   it.
 * - **Counts are live against the current search.** A domain showing 0 while
 *   a query is active is disabled rather than hidden: a rail whose rows move
 *   as you type is a rail you cannot aim at.
 * - **Sticky under the measured header**, not a constant. `--header-h` is
 *   published by `useHeaderHeight` from a ResizeObserver, because the header
 *   grows by the notch on a phone and wraps at narrow widths.
 *
 * Below `@4xl` the rail is not a rail: the page has no side to put it on, so
 * it renders as the horizontal chip row it replaces. Same component, same
 * state, same counts — a second implementation for phones is how the two come
 * to disagree.
 */
export function DomainRail({ value, onChange, countOf, total, filtering, onClear }: {
  /** `null` is All. */
  value: Domain | null
  onChange: (d: Domain | null) => void
  /** Cards currently visible in a domain, after the search. */
  countOf: (d: Domain) => number
  /** Cards visible across every domain. */
  total: number
  filtering: boolean
  onClear: () => void
}) {
  const rows: { key: string; label: string; count: number; value: Domain | null }[] = [
    { key: 'all', label: 'All', count: total, value: null },
    ...DOMAINS.map((d) => ({ key: d, label: DOMAIN_LABEL[d], count: countOf(d), value: d as Domain | null })),
  ]

  return (
    <nav
      aria-label="Insight domains"
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
            aria-label={`${r.label} — ${r.count} ${r.count === 1 ? 'panel' : 'panels'}`}
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
            <span className="num ml-1.5 opacity-70 @4xl/page:ml-0">{r.count}</span>
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

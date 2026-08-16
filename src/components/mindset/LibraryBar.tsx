import { MagnifyingGlass } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { MINDSET_CATEGORIES } from '../../lib/mindset'

/**
 * The library's utility bar: search, category filters, and how much is showing.
 *
 * Pinned directly under the app header. `top` is `--header-h` — the height the
 * shell *measures* and republishes on resize (`shell/useHeaderHeight`), never a
 * literal. The handoff records a hard-coded value leaving a 6px slit that
 * content scrolled through, and this app's header is worse than that one: it
 * wraps at narrow widths and grows by the notch on a phone.
 *
 * **The filter row scrolls, it never wraps.** Eight filters wrapping to a second
 * line cost a pinned bar 107px of height in the handoff's earlier build — on a
 * phone that is a third of the screen permanently spent on chrome.
 */
export function LibraryBar({
  query,
  onQuery,
  filter,
  onFilter,
  shown,
  total,
}: {
  query: string
  onQuery: (q: string) => void
  /** `'All'` or one of `MINDSET_CATEGORIES`. */
  filter: string
  onFilter: (f: string) => void
  shown: number
  total: number
}) {
  return (
    <div className="sticky top-[var(--header-h)] z-20 flex flex-nowrap items-center gap-4 border-b-2 border-line bg-ink-0 py-2">
      <div className="flex flex-none basis-44 items-center gap-2 border-b border-line">
        <Icon as={MagnifyingGlass} size="sm" className="shrink-0 text-fg-3" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search principles"
          aria-label="Search principles"
          className="w-full border-0 bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:outline-none"
        />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3.5 overflow-x-auto whitespace-nowrap [scrollbar-width:thin]">
        {['All', ...MINDSET_CATEGORIES].map((c) => {
          const active = filter === c
          return (
            <button
              key={c}
              onClick={() => onFilter(c)}
              aria-pressed={active}
              className={`flex-none border-b-2 py-0.5 text-label ${
                active ? 'border-brand text-fg-1' : 'border-transparent text-fg-2 hover:text-brand-text'
              }`}
            >
              {c}
            </button>
          )
        })}
      </div>

      <span className="flex-none text-caption tracking-[0.1em] text-fg-3 uppercase">
        {shown} of {total} shown
      </span>
    </div>
  )
}

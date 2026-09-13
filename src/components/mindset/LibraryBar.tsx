import { categoryIcon } from './categoryIcon'
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
 *
 * **Which makes the width budget load-bearing, and it used to be wrong.** The
 * filter row is the only flexible child here, so every pixel the other two take
 * comes out of it. At 390px the band is 324px wide; a fixed `basis-44` search
 * (176) plus `gap-4` twice (32) plus a `flex-none` "26 OF 26 SHOWN" (~106) left
 * the scrollport **10px** — all eight filters were technically reachable by
 * dragging a 10px-wide strip, which is not reachable. Nothing caught it:
 * `clipped-text.mjs` asks whether a control sits outside the viewport with no
 * scrollable ancestor, and this one had a scrollable ancestor, so by that test
 * it was a design. So: the search box shrinks below `sm`, and the count — the
 * least useful of the three on a phone, where the list it counts is directly
 * below — is hidden there. Changing either of those changes the budget; measure
 * the scrollport at 390 afterwards, don't assume.
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
      <div className="flex flex-none basis-32 items-center gap-2 border-b border-line sm:basis-44">
        <Icon as={MagnifyingGlass} size="sm" className="shrink-0 text-fg-3" />
        {/* Placeholder is "Search", not "Search principles": the box is 128px
            below `sm` and the longer string clipped mid-word there. The
            accessible name is unaffected and still says what is searched. */}
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search"
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
              {c === 'All'
                ? c
                : <span className="inline-flex items-center gap-1.5"><Icon as={categoryIcon(c)} size="sm" className="shrink-0" />{c}</span>}
            </button>
          )
        })}
      </div>

      <span className="hidden flex-none text-caption text-fg-3 sm:inline">
        {shown} of {total} shown
      </span>
    </div>
  )
}

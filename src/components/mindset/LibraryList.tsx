import { Icon } from '@/components/Icon'
import { categoryIcon } from './categoryIcon'
import { MINDSET_CATEGORIES, MINDSET_LIBRARY, type MindsetPrinciple } from '../../lib/mindset'
import { bindDashes } from '../../lib/typography'

/**
 * The library — every principle in `MINDSET_LIBRARY`, grouped by category.
 *
 * The count is deliberately not written down here. Two docstrings said "26
 * principles" while the library held 46 and the utility bar rendered "46 of
 * 46 shown" on screen — a number in a comment has nothing keeping it true,
 * and these two had been wrong by twenty for long enough that both copies
 * agreed with each other and with nothing else.
 *
 * ## Each principle is a tile, not a row of text
 *
 * It was a hairline-separated list: a bold line, a grey line, and an `Add`
 * button floating at the far right of the same row. At two columns that put
 * about twelve unbounded text blocks on screen with nothing but 1px rules
 * between them, and the control sat closer to the *next* principle's text
 * than to its own. Reported as "plain text scattered on the page", which is
 * accurate — there was no object boundary anywhere in it.
 *
 * A tile draws the boundary, and it lets the control belong to the thing it
 * acts on. Everything else about the block is unchanged: same grouping, same
 * counts, same copy.
 *
 * **Neutral on purpose.** Nine categories is nine hues if you let it be, and
 * the contract spends the accent on exactly one thing per page — here, the
 * principles you have actually chosen. An in-focus tile is the only coloured
 * thing in the library, which is what makes it findable in a wall of
 * forty-six.
 *
 * Filtering is done by the view and handed here already filtered — this
 * component never decides what is visible, so the count in the utility bar
 * and the tiles on screen cannot disagree. A category with nothing left after
 * filtering is dropped rather than rendered as an empty block; a search that
 * matches nothing at all gets one line, not nine empty headings.
 */
export function LibraryList({
  principles,
  focusedIds,
  full,
  onToggle,
}: {
  /** Already filtered by search + category. */
  principles: MindsetPrinciple[]
  focusedIds: Set<string>
  /** All focus slots are taken — inactive tiles read as unavailable. */
  full: boolean
  onToggle: (principleId: string) => void
}) {
  if (principles.length === 0) {
    return <p className="py-10 text-body text-fg-2">No principle matches that search.</p>
  }

  return (
    <div className="pb-6">
      {MINDSET_CATEGORIES.map((cat) => {
        const items = principles.filter((p) => p.category === cat)
        if (items.length === 0) return null
        // "2 of 4" while filtered, "4 principles" when whole. The count has to
        // say which of the two it is, or a filtered page looks like a shrunken
        // library rather than a filtered one.
        const total = MINDSET_LIBRARY.filter((p) => p.category === cat).length
        return (
          <div key={cat} className="flex flex-wrap gap-x-8 border-b border-line py-5 last:border-b-0">
            <div className="flex-none basis-36">
              <h3 className="flex items-center gap-2 font-display text-body font-medium text-fg-1">
                <Icon as={categoryIcon(cat)} size="sm" className="shrink-0 text-fg-3" />
                {cat}
              </h3>
              <p className="mt-1 text-caption text-fg-3">
                {items.length === total
                  ? `${total} ${total === 1 ? 'principle' : 'principles'}`
                  : `${items.length} of ${total}`}
              </p>
            </div>

            {/* Two columns from `md` up. Forty-six tiles in one column is a
                wall on a tier 1,180px wide where each was using half of it.
                `auto-rows-min` + `content-start`: a grid row is as tall as its
                tallest cell, and a three-line tile should not stretch its
                two-line neighbour. */}
            <ul className="min-w-0 flex-1 basis-[26rem] grid gap-3 md:grid-cols-2 md:auto-rows-min md:content-start">
              {items.map((p) => {
                const on = focusedIds.has(p.id)
                return (
                  <li key={p.id}>
                    {/* The whole tile is the control. A 44px-plus target that
                        is the object itself beats a 60px button beside it —
                        and the old `Add` button sat at the far right of a
                        full-width row, nearer the next principle's text than
                        its own. `aria-pressed` carries the state that the
                        wash and the pill show. */}
                    <button
                      onClick={() => onToggle(p.id)}
                      aria-pressed={on}
                      aria-label={on ? `Remove ${p.title} from your focus` : `Add ${p.title} to your focus`}
                      className={`flex h-full w-full flex-col rounded-card border p-3 text-left transition-colors ${
                        on
                          ? 'border-brand bg-brand-wash'
                          : 'border-line bg-ink-2 hover:border-line-strong'
                      }`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className={`font-display text-label font-medium ${on ? 'text-brand-text' : 'text-fg-1'}`}>
                          {p.title}
                        </span>
                        <span
                          aria-hidden
                          className={`mt-0.5 shrink-0 rounded-pill border px-2 py-0.5 text-micro ${
                            on
                              ? 'border-brand text-brand-text'
                              : full
                                ? 'border-line text-fg-3'
                                : 'border-line text-fg-2'
                          }`}
                        >
                          {on ? 'In focus' : 'Add'}
                        </span>
                      </span>
                      <span className="mt-1 text-label text-pretty text-fg-2">{bindDashes(p.why)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

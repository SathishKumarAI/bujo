import { MINDSET_CATEGORIES, MINDSET_LIBRARY, type MindsetPrinciple } from '../../lib/mindset'

/**
 * The library: 26 principles grouped by category, one row each.
 *
 * Owns the grouped list and the add/remove control on a row. Filtering is done
 * by the view and handed here already filtered — this component never decides
 * what is visible, so the count in the utility bar and the rows on screen
 * cannot disagree.
 *
 * A category with nothing left after filtering is dropped rather than rendered
 * as an empty block; a search that matches nothing at all gets one line, not
 * seven empty headings.
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
  /** All focus slots are taken — inactive rows read as unavailable. */
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
              <h3 className="font-display text-body font-medium text-fg-1">{cat}</h3>
              <p className="mt-1 text-caption tracking-[0.08em] text-fg-3 uppercase">
                {items.length === total
                  ? `${total} ${total === 1 ? 'principle' : 'principles'}`
                  : `${items.length} of ${total}`}
              </p>
            </div>

            <ul className="min-w-0 flex-1 basis-[26rem]">
              {items.map((p) => {
                const on = focusedIds.has(p.id)
                return (
                  <li
                    key={p.id}
                    className="grid grid-cols-[1fr_auto] items-start gap-4 border-t border-line py-2.5 hover:bg-ink-2/50"
                  >
                    <div className="min-w-0">
                      <p className={`font-display text-label font-medium ${on ? 'text-brand-text' : 'text-fg-1'}`}>
                        {p.title}
                      </p>
                      <p className="mt-0.5 max-w-[74ch] text-label text-fg-2">{p.why}</p>
                    </div>
                    {/* Enabled even when full, and deliberately: a disabled
                        button that says "Add" explains nothing about why. This
                        one keeps its accessible name and the view's toast says
                        what the cap is. */}
                    <button
                      onClick={() => onToggle(p.id)}
                      aria-pressed={on}
                      aria-label={on ? `Remove ${p.title} from your focus` : `Add ${p.title} to your focus`}
                      className={`self-center border px-2.5 py-1 text-label ${
                        on
                          ? 'border-brand bg-brand-wash text-brand-text'
                          : full
                            ? 'border-line text-fg-3 hover:border-brand hover:text-brand-text'
                            : 'border-line text-fg-1 hover:border-brand hover:text-brand-text'
                      }`}
                    >
                      {on ? 'In focus' : 'Add'}
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

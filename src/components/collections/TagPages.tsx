import { Band, Eyebrow } from '../mod'
import { EntryRow } from '../EntryRow'
import type { Entry } from '../../lib/types'

/**
 * Auto-collections: one page per #tag, built from the entries themselves.
 *
 * Owns the tag row and the open tag's entries. The view owns which tag is open,
 * because the Index band jumps here.
 *
 * The tag row scrolls rather than wrapping, for the reason the Mindset filter
 * row does: a journal with thirty tags would otherwise push the list itself off
 * the first screen.
 */
export function TagPages({
  tags,
  openTag,
  onOpen,
}: {
  tags: { tag: string; entries: Entry[] }[]
  openTag: string | null
  onOpen: (tag: string | null) => void
}) {
  const open = tags.find((t) => t.tag === openTag)

  // `scroll-mt` clears the sticky header for `Collections`'s
  // `scrollIntoView({block:'start'})`. Measured, not a literal: it was
  // `scroll-mt-24` (96px) against a 99px header, so the jump already landed
  // under it — and the header now folds on scroll, so no constant can be right.
  // See `shell/useHeaderHeight`.
  return (
    <Band id="bujo-tags" className="scroll-mt-[calc(var(--header-h,3.5rem)+1rem)] py-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-display text-heading font-medium text-fg-1">Tag pages</h2>
        <Eyebrow className="tracking-[0.1em]">{tags.length} in this journal</Eyebrow>
      </div>

      {tags.length === 0 ? (
        <p className="mt-3 text-label text-fg-2">No tags yet. Add a #tag to any entry and its page builds itself.</p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-4 overflow-x-auto border-b-2 border-line pb-2 whitespace-nowrap [scrollbar-width:thin]">
            {tags.map(({ tag, entries }) => {
              const active = openTag === tag
              return (
                <button
                  key={tag}
                  onClick={() => onOpen(active ? null : tag)}
                  aria-pressed={active}
                  className={`flex-none border-b-2 pb-1 text-label ${
                    active ? 'border-brand text-fg-1' : 'border-transparent text-fg-2 hover:text-brand-text'
                  }`}
                >
                  #{tag} <span className="num text-caption text-fg-3">{entries.length}</span>
                </button>
              )
            })}
          </div>

          {open && (
            <div className="mt-3">
              <Eyebrow>
                #{open.tag} · {open.entries.length} {open.entries.length === 1 ? 'entry' : 'entries'}
              </Eyebrow>
              <ul className="mt-2 border-t border-line">
                {[...open.entries]
                  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
                  .map((e) => (
                    <EntryRow key={e.id} entry={e} />
                  ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Band>
  )
}

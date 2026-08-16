import { useState } from 'react'
import { Band, Eyebrow } from '../mod'
import { Button } from '../ui/button'
import { EntryRow } from '../EntryRow'
import { collectionProgress } from '../../lib/bullets'
import type { Collection, Entry } from '../../lib/types'

/**
 * Custom collections: create one, open one, add entries to it.
 *
 * Owns the create row, the collection list and the open collection's contents.
 * The view owns which collection is open, because the Index band jumps to it.
 *
 * Collections are a list with a rule per row rather than a wrap of pills. A
 * pill wrap gave every collection a different width and no alignment, so
 * scanning twelve of them meant reading twelve shapes.
 */
export function CustomCollections({
  collections,
  entries,
  openId,
  onOpen,
  onCreate,
  onRemove,
  onAddEntry,
}: {
  collections: Collection[]
  entries: Entry[]
  openId: string | null
  onOpen: (id: string | null) => void
  onCreate: (name: string, icon: string) => void
  onRemove: (id: string) => void
  onAddEntry: (text: string, collectionId: string) => void
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📚')
  const [text, setText] = useState('')

  const items = openId ? entries.filter((e) => e.collection === openId) : []
  const progress = openId ? collectionProgress(entries, openId) : null

  return (
    // Measured header clearance, not a literal — see the note on the same class
    // in `TagPages.tsx`.
    <Band id="bujo-collections" className="scroll-mt-[calc(var(--header-h,3.5rem)+1rem)] py-6">
      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <h2 className="font-display text-heading font-medium text-fg-1">Collections</h2>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value.slice(0, 2))}
            aria-label="Collection icon"
            className="w-10 border-0 border-b border-line bg-transparent py-1 text-center text-body text-fg-1 focus-visible:border-brand focus-visible:outline-none"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || !name.trim()) return
              onCreate(name.trim(), icon || '📄')
              setName('')
            }}
            placeholder="Collection name"
            aria-label="Collection name"
            className="min-w-[10rem] flex-1 border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
          />
          <Button
            variant="secondary"
            className="shrink-0 rounded-none"
            onClick={() => {
              if (!name.trim()) return
              onCreate(name.trim(), icon || '📄')
              setName('')
            }}
          >
            New collection
          </Button>
        </div>
      </div>

      {collections.length === 0 ? (
        <p className="text-label text-fg-2">No collections yet — a free-form page for a project, a packing list, a book list.</p>
      ) : (
        <ul className="border-t-2 border-line">
          {collections.map((c) => {
            const open = openId === c.id
            const count = entries.filter((e) => e.collection === c.id).length
            return (
              <li key={c.id} className="group border-b border-line">
                <div className="flex items-center gap-3 py-2">
                  <button
                    onClick={() => onOpen(open ? null : c.id)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left text-label"
                  >
                    <span aria-hidden>{c.icon}</span>
                    <span className={`min-w-0 flex-1 truncate ${open ? 'text-brand-text' : 'text-fg-1'}`}>{c.name}</span>
                    <span className="num shrink-0 text-fg-2">{count}</span>
                  </button>
                  <button
                    onClick={() => {
                      onRemove(c.id)
                      if (open) onOpen(null)
                    }}
                    aria-label={`Delete ${c.name}`}
                    className="shrink-0 text-fg-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-danger-text"
                  >
                    ×
                  </button>
                </div>

                {open && (
                  <div className="border-t border-line py-3 pl-6">
                    <form
                      className="flex gap-3"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!text.trim()) return
                        onAddEntry(text, c.id)
                        setText('')
                      }}
                    >
                      <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Add to this collection… (t/e/n)"
                        aria-label={`Add an entry to ${c.name}`}
                        className="min-w-0 flex-1 border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
                      />
                      <Button type="submit" variant="secondary" size="sm" className="shrink-0 rounded-none">
                        Add
                      </Button>
                    </form>

                    {progress && progress.total > 0 && (
                      <div className="mt-3 max-w-[22rem]">
                        <div className="mb-1 flex items-baseline justify-between text-label text-fg-2">
                          <Eyebrow>Checklist</Eyebrow>
                          <span className="num">
                            {progress.done}/{progress.total} · {Math.round(progress.rate * 100)}%
                          </span>
                        </div>
                        <div className="h-2 bg-ink-2">
                          <div className="h-full bg-fg-1" style={{ width: `${Math.round(progress.rate * 100)}%` }} />
                        </div>
                      </div>
                    )}

                    {items.length === 0 ? (
                      <p className="mt-3 text-label text-fg-3">Empty — add the first item above.</p>
                    ) : (
                      <ul className="mt-3 border-t border-line">
                        {items.map((e) => (
                          <EntryRow key={e.id} entry={e} />
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Band>
  )
}

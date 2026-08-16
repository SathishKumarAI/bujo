import { Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { Band, BandRow, Eyebrow } from '../mod'
import { Button } from '../ui/button'
import { BookRow } from './BookRow'
import { shelf } from '../../lib/reading'
import type { Book, BookStatus } from '../../lib/types'

const SHELVES: { id: BookStatus; label: string }[] = [
  { id: 'want', label: 'Want to read' },
  { id: 'reading', label: 'Reading now' },
  { id: 'finished', label: 'Finished' },
]

/**
 * The act zone: add a book, and the three shelves side by side.
 *
 * Owns the add form and the shelf columns. `BookRow` owns a book.
 *
 * Unlike Mindset's focus slots this row **does** wrap — a shelf is a list that
 * can run to fifty books, and squeezing three of those into 150px columns on a
 * phone would be unreadable. The slots rule is about fixed-size cells; this is
 * about lists.
 */
export function Shelves({ books, onAdd }: { books: Book[]; onAdd: (title: string, author?: string) => void }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')

  function add() {
    const t = title.trim()
    if (!t) return
    onAdd(t, author.trim() || undefined)
    setTitle('')
    setAuthor('')
  }

  return (
    <Band className="py-6">
      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <h2 className="font-display text-heading font-medium text-fg-1">Shelves</h2>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Book title"
            aria-label="Book title"
            className="min-w-[10rem] flex-1 border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Author (optional)"
            aria-label="Author"
            className="min-w-[8rem] flex-1 border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
          />
          <Button variant="primary" onClick={add} className="shrink-0 rounded-none">
            <Icon as={Plus} size="sm" /> Add to shelf
          </Button>
        </div>
      </div>

      <BandRow className="items-stretch border-t-2 border-line">
        {SHELVES.map((s) => {
          const list = shelf(books, s.id)
          return (
            <div
              key={s.id}
              className="min-w-0 flex-1 basis-[16rem] border-line pt-3 pr-5 [&:not(:last-child)]:border-r"
            >
              <div className="flex items-baseline gap-2">
                <h3 className="font-display text-label font-medium text-fg-1">{s.label}</h3>
                <Eyebrow className="num">{list.length}</Eyebrow>
              </div>
              {list.length === 0 ? (
                <p className="py-4 text-label text-fg-3">Nothing here yet.</p>
              ) : (
                <ul className="mt-2">
                  {list.map((b) => (
                    <BookRow key={b.id} book={b} />
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </BandRow>
    </Band>
  )
}

import { Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { Card } from '../ui'
import { Button } from '../ui/button'
import { BookRow } from './BookRow'
import type { Book } from '../../lib/types'
import { notify } from '../../lib/notify'


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
/**
 * ADD A BOOK · the act.
 *
 * Split out of `Shelves`, which was a `mod/Band` holding the add form *and*
 * three shelf lists — the form because it had to go somewhere, the lists
 * because the Modernist grid wanted a row of `BandCell`s. They are two
 * different jobs and now two different zones: adding is an act, a shelf is a
 * read-back.
 */
export function AddBookCard({ onAdd }: { onAdd: (title: string, author?: string) => void }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')

  function add() {
    const t = title.trim()
    if (!t) { notify.info('Name the book', 'A title is the one field a shelf entry needs.'); return }
    onAdd(t, author.trim() || undefined)
    setTitle('')
    setAuthor('')
  }

  return (
    <Card band title="Add a book" subtitle="It lands on Want to read — move it when you start">
      <div className="flex flex-wrap items-center gap-3">
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
        <Button variant="primary" onClick={add} className="shrink-0 press-3d">
          <Icon as={Plus} size="sm" /> Add to shelf
        </Button>
      </div>
    </Card>
  )
}

/**
 * ONE SHELF · a card, not a third of a row.
 *
 * The three shelves were `BandCell`s sharing a row, which is the grid
 * deciding the layout rather than the content. A shelf is a list with its own
 * count and its own emptiness; three in one box share a heading they do not
 * share a subject with, and an empty one leaves a third of a card blank
 * instead of saying so.
 */
export function ShelfCard({ label, books }: { label: string; books: Book[] }) {
  return (
    <Card band title={label} subtitle={`${books.length} ${books.length === 1 ? 'book' : 'books'}`}>
      {books.length === 0 ? (
        <p className="py-2 text-label text-fg-2">Nothing on this shelf yet.</p>
      ) : (
        <ul>
          {books.map((b) => <BookRow key={b.id} book={b} />)}
        </ul>
      )}
    </Card>
  )
}

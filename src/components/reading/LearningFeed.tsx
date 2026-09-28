import { MagnifyingGlass } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { Card } from '../ui'
import { allLearnings } from '../../lib/reading'
import { prettyDay } from '../../lib/date'
import type { Book } from '../../lib/types'

/**
 * Every dated learning from every book, newest first, searchable.
 *
 * Read-only over `book.learnings` — writing one happens in the book's own row,
 * where the book is. Renders nothing when no book has a learning yet: an empty
 * feed with a search box is a promise of content the page cannot keep.
 */
export function LearningsCard({ books }: { books: Book[] }) {
  const [q, setQ] = useState('')
  const total = books.reduce((n, b) => n + (b.learnings?.length ?? 0), 0)
  const entries = allLearnings(books, q)
  /* It used to `return null` at zero, which a rail cannot tolerate — see
     `StalledCard`. And the eyebrow carried `tracking-[0.1em]`, which is the
     letter-spaced micro label `mod/Eyebrow`'s own docstring retired as "the
     house style of a 2015 analytics dashboard"; two call sites had added the
     tracking back by hand. The count is the card's subtitle now. */
  return (
    <Card band title="Learnings" subtitle={total ? `${total} across your books` : 'What you took from a book'}>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <div className="ml-auto flex items-center gap-2 border-b border-line">
          <Icon as={MagnifyingGlass} size="sm" className="shrink-0 text-fg-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search learnings"
            aria-label="Search learnings"
            className="w-44 border-0 bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:outline-none"
          />
        </div>
      </div>

      {total === 0 ? (
        <p className="py-2 text-label text-fg-2">
          No learnings yet — open a book on a shelf and add what you took from it.
        </p>
      ) : entries.length === 0 ? (
        <p className="py-6 text-body text-fg-2">No learning matches that search.</p>
      ) : (
        <ul className="max-h-96 overflow-y-auto" tabIndex={0} aria-label="Learning feed">
          {entries.map((l, i) => (
            <li key={i} className="grid grid-cols-[6rem_1fr] gap-4 border-t border-line py-2 text-label">
              <span className="text-fg-3">{prettyDay(l.date)}</span>
              <span>
                <span className="text-fg-1">{l.text}</span>
                <span className="mt-0.5 block text-caption text-fg-3">{l.bookTitle}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

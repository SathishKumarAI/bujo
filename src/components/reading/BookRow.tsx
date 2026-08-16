import { ArrowSquareOut, CaretDown, Link, NotePencil, Star, Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../../store'
import { Button } from '../ui/button'
import { progressPct, estimatedFinish } from '../../lib/reading'
import { prettyDay, todayISO } from '../../lib/date'
import type { Book, BookStatus } from '../../lib/types'

/**
 * One book, as a row on a shelf.
 *
 * Owns everything you can do to a single book: move it between shelves, set its
 * page count, rate it, and open its notes (link, review, dated learnings). The
 * shelf owns which books are listed; this owns what a book is.
 *
 * Was a bordered card inside a bordered column inside a bordered page. It is a
 * row divided by a 1px rule now — the same controls, three fewer boxes. Number
 * fields keep only a bottom rule for the same reason the Mindset cue does: a
 * boxed input on a page with no other boxes reads as a form that wandered in.
 */
export function BookRow({ book }: { book: Book }) {
  const store = useJournal()
  const pct = progressPct(book)
  const est = estimatedFinish(book, todayISO())
  const [open, setOpen] = useState(false)
  const [learn, setLearn] = useState('')
  const learnings = book.learnings ?? []

  function addLearning() {
    const t = learn.trim()
    if (!t) return
    store.addBookLearning(book.id, t, todayISO())
    setLearn('')
  }

  function move(status: BookStatus) {
    const patch: Partial<Book> = { status }
    if (status === 'reading' && !book.startedOn) patch.startedOn = todayISO()
    if (status === 'finished') {
      patch.finishedOn = todayISO()
      if (book.totalPages) patch.currentPage = book.totalPages
    }
    store.updateBook(book.id, patch)
  }

  return (
    <li className="group border-t border-line py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-label font-medium text-fg-1">{book.title}</p>
          {book.author && <p className="truncate text-label text-fg-2">{book.author}</p>}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => store.removeBook(book.id)}
          aria-label={`Remove ${book.title}`}
          className="shrink-0 text-fg-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-danger-text"
        >
          <Icon as={Trash} size="sm" />
        </Button>
      </div>

      {book.status === 'reading' && (
        <div className="mt-2">
          <div className="flex items-center gap-2 text-label text-fg-2">
            <input
              type="number"
              min={0}
              value={book.currentPage ?? ''}
              placeholder="0"
              aria-label={`Current page of ${book.title}`}
              onChange={(e) => store.updateBook(book.id, { currentPage: Math.max(0, Number(e.target.value) || 0) })}
              className="w-14 border-0 border-b border-line bg-transparent py-0.5 text-right text-fg-1 focus-visible:border-brand focus-visible:outline-none"
            />
            <span aria-hidden>/</span>
            <input
              type="number"
              min={0}
              value={book.totalPages ?? ''}
              placeholder="pages"
              aria-label={`Total pages of ${book.title}`}
              onChange={(e) => store.updateBook(book.id, { totalPages: Math.max(0, Number(e.target.value) || 0) || undefined })}
              className="w-16 border-0 border-b border-line bg-transparent py-0.5 text-right text-fg-1 focus-visible:border-brand focus-visible:outline-none"
            />
            <span className="num ml-auto text-brand-text">{pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 bg-ink-2">
            <div className="h-full bg-brand transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          {est && (
            <p className="mt-1 text-caption text-fg-2">
              At this pace, done by {prettyDay(est.iso)} · ~{est.daysLeft}d left
            </p>
          )}
        </div>
      )}

      {book.status === 'finished' && (
        <div className="mt-2 flex items-center gap-1">
          {/* Weight, not fill, carries the state: these glyphs are drawn at two
              weights only, so filling an outline star colours the ring and a
              5-star book looked identical to an unrated one. */}
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => store.updateBook(book.id, { rating: n })}
              aria-label={`Rate ${book.title} ${n} star${n === 1 ? '' : 's'}`}
              aria-pressed={n <= (book.rating ?? 0)}
              className="grid size-6 place-items-center"
            >
              <Icon as={Star} size="sm" active={n <= (book.rating ?? 0)} className={n <= (book.rating ?? 0) ? 'text-yellow' : 'text-fg-3'} />
            </button>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-label">
        {book.status !== 'want' && <Move label="Want" onClick={() => move('want')} />}
        {book.status !== 'reading' && <Move label="Reading" onClick={() => move('reading')} />}
        {book.status !== 'finished' && <Move label="Finished" onClick={() => move('finished')} />}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="ml-auto inline-flex items-center gap-1 text-caption text-fg-2 hover:text-fg-1"
        >
          <Icon as={NotePencil} size="sm" /> Notes{learnings.length ? ` (${learnings.length})` : ''}
          <Icon as={CaretDown} size="sm" className={open ? 'rotate-180 transition' : 'transition'} />
        </button>
      </div>

      {open && (
        <div className="mt-2.5 space-y-2 border-t border-line pt-2.5">
          <div className="flex items-center gap-1.5">
            <Icon as={Link} size="sm" className="shrink-0 text-fg-3" />
            <input
              value={book.link ?? ''}
              onChange={(e) => store.updateBook(book.id, { link: e.target.value || undefined })}
              placeholder="Link (summary, buy page, author…)"
              aria-label={`Link for ${book.title}`}
              className="w-full border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
            />
            {book.link && (
              <a href={book.link} target="_blank" rel="noreferrer" aria-label={`Open link for ${book.title}`} className="text-brand-text">
                <Icon as={ArrowSquareOut} size="sm" />
              </a>
            )}
          </div>
          <textarea
            value={book.notes ?? ''}
            onChange={(e) => store.updateBook(book.id, { notes: e.target.value || undefined })}
            placeholder="Your review / overall takeaways…"
            aria-label={`Review of ${book.title}`}
            rows={2}
            className="w-full resize-none border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
          />
          <div>
            <p className="mb-1 text-caption tracking-[0.08em] text-fg-3 uppercase">What I learned</p>
            {learnings.length > 0 && (
              <ul className="mb-1.5 space-y-1">
                {learnings.map((l, i) => (
                  <li key={i} className="group/l flex items-start gap-1.5 text-label text-fg-2">
                    <span className="shrink-0 text-fg-3">{prettyDay(l.date)}:</span>
                    <span className="flex-1">{l.text}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => store.removeBookLearning(book.id, i)}
                      aria-label="Remove learning"
                      className="text-fg-2 opacity-0 group-hover/l:opacity-100 focus-visible:opacity-100 hover:text-danger-text"
                    >
                      ×
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                value={learn}
                onChange={(e) => setLearn(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLearning()}
                placeholder="What did you learn today?"
                aria-label={`Add a learning to ${book.title}`}
                className="w-full border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
              />
              <Button variant="secondary" onClick={addLearning} size="sm" className="shrink-0 rounded-none">
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

function Move({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-fg-2 hover:text-brand-text">
      → {label}
    </button>
  )
}

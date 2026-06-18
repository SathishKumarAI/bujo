import { useState } from 'react'
import { BookOpen, BookMarked, CheckCircle2, Plus, Star, Trash2, Target } from 'lucide-react'
import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { todayISO } from '../lib/date'
import { shelf, progressPct, readingSummary } from '../lib/reading'
import type { Book, BookStatus } from '../lib/types'

const SHELVES: { id: BookStatus; label: string; icon: typeof BookOpen; color: string }[] = [
  { id: 'want', label: 'Want to read', icon: BookMarked, color: 'sky' },
  { id: 'reading', label: 'Reading now', icon: BookOpen, color: 'mauve' },
  { id: 'finished', label: 'Finished', icon: CheckCircle2, color: 'green' },
]

export function Reading() {
  const { data, setSettings } = useJournal()
  const store = useJournal()
  const books = data.books ?? []
  const today = todayISO()
  const sum = readingSummary(books, today)
  const goal = data.settings.readingGoalBooks ?? 0

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')

  function add() {
    const t = title.trim()
    if (!t) return
    store.addBook({ title: t, author: author.trim() || undefined, status: 'want' })
    setTitle(''); setAuthor('')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Reading now" value={sum.reading} color="mauve" />
        <Stat label="Finished this year" value={sum.finishedThisYear} color="green" />
        <Stat label="Pages read" value={sum.pages.toLocaleString()} color="peach" />
        <Stat label="Avg rating" value={sum.avgRating ? sum.avgRating.toFixed(1) + '★' : '—'} color="yellow" />
      </div>

      {/* Yearly goal */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground"><Target size={15} className="text-primary" /> Yearly reading goal</span>
          <div className="flex items-center gap-2 text-sm">
            <input type="number" min={0} value={goal || ''} placeholder="0"
              onChange={(e) => setSettings({ readingGoalBooks: Math.max(0, Number(e.target.value) || 0) })}
              className="w-16 rounded-md border border-input bg-background px-2 py-1 text-right text-foreground" />
            <span className="text-overlay0">books</span>
          </div>
        </div>
        {goal > 0 && (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-green transition-[width]" style={{ width: `${Math.min(100, Math.round((sum.finishedThisYear / goal) * 100))}%` }} />
            </div>
            <p className="mt-1 text-xs text-overlay0">{sum.finishedThisYear} of {goal} finished this year</p>
          </>
        )}
      </div>

      {/* Add a book */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title"
          onKeyDown={(e) => e.key === 'Enter' && add()}
          className="min-w-[12rem] flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author (optional)"
          onKeyDown={(e) => e.key === 'Enter' && add()}
          className="min-w-[10rem] flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
        <button onClick={add} className="press-3d inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-crust">
          <Plus size={15} /> Add to shelf
        </button>
      </div>

      {/* Shelves */}
      <div className="grid gap-5 md:grid-cols-3">
        {SHELVES.map((s) => {
          const list = shelf(books, s.id)
          const Icon = s.icon
          return (
            <div key={s.id} className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon size={16} style={{ color: cat(s.color) }} /> {s.label}
                <span className="text-overlay0">({list.length})</span>
              </h3>
              {list.length === 0 && <p className="rounded-xl border border-dashed border-surface1 p-4 text-center text-xs text-overlay0">Nothing here yet.</p>}
              {list.map((b) => <BookCard key={b.id} book={b} />)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-display text-2xl font-semibold" style={{ color: cat(color) }}>{value}</p>
      <p className="mt-0.5 text-xs text-overlay0">{label}</p>
    </div>
  )
}

function BookCard({ book }: { book: Book }) {
  const store = useJournal()
  const pct = progressPct(book)

  function move(status: BookStatus) {
    const patch: Partial<Book> = { status }
    if (status === 'reading' && !book.startedOn) patch.startedOn = todayISO()
    if (status === 'finished') { patch.finishedOn = todayISO(); if (book.totalPages) patch.currentPage = book.totalPages }
    store.updateBook(book.id, patch)
  }

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{book.title}</p>
          {book.author && <p className="truncate text-xs text-overlay0">{book.author}</p>}
        </div>
        <button onClick={() => store.removeBook(book.id)} aria-label="Remove book" className="text-overlay0 hover:text-red"><Trash2 size={14} /></button>
      </div>

      {book.status === 'reading' && (
        <div className="mt-2">
          <div className="flex items-center gap-2 text-xs text-subtext0">
            <input type="number" min={0} value={book.currentPage ?? ''} placeholder="0"
              onChange={(e) => store.updateBook(book.id, { currentPage: Math.max(0, Number(e.target.value) || 0) })}
              className="w-14 rounded-md border border-input bg-card px-1.5 py-0.5 text-right text-foreground" />
            <span>/</span>
            <input type="number" min={0} value={book.totalPages ?? ''} placeholder="pages"
              onChange={(e) => store.updateBook(book.id, { totalPages: Math.max(0, Number(e.target.value) || 0) || undefined })}
              className="w-16 rounded-md border border-input bg-card px-1.5 py-0.5 text-right text-foreground" />
            <span className="ml-auto font-medium text-primary">{pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {book.status === 'finished' && (
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => store.updateBook(book.id, { rating: n })} aria-label={`Rate ${n} stars`}>
              <Star size={15} className={n <= (book.rating ?? 0) ? 'fill-yellow text-yellow' : 'text-overlay0'} />
            </button>
          ))}
        </div>
      )}

      {/* Shelf controls */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {book.status !== 'want' && <Move label="Want" onClick={() => move('want')} />}
        {book.status !== 'reading' && <Move label="Reading" onClick={() => move('reading')} />}
        {book.status !== 'finished' && <Move label="Finished" onClick={() => move('finished')} />}
      </div>
    </div>
  )
}

function Move({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-md border border-border px-2 py-0.5 text-[11px] text-subtext0 hover:border-primary hover:text-foreground">
      → {label}
    </button>
  )
}

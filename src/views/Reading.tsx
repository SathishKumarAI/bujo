import { useState } from 'react'
import { BookOpen, BookMarked, CheckCircle2, Plus, Star, Trash2, Target, ChevronDown, Link2, NotebookPen, ExternalLink, Check, Bookmark, Flame, Sparkles, CalendarDays, AlarmClock, Lightbulb, Search } from 'lucide-react'
import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { todayISO, prettyDay } from '../lib/date'
import { shelf, progressPct, readingSummary, projectedBooksThisYear, estimatedFinish, readingStreak, averageDaysToFinish, yearInBooks, finishedByMonth, staleBooks, allLearnings, ratingDistribution } from '../lib/reading'
import { StatTile } from '../components/ui'
import { CollapsibleSection } from '../components/trackers/CollapsibleSection'
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
  const projected = projectedBooksThisYear(books, today)
  const streak = readingStreak(books, today)
  const avgDays = averageDaysToFinish(books)
  const wrapped = yearInBooks(books, today)
  const byMonth = finishedByMonth(books, today)
  const maxMonth = Math.max(1, ...byMonth.map((m) => m.count))
  const stale = staleBooks(books, today)
  const ratingDist = ratingDistribution(books)
  const ratedTotal = ratingDist.reduce((a, r) => a + r.count, 0)

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')

  function add() {
    const t = title.trim()
    if (!t) return
    store.addBook({ title: t, author: author.trim() || undefined, status: 'want' })
    setTitle(''); setAuthor('')
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Reading now" value={sum.reading} color="mauve" />
        <StatTile label="Finished this year" value={sum.finishedThisYear} color="green" />
        <StatTile label="Pages read" value={sum.pages.toLocaleString()} color="peach" />
        <StatTile label="Avg rating" value={sum.avgRating ? sum.avgRating.toFixed(1) + '★' : '—'} color="yellow" />
        <StatTile label="Reading streak" value={streak ? `${streak}d` : '—'} color="red" icon={<Flame size={14} />} />
        <StatTile label="Avg days/book" value={avgDays != null ? `${avgDays}d` : '—'} color="sky" />
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
            <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 text-xs text-overlay0">
              <span>{sum.finishedThisYear} of {goal} finished this year</span>
              {projected != null && (
                <span style={{ color: cat(projected >= goal ? 'green' : 'peach') }}>
                  On pace for {projected} {projected >= goal ? '· ahead of goal' : '· behind goal'}
                </span>
              )}
            </div>
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

      {/* Stalled books nudge · pick back up or shelve */}
      {stale.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <AlarmClock size={16} className="text-peach" /> Stalled books
            <span className="text-overlay0">({stale.length})</span>
          </h3>
          <ul className="space-y-1.5 text-xs">
            {stale.map(({ book, idleDays }) => (
              <li key={book.id} className="flex items-center gap-2">
                <BookOpen size={12} className="shrink-0 text-overlay0" />
                <span className="min-w-0 flex-1 truncate text-subtext0">{book.title}</span>
                <span className="shrink-0 text-overlay0">{progressPct(book)}%</span>
                <span className="shrink-0 tabular-nums" style={{ color: cat('peach') }}>idle {idleDays}d</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Learnings · cross-book knowledge feed (collapsed, secondary) */}
      <CollapsibleSection title="Learnings" subtitle="cross-book knowledge feed">
        <LearningLog />
      </CollapsibleSection>

      {/* Reading analytics · volume + wrapped recap (deep, default-collapsed) */}
      <CollapsibleSection title="Reading analytics" subtitle="finished by month · year in books">
      {/* Books finished per month · paces the yearly goal visibly */}
      {byMonth.some((m) => m.count > 0) && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays size={16} className="text-green" /> Finished by month · {today.slice(0, 4)}
          </h3>
          <div className="flex items-end gap-1" style={{ height: 72 }} role="img"
            aria-label={`Books finished per month: ${byMonth.map((m) => `${m.label} ${m.count}`).join(', ')}`}>
            {byMonth.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t" title={`${m.label}: ${m.count}`}
                    style={{ height: `${m.count ? Math.max(8, (m.count / maxMonth) * 100) : 0}%`, background: m.count ? cat('green') : cat('surface1') }} />
                </div>
                <span className="text-[9px] text-overlay0">{m.label[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year in books · wrapped-style recap */}
      {wrapped && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles size={16} className="text-mauve" /> {wrapped.year} in books
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Books finished" value={wrapped.count} color="green" />
            <StatTile label="Pages read" value={wrapped.pages.toLocaleString()} color="peach" />
            <StatTile label="Avg rating" value={wrapped.avgRating ? wrapped.avgRating.toFixed(1) + '★' : '—'} color="yellow" />
            <StatTile label="Longest" value={wrapped.longest?.totalPages ? `${wrapped.longest.totalPages}p` : '—'} color="sky" />
          </div>
          {(wrapped.topRated || wrapped.longest) && (
            <div className="mt-3 space-y-1 text-xs text-overlay1">
              {wrapped.topRated && (
                <p className="flex items-center gap-1.5">
                  <Star size={12} className="fill-yellow text-yellow" /> Top-rated: <span className="text-subtext0">{wrapped.topRated.title}</span>
                </p>
              )}
              {wrapped.longest && (
                <p className="flex items-center gap-1.5">
                  <BookOpen size={12} className="text-sky" /> Longest read: <span className="text-subtext0">{wrapped.longest.title}</span>
                </p>
              )}
            </div>
          )}
          {/* Rating distribution · the shape of your taste */}
          {ratedTotal > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-2 text-[11px] font-medium text-subtext1">Rating distribution · {ratedTotal} rated</p>
              <div className="space-y-1">
                {[...ratingDist].reverse().map((r) => (
                  <div key={r.stars} className="flex items-center gap-2 text-xs">
                    <span className="flex w-12 shrink-0 items-center gap-0.5 text-overlay1">{r.stars}<Star size={10} className="fill-yellow text-yellow" /></span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full" style={{ width: `${ratedTotal ? (r.count / ratedTotal) * 100 : 0}%`, background: cat('yellow') }} />
                    </div>
                    <span className="w-6 shrink-0 text-right tabular-nums text-overlay0">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </CollapsibleSection>

      {/* Read later · saved links (bottom, collapsed) */}
      <CollapsibleSection title="Read later" subtitle="saved links">
        <ReadLater />
      </CollapsibleSection>
    </div>
  )
}

/**
 * Aggregated personal knowledge feed (#405): every dated learning from every
 * book in one searchable place, newest first. Read-only over book.learnings.
 */
function LearningLog() {
  const { data } = useJournal()
  const books = data.books ?? []
  const [q, setQ] = useState('')
  const total = books.reduce((n, b) => n + (b.learnings?.length ?? 0), 0)
  if (total === 0) return null
  const entries = allLearnings(books, q)

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <Lightbulb size={16} className="text-yellow" /> Learning log
        <span className="text-overlay0">({total})</span>
      </h3>
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-input bg-background px-2.5 py-1.5">
        <Search size={14} className="shrink-0 text-overlay0" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search learnings & titles…"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-overlay0" />
      </div>
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-surface1 p-4 text-center text-xs text-overlay0">No learnings match “{q}”.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {entries.map((l, i) => (
            <li key={i} className="text-xs">
              <div className="flex items-baseline gap-2">
                <span className="shrink-0 text-overlay0">{prettyDay(l.date)}</span>
                <span className="min-w-0 flex-1 text-subtext0">{l.text}</span>
              </div>
              <span className="ml-[4.5rem] inline-flex items-center gap-1 text-[10px] text-overlay0"><BookOpen size={9} /> {l.bookTitle}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReadLater() {
  const { data } = useJournal()
  const store = useJournal()
  const links = [...(data.readLinks ?? [])].sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt.localeCompare(a.createdAt))
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')

  function add() {
    const u = url.trim()
    if (!u) return
    store.addReadLink({ url: /^https?:\/\//.test(u) ? u : `https://${u}`, title: title.trim() || undefined })
    setUrl(''); setTitle('')
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <Bookmark size={16} className="text-sky" /> Read later · saved links
        <span className="text-overlay0">({links.filter((l) => !l.done).length} to read)</span>
      </h3>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Paste a link to read later"
          className="min-w-[12rem] flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Title (optional)"
          className="min-w-[8rem] flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
        <button onClick={add} className="press-3d inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-crust"><Plus size={15} /> Save</button>
      </div>
      {links.length === 0 ? (
        <p className="rounded-xl border border-dashed border-surface1 p-4 text-center text-xs text-overlay0">No saved links yet · paste an article or book page to read later.</p>
      ) : (
        <ul className="divide-y divide-border">
          {links.map((l) => (
            <li key={l.id} className="group flex items-center gap-2 py-2 text-sm">
              <button onClick={() => store.updateReadLink(l.id, { done: !l.done })} aria-label={l.done ? 'Mark unread' : 'Mark read'}
                className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${l.done ? 'border-green bg-green text-crust' : 'border-overlay0'}`}>
                {l.done && <Check size={11} />}
              </button>
              <a href={l.url} target="_blank" rel="noreferrer" className={`min-w-0 flex-1 truncate ${l.done ? 'text-overlay0 line-through' : 'text-subtext1 hover:text-foreground'}`}>
                {l.title || l.url}
              </a>
              <ExternalLink size={12} className="shrink-0 text-overlay0" />
              <button onClick={() => store.removeReadLink(l.id)} aria-label="Remove" className="shrink-0 text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red"><Trash2 size={13} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function BookCard({ book }: { book: Book }) {
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
          {est && (
            <p className="mt-1 text-[11px] text-overlay0">
              At this pace, done by <span className="text-subtext0">{prettyDay(est.iso)}</span> · ~{est.daysLeft}d left
            </p>
          )}
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
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {book.status !== 'want' && <Move label="Want" onClick={() => move('want')} />}
        {book.status !== 'reading' && <Move label="Reading" onClick={() => move('reading')} />}
        {book.status !== 'finished' && <Move label="Finished" onClick={() => move('finished')} />}
        <button onClick={() => setOpen((v) => !v)} className="ml-auto inline-flex items-center gap-1 text-[11px] text-overlay1 hover:text-foreground">
          <NotebookPen size={12} /> Notes{learnings.length ? ` (${learnings.length})` : ''} <ChevronDown size={12} className={open ? 'rotate-180 transition' : 'transition'} />
        </button>
      </div>

      {open && (
        <div className="mt-2.5 space-y-2 border-t border-border pt-2.5">
          {/* Link */}
          <div className="flex items-center gap-1.5">
            <Link2 size={13} className="shrink-0 text-overlay1" />
            <input value={book.link ?? ''} onChange={(e) => store.updateBook(book.id, { link: e.target.value || undefined })} placeholder="Link (summary, buy page, author…)"
              className="w-full rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground" />
            {book.link && <a href={book.link} target="_blank" rel="noreferrer" className="text-mauve"><ExternalLink size={13} /></a>}
          </div>
          {/* Review */}
          <textarea value={book.notes ?? ''} onChange={(e) => store.updateBook(book.id, { notes: e.target.value || undefined })} placeholder="Your review / overall takeaways…" rows={2}
            className="w-full rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground" />
          {/* What I learned · dated log */}
          <div>
            <p className="mb-1 text-[11px] font-medium text-subtext1">What I learned</p>
            {learnings.length > 0 && (
              <ul className="mb-1.5 space-y-1">
                {learnings.map((l, i) => (
                  <li key={i} className="group flex items-start gap-1.5 text-xs text-overlay1">
                    <span className="shrink-0 text-overlay0">{prettyDay(l.date)}:</span>
                    <span className="flex-1">{l.text}</span>
                    <button onClick={() => store.removeBookLearning(book.id, i)} aria-label="Remove" className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-1.5">
              <input value={learn} onChange={(e) => setLearn(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLearning()} placeholder="What did you learn today?"
                className="w-full rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground" />
              <button onClick={addLearning} className="shrink-0 rounded-md bg-primary px-2 text-xs font-medium text-crust">Add</button>
            </div>
          </div>
        </div>
      )}
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

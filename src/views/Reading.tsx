import { Alarm, ArrowSquareOut, BookOpen, Bookmark, Books, CalendarBlank, CaretDown, Check, CheckCircle, Flame, Lightbulb, Link, MagnifyingGlass, NotePencil, Plus, Sparkle, Star, Target, Trash } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { todayISO, prettyDay } from '../lib/date'
import { shelf, progressPct, readingSummary, projectedBooksThisYear, estimatedFinish, readingStreak, averageDaysToFinish, yearInBooks, finishedByMonth, staleBooks, allLearnings, ratingDistribution } from '../lib/reading'
import { StatTile } from '../components/ui'
import { Button } from '../components/ui/button'
import { QuietSection as CollapsibleSection } from '../components/CollapsibleSection'
import { Page } from '../components/shell/Page'
import type { Book, BookStatus } from '../lib/types'

const SHELVES: { id: BookStatus; label: string; icon: typeof BookOpen; color: string }[] = [
  { id: 'want', label: 'Want to read', icon: Books, color: 'sky' },
  { id: 'reading', label: 'Reading now', icon: BookOpen, color: 'mauve' },
  { id: 'finished', label: 'Finished', icon: CheckCircle, color: 'green' },
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
    <Page>
      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Reading now" value={sum.reading} color="mauve" />
        <StatTile label="Finished this year" value={sum.finishedThisYear} color="green" />
        <StatTile label="Pages read" value={sum.pages.toLocaleString()} color="peach" />
        <StatTile label="Avg rating" value={sum.avgRating ? sum.avgRating.toFixed(1) + '★' : '—'} color="yellow" />
        <StatTile label="Reading streak" value={streak ? `${streak}d` : '—'} color="red" icon={<AppIcon as={Flame} size="sm" />} />
        <StatTile label="Avg days/book" value={avgDays != null ? `${avgDays}d` : '—'} color="sky" />
      </div>

      {/* Yearly goal */}
      <div className="rounded-card border border-line bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          {/* Real headings, not styled spans: this view hand-rolls its cards
              instead of using <Card>, so it was the one view with no <h2> at
              all under the page <h1> — the whole page read as unstructured
              text to a screen reader. */}
          <h2 className="inline-flex items-center gap-1.5 text-body font-medium text-foreground"><AppIcon as={Target} size="sm" className="text-primary" /> Yearly reading goal</h2>
          <div className="flex items-center gap-2 text-body">
            <input type="number" min={0} value={goal || ''} placeholder="0"
              onChange={(e) => setSettings({ readingGoalBooks: Math.max(0, Number(e.target.value) || 0) })}
              className="w-16 rounded-control border border-input bg-background px-2 py-1 text-right text-foreground" />
            <span className="text-fg-2">books</span>
          </div>
        </div>
        {goal > 0 && (
          <>
            <div className="h-2 overflow-hidden rounded-pill bg-secondary">
              <div className="h-full rounded-pill bg-green transition-[width]" style={{ width: `${Math.min(100, Math.round((sum.finishedThisYear / goal) * 100))}%` }} />
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 text-label text-fg-2">
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
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-card p-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title"
          onKeyDown={(e) => e.key === 'Enter' && add()}
          className="min-w-[12rem] flex-1 rounded-control border border-input bg-background px-3 py-2 text-body text-foreground" />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author (optional)"
          onKeyDown={(e) => e.key === 'Enter' && add()}
          className="min-w-[10rem] flex-1 rounded-control border border-input bg-background px-3 py-2 text-body text-foreground" />
        <Button variant="secondary" onClick={add} className="press-3d inline-flex items-center gap-1.5">
          <AppIcon as={Plus} size="sm" /> Add to shelf
        </Button>
      </div>

      {/* Shelves */}
      <div className="grid gap-5 md:grid-cols-3">
        {SHELVES.map((s) => {
          const list = shelf(books, s.id)
          const Icon = s.icon
          return (
            <section key={s.id} className="space-y-3">
              {/* h2, not h3: each shelf is a top-level section of the page, and
                  the page's h1 lives in the top bar. */}
              <h2 className="flex items-center gap-2 text-body font-medium text-foreground">
                <AppIcon as={Icon} size="md" style={{ color: cat(s.color) }} /> {s.label}
                <span className="text-fg-2">({list.length})</span>
              </h2>
              {list.length === 0 && <p className="rounded-card border border-dashed border-line-strong p-4 text-center text-label text-fg-2">Nothing here yet.</p>}
              {list.map((b) => <BookCard key={b.id} book={b} />)}
            </section>
          )
        })}
      </div>

      {/* Stalled books nudge · pick back up or shelve */}
      {stale.length > 0 && (
        <div className="rounded-card border border-line bg-card p-4">
          <h2 className="mb-2 flex items-center gap-2 text-body font-medium text-foreground">
            <AppIcon as={Alarm} size="md" className="text-peach" /> Stalled books
            <span className="text-fg-2">({stale.length})</span>
          </h2>
          <ul className="space-y-1.5 text-label">
            {stale.map(({ book, idleDays }) => (
              <li key={book.id} className="flex items-center gap-2">
                <AppIcon as={BookOpen} size="sm" className="shrink-0 text-fg-2" />
                <span className="min-w-0 flex-1 truncate text-fg-2">{book.title}</span>
                <span className="shrink-0 text-fg-2">{progressPct(book)}%</span>
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
      <CollapsibleSection title="Reading analytics" subtitle="finished by month, year in books">
      {/* Books finished per month · paces the yearly goal visibly */}
      {byMonth.some((m) => m.count > 0) && (
        <div className="rounded-card border border-line bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-body font-medium text-foreground">
            <AppIcon as={CalendarBlank} size="md" className="text-green" /> Finished by month · {today.slice(0, 4)}
          </h3>
          {/* `items-stretch`, not `items-end`: cross-axis `end` collapses each
              column to its label, leaving the `flex-1` bar track at 0px and the
              chart flat. See `views/Insights.tsx`. */}
          <div className="flex items-stretch gap-1" style={{ height: 72 }} role="img"
            aria-label={`Books finished per month: ${byMonth.map((m) => `${m.label} ${m.count}`).join(', ')}`}>
            {byMonth.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t" title={`${m.label}: ${m.count}`}
                    style={{ height: `${m.count ? Math.max(8, (m.count / maxMonth) * 100) : 0}%`, background: m.count ? cat('green') : cat('surface1') }} />
                </div>
                <span className="text-micro text-fg-2">{m.label[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year in books · wrapped-style recap */}
      {wrapped && (
        <div className="rounded-card border border-line bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-body font-medium text-foreground">
            <AppIcon as={Sparkle} size="md" className="text-mauve" /> {wrapped.year} in books
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Books finished" value={wrapped.count} color="green" />
            {/* "Pages finished", not "Pages read" — the strip at the top of this
                page already says "Pages read" and means something else: it is
                `pagesRead`, all-time, counting how far into the current book you
                are. This one counts finished books only, this year. Both were
                right and both were labelled the same, so the page showed 440 and
                320 under one name and cost more trust than either number gave. */}
            <StatTile label="Pages finished" value={wrapped.pages.toLocaleString()} color="peach" />
            <StatTile label="Avg rating" value={wrapped.avgRating ? wrapped.avgRating.toFixed(1) + '★' : '—'} color="yellow" />
            <StatTile label="Longest" value={wrapped.longest?.totalPages ? `${wrapped.longest.totalPages}p` : '—'} color="sky" />
          </div>
          {(wrapped.topRated || wrapped.longest) && (
            <div className="mt-3 space-y-1 text-label text-fg-2">
              {wrapped.topRated && (
                <p className="flex items-center gap-1.5">
                  <AppIcon as={Star} size="sm" className="fill-yellow text-yellow" /> Top-rated: <span className="text-fg-2">{wrapped.topRated.title}</span>
                </p>
              )}
              {wrapped.longest && (
                <p className="flex items-center gap-1.5">
                  <AppIcon as={BookOpen} size="sm" className="text-sky" /> Longest read: <span className="text-fg-2">{wrapped.longest.title}</span>
                </p>
              )}
            </div>
          )}
          {/* Rating distribution · the shape of your taste */}
          {ratedTotal > 0 && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="mb-2 text-caption font-medium text-fg-1">Rating distribution · {ratedTotal} rated</p>
              <div className="space-y-1">
                {[...ratingDist].reverse().map((r) => (
                  <div key={r.stars} className="flex items-center gap-2 text-label">
                    <span className="flex w-12 shrink-0 items-center gap-0.5 text-fg-2">{r.stars}<AppIcon as={Star} size="sm" className="fill-yellow text-yellow" /></span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-pill bg-secondary">
                      <div className="h-full rounded-pill" style={{ width: `${ratedTotal ? (r.count / ratedTotal) * 100 : 0}%`, background: cat('yellow') }} />
                    </div>
                    <span className="w-6 shrink-0 text-right tabular-nums text-fg-2">{r.count}</span>
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
    </Page>
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
    <div className="rounded-card border border-line bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-body font-medium text-foreground">
        <AppIcon as={Lightbulb} size="md" className="text-yellow" /> Learning log
        <span className="text-fg-2">({total})</span>
      </h3>
      <div className="mb-3 flex items-center gap-2 rounded-control border border-input bg-background px-2.5 py-1.5">
        <AppIcon as={MagnifyingGlass} size="sm" className="shrink-0 text-fg-2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search learnings & titles…"
          className="w-full bg-transparent text-body text-foreground outline-none placeholder:text-fg-2" />
      </div>
      {entries.length === 0 ? (
        <p className="rounded-card border border-dashed border-line-strong p-4 text-center text-label text-fg-2">No learnings match “{q}”.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {entries.map((l, i) => (
            <li key={i} className="text-label">
              <div className="flex items-baseline gap-2">
                <span className="shrink-0 text-fg-2">{prettyDay(l.date)}</span>
                <span className="min-w-0 flex-1 text-fg-2">{l.text}</span>
              </div>
              <span className="ml-[4.5rem] inline-flex items-center gap-1 text-micro text-fg-2"><AppIcon as={BookOpen} size="sm" /> {l.bookTitle}</span>
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
    <div className="rounded-card border border-line bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-body font-medium text-foreground">
        <AppIcon as={Bookmark} size="md" className="text-sky" /> Read later · saved links
        <span className="text-fg-2">({links.filter((l) => !l.done).length} to read)</span>
      </h3>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Paste a link to read later"
          className="min-w-[12rem] flex-1 rounded-control border border-input bg-background px-3 py-2 text-body text-foreground" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Title (optional)"
          className="min-w-[8rem] flex-1 rounded-control border border-input bg-background px-3 py-2 text-body text-foreground" />
        <Button variant="secondary" onClick={add} className="press-3d inline-flex items-center gap-1.5"><AppIcon as={Plus} size="sm" /> Save</Button>
      </div>
      {links.length === 0 ? (
        <p className="rounded-card border border-dashed border-line-strong p-4 text-center text-label text-fg-2">No saved links yet, paste an article or book page to read later.</p>
      ) : (
        <ul className="divide-y divide-border">
          {links.map((l) => (
            <li key={l.id} className="group flex items-center gap-2 py-2 text-body">
              <button onClick={() => store.updateReadLink(l.id, { done: !l.done })} aria-label={l.done ? 'Mark unread' : 'Mark read'}
                className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${l.done ? 'border-green bg-green text-crust' : 'border-overlay0'}`}>
                {l.done && <AppIcon as={Check} size="sm" />}
              </button>
              <a href={l.url} target="_blank" rel="noreferrer" className={`min-w-0 flex-1 truncate ${l.done ? 'text-fg-2 line-through' : 'text-fg-1 hover:text-foreground'}`}>
                {l.title || l.url}
              </a>
              <AppIcon as={ArrowSquareOut} size="sm" className="shrink-0 text-fg-2" />
              <Button variant="ghost" size="icon-sm" onClick={() => store.removeReadLink(l.id)} aria-label="Remove" className="shrink-0 text-fg-2 opacity-0 group-hover:opacity-100 hover:text-red"><AppIcon as={Trash} size="sm" /></Button>
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
    <div className="rounded-card border border-line bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-body font-medium text-foreground">{book.title}</p>
          {book.author && <p className="truncate text-label text-fg-2">{book.author}</p>}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => store.removeBook(book.id)} aria-label="Remove book" className="text-fg-2 hover:text-red"><AppIcon as={Trash} size="sm" /></Button>
      </div>

      {book.status === 'reading' && (
        <div className="mt-2">
          <div className="flex items-center gap-2 text-label text-fg-2">
            <input type="number" min={0} value={book.currentPage ?? ''} placeholder="0"
              onChange={(e) => store.updateBook(book.id, { currentPage: Math.max(0, Number(e.target.value) || 0) })}
              className="w-14 rounded-card border border-input bg-card px-1.5 py-0.5 text-right text-foreground" />
            <span>/</span>
            <input type="number" min={0} value={book.totalPages ?? ''} placeholder="pages"
              onChange={(e) => store.updateBook(book.id, { totalPages: Math.max(0, Number(e.target.value) || 0) || undefined })}
              className="w-16 rounded-card border border-input bg-card px-1.5 py-0.5 text-right text-foreground" />
            <span className="ml-auto font-medium text-primary">{pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-secondary">
            <div className="h-full rounded-pill bg-primary transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          {est && (
            <p className="mt-1 text-caption text-fg-2">
              At this pace, done by <span className="text-fg-2">{prettyDay(est.iso)}</span> · ~{est.daysLeft}d left
            </p>
          )}
        </div>
      )}

      {book.status === 'finished' && (
        <div className="mt-2 flex items-center gap-1">
          {/* `fill-yellow` did nothing here: these glyphs are drawn at two
              weights only (see `Icon`), and the regular Star is an outline ring
              — filling it colours the ring, not the star. A 5-star book drew
              five hollow stars, identical to an unrated one. Weight carries the
              state now, which is the rule the icon system already states.
              `aria-pressed` says the same thing to a screen reader, which had
              no way at all to hear the current rating. */}
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => store.updateBook(book.id, { rating: n })}
              aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`}
              aria-pressed={n <= (book.rating ?? 0)}
              className="grid size-6 place-items-center"
            >
              <AppIcon as={Star} size="sm" active={n <= (book.rating ?? 0)} className={n <= (book.rating ?? 0) ? 'text-yellow' : 'text-fg-2'} />
            </button>
          ))}
        </div>
      )}

      {/* Shelf controls */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {book.status !== 'want' && <Move label="Want" onClick={() => move('want')} />}
        {book.status !== 'reading' && <Move label="Reading" onClick={() => move('reading')} />}
        {book.status !== 'finished' && <Move label="Finished" onClick={() => move('finished')} />}
        <button onClick={() => setOpen((v) => !v)} className="ml-auto inline-flex items-center gap-1 text-caption text-fg-2 hover:text-foreground">
          <AppIcon as={NotePencil} size="sm" /> Notes{learnings.length ? ` (${learnings.length})` : ''} <AppIcon as={CaretDown} size="sm" className={open ? 'rotate-180 transition' : 'transition'} />
        </button>
      </div>

      {open && (
        <div className="mt-2.5 space-y-2 border-t border-line pt-2.5">
          {/* Link */}
          <div className="flex items-center gap-1.5">
            <AppIcon as={Link} size="sm" className="shrink-0 text-fg-2" />
            <input value={book.link ?? ''} onChange={(e) => store.updateBook(book.id, { link: e.target.value || undefined })} placeholder="Link (summary, buy page, author…)"
              className="w-full rounded-card border border-input bg-card px-2 py-1 text-label text-foreground" />
            {book.link && <a href={book.link} target="_blank" rel="noreferrer" className="text-mauve"><AppIcon as={ArrowSquareOut} size="sm" /></a>}
          </div>
          {/* Review */}
          <textarea value={book.notes ?? ''} onChange={(e) => store.updateBook(book.id, { notes: e.target.value || undefined })} placeholder="Your review / overall takeaways…" rows={2}
            className="w-full rounded-card border border-input bg-card px-2 py-1 text-label text-foreground" />
          {/* What I learned · dated log */}
          <div>
            <p className="mb-1 text-caption font-medium text-fg-1">What I learned</p>
            {learnings.length > 0 && (
              <ul className="mb-1.5 space-y-1">
                {learnings.map((l, i) => (
                  <li key={i} className="group flex items-start gap-1.5 text-label text-fg-2">
                    <span className="shrink-0 text-fg-2">{prettyDay(l.date)}:</span>
                    <span className="flex-1">{l.text}</span>
                    <Button variant="ghost" size="icon-sm" onClick={() => store.removeBookLearning(book.id, i)} aria-label="Remove" className="text-fg-2 opacity-0 group-hover:opacity-100 hover:text-red">×</Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-1.5">
              <input value={learn} onChange={(e) => setLearn(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLearning()} placeholder="What did you learn today?"
                className="w-full rounded-card border border-input bg-card px-2 py-1 text-label text-foreground" />
              <Button variant="secondary" onClick={addLearning} size="sm" className="shrink-0">Add</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Move({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button onClick={onClick} variant="ghost" size="sm" className="border border-line text-fg-2 hover:border-primary hover:text-foreground">
      → {label}
    </Button>
  )
}

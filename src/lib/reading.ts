import type { Book, BookStatus } from './types'
import { addDays, dayDiff } from './date'

/** Books on a given shelf, newest-added first. */
export function shelf(books: Book[], status: BookStatus): Book[] {
  return books.filter((b) => b.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** 0–100 reading progress for a book (0 when total pages unknown). */
export function progressPct(book: Book): number {
  if (!book.totalPages || book.totalPages <= 0) return 0
  const cur = Math.min(book.currentPage ?? 0, book.totalPages)
  return Math.round((cur / book.totalPages) * 100)
}

/** Count of books finished in the given calendar year (defaults to today's). */
export function finishedThisYear(books: Book[], today: string): number {
  const year = today.slice(0, 4)
  return books.filter((b) => b.status === 'finished' && b.finishedOn?.slice(0, 4) === year).length
}

/**
 * Total pages read: finished books count their full length; in-progress books
 * count pages read so far, but only when their total length is known.
 * Books with unknown length contribute nothing.
 */
export function pagesRead(books: Book[]): number {
  return books.reduce((sum, b) => {
    if (b.status === 'finished') return sum + (b.totalPages ?? 0)
    if (b.status === 'reading' && b.totalPages && b.totalPages > 0)
      return sum + Math.min(b.currentPage ?? 0, b.totalPages)
    return sum
  }, 0)
}

/** Average 1–5 rating across rated, finished books (0 when none rated). */
export function averageRating(books: Book[]): number {
  const rated = books.filter((b) => b.status === 'finished' && b.rating && b.rating > 0)
  if (!rated.length) return 0
  return rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length
}

/**
 * Year-end pace projection from books finished so far this year. Linearly
 * extrapolates the year-to-date finish rate across the full calendar year,
 * e.g. 3 books by day 90 → ~12 on pace. Returns null before any day has
 * elapsed. The projection is whole-number (you can't finish a fraction).
 */
export function projectedBooksThisYear(books: Book[], today: string): number | null {
  const year = Number(today.slice(0, 4))
  const dayOfYear = dayDiff(`${year}-01-01`, today) + 1 // 1-based
  if (dayOfYear < 1) return null
  const daysInYear = dayDiff(`${year}-01-01`, `${year}-12-31`) + 1
  const done = finishedThisYear(books, today)
  return Math.round((done / dayOfYear) * daysInYear)
}

/**
 * Estimated finish date for a book in progress, from its recent reading pace.
 * Pace = pages read since `startedOn` ÷ days elapsed; remaining pages ÷ pace
 * gives days left, added to today. Returns null when pace can't be computed
 * (not reading, total/current unknown, already complete, or no days elapsed).
 */
export function estimatedFinish(book: Book, today: string): { iso: string; daysLeft: number } | null {
  if (book.status !== 'reading') return null
  if (!book.totalPages || book.totalPages <= 0) return null
  if (!book.startedOn) return null
  const current = Math.min(book.currentPage ?? 0, book.totalPages)
  const remaining = book.totalPages - current
  if (remaining <= 0) return null
  const elapsed = Math.max(1, dayDiff(book.startedOn, today)) // avoid /0 on same-day
  const pagesPerDay = current / elapsed
  if (pagesPerDay <= 0) return null
  const daysLeft = Math.ceil(remaining / pagesPerDay)
  return { iso: addDays(today, daysLeft), daysLeft }
}

/**
 * Consecutive-day reading streak ending today (or yesterday), mirroring the
 * focusStreak mechanic. A day "counts" when it has dated reading activity:
 * a book was finished that day, or a dated learning was logged that day.
 * Returns 0 when there's no activity on today or yesterday.
 */
export function readingStreak(books: Book[], today: string): number {
  const active = new Set<string>()
  for (const b of books) {
    if (b.finishedOn) active.add(b.finishedOn)
    for (const l of b.learnings ?? []) active.add(l.date)
  }
  let cursor = active.has(today) ? today : addDays(today, -1)
  let n = 0
  while (active.has(cursor)) { n += 1; cursor = addDays(cursor, -1) }
  return n
}

/**
 * Mean number of days between startedOn and finishedOn across finished books
 * that have both dates. Same-day finishes count as 1 day. Returns null when no
 * finished book has both a start and finish date.
 */
export function averageDaysToFinish(books: Book[]): number | null {
  const spans = books
    .filter((b) => b.status === 'finished' && b.startedOn && b.finishedOn)
    .map((b) => Math.max(1, dayDiff(b.startedOn!, b.finishedOn!)))
  if (!spans.length) return null
  return Math.round(spans.reduce((a, d) => a + d, 0) / spans.length)
}

/**
 * Year-in-books recap for a given calendar year (defaults via `today`): the
 * Spotify-Wrapped-style summary over books finished that year. Returns null
 * when no book was finished in the year. Pages count a book's totalPages (0 if
 * unknown); top-rated/longest pick the best finished book by rating/pages.
 */
export function yearInBooks(books: Book[], today: string): {
  year: string
  count: number
  pages: number
  avgRating: number
  topRated: Book | null
  longest: Book | null
} | null {
  const year = today.slice(0, 4)
  const finished = books.filter((b) => b.status === 'finished' && b.finishedOn?.slice(0, 4) === year)
  if (!finished.length) return null
  const rated = finished.filter((b) => b.rating && b.rating > 0)
  const avgRating = rated.length ? rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length : 0
  const topRated = rated.length
    ? rated.reduce((best, b) => ((b.rating ?? 0) > (best.rating ?? 0) ? b : best))
    : null
  const withPages = finished.filter((b) => b.totalPages && b.totalPages > 0)
  const longest = withPages.length
    ? withPages.reduce((best, b) => ((b.totalPages ?? 0) > (best.totalPages ?? 0) ? b : best))
    : null
  return {
    year,
    count: finished.length,
    pages: finished.reduce((s, b) => s + (b.totalPages ?? 0), 0),
    avgRating,
    topRated,
    longest,
  }
}

/** A compact summary for the Insights / Goals rollups. */
export function readingSummary(books: Book[], today: string) {
  return {
    want: books.filter((b) => b.status === 'want').length,
    reading: books.filter((b) => b.status === 'reading').length,
    finished: books.filter((b) => b.status === 'finished').length,
    finishedThisYear: finishedThisYear(books, today),
    pages: pagesRead(books),
    avgRating: averageRating(books),
  }
}

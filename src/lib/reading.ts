import type { Book, BookStatus } from './types'

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
 * count pages read so far. Books with unknown length contribute nothing.
 */
export function pagesRead(books: Book[]): number {
  return books.reduce((sum, b) => {
    if (b.status === 'finished') return sum + (b.totalPages ?? 0)
    if (b.status === 'reading') return sum + Math.min(b.currentPage ?? 0, b.totalPages ?? Infinity)
    return sum
  }, 0)
}

/** Average 1–5 rating across rated, finished books (0 when none rated). */
export function averageRating(books: Book[]): number {
  const rated = books.filter((b) => b.status === 'finished' && b.rating && b.rating > 0)
  if (!rated.length) return 0
  return rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length
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

import { describe, it, expect } from 'vitest'
import { shelf, progressPct, finishedThisYear, pagesRead, averageRating, readingSummary, projectedBooksThisYear, estimatedFinish } from './reading'
import type { Book } from './types'

const mk = (p: Partial<Book>): Book => ({
  id: p.id ?? 'b', title: p.title ?? 'T', status: p.status ?? 'want',
  createdAt: p.createdAt ?? '2026-01-01', ...p,
})

describe('reading', () => {
  it('progressPct clamps and rounds; 0 when total unknown', () => {
    expect(progressPct(mk({ status: 'reading', currentPage: 50, totalPages: 200 }))).toBe(25)
    expect(progressPct(mk({ status: 'reading', currentPage: 999, totalPages: 200 }))).toBe(100)
    expect(progressPct(mk({ status: 'reading', currentPage: 50 }))).toBe(0)
  })

  it('shelf filters by status, newest-added first', () => {
    const books = [
      mk({ id: '1', status: 'want', createdAt: '2026-01-01' }),
      mk({ id: '2', status: 'want', createdAt: '2026-02-01' }),
      mk({ id: '3', status: 'reading' }),
    ]
    expect(shelf(books, 'want').map((b) => b.id)).toEqual(['2', '1'])
    expect(shelf(books, 'reading').map((b) => b.id)).toEqual(['3'])
  })

  it('finishedThisYear counts only finished books in the given year', () => {
    const books = [
      mk({ status: 'finished', finishedOn: '2026-03-01' }),
      mk({ status: 'finished', finishedOn: '2025-12-31' }),
      mk({ status: 'reading' }),
    ]
    expect(finishedThisYear(books, '2026-06-18')).toBe(1)
  })

  it('pagesRead sums finished totals + in-progress current', () => {
    const books = [
      mk({ status: 'finished', totalPages: 300 }),
      mk({ status: 'reading', currentPage: 40, totalPages: 200 }),
      mk({ status: 'want', totalPages: 500 }),
    ]
    expect(pagesRead(books)).toBe(340)
  })

  it('pagesRead ignores in-progress currentPage when total is unknown', () => {
    const books = [
      mk({ status: 'reading', currentPage: 120 }),
      mk({ status: 'reading', currentPage: 120, totalPages: 0 }),
      mk({ status: 'reading', currentPage: 30, totalPages: 200 }),
    ]
    expect(pagesRead(books)).toBe(30)
  })

  it('averageRating ignores unrated / unfinished', () => {
    const books = [
      mk({ status: 'finished', rating: 5 }),
      mk({ status: 'finished', rating: 3 }),
      mk({ status: 'finished' }),
      mk({ status: 'reading', rating: 4 }),
    ]
    expect(averageRating(books)).toBe(4)
    expect(averageRating([])).toBe(0)
  })

  it('readingSummary aggregates every shelf', () => {
    const books = [
      mk({ status: 'want' }),
      mk({ status: 'reading', currentPage: 10, totalPages: 100 }),
      mk({ status: 'finished', finishedOn: '2026-01-05', totalPages: 250, rating: 4 }),
    ]
    const s = readingSummary(books, '2026-06-18')
    expect(s).toMatchObject({ want: 1, reading: 1, finished: 1, finishedThisYear: 1, pages: 260, avgRating: 4 })
  })

  it('projectedBooksThisYear extrapolates year-to-date pace', () => {
    // 3 books finished by day 90 (Mar 31) → 3/90*365 ≈ 12
    const books = [
      mk({ status: 'finished', finishedOn: '2026-01-15' }),
      mk({ status: 'finished', finishedOn: '2026-02-15' }),
      mk({ status: 'finished', finishedOn: '2026-03-15' }),
    ]
    expect(projectedBooksThisYear(books, '2026-03-31')).toBe(12)
  })

  it('projectedBooksThisYear is 0 when nothing finished', () => {
    expect(projectedBooksThisYear([], '2026-06-30')).toBe(0)
  })

  it('estimatedFinish projects from pages-per-day pace', () => {
    // 100 pages over 10 days = 10 pg/day; 100 remaining → 10 days left
    const book = mk({ status: 'reading', startedOn: '2026-06-01', currentPage: 100, totalPages: 200 })
    const est = estimatedFinish(book, '2026-06-11')
    expect(est).toEqual({ iso: '2026-06-21', daysLeft: 10 })
  })

  it('estimatedFinish returns null when not enough data', () => {
    expect(estimatedFinish(mk({ status: 'want', totalPages: 200, startedOn: '2026-06-01', currentPage: 50 }), '2026-06-11')).toBeNull()
    expect(estimatedFinish(mk({ status: 'reading', currentPage: 50, startedOn: '2026-06-01' }), '2026-06-11')).toBeNull()
    expect(estimatedFinish(mk({ status: 'reading', totalPages: 200, currentPage: 50 }), '2026-06-11')).toBeNull()
    // already at/past the end → nothing to project
    expect(estimatedFinish(mk({ status: 'reading', totalPages: 200, currentPage: 200, startedOn: '2026-06-01' }), '2026-06-11')).toBeNull()
    // no pages read yet → no pace
    expect(estimatedFinish(mk({ status: 'reading', totalPages: 200, currentPage: 0, startedOn: '2026-06-01' }), '2026-06-11')).toBeNull()
  })
})

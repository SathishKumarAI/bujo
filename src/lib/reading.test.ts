import { describe, it, expect } from 'vitest'
import { shelf, progressPct, finishedThisYear, pagesRead, averageRating, readingSummary } from './reading'
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
})

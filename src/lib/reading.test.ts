import { describe, it, expect } from 'vitest'
import { shelf, progressPct, finishedThisYear, pagesRead, averageRating, readingSummary, projectedBooksThisYear, estimatedFinish, readingStreak, averageDaysToFinish, yearInBooks, finishedByMonth, staleBooks, allLearnings, ratingDistribution } from './reading'
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

  it('readingStreak counts consecutive days of dated reading activity', () => {
    const books = [
      mk({ status: 'finished', finishedOn: '2026-06-18' }),
      mk({ status: 'reading', learnings: [{ date: '2026-06-17', text: 'a' }, { date: '2026-06-16', text: 'b' }] }),
    ]
    // today (18) + 17 + 16 all active → 3
    expect(readingStreak(books, '2026-06-18')).toBe(3)
  })

  it('readingStreak counts from yesterday when today has no activity', () => {
    const books = [mk({ status: 'reading', learnings: [{ date: '2026-06-17', text: 'a' }] })]
    expect(readingStreak(books, '2026-06-18')).toBe(1)
  })

  it('readingStreak is 0 with a gap before today/yesterday', () => {
    const books = [mk({ status: 'finished', finishedOn: '2026-06-10' })]
    expect(readingStreak(books, '2026-06-18')).toBe(0)
    expect(readingStreak([], '2026-06-18')).toBe(0)
  })

  it('averageDaysToFinish averages startedOn→finishedOn spans', () => {
    const books = [
      mk({ status: 'finished', startedOn: '2026-01-01', finishedOn: '2026-01-11' }), // 10
      mk({ status: 'finished', startedOn: '2026-02-01', finishedOn: '2026-02-21' }), // 20
      mk({ status: 'finished', startedOn: '2026-03-01', finishedOn: '2026-03-01' }), // same day → 1
      mk({ status: 'finished', finishedOn: '2026-04-01' }), // no start → ignored
      mk({ status: 'reading', startedOn: '2026-01-01' }), // not finished → ignored
    ]
    expect(averageDaysToFinish(books)).toBe(Math.round((10 + 20 + 1) / 3))
  })

  it('averageDaysToFinish is null when no finished book has both dates', () => {
    expect(averageDaysToFinish([mk({ status: 'finished', finishedOn: '2026-04-01' })])).toBeNull()
    expect(averageDaysToFinish([])).toBeNull()
  })

  it('yearInBooks recaps the year, picking top-rated and longest', () => {
    const books = [
      mk({ id: 'a', status: 'finished', finishedOn: '2026-02-01', totalPages: 300, rating: 4 }),
      mk({ id: 'b', status: 'finished', finishedOn: '2026-05-01', totalPages: 500, rating: 5 }),
      mk({ id: 'c', status: 'finished', finishedOn: '2025-12-31', totalPages: 999, rating: 5 }), // last year
      mk({ id: 'd', status: 'reading' }),
    ]
    const w = yearInBooks(books, '2026-06-18')!
    expect(w.year).toBe('2026')
    expect(w.count).toBe(2)
    expect(w.pages).toBe(800)
    expect(w.avgRating).toBe(4.5)
    expect(w.topRated?.id).toBe('b')
    expect(w.longest?.id).toBe('b')
  })

  it('yearInBooks is null when nothing finished this year', () => {
    expect(yearInBooks([mk({ status: 'finished', finishedOn: '2025-01-01' })], '2026-06-18')).toBeNull()
  })

  it('finishedByMonth buckets finished books into the 12 months of the year', () => {
    const books = [
      mk({ status: 'finished', finishedOn: '2026-01-10' }),
      mk({ status: 'finished', finishedOn: '2026-01-28' }),
      mk({ status: 'finished', finishedOn: '2026-05-02' }),
      mk({ status: 'finished', finishedOn: '2025-05-02' }), // last year → ignored
      mk({ status: 'reading' }), // not finished → ignored
    ]
    const by = finishedByMonth(books, '2026-06-18')
    expect(by.length).toBe(12)
    expect(by[0]).toEqual({ month: 1, label: 'Jan', count: 2 })
    expect(by[4]).toEqual({ month: 5, label: 'May', count: 1 })
    expect(by.reduce((a, m) => a + m.count, 0)).toBe(3)
  })

  it('staleBooks flags idle in-progress books, most stale first', () => {
    const books = [
      // last activity 2026-06-01, 17 days idle by the 18th → stale
      mk({ id: 'a', status: 'reading', totalPages: 300, currentPage: 40, startedOn: '2026-05-20', learnings: [{ date: '2026-06-01', text: 'x' }] }),
      // started long ago, 28 days idle → stale, more idle than 'a'
      mk({ id: 'b', status: 'reading', totalPages: 200, currentPage: 10, startedOn: '2026-05-21' }),
      // recent activity → not stale
      mk({ id: 'c', status: 'reading', totalPages: 200, currentPage: 90, startedOn: '2026-06-15' }),
      // finished-by-page → excluded
      mk({ id: 'd', status: 'reading', totalPages: 100, currentPage: 100, startedOn: '2026-01-01' }),
      // not reading → excluded
      mk({ id: 'e', status: 'want', startedOn: '2026-01-01' }),
    ]
    const stale = staleBooks(books, '2026-06-18')
    expect(stale.map((s) => s.book.id)).toEqual(['b', 'a'])
    expect(stale[1].idleDays).toBe(17)
  })

  it('staleBooks ignores books with no dated activity and respects the threshold', () => {
    const books = [mk({ id: 'a', status: 'reading', totalPages: 300, currentPage: 40 })] // no startedOn / learnings
    expect(staleBooks(books, '2026-06-18')).toEqual([])
    const recent = [mk({ id: 'b', status: 'reading', totalPages: 300, currentPage: 40, startedOn: '2026-06-10' })]
    expect(staleBooks(recent, '2026-06-18', 14)).toEqual([]) // only 8 days idle
  })

  it('allLearnings aggregates every dated learning newest-first, tagged by book', () => {
    const books = [
      mk({ id: 'a', title: 'Dune', status: 'reading', learnings: [
        { date: '2026-06-10', text: 'spice matters' },
        { date: '2026-06-15', text: 'fear is the mind-killer' },
      ] }),
      mk({ id: 'b', title: 'Atomic Habits', status: 'finished', learnings: [
        { date: '2026-06-12', text: 'systems over goals' },
      ] }),
      mk({ id: 'c', title: 'No Notes', status: 'want' }),
    ]
    const all = allLearnings(books)
    expect(all.map((l) => l.date)).toEqual(['2026-06-15', '2026-06-12', '2026-06-10'])
    expect(all[0]).toEqual({ date: '2026-06-15', text: 'fear is the mind-killer', bookId: 'a', bookTitle: 'Dune' })
  })

  it('allLearnings filters by query across text and book title (case-insensitive)', () => {
    const books = [
      mk({ id: 'a', title: 'Dune', learnings: [{ date: '2026-06-10', text: 'spice matters' }] }),
      mk({ id: 'b', title: 'Atomic Habits', learnings: [{ date: '2026-06-12', text: 'systems over goals' }] }),
    ]
    expect(allLearnings(books, 'SPICE').map((l) => l.text)).toEqual(['spice matters'])
    expect(allLearnings(books, 'atomic').map((l) => l.bookTitle)).toEqual(['Atomic Habits'])
    expect(allLearnings(books, 'nothing')).toEqual([])
    expect(allLearnings([])).toEqual([])
  })

  it('ratingDistribution histograms finished, rated books by star', () => {
    const books = [
      mk({ status: 'finished', rating: 5 }),
      mk({ status: 'finished', rating: 5 }),
      mk({ status: 'finished', rating: 3 }),
      mk({ status: 'finished' }), // unrated → ignored
      mk({ status: 'reading', rating: 4 }), // unfinished → ignored
    ]
    const dist = ratingDistribution(books)
    expect(dist.length).toBe(5)
    expect(dist[2]).toEqual({ stars: 3, count: 1 })
    expect(dist[4]).toEqual({ stars: 5, count: 2 })
    expect(dist.reduce((a, d) => a + d.count, 0)).toBe(3)
    expect(ratingDistribution([]).every((d) => d.count === 0)).toBe(true)
  })
})

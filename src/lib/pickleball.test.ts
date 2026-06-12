import { describe, expect, it } from 'vitest'
import { pickleTotals, winRateSeries, weeklyGames, playStreak } from './pickleball'
import { emptyJournal } from './storage'
import type { PickleballSession } from './types'

const s = (date: string, won: number, lost: number): PickleballSession => ({ id: date, date, format: 'doubles', gamesWon: won, gamesLost: lost })

describe('pickleball', () => {
  it('totals compute win percentage as a whole number', () => {
    const d = emptyJournal()
    d.pickleball = [s('2026-06-10', 3, 1), s('2026-06-11', 1, 1)]
    const t = pickleTotals(d)
    expect(t).toMatchObject({ sessions: 2, gamesWon: 4, gamesLost: 2, games: 6 })
    expect(t.winPct).toBe(67)
  })

  it('empty journal is all zeros, never divides by zero', () => {
    expect(pickleTotals(emptyJournal()).winPct).toBe(0)
  })

  it('winRateSeries is oldest-first', () => {
    const d = emptyJournal()
    d.pickleball = [s('2026-06-11', 2, 0), s('2026-06-09', 0, 2)]
    const series = winRateSeries(d)
    expect(series.map((x) => x.winPct)).toEqual([0, 100])
  })

  it('weeklyGames returns the requested number of weeks', () => {
    expect(weeklyGames(emptyJournal(), 8)).toHaveLength(8)
  })

  it('playStreak counts consecutive days', () => {
    const d = emptyJournal()
    d.pickleball = [s('2026-06-11', 1, 0), s('2026-06-12', 1, 0)]
    expect(playStreak(d, '2026-06-12')).toBe(2)
  })
})

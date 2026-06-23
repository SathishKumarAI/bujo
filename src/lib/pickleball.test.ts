import { describe, expect, it } from 'vitest'
import { pickleTotals, winRateSeries, weeklyGames, playStreak, partnerStats, venueStats, opponentRecords } from './pickleball'
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

  it('pickleball minutes count toward Fitness active minutes', () => {
    const d = emptyJournal()
    d.pickleball = [{ ...s('2026-06-12', 2, 1), durationMin: 60 }]
    expect(weeklyActiveMinutes(d, '2026-06-12')).toBe(60)
  })

  it('partnerStats aggregates per partner, ignores untrimmed/missing, sorts by games', () => {
    const d = emptyJournal()
    d.pickleball = [
      { ...s('2026-06-10', 3, 1), partner: 'Ana' },
      { ...s('2026-06-11', 1, 1), partner: 'Ana' },
      { ...s('2026-06-12', 2, 0), partner: ' Bo ' }, // trimmed to "Bo"
      { ...s('2026-06-13', 1, 1) }, // no partner → ignored
    ]
    const ps = partnerStats(d)
    expect(ps.map((p) => p.partner)).toEqual(['Ana', 'Bo'])
    expect(ps[0]).toMatchObject({ partner: 'Ana', sessions: 2, games: 6, gamesWon: 4, gamesLost: 2, winPct: 67 })
    expect(ps[1]).toMatchObject({ partner: 'Bo', games: 2, winPct: 100 })
  })

  it('venueStats aggregates per location and computes win %', () => {
    const d = emptyJournal()
    d.pickleball = [
      { ...s('2026-06-10', 4, 0), location: 'Park Courts' },
      { ...s('2026-06-11', 1, 3), location: 'Park Courts' },
      { ...s('2026-06-12', 2, 2), location: 'Rec Center' },
    ]
    const vs = venueStats(d)
    expect(vs[0]).toMatchObject({ location: 'Park Courts', sessions: 2, games: 8, gamesWon: 5, winPct: 63 })
    expect(vs.find((v) => v.location === 'Rec Center')).toMatchObject({ winPct: 50 })
  })

  it('opponentRecords builds head-to-head with net diff', () => {
    const d = emptyJournal()
    d.pickleball = [
      { ...s('2026-06-10', 3, 1), opponent: 'Rivals' },
      { ...s('2026-06-11', 0, 2), opponent: 'Rivals' },
      { ...s('2026-06-12', 1, 1), opponent: 'Nemesis' },
    ]
    const or = opponentRecords(d)
    expect(or[0]).toMatchObject({ opponent: 'Rivals', games: 6, gamesWon: 3, gamesLost: 3, winPct: 50, diff: 0 })
    expect(or.find((o) => o.opponent === 'Nemesis')).toMatchObject({ diff: 0, games: 2 })
  })

  it('partner/venue/opponent aggregates are empty for an empty journal', () => {
    const d = emptyJournal()
    expect(partnerStats(d)).toEqual([])
    expect(venueStats(d)).toEqual([])
    expect(opponentRecords(d)).toEqual([])
  })
})

import { weeklyActiveMinutes } from './fitness'

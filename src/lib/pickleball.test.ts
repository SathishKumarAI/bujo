import { describe, expect, it } from 'vitest'
import { pickleTotals, winRateSeries, weeklyGames, playStreak, partnerStats, venueStats, opponentRecords, rollingForm, winStreaks, pointDifferential, levelMatchup, weekdayPerformance, duprTrend } from './pickleball'
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

  it('rollingForm marks sessions newest-first and detects upward momentum', () => {
    const d = emptyJournal()
    // older half mostly losses, newer half wins → momentum up
    d.pickleball = [
      s('2026-06-01', 0, 2), s('2026-06-02', 1, 3), // L L (older)
      s('2026-06-03', 3, 0), s('2026-06-04', 2, 1), // W W (newer)
    ]
    const rf = rollingForm(d)
    expect(rf.results).toEqual(['W', 'W', 'L', 'L']) // newest first
    expect(rf).toMatchObject({ wins: 2, losses: 2, draws: 0, winPct: 50, momentum: 'up' })
  })

  it('rollingForm treats an even session as a draw and respects the window', () => {
    const d = emptyJournal()
    d.pickleball = [s('2026-06-05', 2, 2), s('2026-06-06', 3, 1)]
    expect(rollingForm(d, 1).results).toEqual(['W']) // window of 1 = newest only
    expect(rollingForm(d).results).toEqual(['W', '–'])
    expect(rollingForm(d)).toMatchObject({ wins: 1, losses: 0, draws: 1, winPct: 100 })
  })

  it('rollingForm is all zeros for an empty journal', () => {
    expect(rollingForm(emptyJournal())).toMatchObject({ wins: 0, losses: 0, draws: 0, winPct: 0, momentum: 'flat' })
  })

  it('winStreaks finds the longest run of winning sessions and the current streak', () => {
    const d = emptyJournal()
    d.pickleball = [
      s('2026-06-01', 2, 0), s('2026-06-02', 1, 0), s('2026-06-03', 1, 0), // 3 wins
      s('2026-06-04', 0, 2), // loss breaks it
      s('2026-06-05', 2, 1), s('2026-06-06', 3, 1), // 2 trailing wins
    ]
    expect(winStreaks(d)).toEqual({ longest: 3, current: 2 })
  })

  it('winStreaks current is 0 when the latest session is not a win', () => {
    const d = emptyJournal()
    d.pickleball = [s('2026-06-01', 2, 0), s('2026-06-02', 1, 1)]
    expect(winStreaks(d)).toEqual({ longest: 1, current: 0 })
  })

  it('pointDifferential sums points only from sessions that logged them', () => {
    const d = emptyJournal()
    d.pickleball = [
      { ...s('2026-06-01', 2, 0), pointsFor: 22, pointsAgainst: 14 },
      { ...s('2026-06-02', 1, 1), pointsFor: 20, pointsAgainst: 24 },
      s('2026-06-03', 1, 0), // no points → ignored
    ]
    expect(pointDifferential(d)).toEqual({ pointsFor: 42, pointsAgainst: 38, diff: 4, sessions: 2, avgMargin: 2 })
  })

  it('pointDifferential is empty-safe', () => {
    expect(pointDifferential(emptyJournal())).toMatchObject({ diff: 0, sessions: 0, avgMargin: 0 })
  })

  it('levelMatchup buckets by opponent level relative to median and computes win%', () => {
    const d = emptyJournal()
    d.pickleball = [
      { ...s('2026-06-01', 1, 3), level: '4.5' }, // stronger → 25%
      { ...s('2026-06-02', 2, 2), level: '3.5' }, // similar (median) → 50%
      { ...s('2026-06-03', 4, 0), level: '2.5' }, // weaker → 100%
    ]
    const lm = levelMatchup(d)
    expect(lm.find((b) => b.bucket === 'stronger')).toMatchObject({ winPct: 25, games: 4 })
    expect(lm.find((b) => b.bucket === 'similar')).toMatchObject({ winPct: 50 })
    expect(lm.find((b) => b.bucket === 'weaker')).toMatchObject({ winPct: 100 })
  })

  it('levelMatchup ignores sessions with no parseable level', () => {
    const d = emptyJournal()
    d.pickleball = [s('2026-06-01', 2, 0), { ...s('2026-06-02', 1, 0), level: 'open' }]
    expect(levelMatchup(d)).toEqual([])
  })

  it('weekdayPerformance returns all seven days, Sunday-first, with win%', () => {
    const d = emptyJournal()
    // 2026-06-08 is a Monday
    d.pickleball = [{ ...s('2026-06-08', 3, 1) }]
    const wp = weekdayPerformance(d)
    expect(wp).toHaveLength(7)
    expect(wp[0].day).toBe('Sun')
    expect(wp[1]).toMatchObject({ day: 'Mon', games: 4, gamesWon: 3, winPct: 75 })
  })
})

describe('duprTrend', () => {
  it('empty log → all-null, flat', () => {
    const t = duprTrend(emptyJournal().settings)
    expect(t.points).toEqual([])
    expect(t.latest).toBeNull()
    expect(t.first).toBeNull()
    expect(t.best).toBeNull()
    expect(t.change).toBe(0)
    expect(t.direction).toBe('flat')
  })

  it('sorts by date, dedupes same-day (last wins), and summarises an upward trend', () => {
    const settings = {
      ...emptyJournal().settings,
      duprLog: [
        { date: '2026-06-10', rating: 3.5 },
        { date: '2026-06-01', rating: 3.2 },
        { date: '2026-06-10', rating: 3.6 }, // same day → replaces 3.5
        { date: '2026-06-20', rating: 3.8 },
      ],
    }
    const t = duprTrend(settings)
    expect(t.points).toEqual([
      { date: '2026-06-01', rating: 3.2 },
      { date: '2026-06-10', rating: 3.6 },
      { date: '2026-06-20', rating: 3.8 },
    ])
    expect(t.first).toBe(3.2)
    expect(t.latest).toBe(3.8)
    expect(t.best).toBe(3.8)
    expect(t.change).toBe(0.6)
    expect(t.direction).toBe('up')
  })

  it('detects a downward trend', () => {
    const settings = { ...emptyJournal().settings, duprLog: [{ date: '2026-06-01', rating: 4.0 }, { date: '2026-06-10', rating: 3.7 }] }
    const t = duprTrend(settings)
    expect(t.change).toBe(-0.3)
    expect(t.direction).toBe('down')
    expect(t.best).toBe(4.0)
  })

  it('single point → change 0, flat', () => {
    const settings = { ...emptyJournal().settings, duprLog: [{ date: '2026-06-01', rating: 3.5 }] }
    const t = duprTrend(settings)
    expect(t.change).toBe(0)
    expect(t.direction).toBe('flat')
    expect(t.latest).toBe(3.5)
  })
})

import { weeklyActiveMinutes } from './fitness'

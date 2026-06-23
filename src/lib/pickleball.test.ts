import { describe, expect, it } from 'vitest'
import { pickleTotals, winRateSeries, weeklyGames, playStreak, partnerStats, venueStats, opponentRecords, rollingForm, winStreaks, pointDifferential, levelMatchup, weekdayPerformance, duprTrend, monthlyGames, winRateForecast, rpeLoad, pickleMilestones } from './pickleball'
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

describe('monthlyGames', () => {
  it('returns the trailing window of months, oldest → newest, with zero-filled gaps', () => {
    const d = emptyJournal()
    d.pickleball = [
      s('2026-04-10', 2, 0), // April
      s('2026-06-05', 1, 3), // June
      s('2026-06-20', 3, 1), // June
    ]
    const m = monthlyGames(d, 3, '2026-06-23')
    expect(m.map((x) => x.ym)).toEqual(['2026-04', '2026-05', '2026-06'])
    expect(m[0]).toMatchObject({ ym: '2026-04', sessions: 1, games: 2, gamesWon: 2, winPct: 100 })
    expect(m[1]).toMatchObject({ ym: '2026-05', sessions: 0, games: 0, winPct: 0 }) // empty month
    expect(m[2]).toMatchObject({ ym: '2026-06', sessions: 2, games: 8, gamesWon: 4, winPct: 50 })
    expect(m[2].label).toBe('June 2026')
  })

  it('ignores sessions outside the window', () => {
    const d = emptyJournal()
    d.pickleball = [s('2026-01-01', 5, 0)] // far before the window
    const m = monthlyGames(d, 3, '2026-06-23')
    expect(m.reduce((a, x) => a + x.games, 0)).toBe(0)
  })
})

describe('winRateForecast', () => {
  it('not ready below 4 decisive sessions; readiness reads current win%', () => {
    const d = emptyJournal()
    d.pickleball = [s('2026-06-01', 3, 1), s('2026-06-02', 1, 1)]
    const f = winRateForecast(d)
    expect(f.ready).toBe(false)
    expect(f.projected).toBeNull()
  })

  it('projects upward when win% climbs and flags readiness', () => {
    const d = emptyJournal()
    d.pickleball = [
      s('2026-06-01', 0, 4), // 0%
      s('2026-06-02', 1, 3), // 25%
      s('2026-06-03', 3, 1), // 75%
      s('2026-06-04', 4, 0), // 100%
    ]
    const f = winRateForecast(d)
    expect(f.ready).toBe(true)
    expect(f.slope).toBeGreaterThan(0)
    expect(f.direction).toBe('up')
    expect(f.projected).toBe(100) // clamped
    expect(f.readiness).toBe('ready')
  })

  it('detects a downward slope', () => {
    const d = emptyJournal()
    d.pickleball = [
      s('2026-06-01', 4, 0), s('2026-06-02', 3, 1),
      s('2026-06-03', 1, 3), s('2026-06-04', 0, 4),
    ]
    const f = winRateForecast(d)
    expect(f.direction).toBe('down')
    expect(f.projected).toBe(0)
  })
})

describe('rpeLoad', () => {
  it('averages logged RPE, finds the hardest, and sums a recent load', () => {
    const d = emptyJournal()
    d.pickleball = [
      { ...s('2026-06-20', 2, 1), rpe: 8 }, // 3 games · in window
      { ...s('2026-06-22', 1, 1), rpe: 4 }, // 2 games · in window
      { ...s('2026-06-01', 2, 0), rpe: 6 }, // outside the 7-day window
      s('2026-06-21', 1, 0), // no rpe → ignored everywhere
    ]
    const r = rpeLoad(d, 7, '2026-06-23')
    expect(r.sessions).toBe(3)
    expect(r.avg).toBe(6) // (8+4+6)/3
    expect(r.hardest).toBe(8)
    expect(r.weekLoad).toBe(8 * 3 + 4 * 2) // only in-window sessions
    expect(r.label).toBe('hard')
  })

  it('is empty-safe', () => {
    expect(rpeLoad(emptyJournal())).toMatchObject({ sessions: 0, avg: 0, hardest: 0, weekLoad: 0, label: 'easy' })
  })
})

describe('pickleMilestones', () => {
  it('surfaces the next unmet tier per metric', () => {
    const d = emptyJournal()
    // 12 sessions; longest winning-session streak is the trailing 4 (a loss breaks it)
    d.pickleball = [
      s('2026-06-01', 2, 0), s('2026-06-02', 2, 0), s('2026-06-03', 2, 0), // 3-win streak
      s('2026-06-05', 0, 2), // break
      ...Array.from({ length: 4 }, (_, i) => s(`2026-06-${10 + i}`, 3, 1)), // 4 wins
      s('2026-06-15', 1, 1), // draw breaks it
      ...Array.from({ length: 4 }, (_, i) => s(`2026-06-${20 + i}`, 2, 1)), // 4 wins
    ]
    const ms = pickleMilestones(d)
    const sess = ms.find((m) => m.id.startsWith('sessions'))!
    expect(sess).toMatchObject({ current: 13, target: 25, done: false })
    const streak = ms.find((m) => m.id.startsWith('streak'))!
    expect(streak).toMatchObject({ current: 4, target: 5, done: false })
  })

  it('marks a metric done once the top tier is cleared', () => {
    const d = emptyJournal()
    d.pickleball = Array.from({ length: 30 }, (_, i) => s(`2026-0${1 + Math.floor(i / 28)}-${String((i % 28) + 1).padStart(2, '0')}`, 1, 0))
    const streak = pickleMilestones(d).find((m) => m.id.startsWith('streak'))!
    expect(streak.done).toBe(true) // 30-win streak clears the 20 top tier
    expect(streak.target).toBe(20)
  })

  it('is empty-safe (all next-tier, none done)', () => {
    const ms = pickleMilestones(emptyJournal())
    expect(ms).toHaveLength(3)
    expect(ms.every((m) => m.current === 0 && !m.done)).toBe(true)
  })
})

import { weeklyActiveMinutes } from './fitness'

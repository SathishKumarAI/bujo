import { describe, it, expect } from 'vitest'
import { streakStats, addictionStats, unlockedBenefits, nextHabitMilestone, STREAK_MILESTONES, habitComeback, longestStreakEver, daysSinceLastMiss } from './streak'
import { emptyJournal } from './storage'
import type { Habit, JournalData, Relapse } from './types'

const rel = (date: string, trigger = ''): Relapse => ({ id: date, date, trigger, note: '' })

describe('streak', () => {
  it('current = days since start; best honours the live run', () => {
    const d = emptyJournal()
    d.nofap = { startedOn: '2026-06-08', best: 3, relapses: [] }
    const s = streakStats(d, '2026-06-18')
    expect(s.current).toBe(10)
    expect(s.best).toBe(10) // live run beat the stored best
  })

  it('totalClean sums completed streaks + the current run', () => {
    const d = emptyJournal()
    // relapses 10 days apart, last reset 5 days ago
    d.nofap = { startedOn: '2026-06-13', best: 0, relapses: [rel('2026-05-24'), rel('2026-06-03'), rel('2026-06-13')] }
    const s = streakStats(d, '2026-06-18')
    // completed: (5-24→6-03)=10 + (6-03→6-13)=10 = 20; current = 5
    expect(s.totalClean).toBe(25)
    expect(s.avgGap).toBe(10)
    expect(s.relapseCount).toBe(3)
  })

  it('best reflects a long PAST streak that beats the stored best', () => {
    const d = emptyJournal()
    // a 40-day gap between the first two relapses dwarfs stored best (5) and the
    // current live run (5 days since the last reset on 2026-06-13).
    d.nofap = { startedOn: '2026-06-13', best: 5, relapses: [rel('2026-04-04'), rel('2026-05-14'), rel('2026-06-13')] }
    const s = streakStats(d, '2026-06-18')
    expect(s.best).toBe(40) // longest historical gap, not the stored best
  })

  it('avgGap sorts, dedupes, and ignores out-of-range relapse dates', () => {
    const d = emptyJournal()
    // unsorted + a duplicate ('2026-06-03' twice) + one stray date AFTER the
    // current start day ('2026-09-01' can't be a real past relapse → dropped).
    d.nofap = {
      startedOn: '2026-06-13', best: 0,
      relapses: [rel('2026-06-03'), rel('2026-05-24'), rel('2026-06-13'), rel('2026-06-03'), rel('2026-09-01')],
    }
    const s = streakStats(d, '2026-06-18')
    // kept (sorted/deduped): 5-24, 6-03, 6-13. gaps: 10 + 10 = 20 over 2 → avg 10.
    expect(s.avgGap).toBe(10)
    expect(s.relapseCount).toBe(5) // raw count untouched; only gap maths normalised
  })

  it('milestone progress points at the next rung', () => {
    const d = emptyJournal()
    d.nofap = { startedOn: '2026-06-08', best: 0, relapses: [] } // current 10 → next is 14
    const s = streakStats(d, '2026-06-18')
    expect(s.next?.day).toBe(14)
    expect(s.prevDay).toBe(7)
    expect(s.daysToNext).toBe(4)
    expect(s.progressPct).toBe(Math.round(((10 - 7) / (14 - 7)) * 100))
  })

  it('topTriggers ranks reasons by frequency', () => {
    const d = emptyJournal()
    d.nofap = { startedOn: '2026-06-18', best: 0, relapses: [rel('2026-06-01', 'stress'), rel('2026-06-05', 'Stress'), rel('2026-06-10', 'boredom')] }
    const s = streakStats(d, '2026-06-18')
    expect(s.topTriggers[0]).toEqual({ trigger: 'stress', count: 2 })
  })

  it('unlockedBenefits returns reached milestones', () => {
    expect(unlockedBenefits(0)).toHaveLength(0)
    expect(unlockedBenefits(7).at(-1)?.day).toBe(7)
    expect(unlockedBenefits(999)).toHaveLength(STREAK_MILESTONES.length)
  })

  it('nextHabitMilestone finds the next celebratory rung (clean-day badge)', () => {
    expect(nextHabitMilestone(0)).toEqual({ day: 3, daysToGo: 3 })
    expect(nextHabitMilestone(3)).toEqual({ day: 7, daysToGo: 4 }) // already at 3 → next is 7
    expect(nextHabitMilestone(10)).toEqual({ day: 14, daysToGo: 4 })
    expect(nextHabitMilestone(364)).toEqual({ day: 365, daysToGo: 1 })
    expect(nextHabitMilestone(365)).toBeNull() // past the last rung
    expect(nextHabitMilestone(9999)).toBeNull()
  })

  it('addictionStats computes an independent per-addiction streak (BUJO-199)', () => {
    const a = { id: 'a1', name: 'Sugar', startedOn: '2026-06-10', best: 4, relapses: [rel('2026-06-10'), rel('2026-06-05')] }
    const s = addictionStats(a, '2026-06-18')
    expect(s.current).toBe(8) // days since startedOn
    expect(s.best).toBe(8) // live run beats stored best 4
    expect(s.relapseCount).toBe(2)
    expect(s.urges).toBe(0) // per-addiction streaks share the global urge log
  })
})

describe('habitComeback', () => {
  const TODAY = '2026-06-18'
  function hb(p: Partial<Habit> = {}): Habit {
    return { id: 'h1', name: 'Read', category: 'wellness', color: 'mauve', startedOn: '2026-06-01', ...p }
  }
  /** Mark a check habit done on the given ISO days. */
  function withDone(h: Habit, days: string[]): JournalData {
    const d = emptyJournal()
    d.habits = [h]
    for (const day of days) d.habitLog[day] = [h.id]
    return d
  }

  it('clean run from the start is NOT a comeback (no break to recover from)', () => {
    const h = hb({ startedOn: '2026-06-15' }) // 15,16,17,18 all scheduled
    const c = habitComeback(withDone(h, ['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18']), h, TODAY)
    expect(c.current).toBe(4)
    expect(c.comebackCount).toBe(0)
    expect(c.recovering).toBe(false)
  })

  it('counts the current run and flags recovering after a break', () => {
    const h = hb({ startedOn: '2026-06-14' }) // 14..18 scheduled
    // done 14, MISS 15+16, back on 17+18 → current run 2, one comeback, recovering
    const c = habitComeback(withDone(h, ['2026-06-14', '2026-06-17', '2026-06-18']), h, TODAY)
    expect(c.current).toBe(2)
    expect(c.comebackCount).toBe(1)
    expect(c.recovering).toBe(true)
  })

  it('counts multiple comebacks over time', () => {
    const h = hb({ startedOn: '2026-06-12' }) // 12..18 scheduled
    // done 12, miss 13, back 14, miss 15, back 16, miss 17, back 18 → 3 comebacks
    const c = habitComeback(withDone(h, ['2026-06-12', '2026-06-14', '2026-06-16', '2026-06-18']), h, TODAY)
    expect(c.comebackCount).toBe(3)
    expect(c.current).toBe(1) // only today is the unbroken tail
    expect(c.recovering).toBe(true)
  })

  it('a current break (today missed) → no live run, not recovering', () => {
    const h = hb({ startedOn: '2026-06-16' }) // 16,17,18 scheduled
    const c = habitComeback(withDone(h, ['2026-06-16']), h, TODAY) // missed 17,18
    expect(c.current).toBe(0)
    expect(c.recovering).toBe(false)
  })

  it('respects activeDays scheduling (off-days are not breaks)', () => {
    const h = hb({ startedOn: '2026-06-15', activeDays: [1, 3] }) // Mon/Wed only
    // scheduled within window: Mon 15, Wed 17. Done both → clean run, no comeback.
    const c = habitComeback(withDone(h, ['2026-06-15', '2026-06-17']), h, TODAY)
    expect(c.current).toBe(2)
    expect(c.comebackCount).toBe(0)
    expect(c.recovering).toBe(false)
  })
})

describe('longestStreakEver', () => {
  const TODAY = '2026-06-18'
  function hb(p: Partial<Habit> = {}): Habit {
    return { id: 'h1', name: 'Read', category: 'wellness', color: 'mauve', startedOn: '2026-06-01', ...p }
  }
  function withDone(h: Habit, days: string[]): JournalData {
    const d = emptyJournal()
    d.habits = [h]
    for (const day of days) d.habitLog[day] = [h.id]
    return d
  }

  it('finds the longest run, even when it is in the past (not the current run)', () => {
    const h = hb({ startedOn: '2026-06-10' }) // 10..18 scheduled
    // 4-run (10,11,12,13), MISS 14, then 2-run (15,16), MISS 17, 1 (18)
    const d = withDone(h, ['2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-15', '2026-06-16', '2026-06-18'])
    expect(longestStreakEver(d, h, TODAY)).toBe(4)
  })

  it('0 when never done', () => {
    const h = hb({ startedOn: '2026-06-10' })
    expect(longestStreakEver(emptyJournal(), h, TODAY)).toBe(0)
  })

  it('planned skips are neutral — they do not break the best run', () => {
    const h = hb({ startedOn: '2026-06-14' }) // 14..18 scheduled
    const d = withDone(h, ['2026-06-14', '2026-06-15', '2026-06-17', '2026-06-18']) // missing 16
    d.habitSkips = { h1: ['2026-06-16'] } // 16 is a planned skip, not a miss
    // 14,15,[skip 16],17,18 → an unbroken 4-day done run across the skip
    expect(longestStreakEver(d, h, TODAY)).toBe(4)
  })

  it('only counts scheduled weekdays (activeDays)', () => {
    const h = hb({ startedOn: '2026-06-01', activeDays: [1, 3, 5] }) // Mon/Wed/Fri
    // Do every scheduled day in range → run length = number of scheduled days.
    const days: string[] = []
    for (let i = 0; i < 18; i++) {
      const dt = new Date('2026-06-18T00:00'); dt.setDate(dt.getDate() - i)
      const iso = dt.toISOString().slice(0, 10)
      if (iso >= '2026-06-01' && [1, 3, 5].includes(dt.getDay())) days.push(iso)
    }
    const best = longestStreakEver(withDone(h, days), h, TODAY)
    expect(best).toBe(days.length)
    expect(best).toBeGreaterThan(0)
  })
})

describe('daysSinceLastMiss', () => {
  const TODAY = '2026-06-18'
  function hb(p: Partial<Habit> = {}): Habit {
    return { id: 'h1', name: 'Read', category: 'wellness', color: 'mauve', startedOn: '2026-06-01', ...p }
  }
  function withDone(h: Habit, days: string[]): JournalData {
    const d = emptyJournal()
    d.habits = [h]
    for (const day of days) d.habitLog[day] = [h.id]
    return d
  }

  it('calendar days from today to the most recent scheduled miss', () => {
    const h = hb({ startedOn: '2026-06-10' })
    // done 14..18, MISS 13 → last miss was 5 days before today
    const d = withDone(h, ['2026-06-14', '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18'])
    expect(daysSinceLastMiss(d, h, TODAY)).toBe(5)
  })

  it('an unlogged today does NOT count as a miss', () => {
    const h = hb({ startedOn: '2026-06-15' }) // 15..18 scheduled
    // done all PAST scheduled days (15,16,17); today (18) unlogged → no miss yet
    const d = withDone(h, ['2026-06-15', '2026-06-16', '2026-06-17'])
    expect(daysSinceLastMiss(d, h, TODAY)).toBeNull()
  })

  it('null for a clean run from the start', () => {
    const h = hb({ startedOn: '2026-06-15' })
    const d = withDone(h, ['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18'])
    expect(daysSinceLastMiss(d, h, TODAY)).toBeNull()
  })

  it('skips and off-schedule days are not misses', () => {
    const h = hb({ startedOn: '2026-06-14', activeDays: [1, 3, 5] }) // Mon/Wed/Fri
    // Within range the scheduled days are Fri 12?, Mon 15, Wed 17. (14 Sun not scheduled.)
    // Done Mon 15 + Wed 17; today 18 is Thu (off-schedule). A planned skip too.
    const d = withDone(h, ['2026-06-15', '2026-06-17'])
    d.habitSkips = { h1: [] }
    // No missed scheduled day → null.
    expect(daysSinceLastMiss(d, h, TODAY)).toBeNull()
  })
})

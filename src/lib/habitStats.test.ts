import { describe, it, expect } from 'vitest'
import {
  bestWeekday, categoryRollup, completionRate30, consistencyScore, habitCellFill,
  isScheduledOn, perfectDayStats, perfectWeeks, weeklyHeatRow,
  monthlyHabitCompletion, valueSparkline, habitGrade, trackerSummary,
} from './habitStats'
import { emptyJournal } from './storage'
import type { Habit, JournalData } from './types'

const TODAY = '2026-06-18' // Thursday (getDay()=4)

function habit(p: Partial<Habit> = {}): Habit {
  return { id: 'h1', name: 'Read', category: 'wellness', color: 'mauve', startedOn: '2000-01-01', ...p }
}

/** Mark a check habit done on the given ISO days. */
function withDone(h: Habit, days: string[]): JournalData {
  const d = emptyJournal()
  d.habits = [h]
  for (const day of days) d.habitLog[day] = [h.id]
  return d
}

function isoDays(today: string, n: number): string[] {
  const out: string[] = []
  const base = new Date(today + 'T00:00')
  for (let i = 0; i < n; i++) {
    const x = new Date(base)
    x.setDate(x.getDate() - i)
    out.push(x.toISOString().slice(0, 10))
  }
  return out
}

describe('isScheduledOn', () => {
  it('every-day habit (no activeDays) is scheduled on any day on/after start', () => {
    const h = habit({ startedOn: '2026-06-10' })
    expect(isScheduledOn(h, '2026-06-18')).toBe(true)
    expect(isScheduledOn(h, '2026-06-10')).toBe(true) // inclusive of start day
    expect(isScheduledOn(h, '2026-06-09')).toBe(false) // before start
  })

  it('respects activeDays weekday scheduling', () => {
    const h = habit({ activeDays: [1, 3, 5] }) // Mon/Wed/Fri
    expect(isScheduledOn(h, '2026-06-15')).toBe(true) // Mon
    expect(isScheduledOn(h, '2026-06-17')).toBe(true) // Wed
    expect(isScheduledOn(h, '2026-06-18')).toBe(false) // Thu — not scheduled
  })
})

describe('completionRate30', () => {
  it('counts scheduled days vs done for an everyday habit', () => {
    const h = habit({ startedOn: '2026-06-10' })
    // window 30 ends today; scheduled days = startedOn..today inclusive = 9 days
    const done = ['2026-06-18', '2026-06-17', '2026-06-16'] // 3 of 9
    const r = completionRate30(withDone(h, done), h, TODAY)
    expect(r.scheduled).toBe(9)
    expect(r.done).toBe(3)
    expect(r.pct).toBe(Math.round((3 / 9) * 100)) // 33
  })

  it('100% when every scheduled day in a full window is done', () => {
    const h = habit({ startedOn: '2000-01-01' }) // started long ago → full 30-day window
    const r = completionRate30(withDone(h, isoDays(TODAY, 30)), h, TODAY)
    expect(r.scheduled).toBe(30)
    expect(r.done).toBe(30)
    expect(r.pct).toBe(100)
  })

  it('excludes off-schedule weekdays from the denominator (activeDays)', () => {
    const h = habit({ activeDays: [4], startedOn: '2000-01-01' }) // Thursdays only
    // In the last 30 days ending Thu 2026-06-18 there are exactly 5 Thursdays.
    const allThursdays = isoDays(TODAY, 30).filter((d) => new Date(d + 'T00:00').getDay() === 4)
    expect(allThursdays.length).toBe(5)
    // Done on 2 of the 5 Thursdays; logging a non-Thursday must not change scheduled count.
    const r = completionRate30(withDone(h, [allThursdays[0], allThursdays[1], '2026-06-17']), h, TODAY)
    expect(r.scheduled).toBe(5)
    expect(r.done).toBe(2) // the Wed log is off-schedule, not counted
    expect(r.pct).toBe(40)
  })

  it('partial window: only counts days on/after startedOn', () => {
    const h = habit({ startedOn: '2026-06-16' }) // started 3 days ago (16,17,18)
    const r = completionRate30(withDone(h, ['2026-06-18']), h, TODAY)
    expect(r.scheduled).toBe(3)
    expect(r.done).toBe(1)
    expect(r.pct).toBe(33)
  })

  it('divide-by-zero guard: nothing scheduled → pct 0, not NaN', () => {
    const h = habit({ startedOn: '2026-12-01' }) // starts in the future relative to today
    const r = completionRate30(emptyJournal(), h, TODAY)
    expect(r.scheduled).toBe(0)
    expect(r.done).toBe(0)
    expect(r.pct).toBe(0)
    expect(Number.isNaN(r.pct)).toBe(false)
  })

  it('never-due weekday habit in window → pct 0', () => {
    // Habit scheduled only on a weekday that doesn't occur... it always occurs in
    // 30 days, so instead test a short custom window with no matching weekday.
    const h = habit({ activeDays: [0], startedOn: '2000-01-01' }) // Sundays only
    const r = completionRate30(emptyJournal(), h, '2026-06-18', 3) // Thu/Wed/Tue — no Sunday
    expect(r.scheduled).toBe(0)
    expect(r.pct).toBe(0)
  })
})

describe('habitCellFill', () => {
  /** Journal with a count value logged for the habit on a day. */
  function withValue(h: Habit, day: string, value: number): JournalData {
    const d = emptyJournal()
    d.habits = [h]
    d.habitValues = { [day]: { [h.id]: value } }
    return d
  }

  it('check habit: empty when off, met when on', () => {
    const h = habit({ type: 'check' })
    const d = emptyJournal(); d.habits = [h]; d.habitLog['2026-06-18'] = [h.id]
    expect(habitCellFill(emptyJournal(), h, '2026-06-18').state).toBe('empty')
    expect(habitCellFill(d, h, '2026-06-18')).toEqual({ state: 'met', ratio: 1 })
  })

  it('count habit: partial below target with the ratio, met at/above', () => {
    const h = habit({ type: 'count', target: 8 })
    expect(habitCellFill(withValue(h, '2026-06-18', 0), h, '2026-06-18')).toEqual({ state: 'empty', ratio: 0 })
    expect(habitCellFill(withValue(h, '2026-06-18', 4), h, '2026-06-18')).toEqual({ state: 'partial', ratio: 0.5 })
    expect(habitCellFill(withValue(h, '2026-06-18', 8), h, '2026-06-18')).toEqual({ state: 'met', ratio: 1 })
    expect(habitCellFill(withValue(h, '2026-06-18', 12), h, '2026-06-18')).toEqual({ state: 'met', ratio: 1 })
  })

  it('ratio is clamped to 1 and partial never reaches met', () => {
    const h = habit({ type: 'timer', target: 30 })
    const f = habitCellFill(withValue(h, '2026-06-18', 29), h, '2026-06-18')
    expect(f.state).toBe('partial')
    expect(f.ratio).toBeCloseTo(29 / 30)
    expect(f.ratio).toBeLessThan(1)
  })
})

describe('consistencyScore', () => {
  it('100 when every scheduled day in the window is done', () => {
    const h = habit({ startedOn: '2000-01-01' })
    expect(consistencyScore(withDone(h, isoDays(TODAY, 30)), h, TODAY)).toBe(100)
  })

  it('0 when nothing scheduled (no divide-by-zero)', () => {
    const h = habit({ startedOn: '2026-12-01' }) // starts in the future
    const s = consistencyScore(emptyJournal(), h, TODAY)
    expect(s).toBe(0)
    expect(Number.isNaN(s)).toBe(false)
  })

  it('weights recent days more: same #done scores higher when those days are recent', () => {
    const h = habit({ startedOn: '2000-01-01' })
    const recent = consistencyScore(withDone(h, isoDays(TODAY, 5)), h, TODAY, 30) // last 5 days done
    const oldDays = isoDays(TODAY, 30).slice(25) // the 5 OLDEST days in the window
    const old = consistencyScore(withDone(h, oldDays), h, TODAY, 30)
    expect(recent).toBeGreaterThan(old)
  })

  it('between 0 and 100 for a mixed record', () => {
    const h = habit({ startedOn: '2000-01-01' })
    const s = consistencyScore(withDone(h, ['2026-06-18', '2026-06-16', '2026-06-14']), h, TODAY, 30)
    expect(s).toBeGreaterThan(0)
    expect(s).toBeLessThan(100)
  })
})

describe('bestWeekday', () => {
  it('identifies the strongest and weakest scheduled weekday', () => {
    const h = habit({ startedOn: '2000-01-01' })
    // Over 90 days, do every Monday (getDay 1) but skip every Sunday (getDay 0).
    const days = isoDays(TODAY, 90)
    const mondays = days.filter((d) => new Date(d + 'T00:00').getDay() === 1)
    const b = bestWeekday(withDone(h, mondays), h, TODAY, 90)
    expect(b.best).toBe(1) // Monday: 100%
    expect(b.rates[1]).toBe(1)
    expect(b.worst).not.toBe(1) // some other weekday (0% done) is the weakest
    expect(b.rates[b.worst as number]).toBe(0)
  })

  it('only reports weekdays the habit was actually scheduled on', () => {
    const h = habit({ activeDays: [1, 3], startedOn: '2000-01-01' }) // Mon & Wed only
    const b = bestWeekday(emptyJournal(), h, TODAY, 90)
    // Non-scheduled weekdays have a null rate; best/worst come from {Mon,Wed}.
    expect(b.rates[0]).toBeNull() // Sunday never scheduled
    expect(b.rates[2]).toBeNull() // Tuesday never scheduled
    expect([1, 3]).toContain(b.best)
    expect([1, 3]).toContain(b.worst)
  })

  it('returns null best/worst when nothing was scheduled in the window', () => {
    const h = habit({ startedOn: '2026-12-01' }) // future start → nothing scheduled
    const b = bestWeekday(emptyJournal(), h, TODAY, 90)
    expect(b.best).toBeNull()
    expect(b.worst).toBeNull()
  })
})

/** Build a journal from several habits, marking the given check habits done on days. */
function withHabits(habits: Habit[], log: Record<string, string[]> = {}): JournalData {
  const d = emptyJournal()
  d.habits = habits
  d.habitLog = log
  return d
}

describe('categoryRollup', () => {
  it('aggregates scheduled-vs-done across habits per category', () => {
    const a = habit({ id: 'a', category: 'wellness', startedOn: '2000-01-01' })
    const b = habit({ id: 'b', category: 'wellness', startedOn: '2000-01-01' })
    // a done every day in the window, b never done.
    const log: Record<string, string[]> = {}
    for (const day of isoDays(TODAY, 30)) log[day] = ['a']
    const out = categoryRollup(withHabits([a, b], log), TODAY, 30)
    const wellness = out.find((r) => r.category === 'wellness')!
    expect(wellness.habits).toBe(2)
    expect(wellness.scheduled).toBe(60) // 2 habits × 30 days
    expect(wellness.done).toBe(30) // only a
    expect(wellness.pct).toBe(50)
  })

  it('counts avoid habits toward the count but excludes them from completion maths', () => {
    const build = habit({ id: 'b', category: 'food', startedOn: '2000-01-01' })
    const quit = habit({ id: 'q', category: 'food', startedOn: '2000-01-01', avoid: true })
    const log: Record<string, string[]> = {}
    for (const day of isoDays(TODAY, 30)) { log[day] = ['b', 'q'] } // both logged
    const out = categoryRollup(withHabits([build, quit], log), TODAY, 30)
    const food = out.find((r) => r.category === 'food')!
    expect(food.habits).toBe(2)
    expect(food.scheduled).toBe(30) // only the build habit contributes days
    expect(food.done).toBe(30)
    expect(food.pct).toBe(100)
  })

  it('drops archived habits and sorts by pct descending', () => {
    const good = habit({ id: 'g', category: 'wellness', startedOn: '2000-01-01' })
    const bad = habit({ id: 'x', category: 'movement', startedOn: '2000-01-01' })
    const gone = habit({ id: 'z', category: 'custom', startedOn: '2000-01-01', archived: true })
    const log: Record<string, string[]> = {}
    for (const day of isoDays(TODAY, 30)) log[day] = ['g'] // wellness 100%, movement 0%
    const out = categoryRollup(withHabits([good, bad, gone], log), TODAY, 30)
    expect(out.map((r) => r.category)).toEqual(['wellness', 'movement']) // custom dropped
    expect(out[0].pct).toBeGreaterThan(out[1].pct)
  })

  it('pct is 0 (not NaN) when nothing was scheduled', () => {
    const future = habit({ id: 'f', category: 'wellness', startedOn: '2026-12-01' })
    const out = categoryRollup(withHabits([future]), TODAY, 30)
    expect(out[0].pct).toBe(0)
  })
})

describe('perfectWeeks', () => {
  it('counts past weeks where every scheduled day was done', () => {
    const h = habit({ startedOn: '2000-01-01' }) // everyday
    // Mark all of last week fully done (the 7 days before the current Sun-week).
    const dow = new Date(TODAY + 'T00:00').getDay() // Thu → 4
    const curStart = isoDays(TODAY, dow + 1)[dow] // Sunday of current week
    const lastWeek = isoDays(curStart, 8).slice(1, 8) // 7 days before curStart
    const data = withDone(h, lastWeek)
    expect(perfectWeeks(data, h, TODAY, 12)).toBe(1)
  })

  it('a week with one missed scheduled day is not perfect', () => {
    const h = habit({ startedOn: '2000-01-01' })
    const dow = new Date(TODAY + 'T00:00').getDay()
    const curStart = isoDays(TODAY, dow + 1)[dow]
    const lastWeek = isoDays(curStart, 8).slice(1, 8)
    const data = withDone(h, lastWeek.slice(1)) // miss one day
    expect(perfectWeeks(data, h, TODAY, 12)).toBe(0)
  })

  it('the in-progress current week is excluded', () => {
    const h = habit({ startedOn: '2000-01-01' })
    // Mark every day so far this week done — still shouldn't count (current week excluded).
    const dow = new Date(TODAY + 'T00:00').getDay()
    const thisWeekSoFar = isoDays(TODAY, dow + 1)
    const data = withDone(h, thisWeekSoFar)
    expect(perfectWeeks(data, h, TODAY, 12)).toBe(0)
  })

  it('weeks with no scheduled days are skipped, not counted as broken', () => {
    const h = habit({ activeDays: [0], startedOn: '2000-01-01' }) // Sundays only
    // No Sundays done → no perfect weeks, and never a divide/false positive.
    expect(perfectWeeks(emptyJournal2(h), h, TODAY, 12)).toBe(0)
  })
})

/** emptyJournal with one habit, nothing done. */
function emptyJournal2(h: Habit): JournalData {
  const d = emptyJournal()
  d.habits = [h]
  return d
}

describe('perfectDayStats', () => {
  it('counts days where every scheduled check habit was done', () => {
    const a = habit({ id: 'a', startedOn: '2000-01-01' })
    const b = habit({ id: 'b', startedOn: '2000-01-01' })
    const log: Record<string, string[]> = {}
    // Last 3 days: both done. Day -3: only a done (not perfect).
    for (const day of isoDays(TODAY, 3)) log[day] = ['a', 'b']
    log[isoDays(TODAY, 4)[3]] = ['a']
    const out = perfectDayStats(withHabits([a, b], log), TODAY, 90)
    expect(out.total).toBe(3)
    expect(out.streak).toBe(3) // today perfect → run includes today
  })

  it('forgives an unfinished today without breaking the streak', () => {
    const a = habit({ id: 'a', startedOn: '2000-01-01' })
    const log: Record<string, string[]> = {}
    // Yesterday + day before done, today NOT done yet.
    log[isoDays(TODAY, 2)[1]] = ['a']
    log[isoDays(TODAY, 3)[2]] = ['a']
    const out = perfectDayStats(withHabits([a], log), TODAY, 90)
    expect(out.streak).toBe(2) // starts from yesterday, today forgiven
  })

  it('a real miss (a past non-perfect scheduled day) breaks the streak', () => {
    const a = habit({ id: 'a', startedOn: '2000-01-01' })
    const log: Record<string, string[]> = {}
    log[TODAY] = ['a'] // today perfect
    // yesterday missed (no log) → streak stops at today
    log[isoDays(TODAY, 3)[2]] = ['a']
    const out = perfectDayStats(withHabits([a], log), TODAY, 90)
    expect(out.streak).toBe(1)
  })

  it('returns zeros when there are no build check habits', () => {
    const quit = habit({ id: 'q', avoid: true, startedOn: '2000-01-01' })
    const out = perfectDayStats(withHabits([quit]), TODAY, 90)
    expect(out).toEqual({ total: 0, streak: 0 })
  })
})

describe('weeklyHeatRow', () => {
  it('returns 7 cells oldest→newest ending today', () => {
    const h = habit({ startedOn: '2000-01-01' })
    const row = weeklyHeatRow(withDone(h, [TODAY]), h, TODAY)
    expect(row).toHaveLength(7)
    expect(row[6].day).toBe(TODAY) // last cell is today
    expect(row[6].level).toBe(4) // check habit done → full intensity
    expect(row[6].scheduled).toBe(true)
  })

  it('marks off-schedule days as unscheduled with level 0', () => {
    const h = habit({ activeDays: [4], startedOn: '2000-01-01' }) // Thursdays only
    const row = weeklyHeatRow(emptyJournal2(h), h, TODAY) // TODAY = Thu
    expect(row[6].scheduled).toBe(true) // today (Thu) scheduled
    // The other 6 days span Fri..Wed — none scheduled.
    expect(row.slice(0, 6).every((c) => !c.scheduled && c.level === 0)).toBe(true)
  })

  it('grades a partial count habit between 0 and 4', () => {
    const h = habit({ id: 'c', type: 'count', target: 8, startedOn: '2000-01-01' })
    const d = emptyJournal()
    d.habits = [h]
    d.habitValues = { [TODAY]: { c: 4 } } // half of target
    const row = weeklyHeatRow(d, h, TODAY)
    expect(row[6].level).toBeGreaterThan(0)
    expect(row[6].level).toBeLessThan(4)
  })
})

describe('monthlyHabitCompletion', () => {
  it('returns one entry per month oldest→newest ending the current month', () => {
    const h = habit({ startedOn: '2000-01-01' })
    const out = monthlyHabitCompletion(withDone(h, []), h, TODAY, 3)
    expect(out).toHaveLength(3)
    expect(out[2].ym).toBe('2026-06') // current month last
    expect(out[1].ym).toBe('2026-05')
    expect(out[0].ym).toBe('2026-04')
  })

  it('counts scheduled-vs-done within a month and stops at today', () => {
    const h = habit({ startedOn: '2000-01-01' }) // every day
    // Done on 3 days in the current month (June), within the trailing window.
    const out = monthlyHabitCompletion(withDone(h, ['2026-06-18', '2026-06-17', '2026-06-10']), h, TODAY, 1)
    const jun = out[0]
    expect(jun.ym).toBe('2026-06')
    // TODAY=2026-06-18 → scheduled days = Jun 1..18 inclusive = 18
    expect(jun.scheduled).toBe(18)
    expect(jun.done).toBe(3)
    expect(jun.pct).toBe(Math.round((3 / 18) * 100))
  })

  it('reports scheduled=0 (pct 0, no NaN) for months before the habit started', () => {
    const h = habit({ startedOn: '2026-06-01' })
    const out = monthlyHabitCompletion(withDone(h, []), h, TODAY, 3)
    expect(out[0].scheduled).toBe(0) // April — before start
    expect(out[0].pct).toBe(0)
    expect(out[2].scheduled).toBeGreaterThan(0) // June — active
  })

  it('respects activeDays in the scheduled denominator', () => {
    const h = habit({ activeDays: [4], startedOn: '2000-01-01' }) // Thursdays only
    const out = monthlyHabitCompletion(withDone(h, []), h, TODAY, 1)
    // June 2026 Thursdays up to the 18th: Jun 4, 11, 18 = 3
    expect(out[0].scheduled).toBe(3)
  })
})

describe('valueSparkline', () => {
  it('returns `days` points oldest→newest ending today', () => {
    const h = habit({ startedOn: '2000-01-01' })
    const pts = valueSparkline(withDone(h, [TODAY]), h, TODAY, 14)
    expect(pts).toHaveLength(14)
    expect(pts[13].day).toBe(TODAY)
    expect(pts[13].value).toBe(1) // check habit done
    expect(pts[13].norm).toBe(1)
  })

  it('normalises a count habit to its target and clamps overshoot to 1', () => {
    const h = habit({ id: 'c', type: 'count', target: 8, startedOn: '2000-01-01' })
    const d = emptyJournal()
    d.habits = [h]
    d.habitValues = { [TODAY]: { c: 4 }, [isoDays(TODAY, 2)[1]]: { c: 12 } } // half, then overshoot
    const pts = valueSparkline(d, h, TODAY, 2)
    expect(pts[1].value).toBe(4)
    expect(pts[1].norm).toBe(0.5)
    expect(pts[0].value).toBe(12)
    expect(pts[0].norm).toBe(1) // clamped
  })

  it('treats off-schedule days as 0', () => {
    const h = habit({ activeDays: [4], startedOn: '2000-01-01' }) // Thursdays only
    const pts = valueSparkline(withDone(h, isoDays(TODAY, 14)), h, TODAY, 14)
    // Only Thursdays carry value; today (Thu) is 1.
    expect(pts[13].value).toBe(1)
    expect(pts[12].value).toBe(0) // yesterday (Wed) off-schedule
  })

  it('normalises a rating habit to /5', () => {
    const h = habit({ id: 'r', type: 'rating', startedOn: '2000-01-01' })
    const d = emptyJournal()
    d.habits = [h]
    d.habitValues = { [TODAY]: { r: 5 } }
    const pts = valueSparkline(d, h, TODAY, 1)
    expect(pts[0].norm).toBe(1)
  })
})

describe('habitGrade', () => {
  it('grades a perfectly-consistent habit as A', () => {
    const h = habit({ startedOn: '2000-01-01' })
    const g = habitGrade(withDone(h, isoDays(TODAY, 30)), h, TODAY)
    expect(g.score).toBe(100)
    expect(g.letter).toBe('A')
  })

  it('grades a never-done habit as F', () => {
    const h = habit({ startedOn: '2000-01-01' })
    const g = habitGrade(withDone(h, []), h, TODAY)
    expect(g.score).toBe(0)
    expect(g.letter).toBe('F')
  })

  it('maps mid scores to the right band', () => {
    // Recency-weighted: do only the most recent ~14 of 30 days → a C/B-ish score.
    const h = habit({ startedOn: '2000-01-01' })
    const g = habitGrade(withDone(h, isoDays(TODAY, 14)), h, TODAY)
    expect(g.score).toBeGreaterThan(40)
    expect(['B', 'C', 'D']).toContain(g.letter)
  })
})

describe('trackerSummary', () => {
  // tiny inline streak stub so the test doesn't import stats.ts: returns 0.
  const streakOf = () => 0

  it('counts build vs avoid habits and averages consistency', () => {
    const a = habit({ id: 'a', startedOn: '2000-01-01' })
    const b = habit({ id: 'b', startedOn: '2000-01-01' })
    const quit = habit({ id: 'q', avoid: true, startedOn: '2000-01-01' })
    // a done every day (100), b never done (0) → avg 50.
    const data = withHabits([a, b, quit], Object.fromEntries(isoDays(TODAY, 30).map((d) => [d, ['a']])))
    const out = trackerSummary(data, streakOf, TODAY)
    expect(out.buildHabits).toBe(2)
    expect(out.avoidHabits).toBe(1)
    expect(out.avgConsistency).toBe(50)
  })

  it('reports today completion share of scheduled build habits', () => {
    const a = habit({ id: 'a', startedOn: '2000-01-01' })
    const b = habit({ id: 'b', startedOn: '2000-01-01' })
    const data = withHabits([a, b], { [TODAY]: ['a'] }) // 1 of 2 done today
    const out = trackerSummary(data, streakOf, TODAY)
    expect(out.todayPct).toBe(50)
  })

  it('surfaces the longest current streak and its habit name', () => {
    const a = habit({ id: 'a', name: 'Read', startedOn: '2000-01-01' })
    const b = habit({ id: 'b', name: 'Run', startedOn: '2000-01-01' })
    const data = withHabits([a, b], {})
    // Injected streakOf: Read=5, Run=2.
    const out = trackerSummary(data, (id) => (id === 'a' ? 5 : 2), TODAY)
    expect(out.topStreak).toBe(5)
    expect(out.topStreakHabit).toBe('Read')
  })

  it('returns sane zeros for an empty grid', () => {
    const out = trackerSummary(emptyJournal(), streakOf, TODAY)
    expect(out).toEqual({ buildHabits: 0, avoidHabits: 0, avgConsistency: 0, topStreak: 0, topStreakHabit: null, todayPct: 0 })
  })
})

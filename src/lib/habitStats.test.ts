import { describe, it, expect } from 'vitest'
import { completionRate30, isScheduledOn } from './habitStats'
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

import { describe, expect, it } from 'vitest'
import { categoryCounts, currentStreak, daysPracticed, daysWithMarks, marksByDay, moodContrast, practiceData } from './mindsetPractice'

const T = '2026-08-16'

describe('marksByDay', () => {
  it('sums principles marked on the same day rather than overwriting', () => {
    const days = marksByDay({ process: [T], breathe: [T] })
    expect(days.get(T)).toBe(2)
  })

  it('counts a duplicated date once, so a merged import cannot inflate a day', () => {
    expect(marksByDay({ process: [T, T] }).get(T)).toBe(1)
  })
})

describe('practiceData', () => {
  it('emits one row per marked day and nothing for unmarked days', () => {
    const rows = practiceData({ process: ['2026-08-15', T] })
    expect(rows).toHaveLength(2)
    expect(rows).toContainEqual({ date: T, value: 1 })
  })
})

describe('currentStreak', () => {
  it('counts back through consecutive marked days', () => {
    expect(currentStreak({ process: ['2026-08-14', '2026-08-15', T] }, T)).toBe(3)
  })

  it('keeps yesterday-ending runs alive so a morning does not read one short', () => {
    expect(currentStreak({ process: ['2026-08-14', '2026-08-15'] }, T)).toBe(2)
  })

  it('breaks on a gap at yesterday', () => {
    expect(currentStreak({ process: ['2026-08-10', '2026-08-11'] }, T)).toBe(0)
  })

  it('is zero for an empty log rather than throwing', () => {
    expect(currentStreak({}, T)).toBe(0)
  })
})

describe('daysPracticed', () => {
  it('is the number of distinct days for one principle', () => {
    expect(daysPracticed({ process: [T, T, '2026-08-15'] }, 'process')).toBe(2)
  })

  it('is zero for a principle that was never marked', () => {
    expect(daysPracticed({ process: [T] }, 'breathe')).toBe(0)
  })
})

describe('categoryCounts', () => {
  it('returns every category, including the ones at zero', () => {
    const rows = categoryCounts({ process: [T] })
    expect(rows).toHaveLength(9)
    expect(rows.find((r) => r.name === 'Connection')).toEqual({ name: 'Connection', count: 0, share: 0 })
  })

  it('scales share against the busiest category, not the total', () => {
    // process + single-task are both Focus & presence; breathe is Composure.
    const rows = categoryCounts({ process: [T, '2026-08-15'], 'single-task': [T], breathe: [T] })
    const focus = rows.find((r) => r.name === 'Focus & presence')!
    const composure = rows.find((r) => r.name === 'Composure')!
    expect(focus.count).toBe(3)
    expect(focus.share).toBe(1)
    expect(composure.share).toBeCloseTo(1 / 3)
  })

  it('drops an id that is no longer in the library instead of inventing a category', () => {
    const rows = categoryCounts({ 'retired-principle': [T] })
    expect(rows.every((r) => r.count === 0)).toBe(true)
  })

  it('gives every category share 0 on an empty log rather than NaN', () => {
    expect(categoryCounts({}).every((r) => r.share === 0)).toBe(true)
  })
})

describe('daysWithMarks', () => {
  it('counts distinct days, not marks', () => {
    expect(daysWithMarks({ process: [T, '2026-08-15'], breathe: [T] })).toBe(2)
  })

  it('windows from a start date when given one', () => {
    expect(daysWithMarks({ process: [T, '2026-08-15'] }, T)).toBe(1)
  })
})

describe('moodContrast', () => {
  const metrics = [
    { date: '2026-08-16', mood: 8 },
    { date: '2026-08-15', mood: 4 },
    { date: '2026-08-14', mood: 6 },
  ]

  it('splits mood by whether anything was practised that day', () => {
    const c = moodContrast({ process: ['2026-08-16', '2026-08-14'] }, metrics, 90, T)
    expect(c.practised).toBe(7) // (8 + 6) / 2
    expect(c.other).toBe(4)
    expect(c.practisedDays).toBe(2)
    expect(c.otherDays).toBe(1)
  })

  it('returns null rather than 0 for a side with nothing to average', () => {
    // The `count ? sum / count : 0` trap: mood 0 is a real answer on a 0–10
    // scale, so zero cannot also mean "nobody has told us yet".
    const c = moodContrast({}, metrics, 90, T)
    expect(c.practised).toBeNull()
    expect(c.practised).not.toBe(0)
    expect(c.other).toBe(6)
  })

  it('ignores days outside the window and days with no mood', () => {
    const c = moodContrast({ process: ['2026-08-16'] }, [...metrics, { date: '2026-01-01', mood: 0 }, { date: '2026-08-13' }], 3, T)
    expect(c.practisedDays).toBe(1)
    expect(c.otherDays).toBe(2)
  })
})

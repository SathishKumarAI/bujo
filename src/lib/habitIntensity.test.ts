import { describe, expect, it } from 'vitest'
import { habitIntensity, nextHabitValue } from './stats'
import { dayIntensity, intensityOpacity } from './habitIntensity'
import { emptyJournal } from './storage'
import type { Habit, JournalData } from './types'

describe('habitIntensity', () => {
  it('check: binary on/off', () => {
    expect(habitIntensity('check', 0, 1)).toBe(0)
    expect(habitIntensity('check', 1, 1)).toBe(4)
  })

  it('count: thirds of target, full at/above target', () => {
    const t = 8
    expect(habitIntensity('count', 0, t)).toBe(0)
    expect(habitIntensity('count', 2, t)).toBe(1) // 0.25 < 0.34
    expect(habitIntensity('count', 4, t)).toBe(2) // 0.5  < 0.67
    expect(habitIntensity('count', 6, t)).toBe(3) // 0.75 < 1
    expect(habitIntensity('count', 8, t)).toBe(4) // met
    expect(habitIntensity('count', 12, t)).toBe(4) // exceeded
  })

  it('count: missing target falls back to 1 (any value = full)', () => {
    expect(habitIntensity('count', 0, 0)).toBe(0)
    expect(habitIntensity('count', 1, 0)).toBe(4)
  })

  it('timer: same ratio math as count (target in minutes)', () => {
    const t = 30
    expect(habitIntensity('timer', 0, t)).toBe(0)
    expect(habitIntensity('timer', 5, t)).toBe(1) // 0.17
    expect(habitIntensity('timer', 15, t)).toBe(2) // 0.5
    expect(habitIntensity('timer', 25, t)).toBe(3) // 0.83
    expect(habitIntensity('timer', 30, t)).toBe(4) // met
  })

  it('rating: 1→1, 2→2, 3→3, 4 and 5→4', () => {
    expect(habitIntensity('rating', 0, 5)).toBe(0)
    expect(habitIntensity('rating', 1, 5)).toBe(1)
    expect(habitIntensity('rating', 2, 5)).toBe(2)
    expect(habitIntensity('rating', 3, 5)).toBe(3)
    expect(habitIntensity('rating', 4, 5)).toBe(4)
    expect(habitIntensity('rating', 5, 5)).toBe(4)
  })
})

describe('nextHabitValue', () => {
  it('count: steps by 1, wraps to 0 at target', () => {
    expect(nextHabitValue('count', 3, 0)).toBe(1)
    expect(nextHabitValue('count', 3, 2)).toBe(3)
    expect(nextHabitValue('count', 3, 3)).toBe(0) // at target → wrap
  })

  it('timer: steps by 5 when target ≥ 20', () => {
    expect(nextHabitValue('timer', 30, 0)).toBe(5)
    expect(nextHabitValue('timer', 30, 25)).toBe(30)
    expect(nextHabitValue('timer', 30, 30)).toBe(0)
  })

  it('timer: clamps to a non-divisible target so it stays reachable (BUG1)', () => {
    // target 23, step 5: 20 → 23 (clamped, not skipped past), then → 0
    expect(nextHabitValue('timer', 23, 20)).toBe(23)
    expect(nextHabitValue('timer', 23, 23)).toBe(0)
  })

  it('timer: steps by 1 when target < 20', () => {
    expect(nextHabitValue('timer', 10, 0)).toBe(1)
  })

  it('rating: steps by 1 up to 5', () => {
    expect(nextHabitValue('rating', 5, 4)).toBe(5)
    expect(nextHabitValue('rating', 5, 5)).toBe(0)
  })
})

describe('dayIntensity', () => {
  const DAY = '2026-06-18'
  function hb(p: Partial<Habit> = {}): Habit {
    return { id: 'h1', name: 'Water', category: 'wellness', color: 'sky', startedOn: '2026-06-01', ...p }
  }
  function withValue(h: Habit, value: number): JournalData {
    const d = emptyJournal()
    d.habits = [h]
    d.habitValues = { [DAY]: { [h.id]: value } }
    return d
  }

  it('check habit: 0 when unlogged, 4 when done', () => {
    const h = hb({ type: 'check' })
    const done = emptyJournal(); done.habits = [h]; done.habitLog[DAY] = [h.id]
    expect(dayIntensity(emptyJournal(), h, DAY)).toBe(0)
    expect(dayIntensity(done, h, DAY)).toBe(4)
  })

  it('count habit: graded by fraction of target', () => {
    const h = hb({ type: 'count', target: 8 })
    expect(dayIntensity(withValue(h, 0), h, DAY)).toBe(0)
    expect(dayIntensity(withValue(h, 2), h, DAY)).toBe(1)
    expect(dayIntensity(withValue(h, 4), h, DAY)).toBe(2)
    expect(dayIntensity(withValue(h, 6), h, DAY)).toBe(3)
    expect(dayIntensity(withValue(h, 8), h, DAY)).toBe(4)
  })
})

describe('intensityOpacity', () => {
  it('level 0 is transparent; levels ramp up to 1 at level 4', () => {
    expect(intensityOpacity(0)).toBe(0)
    expect(intensityOpacity(4)).toBe(1)
    expect(intensityOpacity(1)).toBeGreaterThan(0)
    expect(intensityOpacity(1)).toBeLessThan(intensityOpacity(2))
    expect(intensityOpacity(2)).toBeLessThan(intensityOpacity(3))
  })
})

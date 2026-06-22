import { describe, expect, it } from 'vitest'
import type { JournalData, Recurrence } from './types'
import { appliesOn, generateRecurring } from './recurrence'
import { addDays } from './date'

const TODAY = '2026-06-22'

/** Minimal JournalData carrying only the fields generateRecurring touches. */
function makeData(recurrences: Recurrence[], entries: JournalData['entries'] = []): JournalData {
  return { recurrences, entries } as unknown as JournalData
}

function dailyRule(startedOn: string, lastGenerated?: string): Recurrence {
  return {
    id: 'r1',
    text: 'water the plants',
    type: 'task',
    important: false,
    freq: 'daily',
    weekdays: [],
    startedOn,
    lastGenerated,
  }
}

function genDays(data: JournalData): string[] {
  return data.entries.filter((e) => e.recurringId === 'r1').map((e) => e.date).sort()
}

describe('generateRecurring — 60-day backfill cap (BUJO-208)', () => {
  it('does not advance lastGenerated past occurrences it skipped', () => {
    // lastGenerated is far older than the 60-day cap.
    const rule = dailyRule('2025-01-01', '2026-01-01')
    const next = generateRecurring(makeData([rule]), TODAY)
    const nextRule = next.recurrences[0]

    // It must NOT jump lastGenerated to today, which would silently drop the
    // skipped (pre-cap) occurrences forever.
    expect(nextRule.lastGenerated).not.toBe(TODAY)
    // It should park just before the cap boundary so skipped days can re-enter.
    expect(nextRule.lastGenerated).toBe(addDays(addDays(TODAY, -60), -1))
  })

  it('generates the full in-range window over two runs with nothing lost', () => {
    const capStart = addDays(TODAY, -60)
    const rule = dailyRule('2025-01-01', '2026-01-01')

    // First run: clamped to the cap window.
    const run1 = generateRecurring(makeData([rule]), TODAY)
    const days1 = genDays(run1)
    expect(days1[0]).toBe(capStart)
    expect(days1[days1.length - 1]).toBe(TODAY)

    // Second run (same `today`) must pick up where the cap left off and complete
    // the in-range window — and crucially must not have permanently skipped it.
    const run2 = generateRecurring(run1, TODAY)
    const days2 = genDays(run2)

    // Build the expected full set of in-range (>= capStart) daily occurrences.
    const expected: string[] = []
    for (let d = capStart; d <= TODAY; d = addDays(d, 1)) expected.push(d)

    expect(days2).toEqual(expected)
    // No duplicates: each in-range day appears exactly once.
    expect(new Set(days2).size).toBe(days2.length)
    // After the window is fully materialised, lastGenerated settles on today.
    expect(run2.recurrences[0].lastGenerated).toBe(TODAY)
  })

  it('is idempotent — a third run adds nothing', () => {
    const rule = dailyRule('2025-01-01', '2026-01-01')
    const run1 = generateRecurring(makeData([rule]), TODAY)
    const run2 = generateRecurring(run1, TODAY)
    const before = genDays(run2)
    const run3 = generateRecurring(run2, TODAY)
    expect(genDays(run3)).toEqual(before)
  })

  it('does not clamp when lastGenerated is within the cap window', () => {
    const rule = dailyRule('2025-01-01', addDays(TODAY, -5))
    const next = generateRecurring(makeData([rule]), TODAY)
    expect(next.recurrences[0].lastGenerated).toBe(TODAY)
    expect(genDays(next)).toEqual([
      addDays(TODAY, -4),
      addDays(TODAY, -3),
      addDays(TODAY, -2),
      addDays(TODAY, -1),
      TODAY,
    ])
  })

  it('appliesOn respects startedOn and weekly weekdays', () => {
    const weekly: Recurrence = { ...dailyRule('2026-06-01'), freq: 'weekly', weekdays: [1] }
    expect(appliesOn(weekly, '2026-05-31')).toBe(false) // before startedOn
    expect(appliesOn(weekly, '2026-06-22')).toBe(true) // a Monday
    expect(appliesOn(weekly, '2026-06-23')).toBe(false) // a Tuesday
  })
})

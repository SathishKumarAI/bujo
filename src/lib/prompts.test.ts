import { describe, expect, it } from 'vitest'
import { PROMPT_FIELDS, promptFieldFor, promptForDay } from './prompts'

describe('promptForDay', () => {
  it('is stable for a given day and never empty', () => {
    expect(promptForDay('2026-08-03')).toBe(promptForDay('2026-08-03'))
    expect(promptForDay('2026-08-03').length).toBeGreaterThan(0)
  })
})

describe('promptFieldFor', () => {
  it('is stable for a given day', () => {
    // Reopening yesterday must ask yesterday's question, not a new one.
    expect(promptFieldFor('2026-08-03')).toBe(promptFieldFor('2026-08-03'))
  })

  it('rotates through all three across consecutive days', () => {
    const three = ['2026-08-03', '2026-08-04', '2026-08-05'].map(promptFieldFor)
    expect(new Set(three).size).toBe(3)
  })

  it('stays in range before the epoch it counts from', () => {
    // `dayDiff` goes negative for dates before 2026-01-01, and a raw `% 3`
    // would index the array at -1 and hand back undefined.
    for (const d of ['2025-12-31', '2025-12-30', '2025-06-01', '2024-01-01']) {
      expect(PROMPT_FIELDS).toContain(promptFieldFor(d))
    }
  })
})

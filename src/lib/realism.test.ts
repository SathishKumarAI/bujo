import { describe, expect, it } from 'vitest'
import { appliesOn, generateRecurring } from './recurrence'
import { pearson, rollingAverage } from './correlations'
import { parseICS } from './ics'
import { promptForDay, REFLECTION_PROMPTS } from './prompts'
import { describeCode } from './weather'
import { emptyJournal } from './storage'
import type { Recurrence } from './types'

const rule = (p: Partial<Recurrence>): Recurrence => ({
  id: 'r1', text: 'vitamins', type: 'task', important: false,
  freq: 'daily', weekdays: [], startedOn: '2026-06-01', ...p,
})

describe('recurrence', () => {
  it('daily rule applies every day after start', () => {
    expect(appliesOn(rule({}), '2026-06-10')).toBe(true)
    expect(appliesOn(rule({}), '2026-05-31')).toBe(false)
  })
  it('weekly rule applies only on chosen weekdays', () => {
    const r = rule({ freq: 'weekly', weekdays: [3] }) // Wednesday
    expect(appliesOn(r, '2026-06-10')).toBe(true) // 2026-06-10 is Wed
    expect(appliesOn(r, '2026-06-11')).toBe(false)
  })
  it('materialises entries without duplicating on re-run', () => {
    const data = { ...emptyJournal(), recurrences: [rule({ startedOn: '2026-06-08' })] }
    const once = generateRecurring(data, '2026-06-10')
    const created = once.entries.filter((e) => e.recurringId === 'r1').length
    expect(created).toBe(3) // 8th, 9th, 10th
    const twice = generateRecurring(once, '2026-06-10')
    expect(twice.entries.filter((e) => e.recurringId === 'r1').length).toBe(3)
  })
})

describe('correlations', () => {
  it('pearson is 1 for a perfect positive line', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1)
  })
  it('pearson is -1 for a perfect negative line', () => {
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1)
  })
  it('rolling average smooths a series', () => {
    expect(rollingAverage([2, 4, 6], 2)).toEqual([2, 3, 5])
  })
})

describe('ics parser', () => {
  it('extracts summary and date from a VEVENT', () => {
    const ics = [
      'BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'DTSTART:20260610T130000Z',
      'SUMMARY:Dentist appointment', 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    expect(parseICS(ics)).toEqual([{ date: '2026-06-10', summary: 'Dentist appointment' }])
  })
  it('handles all-day DATE form', () => {
    const ics = 'BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20260701\r\nSUMMARY:Trip\r\nEND:VEVENT'
    expect(parseICS(ics)[0].date).toBe('2026-07-01')
  })
})

describe('prompts', () => {
  it('returns a stable prompt from the set for a given day', () => {
    const p = promptForDay('2026-06-10')
    expect(REFLECTION_PROMPTS).toContain(p)
    expect(promptForDay('2026-06-10')).toBe(p)
  })
})

describe('weather code map', () => {
  it('maps known WMO codes to label + icon', () => {
    expect(describeCode(0).label).toBe('Clear sky')
    expect(describeCode(95).icon).toBe('⛈️')
  })
  it('falls back for unknown codes', () => {
    expect(describeCode(123).label).toBe('Unknown')
  })
})

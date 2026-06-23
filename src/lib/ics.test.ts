import { describe, expect, it } from 'vitest'
import { parseICS, journalToICS } from './ics'
import { emptyJournal } from './storage'

describe('parseICS', () => {
  it('extracts VEVENT summary and start date (DATE and DATE-TIME forms)', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'DTSTART;VALUE=DATE:20260610',
      'SUMMARY:Dentist',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'DTSTART:20260611T130000Z',
      'SUMMARY:Standup',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    expect(parseICS(ics)).toEqual([
      { date: '2026-06-10', summary: 'Dentist' },
      { date: '2026-06-11', summary: 'Standup' },
    ])
  })

  it('unfolds continued lines and unescapes commas/semicolons', () => {
    const ics = 'BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20260101\r\nSUMMARY:New Year\r\n  party\\, fun\r\nEND:VEVENT'
    expect(parseICS(ics)).toEqual([{ date: '2026-01-01', summary: 'New Year party, fun' }])
  })

  it('skips events missing a date or summary', () => {
    const ics = 'BEGIN:VEVENT\r\nSUMMARY:No date\r\nEND:VEVENT'
    expect(parseICS(ics)).toEqual([])
  })
})

describe('journalToICS', () => {
  it('wraps output in a VCALENDAR envelope', () => {
    const ics = journalToICS(emptyJournal())
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
  })

  it('emits a VEVENT for event-type entries and skips tasks/notes', () => {
    const d = emptyJournal()
    d.entries = [
      { id: 'e1', date: '2026-06-10', type: 'event', text: 'Lunch with Sam', status: 'open', important: false, memory: false, tags: [], createdAt: '2026-06-10' },
      { id: 't1', date: '2026-06-10', type: 'task', text: 'buy milk', status: 'open', important: false, memory: false, tags: [], createdAt: '2026-06-10' },
    ]
    const ics = journalToICS(d)
    expect(ics).toContain('DTSTART;VALUE=DATE:20260610')
    expect(ics).toContain('SUMMARY:Lunch with Sam')
    expect(ics).not.toContain('buy milk')
  })

  it('emits birthdays for the given year and escapes text', () => {
    const d = emptyJournal()
    d.birthdays = [{ id: 'b1', name: 'Amy; Lee', month: 3, day: 5 }]
    const ics = journalToICS(d, 2026)
    expect(ics).toContain('DTSTART;VALUE=DATE:20260305')
    expect(ics).toContain('SUMMARY:🎂 Amy\\; Lee')
  })

  it('round-trips an event entry through the parser', () => {
    const d = emptyJournal()
    d.entries = [{ id: 'e1', date: '2026-06-10', type: 'event', text: 'Demo day', status: 'open', important: false, memory: false, tags: [], createdAt: '2026-06-10' }]
    const back = parseICS(journalToICS(d))
    expect(back).toContainEqual({ date: '2026-06-10', summary: 'Demo day' })
  })
})

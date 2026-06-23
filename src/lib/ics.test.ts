import { describe, expect, it } from 'vitest'
import { parseICS, journalToICS, habitRemindersToICS, tasksToICS, completionsToICS } from './ics'
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

describe('tasksToICS', () => {
  it('wraps output in a VCALENDAR envelope', () => {
    const ics = tasksToICS(emptyJournal())
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
  })

  it('emits open dated tasks and skips events/done/dropped/undated', () => {
    const d = emptyJournal()
    d.entries = [
      { id: 't1', date: '2026-06-10', type: 'task', text: 'File taxes', status: 'open', important: false, memory: false, tags: [], createdAt: '2026-06-10' },
      { id: 't2', date: '2026-06-11', type: 'task', text: 'done thing', status: 'done', important: false, memory: false, tags: [], createdAt: '2026-06-11' },
      { id: 't3', date: '2026-06-12', type: 'task', text: 'dropped thing', status: 'dropped', important: false, memory: false, tags: [], createdAt: '2026-06-12' },
      { id: 't4', date: '', type: 'task', text: 'no date', status: 'open', important: false, memory: false, tags: [], createdAt: '2026-06-13' },
      { id: 'e1', date: '2026-06-14', type: 'event', text: 'a meeting', status: 'open', important: false, memory: false, tags: [], createdAt: '2026-06-14' },
    ]
    const ics = tasksToICS(d)
    expect(ics).toContain('DTSTART;VALUE=DATE:20260610')
    expect(ics).toContain('SUMMARY:☐ File taxes')
    expect(ics).not.toContain('done thing')
    expect(ics).not.toContain('dropped thing')
    expect(ics).not.toContain('no date')
    expect(ics).not.toContain('a meeting')
  })

  it('round-trips an open task back through the parser', () => {
    const d = emptyJournal()
    d.entries = [{ id: 't1', date: '2026-06-10', type: 'task', text: 'Pay rent', status: 'open', important: false, memory: false, tags: [], createdAt: '2026-06-10' }]
    expect(parseICS(tasksToICS(d))).toContainEqual({ date: '2026-06-10', summary: '☐ Pay rent' })
  })
})

describe('habitRemindersToICS', () => {
  it('wraps output in a VCALENDAR envelope', () => {
    const ics = habitRemindersToICS(emptyJournal())
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
  })

  it('emits a daily recurring reminder at the journal reminder time', () => {
    const d = emptyJournal()
    d.settings.reminderTime = '07:30'
    d.habits = [{ id: 'h', name: 'Meditate', category: 'wellness', color: 'mauve', startedOn: '2026-06-01', emoji: '🧘' }]
    const ics = habitRemindersToICS(d)
    expect(ics).toContain('DTSTART:20260601T073000')
    expect(ics).toContain('RRULE:FREQ=DAILY')
    expect(ics).toContain('SUMMARY:🧘 Meditate')
  })

  it('uses weekly BYDAY when the habit has specific active days', () => {
    const d = emptyJournal()
    d.habits = [{ id: 'h', name: 'Gym', category: 'movement', color: 'peach', startedOn: '2026-06-01', activeDays: [1, 3, 5] }]
    const ics = habitRemindersToICS(d)
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR')
  })

  it('appends target/unit to the summary and skips archived habits', () => {
    const d = emptyJournal()
    d.habits = [
      { id: 'w', name: 'Water', category: 'food', color: 'sky', startedOn: '2026-06-01', type: 'count', target: 8, unit: 'glasses' },
      { id: 'old', name: 'Old', category: 'custom', color: 'red', startedOn: '2026-06-01', archived: true },
    ]
    const ics = habitRemindersToICS(d)
    expect(ics).toContain('SUMMARY:Water (8 glasses)')
    expect(ics).not.toContain('Old')
  })
})

describe('completionsToICS', () => {
  it('wraps output in a VCALENDAR envelope', () => {
    const ics = completionsToICS(emptyJournal())
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
  })

  it('emits a ✓ all-day event per logged check-habit completion', () => {
    const d = emptyJournal()
    d.habits = [{ id: 'h', name: 'Meditate', category: 'wellness', color: 'mauve', startedOn: '2026-06-01', emoji: '🧘' }]
    d.habitLog = { '2026-06-10': ['h'] }
    const ics = completionsToICS(d)
    expect(ics).toContain('DTSTART;VALUE=DATE:20260610')
    expect(ics).toContain('SUMMARY:✓ 🧘 Meditate')
  })

  it('counts a count-habit day only when the value meets the target, without duplicating the log', () => {
    const d = emptyJournal()
    d.habits = [{ id: 'w', name: 'Water', category: 'food', color: 'sky', startedOn: '2026-06-01', type: 'count', target: 8 }]
    d.habitValues = { '2026-06-10': { w: 8 }, '2026-06-11': { w: 3 } }
    const ics = completionsToICS(d)
    expect(ics).toContain('DTSTART;VALUE=DATE:20260610') // met target
    expect(ics).not.toContain('20260611') // below target
    // Met-target day appears exactly once (no log+value duplicate).
    expect(ics.match(/20260610/g)).toHaveLength(1)
  })

  it('emits an event for each logged workout with its duration', () => {
    const d = emptyJournal()
    d.workouts = [{ id: 'wk', date: '2026-06-12', activity: 'Run', durationMin: 30, sets: [], notes: '' }]
    const ics = completionsToICS(d)
    expect(ics).toContain('DTSTART;VALUE=DATE:20260612')
    expect(ics).toContain('SUMMARY:✓ Run (30m)')
  })
})

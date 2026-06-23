// Minimal .ics (iCalendar) parser + exporter — round-trips VEVENT summary +
// start date. Handles line folding and both DATE and DATE-TIME DTSTART forms.
import type { JournalData } from './types'

export interface IcsEvent {
  date: string // ISO day
  summary: string
}

function unfold(raw: string): string[] {
  // RFC 5545: lines continued with a leading space/tab.
  return raw.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n')
}

/** "20260610" or "20260610T130000Z" → "2026-06-10". */
function parseDt(value: string): string | null {
  const m = value.match(/(\d{4})(\d{2})(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

export function parseICS(text: string): IcsEvent[] {
  const lines = unfold(text)
  const events: IcsEvent[] = []
  let cur: Partial<IcsEvent> | null = null

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) cur = {}
    else if (line.startsWith('END:VEVENT')) {
      if (cur?.date && cur.summary) events.push({ date: cur.date, summary: cur.summary })
      cur = null
    } else if (cur) {
      if (line.startsWith('DTSTART')) {
        const val = line.slice(line.indexOf(':') + 1).trim()
        const d = parseDt(val)
        if (d) cur.date = d
      } else if (line.startsWith('SUMMARY')) {
        cur.summary = line
          .slice(line.indexOf(':') + 1)
          .trim()
          .replace(/\\,/g, ',')
          .replace(/\\;/g, ';')
          .replace(/\\n/gi, ' ')
      }
    }
  }
  return events
}

// ── Export ────────────────────────────────────────────────────────────────────

/** Escape a value for an iCalendar text field (RFC 5545 §3.3.11). */
function escText(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** "2026-06-10" → "20260610" (all-day DATE value). Non-ISO input is dropped. */
function toIcsDate(iso: string): string | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}${m[2]}${m[3]}` : null
}

/** Wrap a built list of VEVENT bodies in a VCALENDAR envelope. */
function calendar(events: string[]): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//bujo//journal//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

function vevent(uid: string, date: string, summary: string): string | null {
  const d = toIcsDate(date)
  if (!d) return null
  return [
    'BEGIN:VEVENT',
    `UID:${escText(uid)}`,
    `DTSTART;VALUE=DATE:${d}`,
    `SUMMARY:${escText(summary)}`,
    'END:VEVENT',
  ].join('\r\n')
}

/** ISO "2026-06-10" + "HH:MM" → "20260610T090000" (local floating DATE-TIME). */
function toIcsDateTime(iso: string, time: string): string | null {
  const d = toIcsDate(iso)
  const m = /^(\d{2}):(\d{2})$/.exec(time)
  if (!d || !m) return null
  return `${d}T${m[1]}${m[2]}00`
}

/** RFC 5545 weekday tokens, indexed 0=Sun … 6=Sat. */
const ICS_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const

/**
 * Habit reminders as recurring all-day-of timed VEVENTs (BUJO-397): one event per
 * active (non-archived) habit, repeating daily — or weekly on its `activeDays` —
 * at the journal's `reminderTime` (default "09:00"), starting from each habit's
 * `startedOn`. Importable into Google/Apple Calendar so reminders fire on your
 * own calendar. Pure; returns a full VCALENDAR.
 */
export function habitRemindersToICS(data: JournalData): string {
  const time = data.settings.reminderTime || '09:00'
  const events: string[] = []
  for (const h of data.habits) {
    if (h.archived) continue
    const dt = toIcsDateTime(h.startedOn, time)
    if (!dt) continue
    const days = h.activeDays && h.activeDays.length > 0 && h.activeDays.length < 7
    const rrule = days
      ? `RRULE:FREQ=WEEKLY;BYDAY=${[...h.activeDays!].sort((a, b) => a - b).map((d) => ICS_DAYS[d]).filter(Boolean).join(',')}`
      : 'RRULE:FREQ=DAILY'
    const summary = `${h.emoji ? `${h.emoji} ` : ''}${h.name}${h.target ? ` (${h.target}${h.unit ? ` ${h.unit}` : ''})` : ''}`
    events.push(
      [
        'BEGIN:VEVENT',
        `UID:${escText(`bujo-habit-${h.id}`)}`,
        `DTSTART:${dt}`,
        'DURATION:PT15M',
        rrule,
        `SUMMARY:${escText(summary)}`,
        'END:VEVENT',
      ].join('\r\n'),
    )
  }
  return calendar(events)
}

/**
 * Export dated journal items as an all-day iCalendar (.ics) feed importable into
 * Google/Apple Calendar: `event`-type entries, plus this year's birthdays.
 * Pure; pass `year` for deterministic birthday dates (defaults to current year).
 */
export function journalToICS(data: JournalData, year = new Date().getFullYear()): string {
  const events: string[] = []
  for (const e of data.entries) {
    if (e.type !== 'event' || !e.date) continue
    const v = vevent(`bujo-entry-${e.id}`, e.date, e.text)
    if (v) events.push(v)
  }
  for (const b of data.birthdays) {
    const iso = `${year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`
    const v = vevent(`bujo-bday-${b.id}-${year}`, iso, `🎂 ${b.name}`)
    if (v) events.push(v)
  }
  return calendar(events)
}

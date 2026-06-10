// Minimal .ics (iCalendar) parser — extracts VEVENT summary + start date.
// Handles line folding and both DATE and DATE-TIME DTSTART forms.

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

import type { BulletType, Entry, EntryStatus } from './types'

// ── Rapid-logging signifiers (Ryder Carroll method + Elsa's additions) ───────

/** The leading glyph shown for an entry, derived from type + status. */
export function glyphFor(type: BulletType, status: EntryStatus): string {
  if (type === 'event') return '○'
  if (type === 'note') return '–'
  // task
  switch (status) {
    case 'done':
      return '✕'
    case 'migrated':
      return '>'
    case 'scheduled':
      return '<'
    case 'dropped':
      return '·'
    default:
      return '·'
  }
}

export const BULLET_LEGEND: { glyph: string; label: string }[] = [
  { glyph: '·', label: 'Task' },
  { glyph: '✕', label: 'Task complete' },
  { glyph: '>', label: 'Task migrated (next month)' },
  { glyph: '<', label: 'Task scheduled (future log)' },
  { glyph: '○', label: 'Event' },
  { glyph: '–', label: 'Note' },
  { glyph: '▲', label: 'Memory' },
  { glyph: '!', label: 'Important' },
  { glyph: '~', label: 'Dropped (struck through)' },
]

/** Cycle a task through its lifecycle on click: open → done → migrated → open. */
export function nextStatus(status: EntryStatus): EntryStatus {
  const cycle: EntryStatus[] = ['open', 'done', 'migrated', 'dropped']
  const i = cycle.indexOf(status)
  return cycle[(i + 1) % cycle.length]
}

/** Extract #tags from free text. */
export function parseTags(text: string): string[] {
  const matches = text.match(/#[\w-]+/g) ?? []
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))]
}

/**
 * Parse a quick-capture line into a partial entry.
 * Prefixes: "t " task, "e " event, "n " note, "* " important, "^ " memory.
 * Examples: "t buy lamb food #camp", "e ecstatic dance", "* eliminate dairy".
 */
export function parseQuickCapture(raw: string): Pick<
  Entry,
  'type' | 'text' | 'important' | 'memory' | 'tags' | 'status'
> {
  let text = raw.trim()
  let type: BulletType = 'task'
  let important = false
  let memory = false

  // Allow stacking signifiers, e.g. "* t something" or "^ e party".
  let changed = true
  while (changed) {
    changed = false
    if (/^t\s+/i.test(text)) { type = 'task'; text = text.replace(/^t\s+/i, ''); changed = true }
    else if (/^e\s+/i.test(text)) { type = 'event'; text = text.replace(/^e\s+/i, ''); changed = true }
    else if (/^n\s+/i.test(text)) { type = 'note'; text = text.replace(/^n\s+/i, ''); changed = true }
    if (/^[*!]\s+/.test(text)) { important = true; text = text.replace(/^[*!]\s+/, ''); changed = true }
    if (/^\^\s+/.test(text)) { memory = true; text = text.replace(/^\^\s+/, ''); changed = true }
  }

  return {
    type,
    text: text.trim(),
    important,
    memory,
    tags: parseTags(text),
    status: 'open',
  }
}

import type { Entry, JournalData, Recurrence } from './types'
import { addDays, fromISODay, todayISO } from './date'
import { uid } from './storage'

/** Does a recurrence rule apply on the given ISO day? */
export function appliesOn(rule: Recurrence, iso: string): boolean {
  if (iso < rule.startedOn) return false
  if (rule.freq === 'daily') return true
  return rule.weekdays.includes(fromISODay(iso).getDay())
}

/**
 * Materialise recurrence rules into entries for every day from each rule's
 * last-generated point up to today. Pure: returns the next JournalData.
 * Idempotent — never creates a duplicate for a (rule, day) pair.
 */
export function generateRecurring(data: JournalData, today = todayISO()): JournalData {
  if (data.recurrences.length === 0) return data
  const newEntries: Entry[] = []
  const existing = new Set(data.entries.filter((e) => e.recurringId).map((e) => `${e.recurringId}@${e.date}`))

  const recurrences = data.recurrences.map((rule) => {
    // Start from the day after lastGenerated, or the rule start, capped to 60d back.
    const from = rule.lastGenerated ? addDays(rule.lastGenerated, 1) : rule.startedOn
    let cursor = from < addDays(today, -60) ? addDays(today, -60) : from
    while (cursor <= today) {
      if (appliesOn(rule, cursor) && !existing.has(`${rule.id}@${cursor}`)) {
        newEntries.push({
          id: uid('e'),
          date: cursor,
          type: rule.type,
          text: rule.text,
          status: 'open',
          important: rule.important,
          memory: false,
          tags: [],
          recurringId: rule.id,
          createdAt: today,
        })
      }
      cursor = addDays(cursor, 1)
    }
    return { ...rule, lastGenerated: today }
  })

  if (newEntries.length === 0) return { ...data, recurrences }
  return { ...data, entries: [...data.entries, ...newEntries], recurrences }
}

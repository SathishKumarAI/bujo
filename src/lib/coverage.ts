// "What did I actually cover that day?" — a per-day rollup of the core daily
// intentions (habits, journaling, mood check-in, a workout) so the UI can show
// exactly what was missed, especially for yesterday and across the week.
import type { JournalData } from './types'
import { addDays, todayISO } from './date'
import { dayCompletion } from './stats'

export interface DayCoverage {
  date: string
  habits: { done: number; total: number; missed: string[] }
  journaled: boolean // any entry/gratitude/memory written
  moodLogged: boolean
  workout: boolean
  /** 0–1 overall coverage of the day's applicable intentions. */
  score: number
}

/** Did the user write anything (entry/gratitude/memory) on this day? */
function didJournal(data: JournalData, date: string): boolean {
  return (
    data.entries.some((e) => e.date === date && e.text) ||
    data.gratitude.some((g) => g.date === date && g.text) ||
    data.memories.some((m) => m.date === date && m.text)
  )
}

export function dayCoverage(data: JournalData, date: string): DayCoverage {
  const dow = new Date(date + 'T00:00').getDay()
  const scheduled = data.habits.filter((h) =>
    !h.archived && (h.type ?? 'check') === 'check' && date >= h.startedOn &&
    (!h.activeDays?.length || h.activeDays.includes(dow)),
  )
  const log = data.habitLog[date] ?? []
  const skips = (id: string) => (data.habitSkips?.[id] ?? []).includes(date)
  const doneHabits = scheduled.filter((h) => log.includes(h.id) || skips(h.id))
  const missed = scheduled.filter((h) => !log.includes(h.id) && !skips(h.id)).map((h) => h.name)

  const c = dayCompletion(data, date)
  const journaled = didJournal(data, date)
  const moodLogged = data.metrics.some((m) => m.date === date && m.mood != null)
  const workout = data.workouts.some((w) => w.date === date)

  // Score: habit ratio (when habits scheduled) + journaling + mood, each 0–1.
  // Workout is a bonus, not a daily requirement (don't penalise rest days).
  const parts: number[] = [journaled ? 1 : 0, moodLogged ? 1 : 0]
  if (scheduled.length > 0) parts.push(c.ratio ?? 0)
  const score = parts.reduce((a, b) => a + b, 0) / parts.length

  return {
    date,
    habits: { done: doneHabits.length, total: scheduled.length, missed },
    journaled,
    moodLogged,
    workout,
    score,
  }
}

/** Coverage for the last `days` ending today (oldest → newest). */
export function weekCoverage(data: JournalData, today = todayISO(), days = 7): DayCoverage[] {
  return Array.from({ length: days }, (_, i) => dayCoverage(data, addDays(today, -(days - 1 - i))))
}

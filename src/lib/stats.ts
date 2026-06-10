import type { JournalData } from './types'
import { addDays, dayDiff, todayISO } from './date'

/** Days that have ANY activity (entry, metric, gratitude, memory, workout, habit). */
export function activeDays(data: JournalData): Set<string> {
  const days = new Set<string>()
  data.entries.forEach((e) => e.date && days.add(e.date))
  data.metrics.forEach((m) => days.add(m.date))
  data.gratitude.forEach((g) => g.text && days.add(g.date))
  data.memories.forEach((m) => m.text && days.add(m.date))
  data.workouts.forEach((w) => days.add(w.date))
  Object.entries(data.habitLog).forEach(([d, ids]) => ids.length && days.add(d))
  return days
}

/** Current consecutive-day logging streak ending today (or yesterday). */
export function currentStreak(data: JournalData, today = todayISO()): number {
  const days = activeDays(data)
  if (days.size === 0) return 0
  // Allow the streak to "count" even if today isn't logged yet.
  let cursor = days.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Longest streak ever recorded. */
export function longestStreak(data: JournalData): number {
  const days = [...activeDays(data)].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of days) {
    run = prev && dayDiff(prev, d) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

/** Task completion rate (done / non-dropped tasks). */
export function taskCompletion(data: JournalData): { done: number; total: number; pct: number } {
  const tasks = data.entries.filter((e) => e.type === 'task' && e.status !== 'dropped')
  const done = tasks.filter((e) => e.status === 'done').length
  const total = tasks.length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}

/** Habit completion % over the last `window` days. */
export function habitConsistency(
  data: JournalData,
  habitId: string,
  startedOn: string,
  window = 30,
  today = todayISO(),
): number {
  let hit = 0
  let possible = 0
  for (let i = 0; i < window; i++) {
    const day = addDays(today, -i)
    if (dayDiff(startedOn, day) < 0) continue // before tracking began
    possible += 1
    if ((data.habitLog[day] ?? []).includes(habitId)) hit += 1
  }
  return possible ? Math.round((hit / possible) * 100) : 0
}

/** "On this day" — entries/memories from the same month+day in prior periods. */
export function onThisDay(data: JournalData, today = todayISO()) {
  const mmdd = today.slice(5) // "MM-DD"
  const hits = {
    entries: data.entries.filter((e) => e.date && e.date.slice(5) === mmdd && e.date !== today),
    memories: data.memories.filter((m) => m.date.slice(5) === mmdd && m.date !== today && m.text),
    gratitude: data.gratitude.filter((g) => g.date.slice(5) === mmdd && g.date !== today && g.text),
  }
  return hits
}

/** Full-text search across entries, memories, gratitude, workouts. */
export function search(data: JournalData, q: string) {
  const needle = q.trim().toLowerCase()
  if (!needle) return [] as { date: string; kind: string; text: string }[]
  const out: { date: string; kind: string; text: string }[] = []
  data.entries.forEach((e) => {
    if (e.text.toLowerCase().includes(needle)) out.push({ date: e.date, kind: e.type, text: e.text })
  })
  data.memories.forEach((m) => {
    if (m.text.toLowerCase().includes(needle)) out.push({ date: m.date, kind: 'memory', text: m.text })
  })
  data.gratitude.forEach((g) => {
    if (g.text.toLowerCase().includes(needle)) out.push({ date: g.date, kind: 'gratitude', text: g.text })
  })
  data.workouts.forEach((w) => {
    const blob = `${w.activity} ${w.notes} ${w.sets.join(' ')}`.toLowerCase()
    if (blob.includes(needle)) out.push({ date: w.date, kind: 'workout', text: `${w.activity} — ${w.notes}` })
  })
  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
}

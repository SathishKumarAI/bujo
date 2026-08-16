/**
 * Mindset practice log — the arithmetic behind the practice grid, the streak
 * line and the category-balance bars.
 *
 * Owns: reading `JournalData.mindsetPractice` (a `principleId → ISO days` map)
 * and turning it into the shapes the charts want.
 * Does not own: rendering, the principle catalogue (`lib/mindset.ts`), or when a
 * day gets marked (`store.toggleMindsetPractice`).
 *
 * Every function here is pure and takes the log explicitly, so the charts can be
 * tested without a store and a fixed `today` can be passed in tests.
 */

import { MINDSET_CATEGORIES, MINDSET_LIBRARY } from './mindset'
import { addDays, todayISO } from './date'

/** `principleId → ISO days practised`. Matches `JournalData.mindsetPractice`. */
export type PracticeLog = Record<string, string[]>

/** Days with at least one mark, and how many principles were marked on each. */
export function marksByDay(log: PracticeLog = {}): Map<string, number> {
  const out = new Map<string, number>()
  for (const days of Object.values(log)) {
    // A duplicate date within one principle would double-count the day, and
    // nothing upstream guarantees uniqueness across imports and merges.
    for (const day of new Set(days)) out.set(day, (out.get(day) ?? 0) + 1)
  }
  return out
}

/** `{ date, value }` rows for the 12-week grid — the shape `CalendarHeatmap` eats. */
export function practiceData(log: PracticeLog = {}): { date: string; value: number }[] {
  return [...marksByDay(log)].map(([date, value]) => ({ date, value }))
}

/**
 * Consecutive days ending today on which anything was practised.
 *
 * Today not being marked yet does NOT break the run: at 09:00 a streak that
 * counts only closed days would read one lower than the user's own count all
 * morning. A gap at yesterday does break it.
 */
export function currentStreak(log: PracticeLog = {}, today = todayISO()): number {
  const days = marksByDay(log)
  let cursor = days.has(today) ? today : addDays(today, -1)
  let n = 0
  while (days.has(cursor)) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

/** Total marks for one principle — the leading band's "Active N days". */
export function daysPracticed(log: PracticeLog = {}, principleId: string): number {
  return new Set(log[principleId] ?? []).size
}

export interface CategoryCount {
  name: string
  /** Total marks across every principle in the category. */
  count: number
  /** `count / max`, 0–1. Zero when nothing is logged at all — not NaN. */
  share: number
}

/**
 * Marks per category, in `MINDSET_CATEGORIES` order.
 *
 * Every category is returned, including empty ones: a bar at zero says "you
 * have not touched Connection", which is the insight the chart exists for. A
 * filtered list would quietly redraw itself as the user's practice moved.
 */
export function categoryCounts(log: PracticeLog = {}): CategoryCount[] {
  const byPrinciple = new Map(MINDSET_LIBRARY.map((p) => [p.id, p.category]))
  const totals = new Map<string, number>(MINDSET_CATEGORIES.map((c) => [c, 0]))
  for (const [id, days] of Object.entries(log)) {
    const cat = byPrinciple.get(id)
    // An id no longer in the library (renamed principle, hand-edited import)
    // is dropped rather than summed into a phantom category.
    if (!cat) continue
    totals.set(cat, (totals.get(cat) ?? 0) + new Set(days).size)
  }
  const max = Math.max(...totals.values())
  return MINDSET_CATEGORIES.map((name) => {
    const count = totals.get(name) ?? 0
    return { name, count, share: max > 0 ? count / max : 0 }
  })
}

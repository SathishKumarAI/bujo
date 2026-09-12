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
import type { DailyMetric } from './types'

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

/** Distinct days with at least one mark — the review strip's "Days practised". */
export function daysWithMarks(log: PracticeLog = {}, since?: string): number {
  const days = [...marksByDay(log).keys()]
  return since ? days.filter((d) => d >= since).length : days.length
}

export interface MoodContrast {
  /** Mean 0–10 mood on days something was practised. `null` = nothing to average. */
  practised: number | null
  /** Mean 0–10 mood on the days in the window that were not. */
  other: number | null
  practisedDays: number
  otherDays: number
}

/**
 * Mood on the days you practised, against the days you did not.
 *
 * The one thing this page can say that a paper journal cannot, and the product
 * promise ("charts that overlay your mood against your sleep") pointed at the
 * data the page already owns. It is a contrast, not a claim — two means over a
 * trailing window, with the day counts beside them so a two-day sample cannot
 * be read as a finding.
 *
 * **Both sides return `null` when there is nothing to average.** CLAUDE.md
 * records `count ? sum / count : 0` shipping in `monthlyCompletion` and
 * `weekdayConsistency`, where it made "no data" indistinguishable from "you
 * scored zero" and opened a trend with `0% · 0%` for months that never
 * happened. Zero is a real mood here — the scale starts there — so the lie
 * would be worse, not better.
 *
 * Only days carrying a mood count on either side: a day with no metric row is
 * not evidence for or against, and folding it into the denominator would drag
 * whichever side had more untouched days toward zero.
 */
export function moodContrast(
  log: PracticeLog = {},
  metrics: DailyMetric[] = [],
  days = 90,
  today = todayISO(),
): MoodContrast {
  const start = addDays(today, -(days - 1))
  const marked = marksByDay(log)
  let practisedSum = 0
  let practisedN = 0
  let otherSum = 0
  let otherN = 0
  for (const m of metrics) {
    if (m.mood == null || m.date < start || m.date > today) continue
    if (marked.has(m.date)) {
      practisedSum += m.mood
      practisedN++
    } else {
      otherSum += m.mood
      otherN++
    }
  }
  return {
    practised: practisedN ? practisedSum / practisedN : null,
    other: otherN ? otherSum / otherN : null,
    practisedDays: practisedN,
    otherDays: otherN,
  }
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

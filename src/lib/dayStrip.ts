import { addDays, dayDiff, weekDaysOf } from './date'

/**
 * WHICH SEVEN DAYS A DAY STRIP SHOWS for the selected day (`ui/dayStrip.tsx`).
 *
 * - `week`: the calendar week holding it (Plan — a week you plan ahead in).
 * - `trailing`: seven days ending on `today`, then the seven before that, …
 *   (Nutrition, Challenges, Habits — logs, where today is the right edge and
 *   the future has nothing to tick).
 *
 * Derived from the selection alone, so a strip has no paging state of its own:
 * the arrows move the selection by a week and the window follows.
 */
export function stripDays(selected: string, today: string, mode: 'week' | 'trailing', weekStart: 0 | 1 = 0): string[] {
  if (mode === 'week') return weekDaysOf(selected, weekStart)
  const back = Math.max(0, dayDiff(selected, today))
  const end = addDays(today, -7 * Math.floor(back / 7))
  return Array.from({ length: 7 }, (_, i) => addDays(end, i - 6))
}

/** The day a week arrow lands on: a week over, held inside [min, max]. */
export function stepWeek(selected: string, dir: -1 | 1, min?: string, max?: string): string {
  let d = addDays(selected, 7 * dir)
  if (max && dayDiff(d, max) < 0) d = max
  if (min && dayDiff(min, d) < 0) d = min
  return d
}

/**
 * THE TOP BAR'S FEW DAYS (`ui/dayStrip.tsx` in the phone header): `n` days with
 * the selection in the middle, slid back inside [min, max] so the bar never
 * spends a chip on a day that cannot be picked — today selected on a log
 * shows the four days before it, not two dead tomorrows.
 */
export function windowDays(selected: string, n: number, min?: string, max?: string): string[] {
  let start = addDays(selected, -Math.floor(n / 2))
  if (max && dayDiff(addDays(start, n - 1), max) < 0) start = addDays(max, 1 - n)
  if (min && dayDiff(min, start) < 0) start = min
  return Array.from({ length: n }, (_, i) => addDays(start, i))
}

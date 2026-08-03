import type { DailyMetric } from './types'

/**
 * Today is three surfaces over one day record, not three pages.
 *
 * Ten cards on one screen was the core problem: they are never all needed at
 * once, and at 6am most of them are empty. Splitting by time of day means the
 * screen answers "what am I here to do right now" instead of listing everything
 * that could ever be done today.
 *
 * Nothing here filters *data* — every surface reads the same day record. This
 * module only decides which surface is showing.
 */
export type Surface = 'morning' | 'day' | 'evening'

export const SURFACES: Surface[] = ['morning', 'day', 'evening']

export function isSurface(v: string | null | undefined): v is Surface {
  return v === 'morning' || v === 'day' || v === 'evening'
}

/**
 * Which surface the clock suggests. Morning until 11:00, Day until 18:00,
 * Evening after. The person can override; this is only the opening guess.
 */
export function surfaceForHour(hour: number): Surface {
  if (hour < 11) return 'morning'
  if (hour < 18) return 'day'
  return 'evening'
}

/**
 * Is the morning check-in already answered?
 *
 * Used to decide whether Morning shows inputs or a summary. All four ratings
 * have to be present: a half-filled check-in is still a check-in to finish, and
 * showing a summary of it would hide the fields that are still blank.
 *
 * `fastBreak` is deliberately not required — plenty of days have no first meal
 * to record yet at the time you rate your sleep.
 */
export function morningComplete(metric: DailyMetric | undefined): boolean {
  if (!metric) return false
  return (
    metric.mood != null &&
    metric.stress != null &&
    metric.energy != null &&
    metric.sleep != null
  )
}

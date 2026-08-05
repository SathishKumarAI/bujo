import type { Surface } from './deepLink'

/**
 * WHICH SURFACE TODAY OPENS ON.
 *
 * Separate from `timeofday.ts`, which has four slots and groups *habits*. This
 * has three and picks a *page*: the day surface is the default and the widest
 * window because rapid logging is what the page is mostly for, and there is no
 * "anytime" because the page always has to open on something.
 *
 * Pure, so the boundary is a test rather than a thing you check by waiting.
 */
export function surfaceForHour(hour: number): Surface {
  if (hour < 11) return 'morning'
  if (hour < 18) return 'day'
  return 'evening'
}

export const SURFACE_LABEL: Record<Surface, string> = {
  morning: 'Morning',
  day: 'Day',
  evening: 'Evening',
}

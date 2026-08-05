import type { DistanceUnit } from './types'

/**
 * DISTANCE · kilometres are canonical in storage, the user's unit is a display
 * concern, and this module is the only boundary between them.
 *
 * It exists because that boundary was previously missing and half the app had
 * quietly picked a side. `Workout.distanceKm` was written straight from the
 * form with no conversion, so with the default unit (mi) it held miles under a
 * km name. Some readers believed the name and divided by 1.60934 (`pace()`,
 * the "Best mi" tile, the distance badge) and some believed the value and
 * printed it raw (the history row, the totals tile) — so the same 3.1 showed as
 * both "3.1 mi" and "1.9 mi" on one screen.
 *
 * Storing canonical km is what makes the unit toggle non-destructive: switching
 * to km must re-express existing history, not reinterpret it.
 */
export const KM_PER_MI = 1.60934

/** User-entered distance → canonical kilometres for storage. */
export function toKm(value: number, unit: DistanceUnit): number {
  return unit === 'mi' ? value * KM_PER_MI : value
}

/** Canonical kilometres → the user's unit, for display or an input's value. */
export function fromKm(km: number, unit: DistanceUnit): number {
  return unit === 'mi' ? km / KM_PER_MI : km
}

/** Canonical km → a display number in the user's unit, rounded to one decimal. */
export function displayDistance(km: number | undefined, unit: DistanceUnit): number {
  return Math.round(fromKm(km ?? 0, unit) * 10) / 10
}

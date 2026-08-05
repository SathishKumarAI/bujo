import { bestStat, modeOf, type Mode } from './activities'
import { displayDistance } from '../lib/units'
import type { DistanceUnit, JournalData, Workout } from '../lib/types'

/**
 * Derived reads over logged sessions, keyed off the activity registry.
 *
 * These live beside the registry rather than in `lib/fitness.ts` because they
 * are *about* the registry: which stat headlines a summary is `best` on the
 * activity, and which sessions belong to a mode is `modeOf`. Putting them in
 * the view would mean each page re-deriving them slightly differently, which is
 * how the six-different-stat-cards situation happened in the first place.
 */

export const sessionsInMode = (data: JournalData, mode: Mode): Workout[] =>
  data.workouts.filter((w) => modeOf(w.activity) === mode)

/** Total working volume of a strength session: Σ weight × reps, working sets only. */
export function volumeOf(w: Workout): number {
  return (w.setRows ?? [])
    .filter((r) => r.kind !== 'warmup')
    .reduce((sum, r) => sum + (r.weight ?? 0) * (r.reps ?? 0), 0)
}

export interface BestResult {
  label: string
  value: string
  empty: boolean
}

/**
 * The headline "best" for a set of sessions, chosen by the registry's `best`
 * key for whichever activity is most represented.
 *
 * Deliberately one number, not a row of six. The old page showed workouts,
 * minutes, distance, best distance, best calories and best minutes side by side
 * in six different hues — which is not six insights, it is one insight and five
 * distractions competing for the same glance.
 */
export function bestOf(sessions: Workout[], activity: string, unit: DistanceUnit): BestResult {
  const stat = bestStat(activity)
  const empty = { label: labelFor(stat, unit), value: '—', empty: true }
  if (sessions.length === 0) return empty

  switch (stat) {
    case 'pace': {
      // Fastest pace among sessions that have both numbers, in min/unit.
      const paces = sessions
        .filter((s) => (s.distanceKm ?? 0) > 0 && (s.durationMin ?? 0) > 0)
        .map((s) => s.durationMin! / displayDistance(s.distanceKm, unit))
        .filter((p) => Number.isFinite(p) && p > 0)
      if (!paces.length) return empty
      const min = Math.min(...paces)
      const m = Math.floor(min)
      const sec = Math.round((min - m) * 60)
      return { label: labelFor(stat, unit), value: `${m}:${String(sec).padStart(2, '0')} /${unit}`, empty: false }
    }
    case 'distance': {
      const max = Math.max(0, ...sessions.map((s) => s.distanceKm ?? 0))
      if (max <= 0) return empty
      return { label: labelFor(stat, unit), value: `${displayDistance(max, unit)} ${unit}`, empty: false }
    }
    case 'duration': {
      const max = Math.max(0, ...sessions.map((s) => s.durationMin ?? 0))
      if (max <= 0) return empty
      return { label: labelFor(stat, unit), value: `${max} min`, empty: false }
    }
    case 'volume': {
      const max = Math.max(0, ...sessions.map(volumeOf))
      if (max <= 0) return empty
      return { label: labelFor(stat, unit), value: max.toLocaleString(), empty: false }
    }
    case 'maxReps': {
      const max = Math.max(
        0,
        ...sessions.flatMap((s) => (s.setRows ?? []).map((r) => r.reps ?? 0)),
      )
      if (max <= 0) return empty
      return { label: labelFor(stat, unit), value: String(max), empty: false }
    }
  }
}

const labelFor = (stat: ReturnType<typeof bestStat>, unit: DistanceUnit) =>
  stat === 'pace' ? 'Best pace'
    : stat === 'distance' ? `Longest (${unit})`
      : stat === 'duration' ? 'Longest'
        : stat === 'volume' ? 'Best volume'
          : 'Most reps'

/** Total minutes across sessions, formatted as "6h 20m" / "45m". */
export function totalTime(sessions: Workout[]): { value: string; empty: boolean } {
  const mins = sessions.reduce((s, w) => s + (w.durationMin ?? 0), 0)
  if (mins === 0) return { value: '—', empty: true }
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return { value: h > 0 ? `${h}h ${m}m` : `${m}m`, empty: false }
}

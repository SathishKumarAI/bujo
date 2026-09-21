import { useState } from 'react'
import { defaultActivityFor, type ActivityKey, type Mode } from '../../domain/activities'
import { fromKm, toKm } from '../../lib/units'
import { todayISO } from '../../lib/date'
import type { DistanceUnit, Workout } from '../../lib/types'

/**
 * The editable shape behind `ActivityForm`, and the two conversions between it
 * and a stored `Workout`.
 *
 * Split out of the component file rather than co-located, because Fast Refresh
 * only tracks a module that exports components alone — mixing these in cost the
 * form its hot reload, which eslint flagged as an error rather than a nit.
 *
 * Fields are strings, not numbers: a half-typed "1." is a valid thing to have
 * in an input and an invalid number, and coercing on every keystroke is how you
 * get a field that fights the person filling it in.
 */
export interface ActivityDraft {
  date: string
  activity: ActivityKey
  duration: string
  distance: string
  sets: string
  calories: string
  rpe: string
  notes: string
}

export const emptyDraft = (mode: Mode = 'cardio'): ActivityDraft => ({
  date: todayISO(),
  activity: defaultActivityFor(mode),
  duration: '', distance: '', sets: '', calories: '', rpe: '', notes: '',
})

/** A stored session, back into an editable draft. Distance leaves km behind. */
export const draftOf = (w: Workout, unit: DistanceUnit): ActivityDraft => ({
  date: w.date,
  activity: w.activity,
  duration: w.durationMin?.toString() ?? '',
  distance: w.distanceKm != null ? String(Math.round(fromKm(w.distanceKm, unit) * 100) / 100) : '',
  sets: w.sets.join('\n'),
  calories: w.calories?.toString() ?? '',
  rpe: w.rpe?.toString() ?? '',
  notes: w.notes,
})

/** A draft, into a storable session. Distance becomes canonical km. */
export const workoutOf = (d: ActivityDraft, unit: DistanceUnit): Omit<Workout, 'id'> => ({
  date: d.date,
  activity: d.activity,
  durationMin: d.duration ? Number(d.duration) : undefined,
  distanceKm: d.distance ? toKm(Number(d.distance), unit) : undefined,
  calories: d.calories ? Number(d.calories) : undefined,
  rpe: d.rpe ? Number(d.rpe) : undefined,
  sets: d.sets.split('\n').map((s) => s.trim()).filter(Boolean),
  notes: d.notes.trim(),
})

/**
 * Did the person actually enter anything?
 *
 * `Fitness.submit()` had **no guard at all** — every other log form in the app
 * has one, and the reference implementation was the one without. Pressing "Log
 * session" on an untouched form wrote a real workout with no duration, no
 * distance and no sets, which then counted in the session total, in the week's
 * count and on the activity heatmap as a day you trained.
 *
 * The date and the activity are excluded on purpose: both are pre-filled, so
 * neither is evidence that a human touched the form.
 */
export const draftIsEmpty = (d: ActivityDraft): boolean =>
  !d.duration.trim() && !d.distance.trim() && !d.sets.trim() && !d.calories.trim() && !d.notes.trim()

/** Standard draft state for a page that needs no special behaviour. */
export function useActivityDraft(mode: Mode) {
  const [draft, setDraft] = useState(() => emptyDraft(mode))
  const patch = (p: Partial<ActivityDraft>) => setDraft((cur) => ({ ...cur, ...p }))
  const reset = (m: Mode = mode) => setDraft(emptyDraft(m))
  return { draft, patch, reset, setDraft }
}

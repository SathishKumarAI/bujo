import { Barbell, Compass, Drop, Flame, Flower, Footprints, Gauge, Heartbeat, PersonSimpleRun, SunHorizon, Target, Trophy, Wind, type Icon as IconGlyph } from '@/components/icons'
import type { ActivityKey, Mode } from '../../../domain/activities'
import { draftOf, emptyDraft, type ActivityDraft } from '../../page/draft'
import type { DistanceUnit, Workout } from '../../../lib/types'

/*
 * The Fitness phone page's helpers (COD-459) — kept out of the component files
 * because fast refresh only works when a file exports components alone
 * (`react-refresh/only-export-components`).
 */

/**
 * Which glyph draws which activity, on a phone. A UI concern, so it lives
 * here and not in `domain/activities.ts`; an activity missing from it falls
 * back to a heartbeat rather than to nothing. There is no bicycle or swimmer
 * in this icon set, so cycle and swim take the nearest honest metaphor.
 */
const GLYPH: Partial<Record<ActivityKey, IconGlyph>> = {
  run: PersonSimpleRun, walk: Footprints, hike: SunHorizon, cycle: Gauge, swim: Drop,
  row: Wind, yoga: Flower, hiit: Flame, other: Heartbeat, sport: Trophy, pickleball: Target,
  push: Barbell, pull: Barbell, legs: Barbell, strength: Barbell, pullups: Barbell, homeWorkout: Compass,
}
export const glyphOf = (k: ActivityKey): IconGlyph => GLYPH[k] ?? Heartbeat

/**
 * A draft that starts from the last session in this mode — the activity and
 * its usual minutes and distance — and nothing about THIS session (date,
 * effort, kind, calories, notes). Pickleball's `carryOver`, for Fitness: a
 * typical log is then "Log". The kind is dropped on purpose, so its chips
 * start empty and a tap-again-to-clear is safe (CLAUDE.md, the `Seg` trap).
 */
export function carryOverWorkout(last: Workout | undefined, mode: Mode, unit: DistanceUnit): ActivityDraft {
  const blank = emptyDraft(mode)
  if (!last) return blank
  const d = draftOf(last, unit)
  return { ...blank, activity: d.activity, duration: d.duration, distance: d.distance }
}

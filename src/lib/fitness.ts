import type { JournalData, Routine, Split } from './types'

/** PPL split metadata: label + accent color token + emoji. */
export const SPLITS: { id: Split; label: string; color: string; icon: string }[] = [
  { id: 'push', label: 'Push', color: 'red', icon: '🏋️' },
  { id: 'pull', label: 'Pull', color: 'blue', icon: '🤸' },
  { id: 'legs', label: 'Legs', color: 'green', icon: '🦵' },
  { id: 'upper', label: 'Upper', color: 'peach', icon: '💪' },
  { id: 'lower', label: 'Lower', color: 'teal', icon: '🦿' },
  { id: 'full', label: 'Full body', color: 'mauve', icon: '🔥' },
  { id: 'other', label: 'Other', color: 'subtext0', icon: '🏃' },
]

export function splitMeta(id?: Split) {
  return SPLITS.find((s) => s.id === id) ?? SPLITS[6]
}

/** Default Push/Pull/Legs routines, ready to load. */
export const PPL_PRESETS: Omit<Routine, 'id'>[] = [
  { name: 'Push Day', split: 'push', exercises: ['Bench Press', 'Overhead Press', 'Incline Bench', 'Lateral Raise', 'Tricep Extension', 'Dip'] },
  { name: 'Pull Day', split: 'pull', exercises: ['Deadlift', 'Pull-up', 'Barbell Row', 'Lat Pulldown', 'Face Pull', 'Bicep Curl'] },
  { name: 'Leg Day', split: 'legs', exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Lunge', 'Leg Curl', 'Calf Raise'] },
]

/** Suggest the next PPL day based on the most recent gym session. */
export function nextSplit(data: JournalData): Split {
  const order: Split[] = ['push', 'pull', 'legs']
  const last = [...data.workouts]
    .filter((w) => w.split && order.includes(w.split))
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0]
  if (!last?.split) return 'push'
  const i = order.indexOf(last.split)
  return order[(i + 1) % order.length]
}

/** Pre-loaded common exercises for zero-friction logging (GRIT-style). */
export const EXERCISE_LIBRARY = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
  'Pull-up', 'Chin-up', 'Dip', 'Lat Pulldown', 'Bicep Curl', 'Tricep Extension',
  'Leg Press', 'Lunge', 'Romanian Deadlift', 'Hip Thrust', 'Calf Raise',
  'Plank', 'Push-up', 'Face Pull', 'Lateral Raise', 'Incline Bench', 'Leg Curl',
]

export interface PR {
  exercise: string
  weight: number
  date: string
}

/**
 * Parse a set line like "Bench 5x5 @ 60kg" into { exercise, weight }.
 * Tolerant of `x`/`×`, optional unit, and extra spacing.
 */
export function parseSet(line: string): { exercise: string; weight: number } | null {
  const m = line.match(/^(.+?)\s+\d+\s*[x×]\s*\d+\s*@\s*([\d.]+)/i)
  if (!m) return null
  return { exercise: m[1].trim(), weight: Number(m[2]) }
}

/** Personal records: heaviest logged weight per exercise across all workouts. */
export function personalRecords(data: JournalData): PR[] {
  const best = new Map<string, PR>()
  for (const w of data.workouts) {
    for (const line of w.sets) {
      const parsed = parseSet(line)
      if (!parsed) continue
      const key = parsed.exercise.toLowerCase()
      const cur = best.get(key)
      if (!cur || parsed.weight > cur.weight) {
        best.set(key, { exercise: parsed.exercise, weight: parsed.weight, date: w.date })
      }
    }
  }
  return [...best.values()].sort((a, b) => b.weight - a.weight)
}

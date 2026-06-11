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

// Map an exercise name to wger muscle ids by keyword. Specific keys first so
// "leg curl" doesn't also match "curl". Works for our library + wger names.
const MUSCLE_KEYWORDS: [string, number[]][] = [
  ['leg press', [10, 8]],
  ['leg curl', [11]],
  ['leg extension', [10]],
  ['hip thrust', [8, 11]],
  ['romanian', [11, 8]],
  ['deadlift', [11, 8, 9, 12, 10]],
  ['bench', [4, 2, 5]],
  ['incline', [4, 2, 5]],
  ['chest', [4, 2, 5]],
  ['push-up', [4, 2, 5]],
  ['pushup', [4, 2, 5]],
  ['dip', [4, 5, 2]],
  ['overhead', [2, 5, 9]],
  ['shoulder press', [2, 5, 9]],
  ['military', [2, 5, 9]],
  ['lateral raise', [2]],
  ['front raise', [2]],
  ['tricep', [5]],
  ['pull-up', [12, 1, 9]],
  ['pullup', [12, 1, 9]],
  ['chin', [12, 1]],
  ['pulldown', [12, 1]],
  ['row', [12, 9, 1]],
  ['face pull', [2, 9]],
  ['bicep', [1, 13]],
  ['curl', [1, 13]], // after leg curl
  ['squat', [10, 8, 11]],
  ['lunge', [10, 8, 11]],
  ['calf', [7, 15]],
  ['plank', [6, 14]],
  ['crunch', [6]],
  ['lat', [12]],
  ['glute', [8]],
  ['quad', [10]],
  ['hamstring', [11]],
  ['trap', [9]],
  ['shrug', [9]],
  ['delt', [2]],
  ['shoulder', [2]],
  ['pec', [4]],
]

/**
 * wger muscle ids worked by an exercise name (best-effort keyword match).
 * Keywords are ordered specific→general; a matched keyword is blanked out so a
 * shorter substring (e.g. "curl" inside "leg curl") can't double-match.
 */
export function musclesForExercise(name: string): number[] {
  let n = name.toLowerCase()
  const ids = new Set<number>()
  for (const [kw, m] of MUSCLE_KEYWORDS) {
    if (n.includes(kw)) {
      m.forEach((id) => ids.add(id))
      n = n.split(kw).join(' ') // consume the match
    }
  }
  return [...ids]
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
  reps: number
  date: string
}

/**
 * Parse a set line like "Bench 5x5 @ 60kg" into { exercise, reps, weight }.
 * Tolerant of `x`/`×`, optional unit, and extra spacing.
 */
export function parseSet(line: string): { exercise: string; reps: number; weight: number } | null {
  const m = line.match(/^(.+?)\s+\d+\s*[x×]\s*(\d+)\s*@\s*([\d.]+)/i)
  if (!m) return null
  return { exercise: m[1].trim(), reps: Number(m[2]), weight: Number(m[3]) }
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
        best.set(key, { exercise: parsed.exercise, weight: parsed.weight, reps: parsed.reps, date: w.date })
      }
    }
  }
  return [...best.values()].sort((a, b) => b.weight - a.weight)
}

/** Estimated one-rep max (Epley formula). Rounded to the nearest 0.5. */
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return Math.round(weight * (1 + reps / 30) * 2) / 2
}

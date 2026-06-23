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
  // Pull-up program & progressions (from the training PDFs)
  'Pull-up assessment', 'Jumping pull-ups', 'Partner assisted pull-ups',
  'Body-weight negatives', 'Jumping negatives', 'Weighted negatives',
  'Partial ROM pull-ups (bottom)', 'Partial ROM pull-ups (top)',
  'Dead hangs', 'Scapular retractions', 'Hollow Rocks', 'Modified L-Sits',
  'Hanging leg raises', 'Toes-to-bar', 'Burpees', 'Air squats',
  'Jump rope', 'Sprints', 'Mountain climbers', 'Hollow hold',
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

// ── Cardio / activity analytics (v2) ─────────────────────────────────────────
import { addDays, dayDiff, todayISO } from './date'
import { rollingAverage } from './correlations'

/** Pace as "m:ss /unit" from distance + duration. '' if not derivable. */
export function pace(distanceKm?: number, durationMin?: number, unit: 'km' | 'mi' = 'km'): string {
  if (!distanceKm || !durationMin || distanceKm <= 0) return ''
  const dist = unit === 'mi' ? distanceKm / 1.60934 : distanceKm
  if (dist <= 0) return ''
  const minPer = durationMin / dist
  const m = Math.floor(minPer)
  const s = Math.round((minPer - m) * 60)
  return `${m}:${String(s).padStart(2, '0')} /${unit}`
}

/** Active minutes within the last `days` — workouts + pickleball sessions count. */
export function weeklyActiveMinutes(data: JournalData, today = todayISO(), days = 7): number {
  const inWindow = (date: string) => { const diff = dayDiff(date, today); return diff >= 0 && diff < days }
  const workout = data.workouts.filter((w) => inWindow(w.date)).reduce((s, w) => s + (w.durationMin ?? 0), 0)
  const pickle = (data.pickleball ?? []).filter((p) => inWindow(p.date)).reduce((s, p) => s + (p.durationMin ?? 0), 0)
  return workout + pickle
}

/** Consecutive days ending today/yesterday with at least one workout or pickleball session. */
export function activeDayStreak(data: JournalData, today = todayISO()): number {
  const has = (d: string) => data.workouts.some((w) => w.date === d) || (data.pickleball ?? []).some((p) => p.date === d)
  let cursor = has(today) ? today : addDays(today, -1)
  let streak = 0
  while (has(cursor)) { streak += 1; cursor = addDays(cursor, -1) }
  return streak
}

export interface CardioPBs {
  longestKm: number
  mostCalories: number
  mostMinutes: number
}

/** All-time cardio personal bests across logged workouts. */
export function cardioPBs(data: JournalData): CardioPBs {
  return data.workouts.reduce<CardioPBs>(
    (b, w) => ({
      longestKm: Math.max(b.longestKm, w.distanceKm ?? 0),
      mostCalories: Math.max(b.mostCalories, w.calories ?? 0),
      mostMinutes: Math.max(b.mostMinutes, w.durationMin ?? 0),
    }),
    { longestKm: 0, mostCalories: 0, mostMinutes: 0 },
  )
}

// ── Plate calculator (v3) ────────────────────────────────────────────────────
/** Plates to load PER SIDE to reach `target` on a `bar`, greedily, whole reps of each. */
export function platesPerSide(target: number, bar = 20, plates = [25, 20, 15, 10, 5, 2.5, 1.25]): number[] {
  let perSide = (target - bar) / 2
  if (perSide <= 0) return []
  const out: number[] = []
  for (const p of [...plates].sort((a, b) => b - a)) {
    while (perSide >= p - 1e-9) { out.push(p); perSide = Math.round((perSide - p) * 100) / 100 }
  }
  return out
}

/**
 * True when the empty bar already weighs more than the requested target, so the
 * "closest loadable" (the bare bar) is HEAVIER than asked. UI should warn here
 * rather than silently presenting an over-target weight as a clean match.
 */
export function barExceedsTarget(target: number, bar = 20): boolean {
  return bar > target
}

// ── Structured sets (Lyfta-style) ────────────────────────────────────────────
import type { WorkoutSet } from './types'

/** The most recent logged set for an exercise (from setRows, or parsed legacy strings). */
export function lastSetFor(data: JournalData, exercise: string, beforeDate?: string): { weight: number; reps: number; date: string } | null {
  const ex = exercise.trim().toLowerCase()
  if (!ex) return null
  const sorted = [...data.workouts]
    .filter((w) => !beforeDate || w.date < beforeDate)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  for (const w of sorted) {
    const rows = (w.setRows ?? []).filter((r) => r.exercise.trim().toLowerCase() === ex && r.weight != null && r.reps != null && r.kind !== 'warmup')
    // Most recent set = the last entry logged that day, not the heaviest.
    const row = rows[rows.length - 1]
    if (row) return { weight: row.weight!, reps: row.reps!, date: w.date }
    // Legacy string fallback — also take the last matching line in the day.
    for (let i = w.sets.length - 1; i >= 0; i--) {
      const p = parseSet(w.sets[i])
      if (p && p.exercise.toLowerCase() === ex) return { weight: p.weight, reps: p.reps, date: w.date }
    }
  }
  return null
}

/** Total working-set volume (Σ weight × reps) for a set list. */
export function sessionVolume(rows: WorkoutSet[]): number {
  return rows.filter((r) => r.kind !== 'warmup').reduce((a, r) => a + (r.weight ?? 0) * (r.reps ?? 0), 0)
}

export interface SessionSummary {
  /** Total working-set volume (Σ weight × reps; warm-ups excluded). */
  volume: number
  /** Count of working sets that have both a weight and reps logged. */
  sets: number
  /** Heaviest single working set (by weight, ties broken by reps), or null. */
  topSet: { exercise: string; weight: number; reps: number } | null
}

/**
 * Post-session rollup for a finished workout: total working volume, working-set
 * count, and the heaviest single set. Warm-ups are excluded throughout so the
 * numbers reflect the actual training stimulus. Pure — derives only from rows.
 */
export function sessionSummary(rows: WorkoutSet[]): SessionSummary {
  const working = rows.filter((r) => r.kind !== 'warmup' && (r.weight ?? 0) > 0 && (r.reps ?? 0) > 0)
  let topSet: SessionSummary['topSet'] = null
  for (const r of working) {
    const w = r.weight!, reps = r.reps!
    if (!topSet || w > topSet.weight || (w === topSet.weight && reps > topSet.reps)) {
      topSet = { exercise: r.exercise.trim(), weight: w, reps }
    }
  }
  return { volume: sessionVolume(rows), sets: working.length, topSet }
}

/**
 * Auto warm-up ramp for a working weight: a bare-bar set plus 40/60/80% steps,
 * each rounded to the nearest loadable `step` (defaults to 2.5 — the smallest
 * common plate pair). The bare bar and any duplicate/over-target rungs are
 * dropped so the ramp is strictly ascending and never meets or exceeds the
 * working weight. Returns [] when the target isn't above the bar. Pure.
 */
export function warmupRamp(working: number, bar = 20, step = 2.5): { pct: number; weight: number }[] {
  if (!(working > bar)) return []
  const round = (w: number) => Math.max(bar, Math.round(w / step) * step)
  const out: { pct: number; weight: number }[] = []
  const seen = new Set<number>()
  for (const pct of [0, 40, 60, 80]) {
    const weight = pct === 0 ? bar : round(working * (pct / 100))
    if (weight >= working) continue // never ramp to or past the work set
    if (seen.has(weight)) continue // collapse rungs that round to the same load
    seen.add(weight)
    out.push({ pct, weight })
  }
  return out
}

/** Best (heaviest) logged weight per day for an exercise — for a progression chart. */
export function exerciseProgression(data: JournalData, exercise: string): { date: string; weight: number }[] {
  const ex = exercise.trim().toLowerCase()
  const byDay = new Map<string, number>()
  for (const w of data.workouts) {
    let best = 0
    for (const r of w.setRows ?? []) if (r.exercise.trim().toLowerCase() === ex) best = Math.max(best, r.weight ?? 0)
    for (const line of w.sets) { const p = parseSet(line); if (p && p.exercise.toLowerCase() === ex) best = Math.max(best, p.weight) }
    if (best > 0) byDay.set(w.date, Math.max(byDay.get(w.date) ?? 0, best))
  }
  return [...byDay.entries()].map(([date, weight]) => ({ date: date.slice(5), weight })).sort((a, b) => (a.date < b.date ? -1 : 1))
}

/** Working-set volume for a whole workout (uses structured rows, else parses strings). */
export function workoutVolume(w: import('./types').Workout): number {
  if (w.setRows?.length) return sessionVolume(w.setRows)
  return w.sets.reduce((a, line) => { const p = parseSet(line); return a + (p ? p.weight * p.reps : 0) }, 0)
}

/** Weekly training volume for the last `weeks` (oldest→newest, whole numbers). */
export function weeklyVolumeSeries(data: JournalData, today = todayISO(), weeks = 8): { label: string; volume: number }[] {
  return Array.from({ length: weeks }, (_, i) => {
    const end = addDays(today, -7 * (weeks - 1 - i))
    const volume = data.workouts
      .filter((w) => { const d = dayDiff(w.date, end); return d >= 0 && d < 7 })
      .reduce((a, w) => a + workoutVolume(w), 0)
    return { label: end.slice(5), volume: Math.round(volume) }
  })
}

/**
 * True when (weight, reps) beats the existing best for `exercise`. Compares both
 * the heaviest logged weight AND the estimated 1RM (so a strong rep PR at lighter
 * weight still counts). The very first ever set for an exercise is a PR; ties are
 * NOT (you have to actually beat it). Case-insensitive on the exercise name.
 */
export function isNewPR(data: JournalData, exercise: string, weight: number, reps: number): boolean {
  const ex = exercise.trim().toLowerCase()
  if (!ex || !(weight > 0) || !(reps > 0)) return false
  const cur = personalRecords(data).find((p) => p.exercise.toLowerCase() === ex)
  if (!cur) return true // first-ever logged set for this lift
  if (weight > cur.weight) return true
  // Rep PR at equal-or-lighter weight: beat the estimated 1RM, not just match it.
  return epley1RM(weight, reps) > epley1RM(cur.weight, cur.reps)
}

/**
 * Dated body-weight series (ascending) with a trailing 7-day moving average and
 * an optional goal line. Reuses correlations.rollingAverage for the MA so the
 * smoothing matches the rest of the app. `goal` is carried on every point (for a
 * flat recharts reference line) only when a numeric target is supplied.
 */
export function bodyweightSeries(
  data: JournalData,
  goal?: number,
): { date: string; weight: number; avg: number | null; goal?: number }[] {
  const rows = data.bodyMetrics
    .filter((b) => b.weight != null)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  const ma = rollingAverage(rows.map((b) => b.weight), 7)
  return rows.map((b, i) => ({
    date: b.date.slice(5),
    weight: b.weight as number,
    avg: ma[i],
    ...(goal != null ? { goal } : {}),
  }))
}

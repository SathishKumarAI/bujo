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

// ── Weekly hard-sets per muscle (F: #158) ────────────────────────────────────
/** Hypertrophy landmark: a productive weekly hard-set range per muscle group. */
export const MUSCLE_SET_LANDMARK = { min: 10, max: 20 } as const

export interface MuscleSetCount {
  /** wger muscle id. */
  muscle: number
  /** Count of working sets hitting this muscle in the window. */
  sets: number
}

/**
 * Hard (working) sets per muscle group over the last `days`, attributing every
 * non-warm-up logged set to each muscle its exercise trains (via
 * musclesForExercise). A set that works three muscles counts once toward each —
 * the standard "sets per muscle" volume convention. Sorted by set count desc,
 * then muscle id for stable ties. Reads structured setRows first, falling back
 * to parsed legacy `sets` strings so older sessions still count. Pure.
 */
export function weeklySetsPerMuscle(data: JournalData, today = todayISO(), days = 7): MuscleSetCount[] {
  const inWindow = (date: string) => { const diff = dayDiff(date, today); return diff >= 0 && diff < days }
  const counts = new Map<number, number>()
  const add = (exercise: string) => {
    for (const id of musclesForExercise(exercise)) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  for (const w of data.workouts) {
    if (!inWindow(w.date)) continue
    const rows = w.setRows ?? []
    if (rows.length) {
      for (const r of rows) if (r.kind !== 'warmup' && r.exercise.trim()) add(r.exercise)
    } else {
      for (const line of w.sets) { const p = parseSet(line); if (p) add(p.exercise) }
    }
  }
  return [...counts.entries()]
    .map(([muscle, sets]) => ({ muscle, sets }))
    .sort((a, b) => (b.sets - a.sets) || (a.muscle - b.muscle))
}

// ── Estimated-1RM progression (F: #101) ──────────────────────────────────────
/**
 * Best estimated 1-rep max per day for an exercise (Epley over every logged
 * working set that day), ascending by date — a strength-trend line that credits
 * rep PRs, not just heaviest weight. Warm-ups are excluded; legacy `sets`
 * strings are parsed as a fallback. Returns `{ date: 'MM-DD', e1rm }[]`. Pure.
 */
export function e1rmProgression(data: JournalData, exercise: string): { date: string; e1rm: number }[] {
  const ex = exercise.trim().toLowerCase()
  if (!ex) return []
  const byDay = new Map<string, number>()
  for (const w of data.workouts) {
    let best = 0
    for (const r of w.setRows ?? []) {
      if (r.kind === 'warmup') continue
      if (r.exercise.trim().toLowerCase() !== ex) continue
      if ((r.weight ?? 0) > 0 && (r.reps ?? 0) > 0) best = Math.max(best, epley1RM(r.weight!, r.reps!))
    }
    if (!(w.setRows ?? []).length) {
      for (const line of w.sets) { const p = parseSet(line); if (p && p.exercise.toLowerCase() === ex) best = Math.max(best, epley1RM(p.weight, p.reps)) }
    }
    if (best > 0) byDay.set(w.date, Math.max(byDay.get(w.date) ?? 0, best))
  }
  return [...byDay.entries()]
    .map(([date, e1rm]) => ({ date: date.slice(5), e1rm }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
}

// ── Training-day heatmap (F: #162) ───────────────────────────────────────────
export interface HeatCell {
  /** ISO day. */
  date: string
  /** Working-set volume trained that day (0 = rest day). */
  volume: number
  /** Quantised intensity 0–4 for a GitHub-style colour ramp (0 = no training). */
  level: 0 | 1 | 2 | 3 | 4
}

/**
 * A contiguous day-by-day heatmap of training volume for the last `days`
 * (oldest→newest, today last), each cell carrying its workout volume and a 0–4
 * intensity level. Levels are relative to the busiest day in the window so the
 * ramp always spans 1–4 (any trained day is ≥1). Rest days are level 0. Volume
 * sums workoutVolume across all sessions that day. Pure.
 */
export function trainingHeatmap(data: JournalData, today = todayISO(), days = 119): HeatCell[] {
  const vol = new Map<string, number>()
  for (const w of data.workouts) vol.set(w.date, (vol.get(w.date) ?? 0) + workoutVolume(w))
  const cells: { date: string; volume: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    cells.push({ date, volume: Math.round(vol.get(date) ?? 0) })
  }
  const peak = Math.max(0, ...cells.map((c) => c.volume))
  return cells.map((c) => ({
    ...c,
    level: (c.volume <= 0 ? 0 : peak <= 0 ? 1 : Math.min(4, Math.ceil((c.volume / peak) * 4))) as HeatCell['level'],
  }))
}

// ── Cardio PB badges with the date earned (F: #251) ──────────────────────────
export interface CardioBadge {
  key: 'longestKm' | 'mostMinutes' | 'mostCalories'
  label: string
  value: number
  /** ISO day the best was set, or null if no qualifying session exists. */
  date: string | null
}

/**
 * Cardio personal bests (longest distance, most minutes, most calories) each
 * paired with the date it was first achieved. The earliest session reaching a
 * value wins the date so a later equal effort doesn't "steal" the badge. Bests
 * of 0 (never logged) carry a null date so the UI can hide or grey them. Pure.
 */
export function cardioBadges(data: JournalData): CardioBadge[] {
  const pbs = cardioPBs(data)
  const earliestFor = (pick: (w: import('./types').Workout) => number, target: number): string | null => {
    if (target <= 0) return null
    return data.workouts
      .filter((w) => pick(w) === target)
      .map((w) => w.date)
      .sort()[0] ?? null
  }
  return [
    { key: 'longestKm', label: 'Longest distance', value: pbs.longestKm, date: earliestFor((w) => w.distanceKm ?? 0, pbs.longestKm) },
    { key: 'mostMinutes', label: 'Longest session', value: pbs.mostMinutes, date: earliestFor((w) => w.durationMin ?? 0, pbs.mostMinutes) },
    { key: 'mostCalories', label: 'Most calories', value: pbs.mostCalories, date: earliestFor((w) => w.calories ?? 0, pbs.mostCalories) },
  ]
}

// ── Big-three powerlifting total (F: #359) ───────────────────────────────────
export interface BigThreeLift {
  /** Canonical lift label (Squat / Bench / Deadlift). */
  lift: 'Squat' | 'Bench' | 'Deadlift'
  /** Heaviest matching PR weight, or 0 if never logged. */
  weight: number
  /** Date that PR was set, or null. */
  date: string | null
}

export interface BigThreeTotal {
  lifts: BigThreeLift[]
  /** Σ of the three best weights (lifts not yet logged count as 0). */
  total: number
  /** True once all three lifts have at least one logged set. */
  complete: boolean
}

/**
 * The classic powerlifting total: best squat + bench + deadlift. Matches each
 * lift against personalRecords() by keyword (so "Barbell Bench Press",
 * "Back Squat", "Conventional Deadlift" all map correctly), taking the heaviest
 * qualifying PR per lift. Missing lifts contribute 0 and carry a null date so the
 * UI can prompt the user to log them. `complete` is true only when all three
 * have a PR. Pure — derived from logged PRs.
 */
export function bigThreeTotal(data: JournalData): BigThreeTotal {
  const prs = personalRecords(data)
  const find = (match: (name: string) => boolean): { weight: number; date: string | null } => {
    let best = { weight: 0, date: null as string | null }
    for (const p of prs) {
      if (match(p.exercise.toLowerCase()) && p.weight > best.weight) best = { weight: p.weight, date: p.date }
    }
    return best
  }
  const squat = find((n) => n.includes('squat'))
  // Exclude Romanian/stiff-leg variants from the competition deadlift figure.
  const dead = find((n) => n.includes('deadlift') && !n.includes('romanian') && !n.includes('stiff'))
  const bench = find((n) => n.includes('bench'))
  const lifts: BigThreeLift[] = [
    { lift: 'Squat', weight: squat.weight, date: squat.date },
    { lift: 'Bench', weight: bench.weight, date: bench.date },
    { lift: 'Deadlift', weight: dead.weight, date: dead.date },
  ]
  return {
    lifts,
    total: Math.round((squat.weight + bench.weight + dead.weight) * 10) / 10,
    complete: lifts.every((l) => l.weight > 0),
  }
}

// ── Relative strength: PR ÷ bodyweight (F: #360) ─────────────────────────────
/** Common strength-standard bands by bodyweight multiple (barbell, rough). */
const STRENGTH_BANDS: { min: number; label: string }[] = [
  { min: 2, label: 'Elite' },
  { min: 1.5, label: 'Advanced' },
  { min: 1, label: 'Intermediate' },
  { min: 0.5, label: 'Novice' },
  { min: 0, label: 'Beginner' },
]

/** The strength-standard band for a bodyweight multiple. */
export function strengthBand(ratio: number): string {
  return (STRENGTH_BANDS.find((b) => ratio >= b.min) ?? STRENGTH_BANDS[STRENGTH_BANDS.length - 1]).label
}

export interface RelativeStrength {
  exercise: string
  weight: number
  /** Heaviest-PR weight ÷ latest logged bodyweight, rounded to 2dp. */
  ratio: number
  /** Strength-standard band label for that ratio. */
  band: string
}

/** Latest logged bodyweight (most recent BodyMetric with a weight), or null. */
export function latestBodyweight(data: JournalData): number | null {
  const rows = data.bodyMetrics.filter((b) => b.weight != null).sort((a, b) => (a.date < b.date ? 1 : -1))
  return rows[0]?.weight ?? null
}

/**
 * Strength-to-bodyweight ratios for every lift with a PR, using the most recent
 * logged bodyweight as the divisor. Each row carries the raw PR weight, the ratio
 * (PR ÷ bodyweight), and a coarse strength-standard band. Sorted by ratio desc so
 * the strongest relative lifts lead. Returns [] when no bodyweight is logged (the
 * ratio is undefined without it). Pure.
 */
export function relativeStrength(data: JournalData): RelativeStrength[] {
  const bw = latestBodyweight(data)
  if (!bw || bw <= 0) return []
  return personalRecords(data)
    .map((p) => {
      const ratio = Math.round((p.weight / bw) * 100) / 100
      return { exercise: p.exercise, weight: p.weight, ratio, band: strengthBand(ratio) }
    })
    .sort((a, b) => b.ratio - a.ratio)
}

// ── Neglected-muscle alert (F: #297) ─────────────────────────────────────────
export interface NeglectedMuscle {
  /** wger muscle id with no working sets in the window. */
  muscle: number
  /** Days since the muscle was last trained, or null if never. */
  daysSince: number | null
}

/**
 * Muscle groups that have received ZERO working sets in the last `days`, so the
 * UI can nudge balanced training. Only the muscles our keyword mapper actually
 * recognises across the exercise library are candidates (we can't flag what we
 * can't detect). `daysSince` is the gap to the most recent prior session that hit
 * the muscle (null if never trained at all). Sorted longest-neglected first, then
 * by muscle id. Reads structured rows, falling back to legacy strings. Pure.
 */
export function neglectedMuscles(data: JournalData, today = todayISO(), days = 10): NeglectedMuscle[] {
  // Every muscle id reachable from the known library is a candidate.
  const candidates = new Set<number>()
  for (const ex of EXERCISE_LIBRARY) for (const id of musclesForExercise(ex)) candidates.add(id)
  const inWindow = (date: string) => { const diff = dayDiff(date, today); return diff >= 0 && diff < days }
  const trainedInWindow = new Set<number>()
  const lastTrained = new Map<number, string>() // muscle → latest date ever trained
  for (const w of data.workouts) {
    const rows = w.setRows ?? []
    const exercises = rows.length
      ? rows.filter((r) => r.kind !== 'warmup' && r.exercise.trim()).map((r) => r.exercise)
      : w.sets.map((line) => parseSet(line)?.exercise).filter((e): e is string => !!e)
    for (const ex of exercises) {
      for (const id of musclesForExercise(ex)) {
        if (inWindow(w.date)) trainedInWindow.add(id)
        const cur = lastTrained.get(id)
        if (!cur || w.date > cur) lastTrained.set(id, w.date)
      }
    }
  }
  return [...candidates]
    .filter((id) => !trainedInWindow.has(id))
    .map((id) => {
      const last = lastTrained.get(id)
      return { muscle: id, daysSince: last ? dayDiff(last, today) : null }
    })
    .sort((a, b) => {
      // never-trained (null) sort last? No — surface them as most neglected (first).
      const ad = a.daysSince ?? Infinity, bd = b.daysSince ?? Infinity
      return (bd - ad) || (a.muscle - b.muscle)
    })
}

// ── Stalled-lift detector (F: #479) ──────────────────────────────────────────
export interface StalledLift {
  exercise: string
  /** Current top weight (kg/lb in the user's unit). */
  top: number
  /** Number of consecutive most-recent sessions at or below `top`. */
  sessions: number
  /** Most recent session date for the lift. */
  lastDate: string
}

/**
 * Lifts whose heaviest set hasn't improved across the last `sessions` sessions.
 * For each exercise we walk exerciseProgression (best weight per training day,
 * ascending) and look at the trailing window: if the most recent day's top
 * weight is not greater than every earlier day in that window — i.e. no new high
 * was set across the last `sessions` days — the lift is flagged as stalled. Needs
 * at least `sessions` logged days for an exercise to qualify. Sorted by stall
 * length desc then name. Pure — derived from logged progression.
 */
export function stalledLifts(data: JournalData, sessions = 3): StalledLift[] {
  // Distinct exercise names across structured rows + legacy strings.
  const names = new Set<string>()
  for (const w of data.workouts) {
    for (const r of w.setRows ?? []) if (r.exercise.trim()) names.add(r.exercise.trim())
    for (const line of w.sets) { const p = parseSet(line); if (p) names.add(p.exercise.trim()) }
  }
  const out: StalledLift[] = []
  for (const name of names) {
    const prog = exerciseProgression(data, name) // {date:'MM-DD', weight} ascending
    if (prog.length < sessions) continue
    const window = prog.slice(-sessions)
    const recent = window[window.length - 1].weight
    // Stalled when the latest top is not a new high over the window — i.e. some
    // earlier session in the window already matched or beat it.
    const newHigh = window.slice(0, -1).every((p) => recent > p.weight)
    if (newHigh) continue
    // Count how many trailing sessions sit at or below the current top (the run
    // length of the plateau), capped at the available history.
    let run = 0
    for (let i = prog.length - 1; i >= 0; i--) {
      if (prog[i].weight <= recent) run++; else break
    }
    out.push({ exercise: name, top: recent, sessions: run, lastDate: prog[prog.length - 1].date })
  }
  return out.sort((a, b) => (b.sessions - a.sessions) || (a.exercise < b.exercise ? -1 : 1))
}

// ── Rep-PR tracking · best reps at each weight (F: #426) ─────────────────────
export interface RepPR {
  /** The load this record was set at (kg/lb, user's unit). */
  weight: number
  /** Most reps ever logged at that weight. */
  reps: number
  /** Date the rep record was first achieved. */
  date: string
}

/**
 * Rep records for one exercise: the most reps ever performed at each distinct
 * weight, so high-rep gains register even when the bar weight doesn't change.
 * Walks every working set (structured rows first, parsed legacy strings as a
 * fallback), keeping the best rep count per weight and the *earliest* date that
 * rep count was reached (a later equal effort doesn't reset the date). Warm-ups
 * are excluded. Sorted heaviest weight first. Pure — derived from logged sets.
 */
export function repPRs(data: JournalData, exercise: string): RepPR[] {
  const ex = exercise.trim().toLowerCase()
  if (!ex) return []
  const best = new Map<number, { reps: number; date: string }>()
  const consider = (weight: number, reps: number, date: string) => {
    if (!(weight > 0) || !(reps > 0)) return
    const cur = best.get(weight)
    if (!cur || reps > cur.reps || (reps === cur.reps && date < cur.date)) {
      best.set(weight, { reps, date })
    }
  }
  for (const w of [...data.workouts].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    const rows = w.setRows ?? []
    if (rows.length) {
      for (const r of rows) {
        if (r.kind === 'warmup') continue
        if (r.exercise.trim().toLowerCase() !== ex) continue
        consider(r.weight ?? 0, r.reps ?? 0, w.date)
      }
    } else {
      for (const line of w.sets) {
        const p = parseSet(line)
        if (p && p.exercise.toLowerCase() === ex) consider(p.weight, p.reps, w.date)
      }
    }
  }
  return [...best.entries()]
    .map(([weight, v]) => ({ weight, reps: v.reps, date: v.date }))
    .sort((a, b) => b.weight - a.weight)
}

// ── Movement-category volume radar (F: #419) ─────────────────────────────────
export type MovementCategory = 'Push' | 'Pull' | 'Legs' | 'Core'

/** Which movement category an exercise's muscles fall into (push/pull/legs/core). */
const CATEGORY_MUSCLES: Record<MovementCategory, number[]> = {
  Push: [4, 2, 5], // chest, shoulders, triceps
  Pull: [12, 1, 9, 13], // lats, biceps, traps, forearms
  Legs: [10, 11, 8, 7, 15], // quads, hams, glutes, calves
  Core: [6, 14], // abs, obliques
}

export interface CategoryVolume {
  category: MovementCategory
  /** Working-set volume (Σ weight × reps) attributed to this category in the window. */
  volume: number
}

/**
 * Weekly working-set volume split across the four movement categories
 * (Push / Pull / Legs / Core) — a quadrant view for spotting imbalances, ideal
 * for a radar chart. Each set's volume is attributed to a category when any of
 * its trained muscles (via musclesForExercise) belongs to that category; a set
 * spanning two categories counts toward both (e.g. a deadlift hits Pull + Legs),
 * matching how lifters reason about movement balance. Always returns all four
 * categories in fixed order so the radar shape is stable. Warm-ups excluded.
 * Reads structured rows, falling back to parsed legacy strings. Pure.
 */
export function volumeByCategory(data: JournalData, today = todayISO(), days = 7): CategoryVolume[] {
  const inWindow = (date: string) => { const diff = dayDiff(date, today); return diff >= 0 && diff < days }
  const order: MovementCategory[] = ['Push', 'Pull', 'Legs', 'Core']
  const totals = new Map<MovementCategory, number>(order.map((c) => [c, 0]))
  const add = (exercise: string, vol: number) => {
    if (!(vol > 0)) return
    const muscles = musclesForExercise(exercise)
    for (const cat of order) {
      if (CATEGORY_MUSCLES[cat].some((m) => muscles.includes(m))) {
        totals.set(cat, (totals.get(cat) ?? 0) + vol)
      }
    }
  }
  for (const w of data.workouts) {
    if (!inWindow(w.date)) continue
    const rows = w.setRows ?? []
    if (rows.length) {
      for (const r of rows) {
        if (r.kind === 'warmup' || !r.exercise.trim()) continue
        add(r.exercise, (r.weight ?? 0) * (r.reps ?? 0))
      }
    } else {
      for (const line of w.sets) { const p = parseSet(line); if (p) add(p.exercise, p.weight * p.reps) }
    }
  }
  return order.map((category) => ({ category, volume: Math.round(totals.get(category) ?? 0) }))
}

// ── Muscle-recovery readiness map (F: #467) ──────────────────────────────────
export type RecoveryState = 'fresh' | 'recovering' | 'fatigued'

export interface MuscleRecovery {
  /** wger muscle id. */
  muscle: number
  /** Days since this muscle was last given a working set, or null if never. */
  daysSince: number | null
  /**
   * Readiness band: <1 day = fatigued (trained today/yesterday), 1 day = still
   * recovering, ≥2 days (or never) = fresh and ready to train.
   */
  state: RecoveryState
}

/** Readiness band for a recovery gap (days since last trained, null = never). */
export function recoveryState(daysSince: number | null): RecoveryState {
  if (daysSince == null) return 'fresh'
  if (daysSince < 1) return 'fatigued'
  if (daysSince < 2) return 'recovering'
  return 'fresh'
}

/**
 * Recovery readiness for every muscle the exercise library can detect: how many
 * days since each was last given a working set, plus a coarse readiness band
 * (fatigued / recovering / fresh). Lets the UI colour a body map by what's ready
 * to train again. Never-trained muscles read as `fresh` with a null gap (nothing
 * to recover from). Warm-ups don't count as a training stimulus. Sorted freshest
 * (longest rest) first, then muscle id. Reads structured rows, falling back to
 * parsed legacy strings. Pure — derived from logged sessions.
 */
export function muscleRecovery(data: JournalData, today = todayISO()): MuscleRecovery[] {
  const candidates = new Set<number>()
  for (const ex of EXERCISE_LIBRARY) for (const id of musclesForExercise(ex)) candidates.add(id)
  const lastTrained = new Map<number, string>()
  for (const w of data.workouts) {
    const rows = w.setRows ?? []
    const exercises = rows.length
      ? rows.filter((r) => r.kind !== 'warmup' && r.exercise.trim()).map((r) => r.exercise)
      : w.sets.map((line) => parseSet(line)?.exercise).filter((e): e is string => !!e)
    for (const ex of exercises) {
      for (const id of musclesForExercise(ex)) {
        const cur = lastTrained.get(id)
        if (!cur || w.date > cur) lastTrained.set(id, w.date)
      }
    }
  }
  return [...candidates]
    .map((muscle) => {
      const last = lastTrained.get(muscle)
      const daysSince = last ? dayDiff(last, today) : null
      return { muscle, daysSince, state: recoveryState(daysSince) }
    })
    .sort((a, b) => {
      const ad = a.daysSince ?? Infinity, bd = b.daysSince ?? Infinity
      return (bd - ad) || (a.muscle - b.muscle)
    })
}

// ── Exercise frequency + train/rest ratio (F: #102 / #474) ───────────────────
export interface ExerciseFreq {
  exercise: string
  /** Number of distinct training days this exercise appeared in the window. */
  days: number
  /** Total working sets logged for it in the window. */
  sets: number
}

/**
 * How often each exercise was trained in the last `days`: distinct training days
 * it appeared on and its total working-set count. Surfaces your most- and
 * least-frequent movements so neglected staples are obvious. A day counts once
 * toward `days` no matter how many sets it held. Warm-ups excluded. Sorted by
 * day-count desc, then sets desc, then name. Reads structured rows, falling back
 * to parsed legacy strings. Pure.
 */
export function exerciseFrequency(data: JournalData, today = todayISO(), days = 28): ExerciseFreq[] {
  const inWindow = (date: string) => { const diff = dayDiff(date, today); return diff >= 0 && diff < days }
  // exercise → { days set, set count }
  const stat = new Map<string, { display: string; days: Set<string>; sets: number }>()
  const bump = (exercise: string, date: string) => {
    const name = exercise.trim()
    if (!name) return
    const key = name.toLowerCase()
    const cur = stat.get(key) ?? { display: name, days: new Set<string>(), sets: 0 }
    cur.days.add(date)
    cur.sets += 1
    stat.set(key, cur)
  }
  for (const w of data.workouts) {
    if (!inWindow(w.date)) continue
    const rows = w.setRows ?? []
    if (rows.length) {
      for (const r of rows) if (r.kind !== 'warmup' && r.exercise.trim()) bump(r.exercise, w.date)
    } else {
      for (const line of w.sets) { const p = parseSet(line); if (p) bump(p.exercise, w.date) }
    }
  }
  return [...stat.values()]
    .map((s) => ({ exercise: s.display, days: s.days.size, sets: s.sets }))
    .sort((a, b) => (b.days - a.days) || (b.sets - a.sets) || (a.exercise < b.exercise ? -1 : 1))
}

export interface TrainRestRatio {
  /** Distinct days with at least one workout in the window. */
  trainDays: number
  /** Days in the window with no workout logged. */
  restDays: number
  /** Length of the window in days. */
  window: number
  /** trainDays ÷ window as a 0–1 fraction (rounded 2dp). */
  ratio: number
}

/**
 * Train-day vs rest-day balance over the last `days`: how many distinct days had
 * a workout, how many were rest, and the training fraction. Useful for spotting
 * both under-training and a lack of recovery. Any workout (cardio, strength,
 * home) counts a day as trained; multiple sessions on one day still count once.
 * The window is inclusive of today. Pure — derived from workout dates.
 */
export function trainRestRatio(data: JournalData, today = todayISO(), days = 28): TrainRestRatio {
  const window = Math.max(1, days)
  const inWindow = (date: string) => { const diff = dayDiff(date, today); return diff >= 0 && diff < window }
  const trained = new Set<string>()
  for (const w of data.workouts) if (inWindow(w.date)) trained.add(w.date)
  const trainDays = trained.size
  return {
    trainDays,
    restDays: window - trainDays,
    window,
    ratio: Math.round((trainDays / window) * 100) / 100,
  }
}

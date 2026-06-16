// One local, deterministic parser for every input mode (typed, tapped, spoken).
// Pure + framework-free so it's trivially unit-tested; the UI (CaptureBar) and,
// later, voice both funnel raw text through `parseCapture`. No network, no LLM.
//
// Pipeline: trim → run ordered matchers → first confident match wins → else a
// plain journal bullet (lossless fallback — input is never dropped). Add a new
// value type by adding a matcher; nothing else changes.

export type CaptureKind = 'gym' | 'cardio' | 'metric' | 'habit' | 'bullet'

interface Base {
  raw: string
  /** 0..1 — how sure the matcher is. The UI shows the target + lets the user edit. */
  confidence: number
}

export interface GymCapture extends Base {
  kind: 'gym'
  exercise: string
  weight?: number
  reps?: number
  rpe?: number
  unit: 'kg' | 'lb'
}
export interface CardioCapture extends Base {
  kind: 'cardio'
  activity: string
  distanceKm?: number
  durationMin?: number
}
export interface MetricCapture extends Base {
  kind: 'metric'
  mood?: number
  sleep?: number
  stress?: number
}
export interface HabitCapture extends Base {
  kind: 'habit'
  habit: string
  /** Count for count-habits; absent = a simple done toggle. */
  value?: number
}
export interface BulletCapture extends Base {
  kind: 'bullet'
}

export type CaptureResult =
  | GymCapture
  | CardioCapture
  | MetricCapture
  | HabitCapture
  | BulletCapture

export interface CaptureCtx {
  /** Known exercise names (library + recents) for name normalization. */
  exercises: string[]
  /** Known habit names, for the habit matcher. */
  habits: string[]
  /** Default weight unit; a kg/lb suffix in the text overrides it. */
  unit?: 'kg' | 'lb'
}

// ── helpers ──────────────────────────────────────────────────────────────────

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

function titleCase(s: string): string {
  return s.trim().replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Common gym shorthand → canonical names (extend freely). */
const EXERCISE_ALIASES: Record<string, string> = {
  bench: 'Bench Press',
  bp: 'Bench Press',
  ohp: 'Overhead Press',
  press: 'Overhead Press',
  squat: 'Squat',
  squats: 'Squat',
  dl: 'Deadlift',
  deadlift: 'Deadlift',
  rdl: 'Romanian Deadlift',
  row: 'Barbell Row',
  rows: 'Barbell Row',
  curl: 'Bicep Curl',
  curls: 'Bicep Curl',
  pullup: 'Pull-up',
  pullups: 'Pull-up',
  chinup: 'Chin-up',
}

/** Resolve a typed exercise name to a canonical one: alias → library → titlecase. */
export function normalizeExercise(name: string, library: string[]): string {
  const lc = name.toLowerCase().trim()
  if (!lc) return ''
  if (EXERCISE_ALIASES[lc]) return EXERCISE_ALIASES[lc]
  const exact = library.find((e) => e.toLowerCase() === lc)
  if (exact) return exact
  const starts = library.find((e) => e.toLowerCase().startsWith(lc))
  if (starts) return starts
  const includes = library.find((e) => lc.length >= 3 && e.toLowerCase().includes(lc))
  if (includes) return includes
  return titleCase(name)
}

function isKnownExercise(name: string, library: string[]): boolean {
  const lc = name.toLowerCase().trim()
  return !!EXERCISE_ALIASES[lc] || library.some((e) => e.toLowerCase() === lc || e.toLowerCase().startsWith(lc))
}

// ── matchers (return null when they don't apply) ─────────────────────────────

/** `bench 80x5 @8`, `ohp 40kg x 8 rpe7`, `squat 100×5`. weight × reps. */
function matchGym(text: string, ctx: CaptureCtx): GymCapture | null {
  const m = text.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|lb|lbs)?\s*[x×]\s*(\d+)\b/i)
  if (!m) return null
  const name = m[1].trim()
  if (!name) return null
  const unitSuffix = m[3]?.toLowerCase()
  const unit: 'kg' | 'lb' = unitSuffix ? (unitSuffix.startsWith('lb') ? 'lb' : 'kg') : ctx.unit ?? 'kg'
  const rpe = text.match(/(?:@|rpe\s*)(\d+(?:\.\d+)?)/i)
  const known = isKnownExercise(name, ctx.exercises)
  return {
    kind: 'gym',
    raw: text,
    confidence: known ? 0.95 : 0.7,
    exercise: normalizeExercise(name, ctx.exercises),
    weight: Number(m[2]),
    reps: Number(m[4]),
    rpe: rpe ? clamp(Number(rpe[1]), 1, 10) : undefined,
    unit,
  }
}

const CARDIO_WORDS: Record<string, string> = {
  ran: 'Run', run: 'Run', running: 'Run', jog: 'Run', jogged: 'Run',
  walk: 'Walk', walked: 'Walk', walking: 'Walk',
  cycle: 'Cycling', cycled: 'Cycling', cycling: 'Cycling', bike: 'Cycling', biked: 'Cycling',
  swim: 'Swim', swam: 'Swim', swimming: 'Swim',
}

/** `ran 5k 28min`, `walk 30min`, `cycled 12km`. */
function matchCardio(text: string): CardioCapture | null {
  const lc = text.toLowerCase()
  const word = Object.keys(CARDIO_WORDS).find((w) => new RegExp(`\\b${w}\\b`).test(lc))
  if (!word) return null
  const dist = lc.match(/(\d+(?:\.\d+)?)\s*(k|km|mi|mile|miles)\b/)
  let distanceKm: number | undefined
  if (dist) {
    const v = Number(dist[1])
    distanceKm = /^mi/.test(dist[2]) ? Math.round(v * 1.609 * 100) / 100 : v
  }
  const hrs = lc.match(/(\d+(?:\.\d+)?)\s*(h|hr|hour|hours)\b/)
  const mins = lc.match(/(\d+)\s*(m|min|mins|minute|minutes)\b/)
  let durationMin: number | undefined
  if (hrs || mins) durationMin = (hrs ? Number(hrs[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0)
  return {
    kind: 'cardio',
    raw: text,
    confidence: distanceKm != null || durationMin != null ? 0.85 : 0.6,
    activity: CARDIO_WORDS[word],
    distanceKm,
    durationMin,
  }
}

/** `mood 7`, `slept 8h`, `sleep 7`, `stress 3` — one or more in a line. */
function matchMetric(text: string): MetricCapture | null {
  const lc = text.toLowerCase()
  const mood = lc.match(/\bmood\s*(\d+(?:\.\d+)?)/)
  const sleep = lc.match(/\b(?:slept|sleep)\s*(\d+(?:\.\d+)?)\s*h?\b/)
  const stress = lc.match(/\bstress\s*(\d+(?:\.\d+)?)/)
  if (!mood && !sleep && !stress) return null
  return {
    kind: 'metric',
    raw: text,
    confidence: 0.85,
    mood: mood ? clamp(Number(mood[1]), 0, 10) : undefined,
    sleep: sleep ? clamp(Number(sleep[1]), 0, 24) : undefined,
    stress: stress ? clamp(Number(stress[1]), 0, 10) : undefined,
  }
}

/** Text matches a known habit name, with an optional trailing count (`water 6`). */
function matchHabit(text: string, habits: string[]): HabitCapture | null {
  if (!habits.length) return null
  const countM = text.match(/^(.*?)\s+(\d+)\s*$/)
  const namePart = (countM ? countM[1] : text).toLowerCase().trim()
  if (!namePart) return null
  const habit = habits.find((h) => {
    const hl = h.toLowerCase()
    return hl === namePart || hl.startsWith(namePart) || namePart.startsWith(hl)
  })
  if (!habit) return null
  return {
    kind: 'habit',
    raw: text,
    confidence: 0.7,
    habit,
    value: countM ? Number(countM[2]) : undefined,
  }
}

/** Always matches — lossless fallback. Explicit bullet signifiers raise confidence. */
function matchBullet(text: string): BulletCapture {
  const explicit = /^(?:[ten]\s+|[*!^]\s+)/i.test(text)
  return { kind: 'bullet', raw: text, confidence: explicit ? 0.5 : 0.3 }
}

// ── entry point ──────────────────────────────────────────────────────────────

/** Parse one line of free input into a routed, editable result. */
export function parseCapture(input: string, ctx: CaptureCtx): CaptureResult {
  const text = input.trim()
  if (!text) return { kind: 'bullet', raw: '', confidence: 0 }
  return (
    matchGym(text, ctx) ??
    matchCardio(text) ??
    matchMetric(text) ??
    matchHabit(text, ctx.habits) ??
    matchBullet(text)
  )
}

// ── Core domain types for the bullet journal ────────────────────────────────

/** Ryder Carroll rapid-logging bullet kinds. */
export type BulletType = 'task' | 'event' | 'note'

/** Lifecycle of a task bullet (events/notes stay "open"). */
export type EntryStatus =
  | 'open' // ·  task not yet done
  | 'done' // ✕  completed
  | 'migrated' // >  moved forward (to a future month/day)
  | 'scheduled' // <  moved into the Future Log
  | 'dropped' // ~  irrelevant, struck through

/** A single rapid-log entry. */
export interface Entry {
  id: string
  /** ISO day the entry lives on, e.g. "2026-06-10". Empty for collection-only entries. */
  date: string
  type: BulletType
  text: string
  status: EntryStatus
  important: boolean // ! signifier
  memory: boolean // ▲ quick-memory signifier
  tags: string[] // parsed #tags
  /** Optional collection id this entry belongs to (custom pages, future log). */
  collection?: string
  /** If migrated/threaded, the id of the entry this one came from. */
  originId?: string
  /** If generated from a recurrence rule, that rule's id. */
  recurringId?: string
  createdAt: string
}

/** A recurring task/event rule that auto-populates each day it applies. */
export interface Recurrence {
  id: string
  text: string
  type: BulletType
  important: boolean
  freq: 'daily' | 'weekly'
  /** For weekly: 0=Sun … 6=Sat. */
  weekdays: number[]
  startedOn: string
  /** Last ISO day we materialised entries up to (avoids duplicates). */
  lastGenerated?: string
}

/** A trackable habit / stimulant / food shown in the dot-grid. */
export interface Habit {
  id: string
  name: string
  /** Grouping shown as a section header in the tracker. */
  category: 'stimulant' | 'food' | 'movement' | 'wellness' | 'custom'
  color: string // Catppuccin token name, e.g. "mauve"
  /** ISO day tracking began; days before this render as blank, not "missed". */
  startedOn: string
}

/** Per-day 0–10 wellbeing metrics for the line chart. */
export interface DailyMetric {
  date: string // ISO day, primary key
  mood?: number // 0 bad … 10 great
  stress?: number // 0 low … 10 high
  sleep?: number // hours, 0–10+
  /** Intermittent-fast break marker: 'food' (●) or 'drink' (○) or undefined. */
  fastBreak?: 'food' | 'drink'
  /** Auto-logged weather snapshot for the day (opt-in). */
  weather?: Weather
  // Nutrition diary (wger-style, lightweight).
  calories?: number
  protein?: number // grams
  carbs?: number // grams
  fat?: number // grams
}

/** A day's weather snapshot (from open-meteo, opt-in). */
export interface Weather {
  tempC: number
  code: number // WMO weather code
  label: string // human label, e.g. "Partly cloudy"
  icon: string // emoji
}

/** A logged workout / fitness session. */
export interface Workout {
  id: string
  date: string // ISO day
  /** e.g. "Run", "Strength", "Yoga", "Cycling", "Walk", "Swim". */
  activity: string
  /** Training-split tag for gym sessions (push/pull/legs…). */
  split?: Split
  durationMin?: number
  distanceKm?: number
  /** Strength sets: each is "exercise xReps @ weight". Free-form lines. */
  sets: string[]
  calories?: number
  /** Perceived exertion 1–10 (RPE). */
  rpe?: number
  notes: string
}

/** Push/Pull/Legs (and friends) training split categories. */
export type Split = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full' | 'other'

/** A saved, reusable workout routine (GRIT-style), tagged by PPL split. */
export interface Routine {
  id: string
  name: string
  split: Split
  exercises: string[] // exercise names, in order
}

/** A body-metrics snapshot: weight + free-form measurements. */
export interface BodyMetric {
  date: string // ISO day, primary key
  weight?: number // kg or lb (user's unit)
  bodyFat?: number // %
  measurements: Record<string, number> // e.g. { chest: 100, waist: 80, arms: 38 }
}

/** Neutral cycle / basal-temperature point. */
export interface CyclePoint {
  date: string
  temp?: number // °F or °C, user's choice
  note?: string
  flags: string[] // free tags e.g. "period", "spotting"
}

/** One gratitude line per day. */
export interface Gratitude {
  date: string
  text: string
}

/** One-line daily memory, optionally illustrated with a photo. */
export interface Memory {
  date: string
  text: string
  photo?: string // downscaled JPEG data-URL
}

export interface Birthday {
  id: string
  name: string
  month: number // 1–12
  day: number // 1–31
}

/** Per-month metadata: location (for travelers), goals, photo caption. */
export interface MonthlyMeta {
  ym: string // "2026-06"
  location: string
  goals: string
  photoCaption: string
  photo?: string // "photo of the month" — downscaled JPEG data-URL
}

/** A named free-form collection page (book list, project, packing list…). */
export interface Collection {
  id: string
  name: string
  icon: string // emoji
  createdAt: string
}

export type ThemeName = 'mocha' | 'latte'
export type TempUnit = 'F' | 'C'
export type WeightUnit = 'kg' | 'lb'
export type DistanceUnit = 'km' | 'mi'
export type Gender = 'female' | 'male' | 'nonbinary' | 'prefer-not'

/** A relapse event for the abstinence / NoFap streak journal. */
export interface Relapse {
  id: string
  date: string // ISO day
  trigger: string // what led to it (optional)
  note: string // reflection
}

/** Abstinence / NoFap streak tracker state. */
export interface Streak {
  /** ISO day the current streak started (reset on relapse). */
  startedOn: string
  /** Personal best, in days. */
  best: number
  relapses: Relapse[]
  /** Count of urges resisted (a positive counter). */
  urgesResisted?: number
}

export interface Settings {
  theme: ThemeName
  tempUnit: TempUnit
  /** Weight unit for gym/body-metrics — user choice (kg = metric, lb = US). */
  weightUnit: WeightUnit
  /** Distance unit for cardio — km (metric) or mi (US). */
  distanceUnit: DistanceUnit
  /** First day of the week in calendars: 0 = Sunday, 1 = Monday. */
  weekStart: 0 | 1
  /** Drives which gendered wellbeing tools are surfaced (cycle vs. abstinence). */
  gender: Gender
  /** Show the neutral cycle / fertility tracker. Auto-on for female. */
  cycleTrackerEnabled: boolean
  /** Show the abstinence / NoFap streak journal. Auto-on for male. */
  nofapEnabled: boolean
  /** Day the journal "owner" started, for streak math. */
  startedOn: string
  /** Last time the user exported a backup (ISO), for the nudge. */
  lastBackup?: string
  /** Google OAuth Client ID (Web) for optional Drive sync. */
  googleClientId?: string
  /** Last successful Drive backup/restore (ISO). */
  lastDriveSync?: string
  // ── Realism pack ──
  /** Dot-grid paper texture background, like a real bullet journal page. */
  paperMode: boolean
  /** Render content inside an open-book frame (spine + page edges). */
  bookMode: boolean
  /** Handwriting font for entries. */
  handwriting: boolean
  /** Daily reminder nudge to journal (in-app + optional browser notification). */
  reminderEnabled: boolean
  reminderTime: string // "HH:MM"
  /** Auto-log weather + location (makes opt-in network calls). */
  weatherEnabled: boolean
  /** Show a rotating reflection prompt on the Today page. */
  reflectionPrompts: boolean
  /** Content zoom level for charts/calendars/spreads (0.7–1.5). */
  zoom: number
}

/** The single root object persisted to localStorage. */
export interface JournalData {
  version: number
  entries: Entry[]
  habits: Habit[]
  habitLog: Record<string, string[]> // ISO day -> [habitId, …]
  metrics: DailyMetric[]
  workouts: Workout[]
  routines: Routine[]
  bodyMetrics: BodyMetric[]
  cycle: CyclePoint[]
  gratitude: Gratitude[]
  memories: Memory[]
  birthdays: Birthday[]
  monthly: MonthlyMeta[]
  collections: Collection[]
  recurrences: Recurrence[]
  /** Per-day emoji stickers / washi decorations: ISO day -> [emoji, …]. */
  stickers: Record<string, string[]>
  nofap: Streak
  settings: Settings
}

export const SCHEMA_VERSION = 2

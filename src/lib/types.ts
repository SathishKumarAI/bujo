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
  createdAt: string
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
}

/** A logged workout / fitness session. */
export interface Workout {
  id: string
  date: string // ISO day
  /** e.g. "Run", "Strength", "Yoga", "Cycling", "Walk", "Swim". */
  activity: string
  durationMin?: number
  distanceKm?: number
  /** Strength sets: each is "exercise xReps @ weight". Free-form lines. */
  sets: string[]
  calories?: number
  /** Perceived exertion 1–10 (RPE). */
  rpe?: number
  notes: string
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
}

export interface Settings {
  theme: ThemeName
  tempUnit: TempUnit
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
}

/** The single root object persisted to localStorage. */
export interface JournalData {
  version: number
  entries: Entry[]
  habits: Habit[]
  habitLog: Record<string, string[]> // ISO day -> [habitId, …]
  metrics: DailyMetric[]
  workouts: Workout[]
  cycle: CyclePoint[]
  gratitude: Gratitude[]
  memories: Memory[]
  birthdays: Birthday[]
  monthly: MonthlyMeta[]
  collections: Collection[]
  nofap: Streak
  settings: Settings
}

export const SCHEMA_VERSION = 1

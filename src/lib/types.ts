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

export type HabitCategory = 'stimulant' | 'food' | 'movement' | 'wellness' | 'custom'
/** check = a yes/no dot; count = a number toward a daily target. */
export type HabitType = 'check' | 'count' | 'timer' | 'rating'

/** A trackable habit / stimulant / food shown in the dot-grid. */
export interface Habit {
  id: string
  name: string
  /** Grouping shown as a section header in the tracker. */
  category: HabitCategory
  color: string // Catppuccin token name, e.g. "mauve"
  /** ISO day tracking began; days before this render as blank, not "missed". */
  startedOn: string
  // ── customisation (all optional, additive) ──
  type?: HabitType // default 'check'
  target?: number // daily goal for count habits (e.g. 8 glasses)
  unit?: string // e.g. "glasses", "min"
  /** Weekdays the habit is scheduled (0=Sun…6=Sat). Empty/undefined = every day. */
  activeDays?: number[]
  archived?: boolean
  order?: number // manual sort within a category
  /** Target completions per week (shows a weekly-goal meter when set). */
  weeklyGoal?: number
  /** Optional emoji shown beside the habit name. */
  emoji?: string
  /**
   * Polarity. When true this is a habit to QUIT/avoid (alcohol, smoking,
   * doomscrolling): logging a day = a slip (bad), success = staying clean, and
   * the streak counts clean days. Default/undefined = a normal "build" habit.
   */
  avoid?: boolean
  /** Part of day this habit belongs to (Habitify-style). Default = anytime. */
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime'
  /** Habit-stacking cue / implementation intention, e.g. "After morning coffee". */
  cue?: string
}

/** Per-day 0–10 wellbeing metrics for the line chart. */
export interface DailyMetric {
  date: string // ISO day, primary key
  mood?: number // 0 bad … 10 great
  stress?: number // 0 low … 10 high
  sleep?: number // hours, 0–10+
  energy?: number // 0 drained … 10 energized (Bearable-style)
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
/** One structured strength set (Lyfta-style logging). */
export interface WorkoutSet {
  exercise: string
  weight?: number
  reps?: number
  /** Perceived exertion 1–10. */
  rpe?: number
  /** warmup · working (default) · drop set. */
  kind?: 'warmup' | 'working' | 'drop'
}

/** An intermittent-fasting window: when eating stopped → when it resumed. */
export interface Fast {
  id: string
  /** ISO datetime the fast began (last food). */
  start: string
  /** ISO datetime the fast ended (first food). */
  end: string
}

export interface Workout {
  id: string
  date: string // ISO day
  /** e.g. "Run", "Strength", "Yoga", "Cycling", "Walk", "Swim". */
  activity: string
  /** Training-split tag for gym sessions (push/pull/legs…). */
  split?: Split
  durationMin?: number
  distanceKm?: number
  /** Strength sets: each is "exercise xReps @ weight". Free-form lines (legacy + display). */
  sets: string[]
  /** Structured strength sets (preferred for analytics; `sets` kept for back-compat). */
  setRows?: WorkoutSet[]
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

/** Where a book sits on the reading shelf. */
export type BookStatus = 'want' | 'reading' | 'finished'

/**
 * A book on the reading log. The shelf has three columns — want-to-read,
 * currently-reading (with a page-progress bar), and finished (with a rating).
 * Classic bullet-journal "reading list", but trackable.
 */
export interface Book {
  id: string
  title: string
  author?: string
  status: BookStatus
  /** Total pages, if known — drives the progress bar while reading. */
  totalPages?: number
  /** Pages read so far (current-reading progress). */
  currentPage?: number
  /** 1–5 star rating, set when finished. */
  rating?: number
  /** ISO day reading started (status → reading). */
  startedOn?: string
  /** ISO day finished (status → finished); powers the "books this year" stat. */
  finishedOn?: string
  /** Short review / notes. */
  notes?: string
  /** Optional link — buy page, author site, summary, etc. */
  link?: string
  /** Dated reflections: what you learned from the book that day. */
  learnings?: { date: string; text: string }[]
  /** Catppuccin token for the spine colour. */
  color?: string
  createdAt: string
}

/** A saved online link to read later (article, summary, book page). */
export interface ReadLink {
  id: string
  url: string
  title?: string
  note?: string
  done?: boolean
  createdAt: string
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

/** A physique / progress photo, tagged by date (for week-to-week comparison). */
export interface ProgressPhoto {
  id: string
  date: string // ISO day
  photo: string // downscaled JPEG data-URL
  note?: string
  weight?: number // optional body weight at capture (user's unit)
}

/**
 * A friend/contact in the Friends collection. All fields are manual except the
 * optional GitHub enrichment, which the user opts into per-contact by entering a
 * username — we then store the PUBLIC profile fields from GitHub's official API.
 */
export interface Friend {
  id: string
  name: string
  birthday?: string // ISO "MM-DD" or "YYYY-MM-DD"
  notes?: string
  links?: string[] // public URLs the user pastes
  github?: string // username (opt-in enrichment)
  avatar?: string // github avatar_url
  bio?: string // github bio
  company?: string // github company
  createdAt: string
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

export type ThemeName = 'mocha' | 'latte' | 'neon' | 'system'
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
  /** Optional accent override (Catppuccin token name); defaults to mauve. */
  accent?: string
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
  /** Intermittent-fasting target window in hours (e.g. 16 for 16:8). */
  fastTargetHours?: number
  /** ISO datetime of an in-progress fast's start (set while fasting). */
  fastActiveStart?: string
  /** Day the journal "owner" started, for streak math. */
  startedOn: string
  /** Last time the user exported a backup (ISO), for the nudge. */
  lastBackup?: string
  /** Google OAuth Client ID (Web) for optional Drive sync (dev fallback to env). */
  googleClientId?: string
  /** Last successful Drive backup/restore (ISO). */
  lastDriveSync?: string
  /** Chosen storage: undefined = show login gate; 'local' = device only;
   *  'folder' = a cloud-synced folder the user picked (their own cloud). */
  storageMode?: 'local' | 'folder' | 'drive'
  /** Display name of the picked cloud folder. */
  folderName?: string
  /** Exploring sample data (guest demo). Prompts to sign up to keep a real journal. */
  explore?: boolean
  /** GitHub Personal Access Token (gist scope) for gist storage. */
  githubToken?: string
  /** Gist id holding bujo.json. */
  githubGistId?: string
  /** Self-host PostgREST sync endpoint (the Docker stack's /journals API). */
  selfHostUrl?: string
  /** Optional bearer token (JWT) for the self-host API. */
  selfHostToken?: string
  /** Signed-in Google account email (display only). */
  googleEmail?: string
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
  /** Weekly active-minutes goal shown on the Fitness view. */
  fitnessGoalMin?: number
  /** Weekly pickleball-games goal (shown on Pickleball + Goals). */
  pickleballGoalGames?: number
  /** Yearly reading goal in books (shown on Reading + Goals). */
  readingGoalBooks?: number
  /** ISO day the 75-day pickleball 3.5→4.0 plan was started (drives day/phase). */
  pickleballPlanStart?: string
  /** Stats mood/year pair: side-by-side ('split', default) or full-width 'stacked'. */
  statsPairLayout?: 'split' | 'stacked'
  /** Completed training-program day keys, e.g. "pullup-zero-w1d3". */
  programDone?: string[]
  /** Actual reps/sets achieved per program exercise: exKey -> "did 8, 6, 4". */
  programActuals?: Record<string, string>
  // ── Tracker (global) ──
  trackerDensity?: 'comfortable' | 'compact'
  trackerHideWeekends?: boolean
  trackerShowArchived?: boolean
  /** Habit tracker layout: classic month-grid, activity-heatmap rows, or a
   *  time-of-day routine timeline ("run your day"). */
  trackerLayout?: 'classic' | 'activity' | 'routine'
  /** Collapse the sidebar to an icon rail that expands on hover. */
  sidebarCollapsed?: boolean
  /** Fully hide the sidebar for max screen; reveal by hovering the left edge. */
  sidebarAutoHide?: boolean
  /** Saved quick-add snippets, inserted with one tap on the capture field. */
  quickTemplates?: string[]
  /** Optional Today cards the user has hidden (keys: penalty, coverage, onThisDay). */
  hideToday?: string[]
  /** Difficulty of the training-penalty drills: beginner (default) · intermediate · hard. */
  penaltyLevel?: 'beginner' | 'intermediate' | 'hard'
}

/** A fixed-duration discipline challenge (75 Hard, 90-day, …). */
export interface Challenge {
  id: string
  name: string
  /** Total length in days (e.g. 75, 90, 30). */
  durationDays: number
  startDate: string // ISO day the challenge began
  /** Daily required tasks; a day is complete when all are checked. */
  rules: string[]
  /** 75-Hard rule: missing a day resets progress to Day 1. */
  strict: boolean
  archived?: boolean
}

/** A logged pickleball play session (games won/lost + context). */
export interface PickleballSession {
  id: string
  date: string // ISO day
  format: 'singles' | 'doubles'
  gamesWon: number
  gamesLost: number
  durationMin?: number
  partner?: string // doubles partner
  /** Perceived exertion 1–10. */
  rpe?: number
  notes?: string
  // ── richer per-game logging (all optional, additive) ──
  /** Opponent(s) name/handle. */
  opponent?: string
  /** Where you played (court / club / city). */
  location?: string
  /** Self/opponent skill level for the session, e.g. "3.5". */
  level?: string
  /** Total points you scored across games (for point-differential). */
  pointsFor?: number
  /** Total points conceded across games. */
  pointsAgainst?: number
  /** Scoring used: 11/15/21 side-out, or rally-to-21. */
  scoring?: '11' | '15' | '21' | 'rally21'
}

/** Bracket/league format for a competitive pickleball event. */
export type PickleballFormat =
  | 'round-robin' | 'single-elim' | 'double-elim' | 'pool-play'
  | 'ladder' | 'box' | 'swiss' | 'king-of-court'

/** A league or tournament the player entered (separate from casual sessions). */
export interface PickleballEvent {
  id: string
  date: string // ISO day (start date)
  name: string
  kind: 'league' | 'tournament'
  format: PickleballFormat
  /** Division entered, e.g. "3.5 Mixed Doubles". */
  division?: string
  wins?: number
  losses?: number
  /** Final placement / medal, e.g. "Gold", "2nd of 8", "5th". */
  placement?: string
  partner?: string
  notes?: string
}

/** A logged focus/coding work session (developer tracker). */
export interface DevSession {
  id: string
  date: string // ISO day
  durationMin: number
  project?: string
  /** Flow/focus quality 0–10. */
  focus: number
  /** Stress during the session 0–10. */
  stress: number
  interruptions?: number
  tags?: string[] // languages / tools, e.g. ["typescript", "react"]
  notes?: string
}

/** The single root object persisted to localStorage. */
export interface JournalData {
  version: number
  /** ISO timestamp of the last local edit. Drives cloud-sync conflict resolution. */
  updatedAt?: string
  entries: Entry[]
  habits: Habit[]
  habitLog: Record<string, string[]> // ISO day -> [habitId, …] (check habits)
  /** ISO day -> habitId -> numeric value (count habits). */
  habitValues?: Record<string, Record<string, number>>
  /** ISO day -> habitId -> ISO timestamp the habit was checked (time-of-day analysis). */
  habitTimes?: Record<string, Record<string, string>>
  /** ISO day -> habitId -> reflective note for that day (Habitify-style). */
  habitNotes?: Record<string, Record<string, string>>
  metrics: DailyMetric[]
  workouts: Workout[]
  /** Completed intermittent-fasting windows. */
  fasts?: Fast[]
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
  /** Fixed-duration discipline challenges (75 Hard, 90-day, …). */
  challenges?: Challenge[]
  /** challengeId -> ISO day -> indices of rules completed that day. */
  challengeLog?: Record<string, Record<string, number[]>>
  /** habitId -> ISO days marked as a planned skip (don't break the streak). */
  habitSkips?: Record<string, string[]>
  /** Developer focus/coding sessions. */
  devSessions?: DevSession[]
  /** Pickleball play sessions. */
  pickleball?: PickleballSession[]
  /** Pickleball leagues & tournaments entered. */
  pickleballEvents?: PickleballEvent[]
  /** Physique / progress photos for week-to-week comparison. */
  progressPhotos?: ProgressPhoto[]
  /** Friends / contacts (manual, with optional opt-in GitHub enrichment). */
  friends?: Friend[]
  /** Reading log — want-to-read / reading / finished shelves. */
  books?: Book[]
  /** Saved online links to read later. */
  readLinks?: ReadLink[]
  settings: Settings
}

export const SCHEMA_VERSION = 2

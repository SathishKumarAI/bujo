import { SCHEMA_VERSION, type JournalData, type Settings } from './types'
import { todayISO } from './date'

export const STORAGE_KEY = 'bujo:data'

let _counter = 0
/** Stable-ish unique id (uuid when available, else a counter fallback for tests). */
export function uid(prefix = 'id'): string {
  const c: Crypto | undefined = typeof crypto !== 'undefined' ? crypto : undefined
  if (c && 'randomUUID' in c) return `${prefix}_${c.randomUUID()}`
  _counter += 1
  return `${prefix}_${_counter}_${performance.now().toString(36).replace('.', '')}`
}

export function defaultSettings(): Settings {
  return {
    theme: 'mocha',
    tempUnit: 'F',
    weightUnit: 'lb',
    distanceUnit: 'mi',
    weekStart: 0,
    gender: 'male',
    cycleTrackerEnabled: false,
    nofapEnabled: true,
    startedOn: todayISO(),
    paperMode: true,
    bookMode: true,
    handwriting: false,
    reminderEnabled: false,
    reminderTime: '21:00',
    weatherEnabled: false,
    reflectionPrompts: true,
    zoom: 1,
  }
}

/** A fresh, empty journal. */
export function emptyJournal(): JournalData {
  return {
    version: SCHEMA_VERSION,
    entries: [],
    habits: [],
    habitLog: {},
    habitValues: {},
    metrics: [],
    workouts: [],
    fasts: [],
    routines: [],
    bodyMetrics: [],
    cycle: [],
    gratitude: [],
    memories: [],
    birthdays: [],
    monthly: [],
    collections: [],
    recurrences: [],
    nofap: { startedOn: todayISO(), best: 0, relapses: [] },
    challenges: [],
    challengeLog: {},
    habitSkips: {},
    devSessions: [],
    typingSessions: [],
    books: [],
    readLinks: [],
    customGoals: [],
    mindsetFocus: [],
    pickleballEvents: [],
    settings: defaultSettings(),
  }
}

/** A journal pre-seeded with sensible starter habits, so the tracker isn't blank. */
export function seedJournal(): JournalData {
  const j = emptyJournal()
  const today = todayISO()
  // `avoid` is not decoration: it decides what a tick MEANS. For a build habit
  // a logged day is a win; for an avoid habit it is a slip, and the whole app
  // branches on it — penalties, dayCompletion, coverage, reminders,
  // recommendations, streaks. Seeding Sugar and Alcohol without it shipped a
  // journal in which drinking scored a perfect day and sobriety read as
  // "Missed Alcohol". `streak.ts` already lists both as quit-tracker presets;
  // this file disagreed with it.
  //
  // Caffeine is deliberately left as a build habit: `demo.ts` gives it the cue
  // "With breakfast", i.e. it is seeded as something you intend to have. Anyone
  // quitting it can flip the flag in the tracker.
  const starter: { name: string; category: JournalData['habits'][number]['category']; color: string; avoid?: boolean }[] = [
    { name: 'Caffeine', category: 'stimulant', color: 'peach' },
    { name: 'Sugar', category: 'stimulant', color: 'pink', avoid: true },
    { name: 'Alcohol', category: 'stimulant', color: 'red', avoid: true },
    { name: 'Vegetables', category: 'food', color: 'green' },
    { name: 'Water 2L', category: 'food', color: 'sky' },
    { name: 'Exercise', category: 'movement', color: 'teal' },
    { name: 'Vitamins', category: 'wellness', color: 'yellow' },
    { name: 'Read', category: 'wellness', color: 'lavender' },
  ]
  j.habits = starter.map((h) => ({ id: uid('habit'), startedOn: today, ...h }))
  return j
}

/**
 * The exact fingerprint of a habit this app seeded before it learned to set
 * `avoid`: the starter name, the starter category, and no explicit polarity.
 * Anything the user touched — renamed, recategorised, or flagged either way —
 * fails the match and is left alone.
 */
const SEEDED_QUIT_HABITS: { name: string; category: string }[] = [
  { name: 'Sugar', category: 'stimulant' },
  { name: 'Alcohol', category: 'stimulant' },
]

/**
 * Flip the starter Sugar/Alcohol habits to `avoid: true` on load.
 *
 * `seedJournal()` shipped them as ordinary build habits, so every journal
 * created before that fix asks the app to treat drinking as a goal: the tick
 * scored a perfect day in `dayCompletion`, a sober day surfaced as "Missed
 * Alcohol" in the penalty card and "Most missed: Alcohol" in the weekly review,
 * and `reminderMessage` offered to help keep the streak alive.
 *
 * This does NOT rewrite any logged day. `habitLog` already records what the
 * person actually did — they ticked the box when they drank — so only the
 * app's reading of those ticks changes, and it changes from wrong to right.
 * Streaks, completion ratios and penalties for these two habits will therefore
 * move, in some cases sharply, the first time a migrated journal is opened.
 *
 * Deliberately narrow. It matches the seed's own fingerprint rather than the
 * name alone, so a habit someone renamed, recategorised, or already set a
 * polarity on is untouched. Idempotent: once `avoid` is set the guard fails and
 * re-running is a no-op, which matters because `migrate()` runs on every load.
 */
function relabelSeededQuitHabits(habits: JournalData['habits']): JournalData['habits'] {
  return habits.map((h) =>
    h.avoid === undefined &&
    SEEDED_QUIT_HABITS.some((s) => s.name === h.name && s.category === h.category)
      ? { ...h, avoid: true }
      : h,
  )
}

/** Fill in any keys missing from an older/partial payload (forward-compatible load). */
export function migrate(raw: unknown): JournalData {
  const base = emptyJournal()
  if (!raw || typeof raw !== 'object') return base
  const data = raw as Partial<JournalData>
  // Drop any keys that are present-but-null/undefined so they can't overwrite
  // the empty-journal defaults below (a corrupt/partial payload otherwise sets
  // e.g. metrics:null and every `.map`/`.some` over it throws).
  const clean: Partial<JournalData> = {}
  for (const [k, v] of Object.entries(data)) if (v != null) (clean as Record<string, unknown>)[k] = v
  // RETIRED FEATURE · per-day emoji stickers ("Decorate the day"), removed
  // 2026-08-02. Without this line the key would survive every load-and-save
  // round trip as an orphaned field nothing reads.
  //
  // This is deliberately destructive and was confirmed as such: a journal
  // saved after this migration no longer contains the stickers a user placed,
  // and they cannot be recovered from that file. Backups taken *before* the
  // upgrade still hold them.
  delete (clean as Record<string, unknown>).stickers
  return {
    ...base,
    ...clean,
    settings: { ...base.settings, ...(data.settings ?? {}) },
    // nofap is nested state — deep-merge so a malformed/partial nofap can't
    // break logRelapse/streakStats (missing best/relapses/startedOn).
    nofap: { ...base.nofap, ...(data.nofap ?? {}) },
    // Core collections the UI iterates — always arrays/objects, never undefined.
    entries: data.entries ?? [],
    habits: relabelSeededQuitHabits(data.habits ?? []),
    metrics: data.metrics ?? [],
    workouts: data.workouts ?? [],
    gratitude: data.gratitude ?? [],
    memories: data.memories ?? [],
    birthdays: data.birthdays ?? [],
    monthly: data.monthly ?? [],
    collections: data.collections ?? [],
    cycle: data.cycle ?? [],
    habitLog: data.habitLog ?? {},
    habitValues: data.habitValues ?? {},
    recurrences: data.recurrences ?? [],
    routines: data.routines ?? [],
    bodyMetrics: data.bodyMetrics ?? [],
    version: SCHEMA_VERSION,
  }
}

export function load(): JournalData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedJournal()
    return migrate(JSON.parse(raw))
  } catch {
    return seedJournal()
  }
}

export function save(data: JournalData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    // Quota or privacy-mode failure — surfaced by the UI's backup nudge.
    console.error('bujo: failed to persist', e)
  }
}

// ── Passcode encryption (at-rest) ────────────────────────────────────────────
export const STORAGE_ENC_KEY = 'bujo:enc'

/** Is the journal stored encrypted (passcode-protected)? */
export function hasEncrypted(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_ENC_KEY) != null
}
/** The raw encrypted blob, or null. */
export function readEncryptedRaw(): import('./crypto').EncryptedBlob | null {
  try {
    const raw = localStorage.getItem(STORAGE_ENC_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
/** Write the encrypted blob and clear the plaintext copy. */
export function writeEncrypted(blob: import('./crypto').EncryptedBlob): void {
  localStorage.setItem(STORAGE_ENC_KEY, JSON.stringify(blob))
  localStorage.removeItem(STORAGE_KEY)
}
/** Stop storing encrypted (the caller writes plaintext separately). */
export function clearEncrypted(): void {
  localStorage.removeItem(STORAGE_ENC_KEY)
}

// ── Export / import ──────────────────────────────────────────────────────────

export function exportJSON(data: JournalData): string {
  return JSON.stringify(data, null, 2)
}

/** Parse and migrate an imported JSON backup. Throws on invalid JSON. */
export function importJSON(text: string): JournalData {
  return migrate(JSON.parse(text))
}

/** Render the whole journal to portable Markdown (Obsidian / Logseq friendly). */
export function exportMarkdown(data: JournalData): string {
  const lines: string[] = ['# Bullet Journal Export', '']
  const byDay = new Map<string, string[]>()
  for (const e of data.entries) {
    const g =
      e.type === 'event' ? '○' : e.type === 'note' ? '-' : e.status === 'done' ? '[x]' : '[ ]'
    const sig = `${e.important ? '! ' : ''}${e.memory ? '▲ ' : ''}`
    const key = e.date || 'Unsorted'
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(`- ${g} ${sig}${e.text}`)
  }
  for (const day of [...byDay.keys()].sort()) {
    lines.push(`## ${day}`)
    const g = data.gratitude.find((x) => x.date === day)
    if (g) lines.push(`> Grateful: ${g.text}`)
    const m = data.memories.find((x) => x.date === day)
    if (m) lines.push(`> Memory: ${m.text}`)
    lines.push(...byDay.get(day)!, '')
  }
  return lines.join('\n')
}

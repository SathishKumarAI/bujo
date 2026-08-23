import { SCHEMA_VERSION, type JournalData, type Settings, type Workout } from './types'
import { todayISO } from './date'
import { normalizeActivity } from '../domain/activities'
import { toKm } from './units'

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
  const starter: { name: string; category: JournalData['habits'][number]['category']; color: string }[] = [
    { name: 'Caffeine', category: 'stimulant', color: 'peach' },
    { name: 'Sugar', category: 'stimulant', color: 'pink' },
    { name: 'Alcohol', category: 'stimulant', color: 'red' },
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
 * SCHEMA 3 · workouts.
 *
 * Two one-shot conversions, both gated on the *incoming* version so a journal
 * is never converted twice:
 *
 * 1. `activity` becomes a registry key. Free-form labels ("Run", "Home",
 *    "Push day") came from a retired `<select>` and a Gym template literal.
 *
 * 2. `distanceKm` becomes actual kilometres. v2 wrote the form value straight
 *    through with no conversion, so the field held whatever unit was on screen
 *    — miles, by default.
 *
 * The distance half is unavoidably best-effort and worth being blunt about:
 * v2 stored no per-row unit, so the only signal available is the journal's
 * *current* `distanceUnit`. For the overwhelming case — someone who never
 * touched the toggle — that is exact. For someone who switched units mid-
 * history, rows entered before the switch convert wrong. Those rows are
 * already wrong today (that is the bug), and no amount of care here can
 * recover information v2 never wrote down.
 */
function migrateWorkoutsToV3(workouts: Workout[], convertDistanceFrom?: Settings['distanceUnit']): Workout[] {
  return workouts.map((w) => {
    const next: Workout = { ...w, activity: normalizeActivity(w.activity, w.split) }
    if (next.distanceKm != null && convertDistanceFrom === 'mi') {
      next.distanceKm = Math.round(toKm(next.distanceKm, 'mi') * 1000) / 1000
    }
    return next
  })
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
  const settings = { ...base.settings, ...(data.settings ?? {}) }
  // Activity normalisation is idempotent (a key maps to itself), so it runs on
  // every load and stays the tolerant reader for anything arriving from an old
  // client via cloud sync. The distance conversion is NOT idempotent — running
  // it twice would multiply by 1.61 again — so it is gated on the stored
  // version, which is exactly why it needed a version bump to hang off.
  const storedVersion = typeof data.version === 'number' ? data.version : 0
  const workouts = migrateWorkoutsToV3(
    data.workouts ?? [],
    storedVersion < 3 ? settings.distanceUnit : undefined,
  )
  return {
    ...base,
    ...clean,
    settings,
    // nofap is nested state — deep-merge so a malformed/partial nofap can't
    // break logRelapse/streakStats (missing best/relapses/startedOn).
    nofap: { ...base.nofap, ...(data.nofap ?? {}) },
    // Core collections the UI iterates — always arrays/objects, never undefined.
    entries: data.entries ?? [],
    habits: data.habits ?? [],
    metrics: data.metrics ?? [],
    workouts,
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

/**
 * Fires when the outcome of a local write CHANGES (ok → failed, failed → ok).
 * `StorageBanner` listens. Edge-triggered on purpose: `save()` runs on every
 * keystroke, and an event per keystroke would be a re-render per keystroke.
 */
let lastSaveOk = true
function emitPersist(ok: boolean): void {
  if (ok === lastSaveOk) return
  lastSaveOk = ok
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bujo:persist', { detail: ok }))
  }
}

/** True if the most recent local write succeeded. */
export const persistOk = (): boolean => lastSaveOk

/**
 * Persist the journal. Returns false when the write failed.
 *
 * The old version swallowed the throw with a `console.error` and a comment
 * claiming the backup nudge surfaced it — it did not. The nudge keys on
 * `settings.lastBackup`, which says nothing about whether the write landed. On
 * a full quota or in Safari private mode the app kept running from memory and
 * lost everything on reload, with no signal anywhere. Now it says so.
 */
export function save(data: JournalData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    emitPersist(true)
    return true
  } catch (e) {
    // Quota exhausted, or a privacy mode that refuses writes.
    console.error('bujo: failed to persist', e)
    emitPersist(false)
    return false
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

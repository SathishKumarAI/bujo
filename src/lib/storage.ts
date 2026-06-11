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
    weightUnit: 'kg',
    distanceUnit: 'km',
    weekStart: 0,
    gender: 'prefer-not',
    cycleTrackerEnabled: false,
    nofapEnabled: false,
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
    metrics: [],
    workouts: [],
    routines: [],
    bodyMetrics: [],
    cycle: [],
    gratitude: [],
    memories: [],
    birthdays: [],
    monthly: [],
    collections: [],
    recurrences: [],
    stickers: {},
    nofap: { startedOn: todayISO(), best: 0, relapses: [] },
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

/** Fill in any keys missing from an older/partial payload (forward-compatible load). */
export function migrate(raw: unknown): JournalData {
  const base = emptyJournal()
  if (!raw || typeof raw !== 'object') return base
  const data = raw as Partial<JournalData>
  return {
    ...base,
    ...data,
    settings: { ...base.settings, ...(data.settings ?? {}) },
    habitLog: data.habitLog ?? {},
    recurrences: data.recurrences ?? [],
    stickers: data.stickers ?? {},
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

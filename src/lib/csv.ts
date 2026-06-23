// Plain-CSV exporters for spreadsheet/analysis use. Each returns a CSV string;
// the caller downloads it. Kept dependency-free and defensive about commas/quotes.
import type { JournalData } from './types'

function esc(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(headers: string[], rows: (string | number | undefined)[][]): string {
  return [headers.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
}

export function entriesCsv(data: JournalData): string {
  return toCsv(
    ['date', 'type', 'status', 'important', 'text', 'tags'],
    data.entries.map((e) => [e.date, e.type, e.status, e.important ? 'yes' : '', e.text, e.tags.join(' ')]),
  )
}

export function habitsCsv(data: JournalData): string {
  // Long format: one row per habit per day it was completed.
  const rows: (string | number)[][] = []
  for (const [date, ids] of Object.entries(data.habitLog)) {
    for (const id of ids) {
      const h = data.habits.find((x) => x.id === id)
      rows.push([date, h?.name ?? id, h?.category ?? ''])
    }
  }
  rows.sort((a, b) => (a[0] < b[0] ? -1 : 1))
  return toCsv(['date', 'habit', 'category'], rows)
}

export function metricsCsv(data: JournalData): string {
  return toCsv(
    ['date', 'mood', 'stress', 'sleep', 'calories', 'protein', 'carbs', 'fat'],
    [...data.metrics].sort((a, b) => (a.date < b.date ? -1 : 1)).map((m) => [m.date, m.mood, m.stress, m.sleep, m.calories, m.protein, m.carbs, m.fat]),
  )
}

/** Parse a metrics CSV (the format `metricsCsv` exports) into partial day rows. */
export function parseMetricsCsv(text: string): { date: string; patch: Record<string, number> }[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const header = lines[0].split(',').map((h) => h.trim())
  const di = header.indexOf('date')
  if (di < 0) return []
  const numCols = ['mood', 'stress', 'sleep', 'calories', 'protein', 'carbs', 'fat']
  const out: { date: string; patch: Record<string, number> }[] = []
  for (const line of lines.slice(1)) {
    const cells = line.split(',')
    const date = (cells[di] ?? '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    const patch: Record<string, number> = {}
    for (const key of numCols) {
      const ci = header.indexOf(key)
      if (ci < 0) continue
      const v = Number((cells[ci] ?? '').trim())
      if (Number.isFinite(v) && (cells[ci] ?? '').trim() !== '') patch[key] = v
    }
    if (Object.keys(patch).length) out.push({ date, patch })
  }
  return out
}

export function workoutsCsv(data: JournalData): string {
  return toCsv(
    ['date', 'activity', 'split', 'durationMin', 'distanceKm', 'calories', 'rpe', 'sets'],
    [...data.workouts].sort((a, b) => (a.date < b.date ? -1 : 1)).map((w) => [w.date, w.activity, w.split ?? '', w.durationMin, w.distanceKm, w.calories, w.rpe, w.sets.join(' | ')]),
  )
}

// ── Backup hygiene helpers ────────────────────────────────────────────────────

/** Settings keys that are device-/account-specific secrets. Stripped from a
 *  shared/exported backup by default so a copy you hand off can't leak a sync
 *  token, gist PAT, or OAuth client id. */
export const SYNC_SECRET_KEYS = [
  'selfHostToken',
  'selfHostUrl',
  'githubToken',
  'githubGistId',
  'googleClientId',
  'googleEmail',
] as const

/**
 * Return a copy of the journal with sync secrets removed from its settings.
 * Pure — does not mutate the input. Use before sharing/exporting a backup so
 * the file is portable and can't expose another device's credentials.
 */
export function stripSyncSecrets<T extends JournalData>(data: T): T {
  const settings = { ...data.settings }
  for (const k of SYNC_SECRET_KEYS) delete (settings as Record<string, unknown>)[k]
  return { ...data, settings }
}

/** Whole days from an ISO `lastBackup` day to `today` (both "YYYY-MM-DD").
 *  Returns null if `lastBackup` is missing/unparseable. Never negative. */
export function daysSinceBackup(lastBackup: string | undefined, today: string): number | null {
  if (!lastBackup || !/^\d{4}-\d{2}-\d{2}/.test(lastBackup)) return null
  const a = Date.parse(lastBackup.slice(0, 10) + 'T00:00:00')
  const b = Date.parse(today.slice(0, 10) + 'T00:00:00')
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

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

/**
 * Per-habit daily-log CSV (BUJO-281): one row per habit per tracked day, with the
 * count value (count habits), the daily target, and whether it counted as "done".
 * `done` = the day appears in habitLog (check) or value met target (count). Lets a
 * user analyse a single habit's adherence in a spreadsheet. Pure.
 */
export function habitLogCsv(data: JournalData): string {
  const values = data.habitValues ?? {}
  const rows: (string | number)[][] = []
  for (const h of data.habits) {
    // Union of every day this habit has either a check or a numeric value.
    const days = new Set<string>()
    for (const [date, ids] of Object.entries(data.habitLog)) if (ids.includes(h.id)) days.add(date)
    for (const [date, byId] of Object.entries(values)) if (h.id in byId) days.add(date)
    for (const date of [...days].sort()) {
      const checked = (data.habitLog[date] ?? []).includes(h.id)
      const value = values[date]?.[h.id]
      const target = h.target ?? ''
      // For count habits, "done" means meeting the target (or any value if no target);
      // for check habits it's simply being logged that day.
      const done =
        h.type === 'count'
          ? value != null && (h.target == null ? value > 0 : value >= h.target)
          : checked
      rows.push([date, h.name, h.category, value ?? (checked ? 1 : ''), target, done ? 'yes' : ''])
    }
  }
  rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : 1))
  return toCsv(['date', 'habit', 'category', 'value', 'target', 'done'], rows)
}

/**
 * Pickleball CSV export (BUJO-304): emits play sessions and league/tournament
 * events. `kind` distinguishes the two so both fit one sheet. Pure; safe on a
 * journal with no pickleball data (headers-only).
 */
export function pickleballCsv(data: JournalData): string {
  const rows: (string | number | undefined)[][] = []
  for (const s of [...(data.pickleball ?? [])].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    rows.push(['session', s.date, s.format, s.gamesWon, s.gamesLost, s.partner ?? '', s.opponent ?? '', s.location ?? '', s.durationMin ?? '', s.rpe ?? '', s.pointsFor ?? '', s.pointsAgainst ?? '', s.notes ?? ''])
  }
  for (const e of [...(data.pickleballEvents ?? [])].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    rows.push([e.kind, e.date, e.format, e.wins ?? '', e.losses ?? '', e.partner ?? '', '', '', '', '', '', '', `${e.name}${e.placement ? ` · ${e.placement}` : ''}`])
  }
  return toCsv(
    ['kind', 'date', 'format', 'won', 'lost', 'partner', 'opponent', 'location', 'durationMin', 'rpe', 'pointsFor', 'pointsAgainst', 'notes'],
    rows,
  )
}

/**
 * Recovery / abstinence data CSV export (BUJO-319): combines the urge-resisted log,
 * reset (relapse) reasons, and per-addiction streak history into one sheet so the
 * user can back up or analyse their recovery data. `kind` tags each row's source.
 * Pure; headers-only on a fresh journal.
 */
export function recoveryCsv(data: JournalData): string {
  const n = data.nofap
  const rows: (string | number)[][] = []
  // Resisted-urge wins.
  for (const u of [...(n.urgeLog ?? [])].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    rows.push(['urge', 'primary', u.date, u.trigger ?? '', u.technique ?? '', u.intensity ?? '', u.note ?? ''])
  }
  // Primary-streak relapses (resets) with their reasons.
  for (const r of [...n.relapses].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    rows.push(['reset', 'primary', r.date, r.trigger ?? '', '', '', r.note ?? ''])
  }
  // Per-addiction streak history (current start, best, and each reset).
  for (const a of n.addictions ?? []) {
    rows.push(['streak', a.name, a.startedOn, `best ${a.best}d`, '', '', `${a.relapses.length} reset${a.relapses.length === 1 ? '' : 's'}`])
    for (const r of [...a.relapses].sort((x, y) => (x.date < y.date ? -1 : 1))) {
      rows.push(['reset', a.name, r.date, r.trigger ?? '', '', '', r.note ?? ''])
    }
  }
  return toCsv(['kind', 'addiction', 'date', 'trigger', 'technique', 'intensity', 'note'], rows)
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

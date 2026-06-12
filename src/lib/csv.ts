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

export function workoutsCsv(data: JournalData): string {
  return toCsv(
    ['date', 'activity', 'split', 'durationMin', 'distanceKm', 'calories', 'rpe', 'sets'],
    [...data.workouts].sort((a, b) => (a.date < b.date ? -1 : 1)).map((w) => [w.date, w.activity, w.split ?? '', w.durationMin, w.distanceKm, w.calories, w.rpe, w.sets.join(' | ')]),
  )
}

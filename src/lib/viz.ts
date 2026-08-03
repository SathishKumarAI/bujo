import type { JournalData } from './types'
import { activeDays } from './stats'
import { addDays, fromISODay, todayISO, ymOf } from './date'

// ── Activity heatmap (GitHub-style) ──────────────────────────────────────────

export interface HeatCell {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

/** Count of items logged on a day (entries + metric + gratitude + memory + workout + habits). */
export function dayActivity(data: JournalData): Map<string, number> {
  const m = new Map<string, number>()
  const bump = (d?: string, n = 1) => d && m.set(d, (m.get(d) ?? 0) + n)
  data.entries.forEach((e) => bump(e.date))
  data.metrics.forEach((x) => bump(x.date))
  data.gratitude.forEach((g) => g.text && bump(g.date))
  data.memories.forEach((x) => x.text && bump(x.date))
  data.workouts.forEach((w) => bump(w.date, 2))
  Object.entries(data.habitLog).forEach(([d, ids]) => bump(d, ids.length))
  return m
}

/**
 * Bucket day values into the 0–4 intensity ramp by QUARTILE over the non-zero
 * values present, rather than by scaling linearly against the maximum.
 *
 * Linear scaling reads well only when the values are evenly spread, and
 * training volume never is. One 90-minute ride among a month of 25-minute runs
 * puts the max at 90, which drops every ordinary session into the lightest
 * step — the grid then says "one good day, nothing else", which is the opposite
 * of what a training history is for. Quartiles rank the days against each
 * other, so a typical day always lands mid-ramp and the shape of the habit
 * survives one outlier.
 *
 * Zero stays level 0 and is excluded from the quartile maths: a rest day is not
 * a quiet training day, it is the absence of one, and letting rest days into
 * the distribution drags every threshold down.
 */
export function quartileLevels(values: number[]): (v: number) => 0 | 1 | 2 | 3 | 4 {
  const nonZero = values.filter((v) => v > 0).sort((a, b) => a - b)
  if (nonZero.length === 0) return () => 0
  // Nearest-rank quantiles: index = ceil(q · n) − 1, NOT floor(q · n).
  // Floor puts the q-th value one rank too high, which pushes the top cut onto
  // the maximum itself — so the largest value tests as "≤ q3" and level 4 can
  // never be reached. Caught by the even-distribution test, which expected
  // 1/2/3/4 and got 1/1/2/3.
  //
  // With very few values the cuts collapse onto each other, which is correct —
  // three sessions cannot express four tiers, and inventing spread would be a
  // lie about the data.
  const at = (q: number) => nonZero[Math.max(0, Math.ceil(q * nonZero.length) - 1)]
  const q1 = at(0.25)
  const q2 = at(0.5)
  const q3 = at(0.75)
  return (v: number) => {
    if (v <= 0) return 0
    if (v <= q1) return 1
    if (v <= q2) return 2
    if (v <= q3) return 3
    return 4
  }
}

/** Build N weeks of heatmap cells ending today (column-major, Sun-first weeks). */
export function buildHeatmap(data: JournalData, weeks = 26, today = todayISO()): HeatCell[][] {
  const counts = dayActivity(data)
  // Find the Sunday on/before (today - weeks*7).
  const start = addDays(today, -(weeks * 7 - 1))
  const startDow = fromISODay(start).getDay()
  const gridStart = addDays(start, -startDow)
  const cols: HeatCell[][] = []
  for (let w = 0; w < weeks + 1; w++) {
    const col: HeatCell[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(gridStart, w * 7 + d)
      if (date > today) break
      const count = counts.get(date) ?? 0
      const level = (count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 6 ? 3 : 4) as HeatCell['level']
      col.push({ date, count, level })
    }
    if (col.length) cols.push(col)
  }
  return cols
}

// ── Weekly averages for the radar ────────────────────────────────────────────

export interface RadarPoint {
  axis: string
  value: number // 0–10 normalised
}

export function weeklyRadar(data: JournalData, today = todayISO()): RadarPoint[] {
  const last7 = new Set(Array.from({ length: 7 }, (_, i) => addDays(today, -i)))
  const recent = data.metrics.filter((m) => last7.has(m.date))
  const avg = (xs: (number | undefined)[]) => {
    const v = xs.filter((x): x is number => x != null)
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0
  }
  const mood = avg(recent.map((m) => m.mood))
  const stressVals = recent.map((m) => m.stress).filter((x): x is number => x != null)
  // No stress data → 0 (not a false "perfectly calm" 10 from 10 − 0).
  const calm = stressVals.length ? 10 - avg(stressVals) : 0
  const sleep = avg(recent.map((m) => m.sleep))
  // Habit adherence over the week, normalised 0–10. Active habits only.
  const activeHabits = data.habits.filter((h) => !h.archived)
  let hits = 0
  let slots = 0
  for (const day of last7) {
    slots += activeHabits.length
    hits += (data.habitLog[day] ?? []).filter((id) => activeHabits.some((h) => h.id === id)).length
  }
  const habits = slots ? Math.min(10, (hits / slots) * 10) : 0
  // Activity: days logged this week, normalised 0–10.
  const logged = [...activeDays(data)].filter((d) => last7.has(d)).length
  const consistency = (logged / 7) * 10
  return [
    { axis: 'Mood', value: round(mood) },
    { axis: 'Calm', value: round(calm) },
    { axis: 'Sleep', value: round(sleep) },
    { axis: 'Habits', value: round(habits) },
    { axis: 'Consistency', value: round(consistency) },
  ]
}

const round = (n: number) => Math.round(n * 10) / 10

// ── Sleep vs mood scatter ────────────────────────────────────────────────────

export function sleepMoodScatter(data: JournalData): { sleep: number; mood: number }[] {
  return data.metrics
    .filter((m) => m.sleep != null && m.mood != null)
    .map((m) => ({ sleep: m.sleep as number, mood: m.mood as number }))
}

// ── Weekly workout minutes ───────────────────────────────────────────────────

export function weeklyWorkoutMinutes(data: JournalData, weeks = 8, today = todayISO()): { week: string; minutes: number }[] {
  const out: { week: string; minutes: number }[] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const end = addDays(today, -w * 7)
    const start = addDays(end, -6)
    const minutes = data.workouts
      .filter((x) => x.date >= start && x.date <= end)
      .reduce((s, x) => s + (x.durationMin ?? 0), 0)
    out.push({ week: end.slice(5), minutes })
  }
  return out
}

// ── Task status breakdown ────────────────────────────────────────────────────

export function taskBreakdown(data: JournalData): { name: string; value: number; color: string }[] {
  const tasks = data.entries.filter((e) => e.type === 'task')
  const by = (s: string) => tasks.filter((t) => t.status === s).length
  return [
    { name: 'Done', value: by('done'), color: 'green' },
    { name: 'Open', value: by('open'), color: 'blue' },
    { name: 'Migrated', value: by('migrated'), color: 'peach' },
    { name: 'Dropped', value: by('dropped'), color: 'overlay0' },
  ].filter((d) => d.value > 0)
}

// ── Tag frequency ────────────────────────────────────────────────────────────

export function tagCounts(data: JournalData): { tag: string; count: number }[] {
  const m = new Map<string, number>()
  data.entries.forEach((e) => e.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)))
  return [...m.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count)
}

// ── Mood calendar (current month) ────────────────────────────────────────────

export function moodByDay(data: JournalData): Map<string, number> {
  const m = new Map<string, number>()
  data.metrics.forEach((x) => x.mood != null && m.set(x.date, x.mood))
  return m
}

export { ymOf }

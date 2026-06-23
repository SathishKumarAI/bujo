import type { JournalData } from './types'
import { habitDoneOn, currentStreak, taskCompletion } from './stats'
import { addDays, prettyDay, todayISO } from './date'

/** Pearson correlation of two equal-length numeric arrays. */
export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 3) return NaN
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx
    const b = ys[i] - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  const den = Math.sqrt(dx * dy)
  return den === 0 ? NaN : num / den
}

export interface Insight {
  text: string
  r: number
  strength: 'strong' | 'moderate'
}

/** Plain-language insights from the metric series (sleep/mood/stress). */
export function insights(data: JournalData): Insight[] {
  const rows = data.metrics.filter(
    (m) => m.mood != null || m.stress != null || m.sleep != null,
  )
  const out: Insight[] = []

  const pairs: [string, 'mood' | 'stress' | 'sleep', 'mood' | 'stress' | 'sleep', (r: number) => string][] = [
    ['sleep-stress', 'sleep', 'stress', (r) => (r < 0 ? 'Less sleep tends to mean more stress.' : 'More sleep tends to mean more stress.')],
    ['sleep-mood', 'sleep', 'mood', (r) => (r > 0 ? 'More sleep tends to lift your mood.' : 'More sleep tracks with lower mood.')],
    ['mood-stress', 'mood', 'stress', (r) => (r < 0 ? 'Higher stress tends to lower your mood.' : 'Stress and mood rise together for you.')],
  ]

  for (const [, a, b, phrase] of pairs) {
    const xs: number[] = []
    const ys: number[] = []
    for (const m of rows) {
      if (m[a] != null && m[b] != null) {
        xs.push(m[a] as number)
        ys.push(m[b] as number)
      }
    }
    const r = pearson(xs, ys)
    if (!Number.isNaN(r) && Math.abs(r) >= 0.4) {
      out.push({ text: phrase(r), r: Math.round(r * 100) / 100, strength: Math.abs(r) >= 0.7 ? 'strong' : 'moderate' })
    }
  }
  return out
}

export interface MoodImpact {
  habitId: string
  name: string
  emoji?: string
  color: string
  /** Average mood (0–10) on days the habit was done. */
  doneMood: number
  /** Average mood on days it was scheduled-ish but skipped. */
  skipMood: number
  /** doneMood − skipMood: how much doing the habit lifts (or drops) mood. */
  lift: number
  /** Mood-paired days behind the done figure (for confidence display). */
  doneDays: number
}

/**
 * Rank habits by how much doing them moves your mood. For each habit we pair
 * every mood-logged day with whether the habit was done that day, then compare
 * the average mood on done vs skipped days. The `lift` (done − skip) is the
 * signal; positive means the habit tends to coincide with better mood. Habits
 * without enough mood-paired days on BOTH sides are excluded (too sparse to
 * trust). Sorted by lift, strongest first. Pure + unit-tested.
 */
export function moodImpactRanking(data: JournalData, minDays = 3): MoodImpact[] {
  // Mood lookup by ISO day (last write wins, mirroring how metrics are read).
  const moodByDay = new Map<string, number>()
  for (const m of data.metrics) {
    if (m.mood != null) moodByDay.set(m.date, m.mood)
  }
  if (moodByDay.size === 0) return []

  const out: MoodImpact[] = []
  for (const h of data.habits) {
    if (h.archived) continue
    const done: number[] = []
    const skip: number[] = []
    for (const [day, mood] of moodByDay) {
      if (day < h.startedOn) continue // before tracking began
      if (habitDoneOn(data, h, day)) done.push(mood)
      else skip.push(mood)
    }
    // Need enough paired days on both sides to compute a meaningful lift.
    if (done.length < minDays || skip.length < minDays) continue
    const doneMood = done.reduce((a, b) => a + b, 0) / done.length
    const skipMood = skip.reduce((a, b) => a + b, 0) / skip.length
    out.push({
      habitId: h.id,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      doneMood: Math.round(doneMood * 10) / 10,
      skipMood: Math.round(skipMood * 10) / 10,
      lift: Math.round((doneMood - skipMood) * 10) / 10,
      doneDays: done.length,
    })
  }
  return out.sort((a, b) => b.lift - a.lift)
}

/** Mean of a metric over the [from, to] inclusive ISO-day window, or null. */
function metricMean(data: JournalData, key: 'mood' | 'sleep' | 'stress', from: string, to: string): number | null {
  const vals: number[] = []
  for (const m of data.metrics) {
    if (m.date < from || m.date > to) continue
    const v = m[key]
    if (v != null) vals.push(v)
  }
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

/** Habit completions across all habits within [from, to] inclusive. */
function habitDoneCount(data: JournalData, from: string, to: string): number {
  let n = 0
  for (const h of data.habits) {
    if (h.archived) continue
    let day = from
    while (day <= to) {
      if (day >= h.startedOn && habitDoneOn(data, h, day)) n += 1
      day = addDays(day, 1)
    }
  }
  return n
}

export interface DigestLine {
  /** Short label, e.g. "Streak". */
  label: string
  /** Human value, e.g. "12 days". */
  value: string
}

export interface WeeklyDigest {
  /** ISO day range covered (last 7 days ending today). */
  from: string
  to: string
  lines: DigestLine[]
  /** Biggest win this week (most-done habit), or null. */
  win: string | null
  /** Biggest slip — a habit that fell off vs. the prior week, or null. */
  slip: string | null
  /** Mood trend versus the previous 7 days: 'up' | 'down' | 'flat' | null. */
  moodTrend: 'up' | 'down' | 'flat' | null
}

/**
 * Plain-text recap of the last 7 days: logging streak, task completion, mood
 * trend vs. the prior week, and the biggest habit win/slip. Pure + deterministic
 * so the card renders the same all day and is unit-testable.
 */
export function weeklyDigest(data: JournalData, today = todayISO()): WeeklyDigest {
  const to = today
  const from = addDays(today, -6)
  const prevTo = addDays(from, -1)
  const prevFrom = addDays(prevTo, -6)

  const lines: DigestLine[] = []

  const streak = currentStreak(data, today)
  lines.push({ label: 'Logging streak', value: streak === 1 ? '1 day' : `${streak} days` })

  const tasks = taskCompletion(data)
  lines.push({ label: 'Tasks done', value: `${tasks.pct}% (${tasks.done}/${tasks.total})` })

  // Mood trend vs. prior week.
  const moodNow = metricMean(data, 'mood', from, to)
  const moodPrev = metricMean(data, 'mood', prevFrom, prevTo)
  let moodTrend: WeeklyDigest['moodTrend'] = null
  if (moodNow != null) {
    if (moodPrev == null) {
      lines.push({ label: 'Avg mood', value: `${Math.round(moodNow * 10) / 10}/10` })
      moodTrend = 'flat'
    } else {
      const delta = moodNow - moodPrev
      moodTrend = Math.abs(delta) < 0.25 ? 'flat' : delta > 0 ? 'up' : 'down'
      const arrow = moodTrend === 'up' ? '↑' : moodTrend === 'down' ? '↓' : '→'
      lines.push({ label: 'Avg mood', value: `${Math.round(moodNow * 10) / 10}/10 ${arrow} from ${Math.round(moodPrev * 10) / 10}` })
    }
  }

  // Biggest win / slip — per-habit completion counts this week vs. last.
  let win: string | null = null
  let slip: string | null = null
  let bestCount = 0
  let worstDrop = 0
  for (const h of data.habits) {
    if (h.archived || h.avoid) continue
    let now = 0
    let prev = 0
    for (let i = 0; i < 7; i++) {
      const d = addDays(to, -i)
      if (d >= h.startedOn && habitDoneOn(data, h, d)) now += 1
      const pd = addDays(prevTo, -i)
      if (pd >= h.startedOn && habitDoneOn(data, h, pd)) prev += 1
    }
    if (now > bestCount) {
      bestCount = now
      win = `${h.emoji ? h.emoji + ' ' : ''}${h.name} — ${now}× this week`
    }
    const drop = prev - now
    if (prev >= 3 && drop > worstDrop) {
      worstDrop = drop
      slip = `${h.emoji ? h.emoji + ' ' : ''}${h.name} — down ${drop} from last week`
    }
  }

  return { from, to, lines, win, slip, moodTrend }
}

export interface SleepDebtPoint {
  date: string
  /** Hours slept that night (null if not logged). */
  sleep: number | null
  /** Cumulative deficit vs. target in hours (positive = behind). Clamped at 0. */
  debt: number
}

/**
 * Running sleep-debt series over the last `days`: each night's shortfall vs.
 * `target` hours accrues; a night above target pays debt back. Debt is clamped
 * at 0 (you can't bank surplus indefinitely). Nights with no logged sleep are
 * treated as neutral (no accrual) so a gap doesn't fake a deficit. Pure.
 */
export function sleepDebt(data: JournalData, target = 8, days = 14, today = todayISO()): SleepDebtPoint[] {
  const byDay = new Map<string, number>()
  for (const m of data.metrics) {
    if (m.sleep != null) byDay.set(m.date, m.sleep)
  }
  const out: SleepDebtPoint[] = []
  let debt = 0
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const sleep = byDay.has(date) ? byDay.get(date)! : null
    if (sleep != null) {
      debt = Math.max(0, debt + (target - sleep))
    }
    out.push({ date, sleep, debt: Math.round(debt * 10) / 10 })
  }
  return out
}

export interface PeriodTrend {
  /** Percentage change vs. the prior equal-length period, rounded. */
  pct: number
  dir: 'up' | 'down' | 'flat'
}

/**
 * Compare a value now against a prior baseline and produce a signed % change +
 * direction for a trend arrow. `flat` when the rounded change is 0 (or the
 * baseline is 0 and there's no current value). Pure.
 */
export function periodTrend(current: number, prior: number): PeriodTrend {
  if (prior === 0) {
    if (current === 0) return { pct: 0, dir: 'flat' }
    return { pct: 100, dir: 'up' }
  }
  const pct = Math.round(((current - prior) / prior) * 100)
  return { pct, dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' }
}

/**
 * Habit-completion trend for the last 7 days vs. the previous 7, as a % change.
 * Drives the arrow on the "Current streak"/activity tiles. Pure.
 */
export function weeklyHabitTrend(data: JournalData, today = todayISO()): PeriodTrend {
  const to = today
  const from = addDays(today, -6)
  const prevTo = addDays(from, -1)
  const prevFrom = addDays(prevTo, -6)
  const now = habitDoneCount(data, from, to)
  const prev = habitDoneCount(data, prevFrom, prevTo)
  return periodTrend(now, prev)
}

/** Pretty "Jun 1 – Jun 7" label for the digest range. */
export function digestRangeLabel(from: string, to: string): string {
  return `${prettyDay(from)} – ${prettyDay(to)}`
}

/** Simple trailing moving average over a numeric series (nulls skipped). */
export function rollingAverage(values: (number | undefined)[], window = 7): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v != null)
    if (slice.length === 0) return null
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10
  })
}

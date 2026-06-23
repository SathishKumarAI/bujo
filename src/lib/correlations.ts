import type { JournalData, Habit } from './types'
import { habitDoneOn, currentStreak, taskCompletion, habitStreak } from './stats'
import { addDays, prettyDay, todayISO, dayDiff, ymOf, prettyMonth, WEEKDAYS } from './date'

/** Live (non-archived) habit lookup by id. */
function findHabit(data: JournalData, habitId: string): Habit | undefined {
  return data.habits.find((h) => h.id === habitId)
}

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

export interface WeekdayPerf {
  /** 0 = Sun … 6 = Sat. */
  weekday: number
  /** Short label, e.g. "Mon". */
  label: string
  /** Days this weekday was scheduled (active + after start). */
  scheduled: number
  /** Days it was actually done. */
  done: number
  /** done / scheduled in [0,1], or null when never scheduled. */
  rate: number | null
}

export interface HabitWeekdayReport {
  rows: WeekdayPerf[]
  /** Weekday with the highest success rate (needs ≥1 scheduled day), or null. */
  best: WeekdayPerf | null
  /** Weekday with the lowest success rate, or null. */
  worst: WeekdayPerf | null
}

/**
 * Per-weekday success RATE for a single habit, so you can see which days it
 * actually sticks vs. slips — to inform rescheduling. Unlike a raw completion
 * count (biased by how often each weekday has occurred since you started), this
 * divides done-days by SCHEDULED days for that weekday, respecting `activeDays`
 * and `startedOn`. Best/worst pick the extreme rates among weekdays that were
 * ever scheduled, requiring the two to actually differ (else both null — no
 * signal). Pure + deterministic.
 */
export function habitWeekdayPerformance(
  data: JournalData,
  habitId: string,
  today = todayISO(),
): HabitWeekdayReport {
  const h = findHabit(data, habitId)
  const scheduled = [0, 0, 0, 0, 0, 0, 0]
  const done = [0, 0, 0, 0, 0, 0, 0]
  if (h && !h.archived) {
    const span = dayDiff(h.startedOn, today)
    for (let i = 0; i <= span; i++) {
      const day = addDays(h.startedOn, i)
      const wd = new Date(day + 'T00:00:00').getDay()
      if (h.activeDays?.length && !h.activeDays.includes(wd)) continue
      scheduled[wd] += 1
      if (habitDoneOn(data, h, day)) done[wd] += 1
    }
  }
  const rows: WeekdayPerf[] = scheduled.map((s, wd) => ({
    weekday: wd,
    label: WEEKDAYS[wd],
    scheduled: s,
    done: done[wd],
    rate: s ? Math.round((done[wd] / s) * 100) / 100 : null,
  }))
  const rated = rows.filter((r) => r.rate != null)
  let best: WeekdayPerf | null = null
  let worst: WeekdayPerf | null = null
  if (rated.length >= 2) {
    const sorted = [...rated].sort((a, b) => b.rate! - a.rate!)
    if (sorted[0].rate !== sorted[sorted.length - 1].rate) {
      best = sorted[0]
      worst = sorted[sorted.length - 1]
    }
  }
  return { rows, best, worst }
}

export interface StreakLeader {
  habitId: string
  name: string
  emoji?: string
  color: string
  /** Current consecutive-day streak. */
  current: number
  /** All-time longest streak for this habit. */
  best: number
}

/** All-time longest run of consecutive done-days for one habit (history-wide). */
function habitBestStreak(data: JournalData, h: Habit): number {
  const days = new Set<string>()
  for (const [day, ids] of Object.entries(data.habitLog)) {
    if (ids.includes(h.id)) days.add(day)
  }
  // Numeric habits log values, not the habitLog id list.
  if ((h.type ?? 'check') !== 'check') {
    for (const day of Object.keys(data.habitValues ?? {})) {
      if (habitDoneOn(data, h, day)) days.add(day)
    }
  }
  const sorted = [...days].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of sorted) {
    run = prev && dayDiff(prev, d) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

/**
 * Ranked leaderboard of your build habits by streak — current first, then
 * all-time best as a tiebreak — for a motivating "who's hottest" glance.
 * Excludes archived and avoid (quit) habits, whose streak semantics are
 * inverted (clean-day, handled elsewhere). Habits with no streak at all
 * (current 0 and best 0) are dropped. Pure + deterministic.
 */
export function streakLeaderboard(data: JournalData, today = todayISO()): StreakLeader[] {
  const out: StreakLeader[] = []
  for (const h of data.habits) {
    if (h.archived || h.avoid) continue
    const current = habitStreak(data, h.id, today)
    const best = Math.max(current, habitBestStreak(data, h))
    if (current === 0 && best === 0) continue
    out.push({ habitId: h.id, name: h.name, emoji: h.emoji, color: h.color, current, best })
  }
  return out.sort((a, b) => b.current - a.current || b.best - a.best)
}

/**
 * Recency-weighted consistency score (0–100) for a single habit over the last
 * `window` scheduled days. Unlike a flat completion %, recent days count more
 * (linear weight: today weighs `window`, the oldest day weighs 1), so the score
 * captures momentum — a habit you've nailed all week scores high even if last
 * month was patchy, and a recent slump drags it down fast. Only scheduled days
 * (active weekday + after start) enter the denominator. Returns null when
 * nothing was scheduled in the window. Pure.
 */
export function habitConsistencyScore(
  data: JournalData,
  habitId: string,
  window = 30,
  today = todayISO(),
): number | null {
  const h = findHabit(data, habitId)
  if (!h) return null
  let num = 0
  let den = 0
  for (let i = 0; i < window; i++) {
    const day = addDays(today, -i)
    if (day < h.startedOn) continue
    const wd = new Date(day + 'T00:00:00').getDay()
    if (h.activeDays?.length && !h.activeDays.includes(wd)) continue
    const weight = window - i // today heaviest, oldest lightest
    den += weight
    if (habitDoneOn(data, h, day)) num += weight
  }
  return den ? Math.round((num / den) * 100) : null
}

export interface MonthlyHabitPoint {
  /** "YYYY-MM". */
  ym: string
  /** Pretty label, e.g. "Jun 2026". */
  label: string
  /** Completions that calendar month. */
  done: number
  /** Change vs. the previous listed month (0 for the first). */
  delta: number
}

/**
 * Month-over-month completion counts for one habit across the trailing
 * `months`, each tagged with its delta vs. the prior month — the raw signal
 * behind "you did X more this month than last". Oldest-first so the series
 * reads left-to-right and the first point's delta is 0 (no baseline). Pure.
 */
export function habitMonthlyDeltas(
  data: JournalData,
  habitId: string,
  months = 6,
  today = todayISO(),
): MonthlyHabitPoint[] {
  const h = findHabit(data, habitId)
  if (!h) return []
  // Build the list of trailing year-months, oldest first.
  const yms: string[] = []
  const [y0, m0] = ymOf(today).split('-').map(Number)
  for (let i = months - 1; i >= 0; i--) {
    yms.push(ymOf(new Date(y0, m0 - 1 - i, 1)))
  }
  const counts = new Map<string, number>(yms.map((ym) => [ym, 0]))
  // Count done-days per month from both the check log and numeric values.
  const tally = (day: string) => {
    if (day < h.startedOn) return
    const ym = ymOf(day)
    if (counts.has(ym) && habitDoneOn(data, h, day)) counts.set(ym, counts.get(ym)! + 1)
  }
  if ((h.type ?? 'check') === 'check') {
    for (const [day, ids] of Object.entries(data.habitLog)) {
      if (ids.includes(h.id)) tally(day)
    }
  } else {
    for (const day of Object.keys(data.habitValues ?? {})) tally(day)
  }
  const out: MonthlyHabitPoint[] = []
  let prev: number | null = null
  for (const ym of yms) {
    const done = counts.get(ym) ?? 0
    out.push({ ym, label: prettyMonth(ym), done, delta: prev == null ? 0 : done - prev })
    prev = done
  }
  return out
}

/** Simple trailing moving average over a numeric series (nulls skipped). */
export function rollingAverage(values: (number | undefined)[], window = 7): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v != null)
    if (slice.length === 0) return null
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10
  })
}

import type { JournalData, Habit, Entry } from './types'
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

export type MetricKey = 'mood' | 'sleep' | 'stress' | 'energy'

export interface WeekdayMetric {
  weekday: number
  label: string
  /** Average of the metric on that weekday, or null if never logged. */
  avg: number | null
  /** Days that fed the average (for a confidence read). */
  days: number
}

export interface BestWorstWeekday {
  rows: WeekdayMetric[]
  /** Brightest weekday (highest avg, needs ≥1 logged day), or null. */
  best: WeekdayMetric | null
  /** Dimmest weekday (lowest avg), or null. Distinct from best. */
  worst: WeekdayMetric | null
}

/**
 * Average a daily metric (mood/sleep/energy/…) per weekday across ALL logged
 * history, then surface the single best and worst day — "your Saturdays run
 * bright, your Mondays drag". Unlike a same-week snapshot this pools every
 * occurrence of each weekday, so it reflects a durable rhythm rather than this
 * week's noise. best/worst require at least two rated weekdays whose averages
 * actually differ (else both null — no signal). Pure + deterministic.
 */
export function bestWorstWeekday(data: JournalData, key: MetricKey = 'mood'): BestWorstWeekday {
  const sums = [0, 0, 0, 0, 0, 0, 0]
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const m of data.metrics) {
    const v = m[key]
    if (v == null) continue
    const wd = new Date(m.date + 'T00:00:00').getDay()
    sums[wd] += v
    counts[wd] += 1
  }
  const rows: WeekdayMetric[] = counts.map((c, wd) => ({
    weekday: wd,
    label: WEEKDAYS[wd],
    avg: c ? Math.round((sums[wd] / c) * 10) / 10 : null,
    days: c,
  }))
  const rated = rows.filter((r) => r.avg != null)
  let best: WeekdayMetric | null = null
  let worst: WeekdayMetric | null = null
  if (rated.length >= 2) {
    const sorted = [...rated].sort((a, b) => b.avg! - a.avg!)
    if (sorted[0].avg !== sorted[sorted.length - 1].avg) {
      best = sorted[0]
      worst = sorted[sorted.length - 1]
    }
  }
  return { rows, best, worst }
}

export interface WeekdayWeekendSplit {
  /** Habit completion rate (done / scheduled) on weekdays, 0–1 or null. */
  habitWeekday: number | null
  /** Habit completion rate on weekends. */
  habitWeekend: number | null
  /** Average mood on weekdays, or null. */
  moodWeekday: number | null
  /** Average mood on weekends. */
  moodWeekend: number | null
  /** Scheduled habit-days behind the weekday/weekend rates (confidence). */
  weekdayDays: number
  weekendDays: number
}

/**
 * Contrast how you run on weekdays vs. weekends across two axes: habit
 * completion rate (done ÷ scheduled, respecting activeDays + startedOn) and
 * average mood. Weekend = Sat/Sun. Surfaces the common "I fall off on weekends"
 * (or the reverse) pattern in one card. Rates are null when nothing was
 * scheduled / logged on that side. Pure + deterministic.
 */
export function weekdayWeekendSplit(data: JournalData, today = todayISO()): WeekdayWeekendSplit {
  let wdDone = 0
  let wdSched = 0
  let weDone = 0
  let weSched = 0
  for (const h of data.habits) {
    if (h.archived || h.avoid) continue
    const span = dayDiff(h.startedOn, today)
    for (let i = 0; i <= span; i++) {
      const day = addDays(h.startedOn, i)
      const wd = new Date(day + 'T00:00:00').getDay()
      if (h.activeDays?.length && !h.activeDays.includes(wd)) continue
      const weekend = wd === 0 || wd === 6
      const done = habitDoneOn(data, h, day)
      if (weekend) {
        weSched += 1
        if (done) weDone += 1
      } else {
        wdSched += 1
        if (done) wdDone += 1
      }
    }
  }
  let moodWdSum = 0
  let moodWdN = 0
  let moodWeSum = 0
  let moodWeN = 0
  for (const m of data.metrics) {
    if (m.mood == null) continue
    const wd = new Date(m.date + 'T00:00:00').getDay()
    if (wd === 0 || wd === 6) {
      moodWeSum += m.mood
      moodWeN += 1
    } else {
      moodWdSum += m.mood
      moodWdN += 1
    }
  }
  return {
    habitWeekday: wdSched ? Math.round((wdDone / wdSched) * 100) / 100 : null,
    habitWeekend: weSched ? Math.round((weDone / weSched) * 100) / 100 : null,
    moodWeekday: moodWdN ? Math.round((moodWdSum / moodWdN) * 10) / 10 : null,
    moodWeekend: moodWeN ? Math.round((moodWeSum / moodWeN) * 10) / 10 : null,
    weekdayDays: wdSched,
    weekendDays: weSched,
  }
}

export interface VolatilityReport {
  /** Population standard deviation of the metric over the window, or null. */
  sd: number | null
  /** Mean of the metric over the window (context for the SD), or null. */
  mean: number | null
  /** Stability score 0–100: 100 = rock-steady, lower = more swingy. */
  stability: number | null
  /** Days that fed the calculation. */
  days: number
  /** 'steady' | 'variable' | 'volatile' label, or null when too sparse. */
  band: 'steady' | 'variable' | 'volatile' | null
}

/**
 * Mood (or any metric) VOLATILITY over the trailing `window` days: the standard
 * deviation captures how much your days swing, independent of the average — two
 * people can average 6/10 yet one is a flat line and the other a rollercoaster.
 * We map SD onto a 0–100 stability score (SD 0 → 100, SD 3 → 0 on the 0–10
 * scale) so higher is calmer, and band it for plain-language display. Needs at
 * least 3 logged days. Pure + deterministic.
 */
export function metricVolatility(
  data: JournalData,
  key: MetricKey = 'mood',
  window = 30,
  today = todayISO(),
): VolatilityReport {
  const from = addDays(today, -(window - 1))
  const vals: number[] = []
  for (const m of data.metrics) {
    if (m.date < from || m.date > today) continue
    const v = m[key]
    if (v != null) vals.push(v)
  }
  if (vals.length < 3) return { sd: null, mean: null, stability: null, days: vals.length, band: null }
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length
  const sd = Math.sqrt(variance)
  // SD on a 0–10 metric: clamp to [0,3] then invert to a 0–100 calmness score.
  const stability = Math.round(Math.max(0, 1 - Math.min(sd, 3) / 3) * 100)
  const band: VolatilityReport['band'] = sd < 1 ? 'steady' : sd < 2 ? 'variable' : 'volatile'
  return {
    sd: Math.round(sd * 100) / 100,
    mean: Math.round(mean * 10) / 10,
    stability,
    days: vals.length,
    band,
  }
}

export interface Momentum {
  key: MetricKey
  label: string
  /** Recent-window mean minus the prior-window mean (signed). */
  delta: number
  dir: 'up' | 'down' | 'flat'
  /** Recent-window mean (the current level). */
  recent: number
  /** Sample days behind the recent figure (confidence). */
  recentDays: number
}

const METRIC_LABELS: Record<MetricKey, string> = {
  mood: 'Mood',
  sleep: 'Sleep',
  stress: 'Stress',
  energy: 'Energy',
}

/**
 * Per-metric MOMENTUM: is each tracked metric trending up, down or flat right
 * now? Compares the mean of the recent `window` days against the immediately
 * prior `window` days and reports the signed delta + direction. A small dead
 * zone (`flatBand`) keeps trivial wobble from reading as a trend. Only metrics
 * with enough data on BOTH windows are returned, strongest move first (by
 * |delta|). Note `stress` is left as-is — the view decides whether up is good.
 * Pure + deterministic.
 */
export function momentumIndicator(
  data: JournalData,
  window = 7,
  today = todayISO(),
  flatBand = 0.25,
): Momentum[] {
  const recentTo = today
  const recentFrom = addDays(today, -(window - 1))
  const priorTo = addDays(recentFrom, -1)
  const priorFrom = addDays(priorTo, -(window - 1))

  const out: Momentum[] = []
  const keys: MetricKey[] = ['mood', 'sleep', 'energy', 'stress']
  for (const key of keys) {
    const recentVals: number[] = []
    const priorVals: number[] = []
    for (const m of data.metrics) {
      const v = m[key]
      if (v == null) continue
      if (m.date >= recentFrom && m.date <= recentTo) recentVals.push(v)
      else if (m.date >= priorFrom && m.date <= priorTo) priorVals.push(v)
    }
    if (recentVals.length < 2 || priorVals.length < 2) continue
    const recent = recentVals.reduce((a, b) => a + b, 0) / recentVals.length
    const prior = priorVals.reduce((a, b) => a + b, 0) / priorVals.length
    const delta = Math.round((recent - prior) * 10) / 10
    const dir: Momentum['dir'] = Math.abs(delta) < flatBand ? 'flat' : delta > 0 ? 'up' : 'down'
    out.push({
      key,
      label: METRIC_LABELS[key],
      delta,
      dir,
      recent: Math.round(recent * 10) / 10,
      recentDays: recentVals.length,
    })
  }
  return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

export interface DeferredTask {
  /** id of the most-recent (live) entry in the chain. */
  id: string
  text: string
  /** Times this task was carried forward (length of its origin chain minus 1). */
  migrations: number
  /** ISO day the live entry currently sits on. */
  date: string
  /** Whether the live entry is still open (vs. done/dropped). */
  open: boolean
}

export interface MigrationReport {
  /** Open tasks migrated at least `minMigrations` times, most-migrated first. */
  chronic: DeferredTask[]
  /** Total migrations counted across every task chain (engagement signal). */
  totalMigrations: number
  /** How many distinct task chains were migrated at least once. */
  migratedChains: number
}

/**
 * Migration analytics: the BuJo "is this task actually worth doing?" read. A
 * task that gets carried forward day after day forms an `originId` chain; the
 * length of that chain is how many times you deferred it. We walk every chain to
 * its live tip, count the hops, and surface still-open tasks that have been
 * migrated `minMigrations`+ times — the chronically-deferred work that wants a
 * "do it or drop it" decision. Pure + deterministic, read-only over entries.
 */
export function migrationAnalytics(data: JournalData, minMigrations = 2): MigrationReport {
  const byId = new Map<string, Entry>()
  for (const e of data.entries) byId.set(e.id, e)
  // Entries that are someone's origin are mid-chain, not the live tip.
  const isOrigin = new Set<string>()
  for (const e of data.entries) if (e.originId) isOrigin.add(e.originId)

  let totalMigrations = 0
  let migratedChains = 0
  const chronic: DeferredTask[] = []

  for (const e of data.entries) {
    if (e.type !== 'task') continue
    if (isOrigin.has(e.id)) continue // not the tip of its chain
    // Walk back through originId to count hops (guard against cycles).
    let hops = 0
    let cur: Entry | undefined = e
    const seen = new Set<string>()
    while (cur?.originId && byId.has(cur.originId) && !seen.has(cur.originId)) {
      seen.add(cur.originId)
      hops += 1
      cur = byId.get(cur.originId)
    }
    if (hops > 0) {
      totalMigrations += hops
      migratedChains += 1
    }
    const open = e.status === 'open' || e.status === 'migrated' || e.status === 'scheduled'
    if (hops >= minMigrations && open && e.status !== 'dropped' && e.status !== 'done') {
      chronic.push({ id: e.id, text: e.text, migrations: hops, date: e.date, open })
    }
  }
  chronic.sort((a, b) => b.migrations - a.migrations || (a.date < b.date ? -1 : 1))
  return { chronic, totalMigrations, migratedChains }
}

export interface TaskAgingBucket {
  /** Bucket label, e.g. "8–14d". */
  label: string
  /** Open tasks whose age (days since they live-date) falls in this bucket. */
  count: number
  /** Catppuccin color name keyed to urgency (fresh → stale). */
  color: string
}

export interface TaskAgingReport {
  buckets: TaskAgingBucket[]
  /** Total open tasks across all buckets. */
  open: number
  /** The single oldest open task (text + age in days), or null. */
  oldest: { text: string; age: number } | null
}

/**
 * Task-aging report: how long your open tasks have been sitting, bucketed by
 * age (today, this week, 1–2 weeks, 2+ weeks). Stale open tasks are the silent
 * backlog a tracker never confronts; bucketing them makes the pile legible and
 * nudges a cleanup. Age is measured from the entry's live date to `today`.
 * Only genuinely open tasks (not done/dropped) count. Pure + deterministic.
 */
export function taskAging(data: JournalData, today = todayISO()): TaskAgingReport {
  const defs: { label: string; max: number; color: string }[] = [
    { label: 'Today', max: 0, color: 'green' },
    { label: '1–7d', max: 7, color: 'teal' },
    { label: '8–14d', max: 14, color: 'yellow' },
    { label: '15+d', max: Infinity, color: 'peach' },
  ]
  const counts = defs.map(() => 0)
  let open = 0
  let oldest: { text: string; age: number } | null = null
  for (const e of data.entries) {
    if (e.type !== 'task') continue
    if (e.status !== 'open' && e.status !== 'migrated' && e.status !== 'scheduled') continue
    if (!e.date) continue
    const age = Math.max(0, dayDiff(e.date, today))
    open += 1
    const bi = defs.findIndex((d) => age <= d.max)
    counts[bi >= 0 ? bi : defs.length - 1] += 1
    if (!oldest || age > oldest.age) oldest = { text: e.text, age }
  }
  const buckets = defs.map((d, i) => ({ label: d.label, count: counts[i], color: d.color }))
  return { buckets, open, oldest }
}

export interface PickleballInsights {
  /** Lifetime games won ÷ total games, 0–1, or null if no games logged. */
  winRate: number | null
  /** Games played in the trailing 7 days. */
  weekGames: number
  /** Consecutive days (ending today or yesterday) with a logged session. */
  playStreak: number
  /** Total sessions logged. */
  sessions: number
  /** Win-rate over the most recent 5 sessions minus the prior 5 (momentum). */
  recentWinRate: number | null
  formDir: 'up' | 'down' | 'flat' | null
  /** Doubles vs singles session split. */
  doubles: number
  singles: number
}

/**
 * Cross-domain pickleball KPIs for the Insights view: lifetime win rate, games
 * this week, current play streak, and a recent-form read (win rate over the last
 * 5 sessions vs. the 5 before). Mirrors how other trackers surface a compact
 * scorecard so pickleball sits alongside habits and mood. Pure + deterministic,
 * read-only over `data.pickleball`.
 */
export function pickleballInsights(data: JournalData, today = todayISO()): PickleballInsights {
  const all = [...(data.pickleball ?? [])].sort((a, b) => (a.date < b.date ? -1 : 1))
  let won = 0
  let total = 0
  let doubles = 0
  let singles = 0
  for (const s of all) {
    won += s.gamesWon
    total += s.gamesWon + s.gamesLost
    if (s.format === 'doubles') doubles += 1
    else singles += 1
  }
  const weekFrom = addDays(today, -6)
  const weekGames = all
    .filter((s) => s.date >= weekFrom && s.date <= today)
    .reduce((n, s) => n + s.gamesWon + s.gamesLost, 0)

  // Play streak: consecutive days with ≥1 session, anchored to today or yesterday.
  const playedDays = new Set(all.map((s) => s.date))
  let playStreak = 0
  let cursor = playedDays.has(today) ? today : playedDays.has(addDays(today, -1)) ? addDays(today, -1) : null
  while (cursor && playedDays.has(cursor)) {
    playStreak += 1
    cursor = addDays(cursor, -1)
  }

  // Recent form: win rate of last 5 sessions vs. the 5 before them.
  const sessionWinRate = (xs: typeof all): number | null => {
    let w = 0
    let t = 0
    for (const s of xs) {
      w += s.gamesWon
      t += s.gamesWon + s.gamesLost
    }
    return t ? w / t : null
  }
  let recentWinRate: number | null = null
  let formDir: PickleballInsights['formDir'] = null
  if (all.length >= 2) {
    const last5 = all.slice(-5)
    const prev5 = all.slice(-10, -5)
    const r = sessionWinRate(last5)
    recentWinRate = r == null ? null : Math.round(r * 100) / 100
    const p = sessionWinRate(prev5)
    if (r != null && p != null) {
      const d = r - p
      formDir = Math.abs(d) < 0.05 ? 'flat' : d > 0 ? 'up' : 'down'
    }
  }

  return {
    winRate: total ? Math.round((won / total) * 100) / 100 : null,
    weekGames,
    playStreak,
    sessions: all.length,
    recentWinRate,
    formDir,
    doubles,
    singles,
  }
}

export interface FocusSleepLink {
  /** Pearson r of same-day sleep vs. focus score, or null when too sparse. */
  r: number | null
  /** Paired (sleep, focus) days behind the figure. */
  days: number
  /** Plain-language read, or null when there's no usable signal. */
  note: string | null
}

/**
 * Productivity-vs-sleep link: pairs each dev/focus session's quality score with
 * the same day's logged sleep hours and correlates them — the "does rest fuel
 * deep work?" question, answered from your own data. When a day has several
 * sessions we average their focus so each day weighs once. Needs at least a few
 * paired days; below that there's no honest signal (r = null). Pure.
 */
export function focusSleepCorrelation(data: JournalData): FocusSleepLink {
  const sleepByDay = new Map<string, number>()
  for (const m of data.metrics) if (m.sleep != null) sleepByDay.set(m.date, m.sleep)

  // Average focus per day so multi-session days don't dominate.
  const focusSum = new Map<string, number>()
  const focusN = new Map<string, number>()
  for (const s of data.devSessions ?? []) {
    if (s.focus == null) continue
    focusSum.set(s.date, (focusSum.get(s.date) ?? 0) + s.focus)
    focusN.set(s.date, (focusN.get(s.date) ?? 0) + 1)
  }

  const sleeps: number[] = []
  const focuses: number[] = []
  for (const [day, n] of focusN) {
    const sleep = sleepByDay.get(day)
    if (sleep == null) continue
    sleeps.push(sleep)
    focuses.push(focusSum.get(day)! / n)
  }
  const days = sleeps.length
  const r = pearson(sleeps, focuses)
  if (Number.isNaN(r)) return { r: null, days, note: null }
  const rounded = Math.round(r * 100) / 100
  let note: string | null
  if (Math.abs(r) < 0.3) note = 'Your sleep and focus look fairly independent so far.'
  else if (r > 0) note = 'More sleep tends to track with sharper focus for you.'
  else note = 'Oddly, your focus runs higher on shorter-sleep days — worth a closer look.'
  return { r: rounded, days, note }
}

import type { JournalData } from './types'
import { habitDoneOn } from './stats'

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

/** Simple trailing moving average over a numeric series (nulls skipped). */
export function rollingAverage(values: (number | undefined)[], window = 7): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v != null)
    if (slice.length === 0) return null
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10
  })
}

import type { JournalData } from './types'

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

/** Simple trailing moving average over a numeric series (nulls skipped). */
export function rollingAverage(values: (number | undefined)[], window = 7): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v != null)
    if (slice.length === 0) return null
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10
  })
}

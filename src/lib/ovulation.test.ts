/**
 * THE DETECTION ENGINE.
 *
 * Named for what goes wrong, because every failure here is a wrong claim about
 * someone's body: a shift invented from noise, a shift erased by a fever, an
 * ovulation day placed a day late every single cycle.
 */
import { describe, expect, it } from 'vitest'
import { avgLutealLength, detectOvulation, predict } from './ovulation'
import { addDays } from './date'
import type { CyclePoint } from './types'

/** Build a cycle from a list of temperatures, day 1 = 2026-09-01. */
function cycle(temps: (number | undefined)[], extra: Partial<CyclePoint>[] = []): CyclePoint[] {
  return temps.map((t, i) => ({
    date: addDays('2026-09-01', i),
    flags: i === 0 ? ['period'] : [],
    ...(t != null ? { temp: t } : {}),
    ...(extra[i] ?? {}),
  }))
}

/** Six lows then a clean, unambiguous rise. */
const LOWS = [97.2, 97.3, 97.1, 97.25, 97.2, 97.3]
const HIGHS = [97.7, 97.8, 97.75, 97.8, 97.85]

describe('the 3-over-6 rule', () => {
  it('finds the coverline as the highest of the six lows', () => {
    const r = detectOvulation(cycle([...LOWS, ...HIGHS]))
    expect(r.coverline).toBe(97.3)
  })

  it('places ovulation on the LAST LOW, not the first high', () => {
    // The rise follows ovulation by a day or so. Naming the first high day
    // would place the estimate a day late in every single cycle.
    const r = detectOvulation(cycle([...LOWS, ...HIGHS]))
    expect(r.day).toBe(6)
    expect(r.date).toBe('2026-09-06')
  })

  it('reports nothing at all when there are fewer than nine readings', () => {
    const r = detectOvulation(cycle([...LOWS, 97.7, 97.8]))
    expect(r.day).toBeNull()
    expect(r.coverline).toBeNull()
    expect(r.confidence).toBe('estimated')
  })

  it('does not fire when the three highs are not all above the six lows', () => {
    const r = detectOvulation(cycle([...LOWS, 97.7, 97.28, 97.8]))
    expect(r.day).toBeNull()
  })

  it('gives the fertile window as the five days before ovulation plus the day', () => {
    const r = detectOvulation(cycle([...LOWS, ...HIGHS]))
    expect(r.fertileFrom).toBe(1)
    expect(r.fertileTo).toBe(6)
  })
})

describe('the 0.2 F confirmation, which separates a shift from noise', () => {
  it('confirms on the third high when it clears the line by the margin', () => {
    // coverline 97.3, third high 97.50 = exactly +0.2
    const r = detectOvulation(cycle([...LOWS, 97.35, 97.4, 97.5]))
    expect(r.day).toBe(6)
  })

  it('requires a fourth reading when the third is only barely above', () => {
    // Three readings a hundredth above a noisy baseline is measurement error.
    const marginal = [...LOWS, 97.32, 97.34, 97.33]
    expect(detectOvulation(cycle(marginal)).day).toBeNull()
    expect(detectOvulation(cycle([...marginal, 97.36])).day).toBe(6)
  })

  it('uses the tighter 0.1 margin in Celsius', () => {
    const lowsC = [36.2, 36.3, 36.1, 36.25, 36.2, 36.3]
    // third high = 36.40 = coverline 36.3 + 0.1
    const r = detectOvulation(cycle([...lowsC, 36.35, 36.38, 36.4]), 'C')
    expect(r.day).toBe(6)
  })
})

describe('disturbed readings are skipped, not counted and not fatal', () => {
  it('ignores a disturbed spike that would otherwise invent a shift', () => {
    // A fever in the middle of the follicular phase: three "highs" that are
    // really one illness. Marked disturbed, the run must not fire.
    const temps = [...LOWS, 98.6, 98.7, 98.6]
    const marks = temps.map((_, i) => (i >= 6 ? { tempDisturbed: true as const } : {}))
    expect(detectOvulation(cycle(temps, marks)).day).toBeNull()
  })

  it('does not let a disturbed day in the middle break a real run', () => {
    // Lows, one bad night, then the genuine rise. Treating the disturbed day
    // as a low would break the three-in-a-row and erase a real shift.
    const temps = [...LOWS, 98.9, 97.7, 97.8, 97.75, 97.85]
    const marks: Partial<CyclePoint>[] = []
    marks[6] = { tempDisturbed: true }
    const r = detectOvulation(cycle(temps, marks))
    expect(r.day).toBe(6)
    expect(r.coverline).toBe(97.3)
  })

  it('treats a missing reading the same way — absent, not low', () => {
    const r = detectOvulation(cycle([...LOWS, undefined, 97.7, 97.8, 97.75]))
    expect(r.day).toBe(6)
  })
})

describe('supporting signs strengthen but never substitute', () => {
  it('is `likely` on temperature alone', () => {
    expect(detectOvulation(cycle([...LOWS, ...HIGHS])).confidence).toBe('likely')
  })

  it('is `confirmed` when an LH peak lands within two days before', () => {
    const marks: Partial<CyclePoint>[] = []
    marks[5] = { lh: 'peak' } // day 6, the estimate itself
    const r = detectOvulation(cycle([...LOWS, ...HIGHS], marks))
    expect(r.confidence).toBe('confirmed')
    expect(r.signs).toContain('LH test')
  })

  it('is `confirmed` on egg-white mucus in the run-up', () => {
    const marks: Partial<CyclePoint>[] = []
    marks[3] = { mucus: 'egg-white' } // day 4, three before the estimate
    expect(detectOvulation(cycle([...LOWS, ...HIGHS], marks)).confidence).toBe('confirmed')
  })

  it('ignores a sign that lands AFTER ovulation', () => {
    // A positive test after the fact is not evidence for the estimate.
    const marks: Partial<CyclePoint>[] = []
    marks[9] = { lh: 'peak' }
    expect(detectOvulation(cycle([...LOWS, ...HIGHS], marks)).confidence).toBe('likely')
  })

  it('NEVER reports an ovulation from signs alone, with no temperature shift', () => {
    // The whole rule in one test. A urine test predicts; only temperature confirms.
    const flat = [97.2, 97.2, 97.2, 97.2, 97.2, 97.2, 97.2, 97.2, 97.2]
    const marks: Partial<CyclePoint>[] = []
    marks[5] = { lh: 'peak', mucus: 'egg-white', flags: ['ovulation'] }
    const r = detectOvulation(cycle(flat, marks))
    expect(r.day).toBeNull()
    expect(r.confidence).toBe('estimated')
  })
})

describe('luteal length', () => {
  it('counts from ovulation to the day before the next period', () => {
    // Ovulation day 6 = 2026-09-06, next period 2026-09-20 → 14 days.
    const r = detectOvulation(cycle([...LOWS, ...HIGHS]), 'F', '2026-09-20')
    expect(r.lutealLength).toBe(14)
  })

  it('is null for a cycle still in progress, not a guess', () => {
    expect(detectOvulation(cycle([...LOWS, ...HIGHS])).lutealLength).toBeNull()
  })

  it('averages only the cycles that produced one', () => {
    expect(avgLutealLength([])).toBeNull()
    expect(avgLutealLength([13, 14, 15])).toBe(14)
  })
})

describe('predictions are ranges, and widen when the log says they should', () => {
  it('returns nothing rather than a guess with no history', () => {
    expect(predict([], null).date).toBeNull()
    expect(predict([], '2026-09-01').date).toBeNull()
  })

  it('centres on the average and never states a single day', () => {
    const p = predict([28, 28, 28], '2026-09-01')
    expect(p.date).toBe('2026-09-29')
    // Even a perfectly regular log gets +/- 1: "Tuesday, and it will be
    // Tuesday" is a promise a cycle log cannot make.
    expect(p.spread).toBe(1)
    expect(p.from).toBe('2026-09-28')
    expect(p.to).toBe('2026-09-30')
  })

  it('widens with real variation', () => {
    expect(predict([26, 30, 28], '2026-09-01').spread).toBeGreaterThan(1)
  })

  it('flags fewer than three cycles as an early estimate', () => {
    expect(predict([28, 29], '2026-09-01').early).toBe(true)
    expect(predict([28, 29, 30], '2026-09-01').early).toBe(false)
  })

  it('flags a cycle outside 21-35 as irregular and widens the range further', () => {
    const regular = predict([28, 29, 30], '2026-09-01')
    const irregular = predict([19, 29, 30], '2026-09-01')
    expect(irregular.irregular).toBe(true)
    expect(irregular.spread).toBeGreaterThan(regular.spread)
  })

  it('flags variation over 7 days even when every cycle is in range', () => {
    expect(predict([22, 30, 34], '2026-09-01').irregular).toBe(true)
  })

  it('predicts ovulation from the personal luteal length once two are confirmed', () => {
    const p = predict([28, 28, 28], '2026-09-01', [11, 11])
    // 2026-09-29 minus an 11-day luteal phase.
    expect(p.ovulation).toBe('2026-09-18')
  })

  it('falls back to 14 days with fewer than two confirmed', () => {
    expect(predict([28, 28, 28], '2026-09-01', [11]).ovulation).toBe('2026-09-15')
  })
})

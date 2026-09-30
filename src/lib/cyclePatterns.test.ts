/**
 * THE PATTERN ENGINE.
 *
 * The failures worth preventing here are all the same shape: a number that
 * looks like a finding and is an artefact. A row that fades late in the cycle
 * because long cycles are rarer; an average dragged to zero by days nobody
 * rated; a confident sentence generated from two coincidences.
 */
import { describe, expect, it } from 'vitest'
import { insights, moodByPhase, patternGrid, quartileBuckets, type AlignedCycle } from './cyclePatterns'
import { addDays } from './date'
import type { CyclePoint } from './types'

/** Three 28-day cycles starting 2026-01-01, with a builder per day. */
function build(perDay: (cycleIndex: number, day: number, date: string) => Partial<CyclePoint> | null) {
  const entries: CyclePoint[] = []
  const cycles: AlignedCycle[] = []
  for (let c = 0; c < 3; c++) {
    const start = addDays('2026-01-01', c * 28)
    cycles.push({ start, end: addDays(start, 28), ovulation: addDays(start, 13) })
    for (let d = 1; d <= 28; d++) {
      const date = addDays(start, d - 1)
      const extra = perDay(c, d, date)
      if (extra) entries.push({ date, flags: [], ...extra })
    }
  }
  return { entries, cycles }
}

describe('three cycles minimum, always', () => {
  it('returns nothing from two cycles rather than a thin grid', () => {
    const { entries, cycles } = build((_, d) => (d === 22 ? { symptoms: ['bloating'] } : null))
    const grid = patternGrid(entries, cycles.slice(0, 2))
    expect(grid.rows).toEqual([])
    expect(grid.cycles).toBe(2)
  })

  it('produces rows at three', () => {
    const { entries, cycles } = build((_, d) => (d === 22 ? { symptoms: ['bloating'] } : null))
    expect(patternGrid(entries, cycles).rows.length).toBeGreaterThan(0)
  })

  it('generates no insight below the threshold either', () => {
    const { entries, cycles } = build((_, d) => (d === 22 ? { symptoms: ['bloating'] } : null))
    expect(insights(patternGrid(entries, cycles.slice(0, 2)), 28)).toEqual([])
  })
})

describe('the denominator is days observed, not cycles logged', () => {
  /**
   * The artefact this prevents: if only two of three cycles reach day 33, a
   * symptom logged in both is ALWAYS, not 67%. Dividing by the cycle count
   * makes late-cycle rows fade purely because long cycles are rarer — which
   * looks exactly like a finding.
   */
  it('counts a signal against the cycles that actually have that day', () => {
    const entries: CyclePoint[] = []
    const cycles: AlignedCycle[] = []
    for (let c = 0; c < 3; c++) {
      const start = addDays('2026-01-01', c * 40)
      const len = c === 2 ? 33 : 28 // only the third cycle reaches day 30
      cycles.push({ start, end: addDays(start, len) })
      for (let d = 1; d <= len; d++) {
        entries.push({ date: addDays(start, d - 1), flags: [], ...(d === 30 ? { symptoms: ['headache'] } : {}) })
      }
    }
    const grid = patternGrid(entries, cycles)
    const row = grid.rows.find((r) => r.label === 'headache')!
    const day30 = row.cells.find((c) => c.offset === 30)!
    expect(day30.observed).toBe(1)
    expect(day30.count).toBe(1)
    // 1 of 1 observed, not 1 of 3 cycles.
    expect(day30.count / day30.observed).toBe(1)
  })
})

describe('absent is not zero', () => {
  it('averages only the days that carry a value', () => {
    // Mood 4 on one day in three; the other two are unrated, not zeros.
    const { entries, cycles } = build((c, d) => (d === 10 ? (c === 0 ? { mood: 4 } : {}) : null))
    const grid = patternGrid(entries, cycles)
    const mood = grid.rows.find((r) => r.key === 'mood')!
    const day10 = mood.cells.find((c) => c.offset === 10)!
    expect(day10.mean).toBe(4)
  })

  it('returns null for a day nobody rated, never 0', () => {
    const { entries, cycles } = build((_, d) => (d === 10 ? { symptoms: ['acne'] } : null))
    const grid = patternGrid(entries, cycles)
    const mood = grid.rows.find((r) => r.key === 'mood')
    // The mood row is dropped entirely when nothing scored — but if present,
    // no cell may claim a mean of 0.
    if (mood) for (const c of mood.cells) expect(c.mean === null || c.mean > 0).toBe(true)
  })

  it('drops rows that never fired rather than printing an empty line', () => {
    const { entries, cycles } = build((_, d) => (d === 22 ? { symptoms: ['bloating'] } : null))
    const grid = patternGrid(entries, cycles)
    expect(grid.rows.every((r) => r.cells.some((c) => c.count > 0))).toBe(true)
    expect(grid.rows.find((r) => r.label === 'acne')).toBeUndefined()
  })
})

describe('aligning by ovulation is a different question', () => {
  it('folds a symptom onto one column when cycle lengths differ', () => {
    // A symptom 3 days before the period, in cycles of 26, 28 and 34 days.
    // By period start it lands on days 24, 26 and 32 — smeared. By ovulation
    // (always 14 days before the period here) it stacks on +11.
    const entries: CyclePoint[] = []
    const cycles: AlignedCycle[] = []
    let cursor = '2026-01-01'
    for (const len of [26, 28, 34]) {
      cycles.push({ start: cursor, end: addDays(cursor, len), ovulation: addDays(cursor, len - 15) })
      for (let d = 1; d <= len; d++) {
        const date = addDays(cursor, d - 1)
        entries.push({ date, flags: [], ...(d === len - 3 ? { symptoms: ['bloating'] } : {}) })
      }
      cursor = addDays(cursor, len)
    }

    const byPeriod = patternGrid(entries, cycles, 'period')
    const byOvulation = patternGrid(entries, cycles, 'ovulation')
    const spread = (g: typeof byPeriod) => {
      const row = g.rows.find((r) => r.label === 'bloating')!
      return row.cells.filter((c) => c.count > 0).length
    }
    expect(spread(byPeriod)).toBe(3) // three different columns
    expect(spread(byOvulation)).toBe(1) // one column
  })

  it('refuses to align by ovulation when too few cycles detected one', () => {
    const { entries, cycles } = build((_, d) => (d === 22 ? { symptoms: ['bloating'] } : null))
    const noOv = cycles.map((c) => ({ ...c, ovulation: null }))
    expect(patternGrid(entries, noOv, 'ovulation').rows).toEqual([])
  })
})

describe('quartile buckets rank what happened, not the zeros', () => {
  it('puts every non-zero value above bucket 0', () => {
    const b = quartileBuckets([0, 0, 0, 0, 1, 2, 3, 4])
    expect(b(0)).toBe(0)
    expect(b(1)).toBeGreaterThan(0)
  })

  it('separates a rare value from a common one', () => {
    // Quartiles over EVERYTHING would put all the boundaries inside the zeros
    // and render 1 and 8 in the same top bucket.
    const b = quartileBuckets([0, 0, 0, 0, 0, 0, 1, 2, 4, 8])
    expect(b(1)).toBeLessThan(b(8))
  })

  it('degrades to all-zero when nothing ever happened', () => {
    const b = quartileBuckets([0, 0, 0])
    expect(b(0)).toBe(0)
  })
})

describe('insights are held to a high bar, because someone will repeat them', () => {
  it('names the day and the distance to the period', () => {
    const { entries, cycles } = build((_, d) => (d === 22 ? { cravings: ['sweet'] } : null))
    const out = insights(patternGrid(entries, cycles), 28)
    expect(out.length).toBeGreaterThan(0)
    expect(out[0].text).toMatch(/day 22/)
    expect(out[0].text).toMatch(/6 days before your period/)
  })

  it('says nothing about a signal that only happened once in three cycles', () => {
    const { entries, cycles } = build((c, d) => (d === 22 && c === 0 ? { cravings: ['sweet'] } : null))
    expect(insights(patternGrid(entries, cycles), 28)).toEqual([])
  })

  it('never returns more than three', () => {
    const { entries, cycles } = build((_, d) => (d === 22
      ? { symptoms: ['bloating', 'headache', 'acne', 'nausea'], cravings: ['sweet', 'salty'] }
      : null))
    expect(insights(patternGrid(entries, cycles), 28).length).toBeLessThanOrEqual(3)
  })

  it('phrases it relative to ovulation when aligned that way', () => {
    const { entries, cycles } = build((_, d) => (d === 22 ? { cravings: ['sweet'] } : null))
    const out = insights(patternGrid(entries, cycles, 'ovulation'), 28)
    expect(out[0]?.text).toMatch(/after you ovulate/)
  })
})

describe('mood by phase', () => {
  it('averages per phase and never invents a zero', () => {
    const entries: CyclePoint[] = [
      { date: '2026-01-01', flags: [], mood: 2 },
      { date: '2026-01-02', flags: [], mood: 4 },
      { date: '2026-01-20', flags: [] }, // luteal, unrated
    ]
    const rows = moodByPhase(entries, (d) => (d < '2026-01-10' ? 'menstrual' : 'luteal'))
    expect(rows.find((r) => r.phase === 'menstrual')!.mood).toBe(3)
    expect(rows.find((r) => r.phase === 'luteal')!.mood).toBeNull()
    expect(rows.find((r) => r.phase === 'luteal')!.days).toBe(1)
  })
})

describe('signal names that are acronyms are not sentence-cased into typos', () => {
  it('writes PMS, not Pms', () => {
    const entries: CyclePoint[] = []
    const cycles: AlignedCycle[] = []
    for (let c = 0; c < 3; c++) {
      const start = addDays('2026-01-01', c * 28)
      cycles.push({ start, end: addDays(start, 28) })
      for (let d = 1; d <= 28; d++) {
        entries.push({ date: addDays(start, d - 1), flags: d === 25 ? ['pms'] : [] })
      }
    }
    const out = insights(patternGrid(entries, cycles), 28)
    expect(out[0].text).toMatch(/^PMS /)
  })
})

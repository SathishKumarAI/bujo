/**
 * THE DEMO SEED HAS TO EXERCISE WHAT IT SEEDS.
 *
 * `data.cycle` was unseeded for the life of this page, so the whole
 * orientation block was absent from the DOM, the chart drew a bare grid, and
 * none of it could fail — the finding CLAUDE.md records as "a field the seed
 * skips is a field the gates are silently not checking". Adding nine optional
 * fields in Stage 3 re-opens exactly that hole, nine times over.
 *
 * So this asserts the seed produces, for every new field: some days WITH it,
 * some days WITHOUT it, and — where the field is supposed to follow the cycle —
 * a shape rather than uniform noise. A seed that fills every day cannot render
 * "not logged"; a seed that fills them at random renders an evenly grey pattern
 * grid, which demos the arithmetic rather than the feature.
 */
import { describe, expect, it } from 'vitest'
import { generateDemoData } from './demo'
import { periodStarts } from './cycleInsights'
import type { CyclePoint } from './types'

const DEMO_TODAY = '2026-09-29'
const log = generateDemoData(DEMO_TODAY).cycle

/** Cycle day for an entry, or null when it falls before the first period. */
function cycleDayOf(entry: CyclePoint, starts: string[]): number | null {
  const start = [...starts].reverse().find((s) => s <= entry.date)
  if (!start) return null
  return Math.round((Date.parse(entry.date) - Date.parse(start)) / 86_400_000) + 1
}
const starts = periodStarts(log)

describe('every optional field is both present and absent in the seed', () => {
  // `note` joined this list when it became writable. It had been in the type
  // since the page shipped, READ by `lib/captureLanding.ts` into journal
  // search, and written by nothing — so the seed could not reach it and the
  // search could never contain one.
  const fields = ['mucus', 'lh', 'mood', 'energy', 'flow', 'note'] as const
  for (const f of fields) {
    it(`${f} is logged on some days and not on others`, () => {
      const withIt = log.filter((e) => e[f] != null).length
      const without = log.filter((e) => e[f] == null).length
      expect(withIt, `no day carries ${f}`).toBeGreaterThan(0)
      expect(without, `every day carries ${f} — "not logged" is unrenderable`).toBeGreaterThan(0)
    })
  }

  const listFields = ['symptoms', 'cravings', 'moodTags'] as const
  for (const f of listFields) {
    it(`${f} appears on some days and is absent on others`, () => {
      expect(log.filter((e) => (e[f]?.length ?? 0) > 0).length, `no day carries ${f}`).toBeGreaterThan(0)
      expect(log.filter((e) => e[f] == null).length).toBeGreaterThan(0)
    })
  }

  it('never stores an empty array, which would mean "asked and answered with nothing"', () => {
    for (const e of log) {
      expect(e.symptoms?.length ?? 1).toBeGreaterThan(0)
      expect(e.cravings?.length ?? 1).toBeGreaterThan(0)
      expect(e.moodTags?.length ?? 1).toBeGreaterThan(0)
    }
  })

  it('marks a few readings disturbed, so the skip path and hollow marker render', () => {
    const disturbed = log.filter((e) => e.tempDisturbed).length
    expect(disturbed).toBeGreaterThan(0)
    // But not so many that the detection engine has nothing left to read.
    expect(disturbed).toBeLessThan(log.length * 0.1)
  })
})

describe('the seed has a cycle shape, not uniform noise', () => {
  it('only records flow on days that are flagged as bleeding', () => {
    for (const e of log) {
      if (e.flow) expect(e.flags, `flow on a non-period day ${e.date}`).toContain('period')
    }
  })

  it('puts egg-white and watery mucus in the second week, not while bleeding', () => {
    const fertile = log.filter((e) => e.mucus === 'egg-white' || e.mucus === 'watery')
    expect(fertile.length).toBeGreaterThan(0)
    for (const e of fertile) {
      const d = cycleDayOf(e, starts)
      if (d != null) expect(d, `fertile mucus on day ${d}`).toBeGreaterThan(5)
    }
  })

  it('never puts an LH peak during the period', () => {
    for (const e of log.filter((e) => e.lh === 'peak')) {
      const d = cycleDayOf(e, starts)
      if (d != null) expect(d).toBeGreaterThan(5)
    }
  })

  /**
   * The one that matters for Stage 5: if cravings were uniform, the pattern
   * grid would render an evenly grey row and the "your cravings start around
   * day 22" insight would be describing noise.
   */
  it('clusters cravings in the back half of the cycle', () => {
    const days = log.filter((e) => (e.cravings?.length ?? 0) > 0)
      .map((e) => cycleDayOf(e, starts)).filter((d): d is number => d != null)
    expect(days.length).toBeGreaterThan(3)
    const mean = days.reduce((s, d) => s + d, 0) / days.length
    expect(mean, 'cravings are not concentrated late in the cycle').toBeGreaterThan(15)
  })

  it('clusters bloating and breast tenderness premenstrually too', () => {
    const days = log.filter((e) => e.symptoms?.some((s) => s === 'bloating' || s === 'breast tenderness'))
      .map((e) => cycleDayOf(e, starts)).filter((d): d is number => d != null)
    expect(days.length).toBeGreaterThan(3)
    expect(days.reduce((s, d) => s + d, 0) / days.length).toBeGreaterThan(15)
  })
})

/**
 * The note is a sentence, not a tag, so "present on some days" is not enough —
 * a seed of empty strings would satisfy that and render nothing. Count the days
 * that actually hold words, and keep it sparse: a log with a paragraph every day
 * is not a log anyone kept, and the common case the UI must handle is no note.
 */
describe('the cycle day note is words, and sparse', () => {
  it('seeds several notes with real text and leaves most days without one', () => {
    const noted = log.filter((e) => (e.note ?? '').trim().length > 10)
    expect(noted.length, 'no seeded day carries a note with words in it').toBeGreaterThan(2)
    expect(noted.length / log.length, 'notes are on too many days to demo "no note"').toBeLessThan(0.3)
  })
})

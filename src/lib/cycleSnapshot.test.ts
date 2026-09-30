/**
 * CYCLE · the numbers the page puts in its header, pinned.
 *
 * Stage 1 of the Cycle expansion: lock today's behaviour before any of it
 * moves, so a later stage cannot quietly change what the page claims about
 * someone's body.
 *
 * **Pinned against a FIXED demo date, not `todayISO()`.** `generateDemoData`
 * takes `today` as a parameter and builds the whole journal relative to it, so
 * a snapshot taken against the real today passes on the day it is written and
 * fails every day after — a test that rots on a calendar is worse than none,
 * because the next person learns to re-bless it without reading it. Everything
 * here is `DEMO_TODAY`.
 *
 * These are **characterisation** tests, not correctness claims: they assert
 * what the code does now, so that a change to it has to be deliberate. Where a
 * value looks wrong it is called out in a comment rather than quietly "fixed"
 * here — see `estimated ovulation window` below.
 */
import { describe, expect, it } from 'vitest'
import { generateDemoData } from './demo'
import { CYCLE_PHASES } from './cycleGuide'
import {
  avgCycleLength, avgPeriodLength, coverline, cycleDay, cycleHistory,
  daysUntilNextPeriod, nextPeriodEstimate, periodStarts, phaseBands, phaseOf,
} from './cycleInsights'

/** Frozen so the fixture cannot drift with the wall clock. */
const DEMO_TODAY = '2026-09-29'
const demo = generateDemoData(DEMO_TODAY)
const log = demo.cycle

describe('the demo journal seeds a cycle log at all', () => {
  it('has entries, temperatures and period flags', () => {
    expect(log.length).toBeGreaterThan(0)
    expect(log.some((e) => e.temp != null)).toBe(true)
    expect(log.some((e) => e.flags.includes('period'))).toBe(true)
  })

  it('records more than one period start, or the derivations below are vacuous', () => {
    expect(periodStarts(log).length).toBeGreaterThanOrEqual(2)
  })
})

describe('header stat strip · pinned', () => {
  it('cycle day', () => {
    expect(cycleDay(log, DEMO_TODAY)).toBe(20)
  })

  it('average cycle length', () => {
    expect(avgCycleLength(log)).toBe(29)
  })

  it('next period estimate, and the countdown beside it', () => {
    expect(nextPeriodEstimate(log, DEMO_TODAY)).toBe('2026-10-09')
    expect(daysUntilNextPeriod(log, DEMO_TODAY)).toBe(10)
  })

  it('phase for the current day', () => {
    const phase = phaseOf(cycleDay(log, DEMO_TODAY)!, avgCycleLength(log))
    expect(phase.id).toBe('luteal')
    expect(phase.label).toBe('Luteal')
  })
})

describe('stat cards · pinned', () => {
  const history = cycleHistory(log, DEMO_TODAY)

  it('cycles logged', () => {
    expect(history.length).toBe(4)
    expect(history.filter((c) => !c.current).length).toBe(3)
  })

  it('average period length', () => {
    expect(avgPeriodLength(history)).toBe(5)
  })

  it('exactly one cycle is in progress', () => {
    expect(history.filter((c) => c.current)).toHaveLength(1)
  })
})

describe('phase bands · the legend day ranges, pinned', () => {
  const bands = phaseBands(avgCycleLength(log))

  it('covers every day of the average cycle with no gap and no overlap', () => {
    expect(bands[0].from).toBe(1)
    expect(bands[bands.length - 1].to).toBe(29)
    for (let i = 1; i < bands.length; i++) expect(bands[i].from).toBe(bands[i - 1].to + 1)
  })

  it('pins the four ranges the legend prints', () => {
    expect(bands.map((b) => [b.id, b.from, b.to])).toEqual([
      ['menstrual', 1, 5],
      ['follicular', 6, 13],
      ['ovulation', 14, 16],
      ['luteal', 17, 29],
    ])
  })

  /**
   * The window reads 14–16 and is NOT hard-coded: `phaseOf` places it at
   * `length - 14` ± 1, so it is 14–16 *because this fixture averages 29 days*.
   * A 28-day log gives 13–15. Recorded here because "the hard-coded 14–16
   * window" is a natural misreading of the rendered legend, and Stage 4 will
   * replace this calendar estimate with a temperature-confirmed one — at which
   * point this expectation changes deliberately, and only this one.
   */
  it('derives the window from the personal average rather than a constant', () => {
    expect(phaseBands(28).find((b) => b.id === 'ovulation')).toMatchObject({ from: 13, to: 15 })
    expect(phaseBands(35).find((b) => b.id === 'ovulation')).toMatchObject({ from: 20, to: 22 })
  })
})

describe('temperature shift · pinned', () => {
  /** The chart indexes by cycle day of the running cycle; this mirrors it. */
  const starts = periodStarts(log)
  const currentStart = [...starts].reverse().find((s) => s <= DEMO_TODAY)!
  const bbt = log
    .filter((e) => e.date >= currentStart && e.date <= DEMO_TODAY)
    .map((e) => ({
      day: Math.round((Date.parse(e.date) - Date.parse(currentStart)) / 86_400_000) + 1,
      temp: e.temp,
    }))

  it('finds a coverline for the current cycle', () => {
    expect(coverline(bbt)).toBe(97.41)
  })

  it('returns null rather than a number when there is nothing to read', () => {
    expect(coverline([])).toBeNull()
    expect(coverline([{ day: 1, temp: 97.5 }, { day: 2, temp: 97.6 }])).toBeNull()
  })
})

/**
 * THE PHASE HUE IS WRITTEN DOWN TWICE.
 *
 * `phaseOf` carries it for the ring, the legend and the day markers;
 * `CYCLE_PHASES` carries it for the Guide's phase cards. Nothing makes them
 * agree, so a change to one paints the same phase in two colours on one screen
 * — the exact shape of the palette divergence CLAUDE.md records (`text-red` and
 * `cat('red')` disagreeing for a whole release). This is the cheap guard.
 */
describe('the two places a phase colour is written agree', () => {
  it('matches hue for every phase', () => {
    for (const phase of CYCLE_PHASES) {
      // `phaseOf` is keyed by day, so find a day that resolves to this phase.
      const day = Array.from({ length: 28 }, (_, i) => i + 1).find((d) => phaseOf(d, 28).id === phase.id)
      expect(day, `no day of a 28-day cycle resolves to ${phase.id}`).toBeDefined()
      expect(phaseOf(day!, 28).color, `${phase.id} hue`).toBe(phase.color)
    }
  })

  it('and luteal is not the app accent', () => {
    expect(phaseOf(20, 28).color).not.toBe('mauve')
  })
})

/**
 * STAGE 4 · the declared change.
 *
 * The brief said the ovulation window would move from calendar to measured, and
 * that only those expectations should change. They did not, in fact, need to:
 * `phaseOf` keeps the `length - 14` calendar placement as its DEFAULT, and the
 * measured day is an optional third argument the view supplies once the chart
 * has found a shift. So every pinned value above is untouched, and the new
 * behaviour is pinned here instead — which is the better outcome, since the old
 * expectations still describe what a user with no temperature data sees.
 */
describe('a measured ovulation overrides the calendar placement', () => {
  it('leaves the calendar estimate alone when nothing was detected', () => {
    expect(phaseBands(28).find((b) => b.id === 'ovulation')).toMatchObject({ from: 13, to: 15 })
  })

  it('moves the window to the measured day when one is supplied', () => {
    // A user who ovulates on day 11 of a 28-day cycle has a 17-day luteal
    // phase; the textbook placement would have told her day 14 for months.
    expect(phaseBands(28, 11).find((b) => b.id === 'ovulation')).toMatchObject({ from: 10, to: 12 })
    expect(phaseOf(11, 28, 11).id).toBe('ovulation')
    expect(phaseOf(14, 28, 11).id).toBe('luteal')
  })

  it('still covers every day with no gap once the window has moved', () => {
    const bands = phaseBands(29, 11)
    expect(bands[0].from).toBe(1)
    expect(bands[bands.length - 1].to).toBe(29)
    for (let i = 1; i < bands.length; i++) expect(bands[i].from).toBe(bands[i - 1].to + 1)
  })
})

import { describe, expect, it } from 'vitest'
import { generateDemoData } from './demo'
import {
  MOOD_REASONS, lapseDays, lapseMoodGap, moodAroundLapse, moodBandRisk,
  moodReasonImpact, moodSwingByWeek,
} from './moodPatterns'

/**
 * THE SEED LANDED — asserted, not assumed.
 *
 * Every chart added by `feat/mood-patterns` is gated on having enough data, and
 * a gate that silently reverts to an empty journal prints the same reassuring
 * green as one that passed. `#283` proved this on the adjacent page: seeding
 * `addictions` turned the a11y gate red on a real 4.14:1 button that had never
 * been rendered. So the demo journal is checked here for each new card's
 * precondition, and the numbers are quoted so a future change that guts one is
 * a failing test rather than a card that quietly shows its empty state.
 *
 * `generateDemoData` takes `today`, so this is pinned to a fixed Sunday rather
 * than to the clock — otherwise the week buckets and the `sunday(n)` relapse
 * anchors move with the day the suite happens to run.
 */
const TODAY = '2026-03-15'
const demo = generateDemoData(TODAY)

describe('the demo journal can render every mood pattern', () => {
  it('rates mood across the whole 90-day history, not only the recent month', () => {
    const rated = demo.metrics.filter((m) => m.mood != null)
    expect(rated.length).toBeGreaterThanOrEqual(85)
    // The oldest rated day is near the start of the habit history, not 30d back.
    const oldest = rated.map((m) => m.date).sort()[0]
    expect(oldest <= '2025-12-25').toBe(true)
  })

  it('tags some days with a reason and leaves others untagged, which the card needs both of', () => {
    const tagged = demo.metrics.filter((m) => m.moodReasons?.length)
    const untagged = demo.metrics.filter((m) => m.mood != null && !m.moodReasons?.length)
    expect(tagged.length).toBeGreaterThanOrEqual(30)
    expect(untagged.length).toBeGreaterThanOrEqual(10)
    expect(demo.metrics.some((m) => m.moodReasonNote)).toBe(true)
  })

  it('uses most of the reason vocabulary, so an unused chip is a deliberate choice', () => {
    const seen = new Set(demo.metrics.flatMap((m) => m.moodReasons ?? []))
    expect(seen.size).toBeGreaterThanOrEqual(7)
    for (const r of seen) expect(MOOD_REASONS).toContain(r)
  })

  it('shows at least three reasons above the floor in the reason card', () => {
    const rows = moodReasonImpact(demo)
    expect(rows.length).toBeGreaterThanOrEqual(3)
    // Every row states its own n, and it clears the floor.
    for (const r of rows) expect(r.days).toBeGreaterThanOrEqual(3)
  })

  it('fills the swing chart rather than leaving eight of twelve weeks empty', () => {
    const weeks = moodSwingByWeek(demo, 12, TODAY)
    const withSwing = weeks.filter((w) => w.swing != null)
    expect(withSwing.length).toBeGreaterThanOrEqual(11)
  })

  it('has enough lapse days with mood around them to draw the lag profile', () => {
    expect(lapseDays(demo).size).toBeGreaterThanOrEqual(10)
    const lag = moodAroundLapse(demo, 3, 4, TODAY)
    expect(lag).not.toBeNull()
    expect(lag!.lapses).toBeGreaterThanOrEqual(10)
    // Every one of the seven offsets is drawn from real days, so no point on the
    // rendered curve is an empty state wearing a line.
    for (const p of lag!.points) {
      expect(p.avg).not.toBeNull()
      expect(p.days).toBeGreaterThanOrEqual(4)
    }
    expect(lag!.baseline).not.toBeNull()
  })

  it('has rated days and urges in every mood band, so no band renders as a dash', () => {
    const rows = moodBandRisk(demo)
    expect(rows).toHaveLength(3)
    for (const r of rows) {
      expect(r.days).toBeGreaterThan(0)
      expect(r.lapseRate).not.toBeNull()
    }
    // At least two bands carry a rated urge — the column the card exists for.
    expect(rows.filter((r) => r.intensity != null).length).toBeGreaterThanOrEqual(2)
  })

  it('has mood on lapse days AND off them, so the headline gap is a real comparison', () => {
    const gap = lapseMoodGap(demo)
    expect(gap.onLapse).not.toBeNull()
    expect(gap.otherwise).not.toBeNull()
    expect(gap.onLapseDays).toBeGreaterThanOrEqual(4)
  })
})

/**
 * THE SEEDED RELATIONSHIP IS ACTUALLY IN THE SEED — on any run date.
 *
 * The lag chart is the flagship of this whole change and for one build it drew a
 * **5.6 against 5.8** gap: nothing, in the card whose whole argument is that a
 * shape here is worth looking at. The cause is that the primary streak's
 * relapses are at fixed day offsets while the per-addiction ones are anchored to
 * Sundays, so the geometry re-shuffles with the weekday the demo is generated on
 * — a finding that depends on the calendar, which is the failure `sunday(n)` was
 * introduced to fix one card earlier.
 *
 * So this runs on **two run dates, a Sunday and a Saturday**, and asserts the
 * shape rather than the numbers: day 0 clearly below the journal's own average,
 * the day before part-way down, and the days after back at the level. The
 * asymmetry is the load-bearing half — a symmetric dip would make the card's two
 * readings ("the low ran into it" / "it left me low") indistinguishable, which is
 * the one thing it exists to separate.
 */
describe.each(['2026-03-15', '2026-09-26'])('the demo contains the pattern it claims to reveal · %s', (day) => {
  const d = generateDemoData(day)

  it('dips mood into the lapse day and recovers after it', () => {
    const lag = moodAroundLapse(d, 3, 4, day)
    expect(lag).not.toBeNull()
    const at = (o: number) => lag!.points.find((p) => p.offset === o)!.avg
    expect(at(0)).not.toBeNull()
    expect(at(-1)).not.toBeNull()
    expect(at(1)).not.toBeNull()
    expect(lag!.baseline).not.toBeNull()
    // The lapse day is the bottom, by a gap a reader can see rather than a rounding.
    expect(lag!.baseline! - at(0)!).toBeGreaterThan(1.2)
    // Sagging in, not out. This is the asymmetry the card is read for.
    expect(at(-1)!).toBeLessThan(at(1)!)
    expect(at(0)!).toBeLessThan(at(-1)!)
    // And +1 is back at the journal's own level rather than still in a hole.
    expect(Math.abs(at(1)! - lag!.baseline!)).toBeLessThan(1)
  })

  it('makes the low mood band the riskiest band, monotonically, on both measures', () => {
    const [low, mid, bright] = moodBandRisk(d)
    expect(low.lapseRate).not.toBeNull()
    expect(mid.lapseRate).not.toBeNull()
    expect(bright.lapseRate).not.toBeNull()
    expect(low.lapseRate!).toBeGreaterThan(mid.lapseRate!)
    expect(mid.lapseRate!).toBeGreaterThan(bright.lapseRate!)
    expect(low.intensity).not.toBeNull()
    expect(bright.intensity).not.toBeNull()
    expect(low.intensity!).toBeGreaterThan(bright.intensity!)
  })

  it('has reasons pointing both ways, so the diverging bars have two sides', () => {
    const rows = moodReasonImpact(d)
    expect(rows.some((r) => r.delta < -1)).toBe(true)
    expect(rows.some((r) => r.delta > 1)).toBe(true)
  })
})

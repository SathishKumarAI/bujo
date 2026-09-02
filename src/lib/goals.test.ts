import { describe, it, expect } from 'vitest'
import { goalFraction, goalMet, goalPace } from './goals'

/**
 * COD-48 · the Goals headline counted `value >= target` and called it "on
 * track", which is a different question from the pace pill beside it, and is
 * backwards for a cap. Each case here is one of the sentences that was wrong
 * on the rendered page.
 */
describe('goalMet', () => {
  it('a reach goal is met when it reaches the number', () => {
    expect(goalMet(5, 5)).toBe(true)
    expect(goalMet(6, 5)).toBe(true)
    expect(goalMet(4, 5)).toBe(false)
  })

  it('a cap is met while you are UNDER it — the inversion the headline missed', () => {
    // "Caffeine 2 of 5" was counted as a miss, so a good week scored as failure.
    expect(goalMet(2, 5, true)).toBe(true)
    expect(goalMet(5, 5, true)).toBe(true) // exactly at the cap is still within it
    expect(goalMet(6, 5, true)).toBe(false)
  })

  it('is not the same predicate as being on pace', () => {
    // Mid-week at 1 of 7 is behind on nothing yet, but it is not *met*. The old
    // headline printed this as "not on track" for five goals at once.
    expect(goalMet(1, 7)).toBe(false)
  })
})

describe('goalFraction', () => {
  it('clamps to 0..1 and survives a zero target', () => {
    expect(goalFraction(3, 6)).toBe(0.5)
    expect(goalFraction(9, 6)).toBe(1)
    expect(goalFraction(-2, 6)).toBe(0)
    expect(goalFraction(3, 0)).toBe(0) // no divide-by-zero, no Infinity bar
  })
})

describe('goalPace', () => {
  it('returns null when there is no deadline', () => {
    expect(goalPace(10, 100, '2026-06-01', undefined, '2026-06-10')).toBeNull()
  })

  it('computes per-day-needed over the remaining days (today inclusive)', () => {
    // 60 left, due in 5 days (today + 5). days left 5 → spread over 6 (incl today).
    const p = goalPace(40, 100, '2026-06-01', '2026-06-15', '2026-06-10')!
    expect(p.remaining).toBe(60)
    expect(p.daysLeft).toBe(5)
    expect(p.perDayNeeded).toBe(10) // 60 / 6
    expect(p.pastDue).toBe(false)
  })

  it('on track when the observed pace meets the required pace', () => {
    // span 10 days, target 100 → need 10/day. By day 5 (elapsed 5) value 60 →
    // observed 12/day ≥ 10/day required → ahead.
    const p = goalPace(60, 100, '2026-06-01', '2026-06-11', '2026-06-06')!
    expect(p.onTrack).toBe(true)
  })

  it('behind when the observed pace lags the required pace', () => {
    // same span, but only 20 done by day 5 → observed 4/day < 10/day → behind.
    const p = goalPace(20, 100, '2026-06-01', '2026-06-11', '2026-06-06')!
    expect(p.onTrack).toBe(false)
  })

  it('a completed goal is always on track with 0/day needed', () => {
    const p = goalPace(100, 100, '2026-06-01', '2026-06-05', '2026-06-10')! // past due but done
    expect(p.remaining).toBe(0)
    expect(p.perDayNeeded).toBe(0)
    expect(p.onTrack).toBe(true)
  })

  it('past due + incomplete → never on track, whole remainder needed', () => {
    const p = goalPace(40, 100, '2026-06-01', '2026-06-05', '2026-06-10')!
    expect(p.pastDue).toBe(true)
    expect(p.onTrack).toBe(false)
    expect(p.remaining).toBe(60)
    expect(p.perDayNeeded).toBe(60) // daysLeft -5 → max(1, -4)=1 → all of it
  })

  it('due today spreads the remainder over a single day', () => {
    const p = goalPace(70, 100, '2026-06-01', '2026-06-10', '2026-06-10')!
    expect(p.daysLeft).toBe(0)
    expect(p.perDayNeeded).toBe(30) // 30 / max(1, 0+1)
    expect(p.pastDue).toBe(false)
  })
})

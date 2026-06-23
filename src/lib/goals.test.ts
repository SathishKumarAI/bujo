import { describe, it, expect } from 'vitest'
import { goalPace } from './goals'

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

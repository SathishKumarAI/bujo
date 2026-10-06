import { describe, expect, it } from 'vitest'
import { coachingWeekOf, coachingWeekRange, rowsInCoachingWeek, weekPlay } from './coachingWeek'

const START = '2026-03-02' // a Monday

/** Minimal session shape — only what the helpers read. */
const s = (date: string, won = 2, lost = 1, durationMin?: number) => ({ date, gamesWon: won, gamesLost: lost, durationMin })

describe('coachingWeekRange', () => {
  it('week_1_starts_on_the_start_day_and_ends_six_days_later_not_seven', () => {
    // The off-by-one that would put every seventh session in two weeks at once.
    expect(coachingWeekRange(START, 1)).toEqual({ from: '2026-03-02', to: '2026-03-08' })
  })

  it('weeks_do_not_overlap_and_leave_no_gap', () => {
    for (let w = 1; w < 12; w++) {
      const a = coachingWeekRange(START, w)
      const b = coachingWeekRange(START, w + 1)
      expect(a.to < b.from).toBe(true)
      // Consecutive: the next week begins the day after this one ends.
      expect(coachingWeekOf(START, b.from)).toBe(w + 1)
      expect(coachingWeekOf(START, a.to)).toBe(w)
    }
  })

  it('week_12_ends_on_day_83', () => {
    expect(coachingWeekRange(START, 12)).toEqual({ from: '2026-05-18', to: '2026-05-24' })
  })
})

describe('coachingWeekOf', () => {
  it('the_start_day_is_week_1_not_week_0', () => {
    expect(coachingWeekOf(START, START)).toBe(1)
  })

  it('a_day_before_the_start_is_null_not_week_1', () => {
    // Null, not 1 and not 0: a session logged before the program began is not
    // evidence about week 1, and the page must be able to say so.
    expect(coachingWeekOf(START, '2026-03-01')).toBeNull()
  })

  it('day_7_rolls_into_week_2', () => {
    expect(coachingWeekOf(START, '2026-03-08')).toBe(1)
    expect(coachingWeekOf(START, '2026-03-09')).toBe(2)
  })
})

describe('rowsInCoachingWeek', () => {
  const rows = [s('2026-03-09'), s('2026-03-01'), s('2026-03-08'), s('2026-03-02')]

  it('keeps_only_the_weeks_own_days_and_sorts_them_oldest_first', () => {
    expect(rowsInCoachingWeek(rows, START, 1).map((r) => r.date)).toEqual(['2026-03-02', '2026-03-08'])
  })

  it('excludes_a_session_logged_before_the_program_started', () => {
    const all = Array.from({ length: 12 }, (_, i) => rowsInCoachingWeek(rows, START, i + 1)).flat()
    expect(all.map((r) => r.date)).not.toContain('2026-03-01')
  })

  it('a_week_with_nothing_logged_is_empty_not_undefined', () => {
    expect(rowsInCoachingWeek(rows, START, 5)).toEqual([])
  })
})

describe('weekPlay', () => {
  it('sums_games_wins_and_minutes_treating_a_missing_duration_as_zero', () => {
    const p = weekPlay([s('2026-03-02', 3, 1, 60), s('2026-03-04', 2, 2)])
    expect(p).toEqual({ sessions: 2, games: 8, won: 5, minutes: 60 })
  })

  it('an_empty_week_is_all_zeros_which_the_caller_must_not_render_as_a_score', () => {
    expect(weekPlay([])).toEqual({ sessions: 0, games: 0, won: 0, minutes: 0 })
  })
})

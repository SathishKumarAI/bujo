import { describe, it, expect } from 'vitest'
import { emptyJournal } from './storage'
import type { Challenge, JournalData } from './types'
import {
  CHALLENGE_PRESETS, isDayComplete, elapsedDay, completedDays,
  streakBeforeToday, progressDay, percentComplete, isFinished, longestStreak,
} from './challenges'

function withChallenge(c: Challenge, log: Record<string, number[]>): JournalData {
  const d = emptyJournal()
  d.challenges = [c]
  d.challengeLog = { [c.id]: log }
  return d
}

const C: Challenge = {
  id: 'c1', name: 'Test', durationDays: 5, startDate: '2026-06-01', strict: false,
  rules: ['a', 'b'],
}

describe('challenge presets', () => {
  it('ships 75 Hard as strict with 6 rules', () => {
    const hard = CHALLENGE_PRESETS.find((p) => p.name === '75 Hard')!
    expect(hard.strict).toBe(true)
    expect(hard.durationDays).toBe(75)
    expect(hard.rules.length).toBe(6)
  })
})

describe('day completion', () => {
  it('is complete only when all rules are checked', () => {
    const d = withChallenge(C, { '2026-06-01': [0] })
    expect(isDayComplete(d, C, '2026-06-01')).toBe(false)
    const d2 = withChallenge(C, { '2026-06-01': [0, 1] })
    expect(isDayComplete(d2, C, '2026-06-01')).toBe(true)
  })
})

describe('elapsedDay', () => {
  it('is 1-based from start and clamps to duration', () => {
    expect(elapsedDay(C, '2026-05-31')).toBe(0) // before start
    expect(elapsedDay(C, '2026-06-01')).toBe(1)
    expect(elapsedDay(C, '2026-06-03')).toBe(3)
    expect(elapsedDay(C, '2026-06-30')).toBe(5) // clamped to durationDays
  })
})

describe('lenient progress', () => {
  it('counts completed days and integer percent', () => {
    const log = { '2026-06-01': [0, 1], '2026-06-02': [0, 1], '2026-06-03': [0] }
    const d = withChallenge(C, log)
    expect(completedDays(d, C, '2026-06-03')).toBe(2)
    expect(percentComplete(d, C, '2026-06-03')).toBe(40) // 2/5 -> 40, whole number
    expect(progressDay(d, C, '2026-06-03')).toBe(3) // calendar day
  })
})

describe('strict progress (75-Hard reset rule)', () => {
  const S: Challenge = { ...C, id: 's1', strict: true }
  it('resets the day count when a day is missed', () => {
    // day1 + day2 complete, day3 missed → on day3 you are back to "day 1"
    const log = { '2026-06-01': [0, 1], '2026-06-02': [0, 1] }
    const d = withChallenge(S, log)
    expect(streakBeforeToday(d, S, '2026-06-03')).toBe(2)
    expect(progressDay(d, S, '2026-06-03')).toBe(3) // streak 2 + the day in progress
    // a gap: nothing logged on 06-03, so on 06-04 the streak is broken to 0
    expect(streakBeforeToday(d, S, '2026-06-04')).toBe(0)
    expect(progressDay(d, S, '2026-06-04')).toBe(1) // reset to day 1
  })
  it('tracks the longest streak across gaps', () => {
    // 01,02 done, 03 missed, 04,05 done → longest run = 2
    const log = { '2026-06-01': [0, 1], '2026-06-02': [0, 1], '2026-06-04': [0, 1], '2026-06-05': [0, 1] }
    const d = withChallenge(C, log)
    expect(longestStreak(d, C, '2026-06-05')).toBe(2)
  })
  it('marks finished when the strict streak reaches the duration', () => {
    const full: Record<string, number[]> = {}
    for (let i = 0; i < 5; i++) full[`2026-06-0${i + 1}`] = [0, 1]
    const d = withChallenge(S, full)
    expect(isFinished(d, S, '2026-06-05')).toBe(true)
  })

  it('BUJO-209: ring % agrees with the "X of N days done" text after a miss', () => {
    // 3 complete days (01-03), a miss on 06-04. Viewed on 06-05 the streak is
    // broken (0), but the card text shows completedDays (3). The ring must reflect
    // that same count, not the broken streak — they must not contradict.
    const log = { '2026-06-01': [0, 1], '2026-06-02': [0, 1], '2026-06-03': [0, 1] }
    const d = withChallenge(S, log)
    const done = completedDays(d, S, '2026-06-05')
    expect(done).toBe(3) // the count the card text renders
    expect(percentComplete(d, S, '2026-06-05')).toBe(Math.round((done / 5) * 100)) // 60
    expect(percentComplete(d, S, '2026-06-05')).toBe(60)
    // streak nuance is still surfaced separately and is allowed to differ
    expect(streakBeforeToday(d, S, '2026-06-05')).toBe(0)
  })
})

describe('BUJO-209: zero-rule custom challenge', () => {
  const Z: Challenge = { ...C, id: 'z1', rules: [] }
  it('does not get stuck at 0% — each elapsed day counts as complete', () => {
    const d = withChallenge(Z, {})
    expect(isDayComplete(d, Z, '2026-06-01')).toBe(true)
    expect(completedDays(d, Z, '2026-06-03')).toBe(3)
    expect(percentComplete(d, Z, '2026-06-03')).toBe(60) // 3/5
    expect(percentComplete(d, Z, '2026-06-30')).toBe(100) // clamped duration
    expect(isFinished(d, Z, '2026-06-30')).toBe(true)
  })
})

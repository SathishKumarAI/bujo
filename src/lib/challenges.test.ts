import { describe, it, expect } from 'vitest'
import { emptyJournal } from './storage'
import type { Challenge, JournalData } from './types'
import {
  CHALLENGE_PRESETS, isDayComplete, elapsedDay, completedDays, missedDays,
  streakBeforeToday, percentComplete, isFinished, longestStreak, ruleCompletion, nextStep,
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
  })
})

/**
 * COD-35. The page printed `Day 4 of 75`, `5 of 75 days done`, `70 to go`,
 * `7%`, `70 Days left` and `9/75 Elapsed` from one screen, and none of them
 * could be added to any other. The three review numbers now partition the
 * elapsed window, and this is the assertion that keeps them a partition.
 */
describe('the review numbers add up', () => {
  const cases: [string, Record<string, number[]>, string][] = [
    ['nothing logged', {}, '2026-06-03'],
    ['today open, earlier days mixed', { '2026-06-01': [0, 1], '2026-06-02': [0] }, '2026-06-03'],
    ['today already done', { '2026-06-01': [0, 1], '2026-06-03': [0, 1] }, '2026-06-03'],
    ['past the end', { '2026-06-01': [0, 1] }, '2026-06-30'],
  ]
  for (const [label, log, today] of cases) {
    it(`done + missed + today-in-progress === elapsed · ${label}`, () => {
      const d = withChallenge(C, log)
      const elapsed = elapsedDay(C, today)
      const open = elapsed > 0 && !isDayComplete(d, C, today) ? 1 : 0
      expect(completedDays(d, C, today) + missedDays(d, C, today) + open).toBe(elapsed)
    })
  }

  it('does not count today as missed while it is still open', () => {
    const d = withChallenge(C, { '2026-06-01': [0, 1], '2026-06-02': [0, 1] })
    expect(missedDays(d, C, '2026-06-03')).toBe(0) // day 3 is in progress, not lost
    expect(missedDays(d, C, '2026-06-04')).toBe(1) // day 3 ended incomplete
  })

  it('is zero before the challenge starts', () => {
    expect(missedDays(withChallenge(C, {}), C, '2026-05-31')).toBe(0)
  })
})

describe('strict progress (75-Hard reset rule)', () => {
  const S: Challenge = { ...C, id: 's1', strict: true }
  it('resets the day count when a day is missed', () => {
    // day1 + day2 complete, day3 missed → on day3 you are back to "day 1"
    const log = { '2026-06-01': [0, 1], '2026-06-02': [0, 1] }
    const d = withChallenge(S, log)
    expect(streakBeforeToday(d, S, '2026-06-03')).toBe(2)
    // a gap: nothing logged on 06-03, so on 06-04 the streak is broken to 0
    expect(streakBeforeToday(d, S, '2026-06-04')).toBe(0)
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

describe('ruleCompletion names the rule that is costing the days', () => {
  // Day 1 both, day 2 only rule a, day 3 only rule a. Today is day 3, still open.
  const data = withChallenge(C, {
    '2026-06-01': [0, 1],
    '2026-06-02': [0],
    '2026-06-03': [0],
  })

  it('counts each rule over the elapsed window, not the whole duration', () => {
    const rows = ruleCompletion(data, C, '2026-06-03')
    expect(rows).toHaveLength(2)
    // Three days elapsed of a five-day challenge: the denominator is 3.
    expect(rows[0]).toEqual({ index: 0, rule: 'a', done: 3, of: 3 })
    expect(rows[1]).toEqual({ index: 1, rule: 'b', done: 1, of: 3 })
  })

  it('shares its origin with completedDays and missedDays', () => {
    const rows = ruleCompletion(data, C, '2026-06-03')
    // The weakest rule bounds the complete days — a day is complete only when
    // every rule is ticked, so no rule can be done fewer times than the days
    // that were complete.
    const weakest = Math.min(...rows.map((r) => r.done))
    expect(weakest).toBe(completedDays(data, C, '2026-06-03'))
    expect(rows[0].of).toBe(elapsedDay(C, '2026-06-03'))
  })

  it('keeps rule order rather than sorting by worst', () => {
    // A list that reorders itself as you tick is one you cannot build a habit
    // against, so the order is the order they are drawn and ticked in.
    expect(ruleCompletion(data, C, '2026-06-03').map((r) => r.rule)).toEqual(C.rules)
  })

  it('is all zeroes before the challenge starts, never a divide by nothing', () => {
    const rows = ruleCompletion(data, C, '2026-05-30')
    expect(rows.map((r) => [r.done, r.of])).toEqual([[0, 0], [0, 0]])
  })
})

describe('nextStep says what to do, in order of urgency', () => {
  /** Five days from 2026-06-01, two rules: `a` and `b`. */
  const full = (days: string[]) => Object.fromEntries(days.map((d) => [d, [0, 1]]))

  it('says nothing to tick before day 1', () => {
    const step = nextStep(withChallenge(C, {}), C, '2026-05-30')
    expect(step.id).toBe('not-started')
    expect(step.text).toContain('2 days away')
  })

  it('asks for the archive once every day is behind you', () => {
    const data = withChallenge(C, full(['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05']))
    const step = nextStep(data, C, '2026-06-06')
    expect(step.id).toBe('finished')
  })

  it('reports a strict reset as what happened, not as a verdict', () => {
    const strict: Challenge = { ...C, strict: true }
    // Day 1 complete, day 2 missed: on day 3 the streak before today is 0.
    const data = withChallenge(strict, { '2026-06-01': [0, 1] })
    const step = nextStep(data, strict, '2026-06-03')
    expect(step.id).toBe('reset')
    expect(step.text).not.toMatch(/failed|blew|ruined|lost it/i)
    // It outranks `left`, so it owes the reader what `left` would have said.
    expect(step.text).toContain('2 of 2 rules to tick today')
  })

  it('names the rules left today rather than counting them again', () => {
    const data = withChallenge(C, { '2026-06-03': [0] })
    const step = nextStep(data, C, '2026-06-03')
    expect(step.id).toBe('left')
    // The count alone is the facts row subtracted — `Today · 1 of 2 rules`
    // sits eight pixels below it. Which rule is the half the facts cannot
    // carry.
    expect(step.text).toBe('Left today: b.')
  })

  it('falls back to a count once naming them would be a paragraph', () => {
    const five: Challenge = { ...C, rules: ['a', 'b', 'c', 'd', 'e'] }
    const step = nextStep(withChallenge(five, { '2026-06-03': [0, 1] }), five, '2026-06-03')
    expect(step.id).toBe('left')
    expect(step.text).toBe('3 of 5 rules left today.')
  })

  /**
   * The floor that stops a single miss being promoted to a finding. Under four
   * elapsed days "the worst rule" is decided by a margin of one over a sample
   * of three, which is the overstatement CLAUDE.md keeps a list of.
   */
  it('will not name a slipping rule before there is a window to judge it on', () => {
    // Day 1: both. Day 2: only `a`. Day 3 (today): both — so today is done and
    // `b` trails by one, on three elapsed days.
    const data = withChallenge(C, { '2026-06-01': [0, 1], '2026-06-02': [0], '2026-06-03': [0, 1] })
    expect(nextStep(data, C, '2026-06-03').id).toBe('done')
  })

  it('names the slipping rule once the gap is more than one day', () => {
    const data = withChallenge(C, {
      '2026-06-01': [0, 1], '2026-06-02': [0], '2026-06-03': [0], '2026-06-04': [0, 1],
    })
    const step = nextStep(data, C, '2026-06-04')
    expect(step.id).toBe('weak')
    expect(step.text).toContain('b is the one slipping')
    expect(step.text).toContain('2 of 4 days')
    expect(step.toRules).toBe(true)
  })

  it('always returns a sentence, so zone 1 never renders a hole', () => {
    // A real sentence, asserted as one: not empty, not a fragment, ends in a
    // full stop. A character floor would only be measuring this fixture's
    // one-letter rule names.
    for (const today of ['2026-05-20', '2026-06-01', '2026-06-03', '2026-06-09']) {
      const { text } = nextStep(withChallenge(C, {}), C, today)
      expect(text, today).toMatch(/^[A-Z0-9].*\.$/)
    }
  })
})

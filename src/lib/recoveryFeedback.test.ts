/**
 * THE FEEDBACK LEDGER.
 *
 * The failures here would all hurt someone who is using this page to decide
 * whether they are getting better: a quiet week scored as a perfect one, a
 * ten-cigarette day counted as one slip, an urge attributed to the wrong thing.
 */
import { describe, expect, it } from 'vitest'
import { contrastOutcomes, feedbackLedger, nextSteps, verdictOf, VERDICT_COPY } from './recoveryFeedback'
import { emptyJournal } from './storage'
import { addDays } from './date'
import type { AddictionStreak, JournalData, UrgeWin } from './types'

const TODAY = '2026-09-30'
const d = (back: number) => addDays(TODAY, -back)

function journal(addictions: AddictionStreak[], urgeLog: UrgeWin[] = []): JournalData {
  const j = emptyJournal()
  return { ...j, nofap: { ...j.nofap, addictions, urgeLog } }
}

function addiction(id: string, name: string, relapses: { date: string; count?: number }[] = []): AddictionStreak {
  return {
    id,
    name,
    startedOn: d(60),
    best: 0,
    relapses: relapses.map((r, i) => ({ id: `${id}-r${i}`, date: r.date, trigger: '', note: '', count: r.count })),
  }
}

function urge(addictionId: string, back: number, extra: Partial<UrgeWin> = {}): UrgeWin {
  return { id: `u-${addictionId}-${back}-${Math.random()}`, date: d(back), addictionId, ...extra }
}

describe('both sides are counted, and attributed to the right thing', () => {
  it('splits resisted and slipped per addiction', () => {
    const j = journal(
      [addiction('porn', 'Porn', [{ date: d(3) }]), addiction('nic', 'Nicotine', [{ date: d(2) }, { date: d(5) }])],
      [urge('porn', 1), urge('porn', 2), urge('porn', 4), urge('nic', 6)],
    )
    const l = feedbackLedger(j, 30, TODAY)
    const porn = l.rows.find((r) => r.addictionId === 'porn')!
    const nic = l.rows.find((r) => r.addictionId === 'nic')!
    expect(porn.resisted).toBe(3)
    expect(porn.lapses).toBe(1)
    expect(porn.net).toBe(2)
    expect(nic.resisted).toBe(1)
    expect(nic.lapses).toBe(2)
    expect(nic.net).toBe(-1)
  })

  it('does not let one addiction’s urges land on another', () => {
    const j = journal([addiction('porn', 'Porn'), addiction('nic', 'Nicotine')], [urge('porn', 1), urge('porn', 2)])
    const l = feedbackLedger(j, 30, TODAY)
    expect(l.rows.find((r) => r.addictionId === 'nic')!.resisted).toBe(0)
  })

  it('counts a ten-cigarette day as ten occurrences, not one slip', () => {
    // The `count` field exists precisely so a bad day is not flattened to a tick.
    const j = journal([addiction('nic', 'Nicotine', [{ date: d(1), count: 10 }])])
    expect(feedbackLedger(j, 30, TODAY).rows[0].lapses).toBe(10)
  })

  it('names urges it cannot attribute rather than dropping them', () => {
    // Every urge logged before `addictionId` existed has none.
    const j = journal([addiction('porn', 'Porn')], [{ id: 'old', date: d(2) }, urge('porn', 1)])
    const l = feedbackLedger(j, 30, TODAY)
    expect(l.unattributed).toBe(1)
    expect(l.rows[0].resisted).toBe(1)
  })
})

describe('a quiet week is not a perfect week', () => {
  it('returns null, not 0 or 1, when nothing was logged', () => {
    const j = journal([addiction('porn', 'Porn')])
    const row = feedbackLedger(j, 30, TODAY).rows[0]
    expect(row.ratio).toBeNull()
    expect(verdictOf(row)).toBe('quiet')
  })

  it('says so in words rather than showing a score', () => {
    expect(VERDICT_COPY.quiet.line).toMatch(/not the same as a good month/)
  })

  it('scores 100% only when something was actually resisted', () => {
    const j = journal([addiction('porn', 'Porn')], [urge('porn', 1), urge('porn', 2)])
    const row = feedbackLedger(j, 30, TODAY).rows[0]
    expect(row.ratio).toBe(1)
    expect(verdictOf(row)).toBe('strong')
  })
})

describe('the window is a window', () => {
  it('ignores events older than it', () => {
    const j = journal([addiction('porn', 'Porn', [{ date: d(40) }])], [urge('porn', 45)])
    const l = feedbackLedger(j, 30, TODAY)
    expect(l.rows[0].resisted).toBe(0)
    expect(l.rows[0].lapses).toBe(0)
  })

  it('compares against the window before it', () => {
    const j = journal(
      [addiction('porn', 'Porn', [{ date: d(40) }, { date: d(41) }])],
      [urge('porn', 1), urge('porn', 2), urge('porn', 45)],
    )
    const row = feedbackLedger(j, 30, TODAY).rows[0]
    expect(row.ratio).toBe(1) // this window: 2 resisted, 0 lapses
    expect(row.prevRatio).toBeCloseTo(1 / 3) // previous: 1 resisted, 2 lapses
  })

  it('counts clean days from the most recent slip', () => {
    const j = journal([addiction('nic', 'Nicotine', [{ date: d(9) }, { date: d(20) }])])
    expect(feedbackLedger(j, 30, TODAY).rows[0].cleanDays).toBe(9)
  })

  it('reports null clean days when there has never been a slip', () => {
    expect(feedbackLedger(journal([addiction('nic', 'Nicotine')]), 30, TODAY).rows[0].cleanDays).toBeNull()
  })
})

describe('verdicts are generous at the bottom, because people are still logging', () => {
  const row = (resisted: number, lapses: number) =>
    feedbackLedger(
      journal(
        [addiction('x', 'X', Array.from({ length: lapses }, () => ({ date: d(2) })))],
        Array.from({ length: resisted }, (_, i) => urge('x', i + 1)),
      ),
      30,
      TODAY,
    ).rows[0]

  it('calls a majority of resisted pulls holding, not failing', () => {
    expect(verdictOf(row(3, 2))).toBe('holding')
  })

  it('only says a hard stretch when most logged pulls were followed', () => {
    expect(verdictOf(row(1, 4))).toBe('slipping')
  })

  it('words a hard stretch as information rather than a verdict', () => {
    expect(VERDICT_COPY.slipping.line).toMatch(/information, not a verdict/)
  })
})

describe('next steps name the evidence they came from', () => {
  it('suggests planning company when the lonely kind is being ALONE', () => {
    const j = journal(
      [addiction('porn', 'Porn')],
      [
        urge('porn', 1, { halt: ['lonely'], lonelyKind: 'alone' }),
        urge('porn', 2, { halt: ['lonely'], lonelyKind: 'alone' }),
        urge('porn', 3, { halt: ['tired'] }),
      ],
    )
    const steps = nextSteps(feedbackLedger(j, 30, TODAY).rows[0])
    expect(steps[0].title).toMatch(/company/i)
  })

  /**
   * The whole reason the kind is asked. "Arrange company" is good advice for
   * being alone and actively wrong for being unseen in a room full of people —
   * an app that gives the same suggestion to both is useless to one of them.
   */
  it('does NOT suggest company when the loneliness was being unseen in a crowd', () => {
    const j = journal(
      [addiction('porn', 'Porn')],
      [
        urge('porn', 1, { halt: ['lonely'], lonelyKind: 'unseen' }),
        urge('porn', 2, { halt: ['lonely'], lonelyKind: 'unseen' }),
      ],
    )
    const steps = nextSteps(feedbackLedger(j, 30, TODAY).rows[0])
    expect(steps[0].title).not.toMatch(/arrange company/i)
    expect(steps[0].title).toMatch(/one honest conversation/i)
  })

  it('tells bored from lonely, which need opposite responses', () => {
    const j = journal(
      [addiction('porn', 'Porn')],
      [urge('porn', 1, { halt: ['lonely'], lonelyKind: 'bored' }), urge('porn', 2, { halt: ['lonely'], lonelyKind: 'bored' })],
    )
    expect(nextSteps(feedbackLedger(j, 30, TODAY).rows[0])[0].title).toMatch(/absorbing/i)
  })

  it('asks which kind when loneliness leads but no kind was recorded', () => {
    const j = journal(
      [addiction('porn', 'Porn')],
      [urge('porn', 1, { halt: ['lonely'] }), urge('porn', 2, { halt: ['lonely'] })],
    )
    expect(nextSteps(feedbackLedger(j, 30, TODAY).rows[0])[0].title).toMatch(/what kind of lonely/i)
  })

  it('leads with the technique that actually worked', () => {
    const j = journal(
      [addiction('porn', 'Porn')],
      [urge('porn', 1, { technique: 'delay' }), urge('porn', 2, { technique: 'delay' }), urge('porn', 3, { technique: 'surf' })],
    )
    const steps = nextSteps(feedbackLedger(j, 30, TODAY).rows[0])
    expect(steps.some((s) => /delaying it/.test(s.title))).toBe(true)
  })

  it('asks for the wins when only slips are being logged', () => {
    const j = journal([addiction('nic', 'Nicotine', [{ date: d(1) }, { date: d(3) }])])
    const steps = nextSteps(feedbackLedger(j, 30, TODAY).rows[0])
    expect(steps.some((s) => /Log the urges you resist/.test(s.title))).toBe(true)
  })

  it('never returns more than three', () => {
    const j = journal(
      [addiction('porn', 'Porn', [{ date: d(1) }])],
      [urge('porn', 1, { halt: ['lonely', 'tired', 'hungry', 'angry'], technique: 'surf' })],
    )
    expect(nextSteps(feedbackLedger(j, 30, TODAY).rows[0]).length).toBeLessThanOrEqual(3)
  })
})

describe('logging a slip must never improve the score', () => {
  const withOutcome = (n: number, outcome?: 'followed') =>
    Array.from({ length: n }, (_, i) => urge('x', i + 1, outcome ? { outcome } : {}))

  it('counts only resisted rows as wins', () => {
    const j = journal([addiction('x', 'X')], [...withOutcome(2), ...withOutcome(3, 'followed')])
    const row = feedbackLedger(j, 30, TODAY).rows[0]
    // Three "gave in" rows carry context but are not victories.
    expect(row.resisted).toBe(2)
  })

  it('does not let a followed row raise the ratio', () => {
    const base = feedbackLedger(
      journal([addiction('x', 'X', [{ date: d(2) }])], withOutcome(2)), 30, TODAY,
    ).rows[0]
    const after = feedbackLedger(
      journal([addiction('x', 'X', [{ date: d(2) }])], [...withOutcome(2), ...withOutcome(4, 'followed')]),
      30, TODAY,
    ).rows[0]
    expect(after.ratio).toBeLessThanOrEqual(base.ratio!)
  })

  it('treats a row with no outcome as resisted, so old journals still read right', () => {
    const j = journal([addiction('x', 'X')], [{ id: 'old', date: d(1), addictionId: 'x' }])
    expect(feedbackLedger(j, 30, TODAY).rows[0].resisted).toBe(1)
  })
})

describe('what was different about the times you gave in', () => {
  const urges = (spec: { outcome?: 'followed'; halt?: ('lonely' | 'tired')[]; intensity?: 1 | 2 | 3 | 4 | 5; technique?: 'delay' }[]) =>
    spec.map((x, i) => urge('x', i + 1, x))

  it('says nothing until both sides have enough rows', () => {
    const few = urges([
      { outcome: 'followed', halt: ['lonely'] }, { outcome: 'followed', halt: ['lonely'] },
      { halt: [] }, { halt: [] }, { halt: [] },
    ])
    expect(contrastOutcomes(few)).toEqual([])
  })

  it('names loneliness when it separates the two outcomes', () => {
    const rows = urges([
      { outcome: 'followed', halt: ['lonely'] }, { outcome: 'followed', halt: ['lonely'] },
      { outcome: 'followed', halt: ['lonely'] },
      { halt: [] }, { halt: [] }, { halt: [] },
    ])
    const out = contrastOutcomes(rows)
    expect(out[0].factor).toBe('lonely')
    expect(out[0].text).toMatch(/100% of the times you gave in/)
    expect(out[0].text).toMatch(/0% of the times you held/)
  })

  it('ignores a factor that is equally common on both sides', () => {
    const rows = urges([
      { outcome: 'followed', halt: ['tired'] }, { outcome: 'followed', halt: ['tired'] },
      { outcome: 'followed', halt: ['tired'] },
      { halt: ['tired'] }, { halt: ['tired'] }, { halt: ['tired'] },
    ])
    expect(contrastOutcomes(rows).find((c) => c.factor === 'tired')).toBeUndefined()
  })

  it('reports a technique that shows up on the wins and not the losses', () => {
    const rows = urges([
      { outcome: 'followed' }, { outcome: 'followed' }, { outcome: 'followed' },
      { technique: 'delay' }, { technique: 'delay' }, { technique: 'delay' },
    ])
    expect(contrastOutcomes(rows).some((c) => /delaying it/.test(c.text))).toBe(true)
  })

  it('only reports an intensity gap of a full point or more', () => {
    const close = urges([
      { outcome: 'followed', intensity: 3 }, { outcome: 'followed', intensity: 3 }, { outcome: 'followed', intensity: 3 },
      { intensity: 3 }, { intensity: 3 }, { intensity: 3 },
    ])
    expect(contrastOutcomes(close).find((c) => c.factor === 'intensity')).toBeUndefined()

    const wide = urges([
      { outcome: 'followed', intensity: 5 }, { outcome: 'followed', intensity: 5 }, { outcome: 'followed', intensity: 5 },
      { intensity: 2 }, { intensity: 2 }, { intensity: 2 },
    ])
    expect(contrastOutcomes(wide).find((c) => c.factor === 'intensity')).toBeDefined()
  })

  it('returns at most three, strongest first', () => {
    const rows = urges([
      { outcome: 'followed', halt: ['lonely', 'tired'], intensity: 5 },
      { outcome: 'followed', halt: ['lonely', 'tired'], intensity: 5 },
      { outcome: 'followed', halt: ['lonely', 'tired'], intensity: 5 },
      { halt: [], intensity: 1, technique: 'delay' },
      { halt: [], intensity: 1, technique: 'delay' },
      { halt: [], intensity: 1, technique: 'delay' },
    ])
    const out = contrastOutcomes(rows)
    expect(out.length).toBeLessThanOrEqual(3)
    expect(Math.abs(out[0].gap)).toBeGreaterThanOrEqual(Math.abs(out[out.length - 1].gap))
  })
})

describe('a ratio compares like with like', () => {
  /**
   * The bug this catches, which shipped for about ten minutes: once amounts
   * carried units, the ratio divided resisted EVENTS by slipped MINUTES and
   * rendered "2% of the pulls you logged, you did not follow" for a month with
   * five wins and two bad evenings.
   */
  it('divides events by events, not events by minutes', () => {
    const j = journal(
      [{ ...addiction('scroll', 'Doomscrolling', [{ date: d(3), count: 95 }, { date: d(9), count: 140 }]), unit: 'minutes' }],
      [urge('scroll', 1), urge('scroll', 2), urge('scroll', 4), urge('scroll', 5), urge('scroll', 6)],
    )
    const row = feedbackLedger(j, 30, TODAY).rows[0]
    expect(row.lapses).toBe(235)      // the amount, for saying what it cost
    expect(row.lapseDays).toBe(2)     // the events, for the ratio
    // 5 wins against 2 slips is a good month, not a 2% catastrophe.
    expect(row.ratio).toBeCloseTo(5 / 7)
    expect(verdictOf(row)).toBe('holding')
  })

  it('still reports the amount in the addiction’s own unit', () => {
    const j = journal(
      [{ ...addiction('nic', 'Nicotine', [{ date: d(2), count: 14 }]), unit: 'cigarettes' }],
      [urge('nic', 1)],
    )
    const row = feedbackLedger(j, 30, TODAY).rows[0]
    expect(row.lapsesLabel).toBe('14 cigarettes')
    expect(row.lapseDays).toBe(1)
    expect(row.minutesLost).toBeNull()
  })

  it('totals time lost only for a duration unit', () => {
    const j = journal([{ ...addiction('scroll', 'Doomscrolling', [{ date: d(2), count: 90 }]), unit: 'minutes' }])
    expect(feedbackLedger(j, 30, TODAY).rows[0].minutesLost).toBe(90)
  })
})

import { describe, expect, it } from 'vitest'
import { QUIET_DAYS, recoveryStep } from './recoveryStep'
import { GROUPS } from './recoveryCards'
import type { JournalData } from './types'

/**
 * The one sentence at the top of Recovery.
 *
 * Two properties carry the file. It is **total** — zone 1 renders it with no
 * conditional, so a journal shape that returns nothing would leave a hole
 * where the page's headline goes. And every sentence **names a group that
 * exists**, because the sentence is a button into the rail and a button that
 * cannot reach the state it names is a button that lies — the failure mode
 * this repo has shipped three times as a hand-written id list.
 */
const TODAY = '2026-10-16'

const journal = (nofap: Record<string, unknown>): JournalData => ({
  entries: [], habits: [], workouts: [], metrics: [], collections: [],
  settings: {},
  nofap: { startedOn: '2026-01-01', relapses: [], urgeLog: [], ...nofap },
} as unknown as JournalData)

/** N urges, one a day ending `end`. */
const urges = (n: number, end = TODAY) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(`${end}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - i)
    return { id: `u${i}`, date: d.toISOString().slice(0, 10), at: `${d.toISOString().slice(0, 10)}T09:00:00Z` }
  })

describe('recoveryStep', () => {
  it('always returns a sentence and a real group', () => {
    const shapes = [
      journal({}),
      journal({ relapses: [{ id: 'r', date: TODAY }] }),
      journal({ startedOn: '2026-10-01', relapses: [], urgeLog: urges(9) }),
      journal({ startedOn: '2020-01-01', urgeLog: urges(1, '2026-01-01') }),
    ]
    for (const j of shapes) {
      const step = recoveryStep(j, TODAY)
      expect(step.text.length, step.id).toBeGreaterThan(20)
      expect(GROUPS).toContain(step.group)
    }
  })

  it('opens on an invitation when nothing has been logged', () => {
    const step = recoveryStep(journal({ startedOn: TODAY }), TODAY)
    expect(step.id).toBe('first')
    expect(step.text).toMatch(/log/i)
  })

  it('a reset today outranks everything else, including a record run', () => {
    // The order is by what you can DO about it. A reset today is a decision in
    // front of you; a record is a week away.
    const step = recoveryStep(journal({
      startedOn: '2020-01-01',
      relapses: [{ id: 'r', date: TODAY }],
      urgeLog: urges(20),
    }), TODAY)
    expect(step.id).toBe('reset')
    expect(step.group).toBe('feedback')
  })

  it('does not call a reset a failure, and keeps the lifetime total', () => {
    const step = recoveryStep(journal({ relapses: [{ id: 'r', date: TODAY }] }), TODAY)
    expect(step.text).not.toMatch(/fail|broke|lost/i)
    expect(step.text).toMatch(/clean days/)
  })

  it('names the gap to the record when it is within reach', () => {
    // 10 days clean against a best of 14 → `near`, 4 days to beat.
    const step = recoveryStep(journal({
      startedOn: '2026-10-06',
      relapses: [
        { id: 'a', date: '2026-10-05' },
        // A 14-day run before that sets the best.
        { id: 'b', date: '2026-09-21' },
      ],
    }), TODAY)
    expect(['close', 'edge', 'record']).toContain(step.id)
    expect(step.group).toBe('progress')
  })

  it('says a long quiet stretch out loud, because nothing else can', () => {
    // The one figure that gets better the LESS you use the page.
    const step = recoveryStep(journal({
      startedOn: '2026-09-01',
      urgeLog: urges(3, '2026-10-01'),
    }), TODAY)
    expect(step.id).toBe('quiet')
    expect(step.text).toMatch(new RegExp(`${15}|\\d+ days without`))
    expect(step.group).toBe('patterns')
  })

  it('does not call a two-day gap a quiet stretch', () => {
    const step = recoveryStep(journal({
      startedOn: '2026-09-01',
      urgeLog: urges(6, '2026-10-14'),
    }), TODAY)
    expect(step.id).not.toBe('quiet')
    expect(QUIET_DAYS).toBe(7)
  })

  it('points at the hours once there are urges worth a pattern', () => {
    const step = recoveryStep(journal({
      startedOn: '2026-09-01',
      urgeLog: urges(9),
    }), TODAY)
    expect(step.id).toBe('resisting')
    expect(step.group).toBe('patterns')
  })

  it('never counts urges as a score to protect', () => {
    // The page deliberately stopped headlining "urges resisted"; a counter you
    // can inflate by tapping a button is not recovery.
    for (const j of [journal({ urgeLog: urges(9), startedOn: '2026-09-01' }), journal({ urgeLog: urges(40), startedOn: '2026-01-01' })]) {
      expect(recoveryStep(j, TODAY).text).not.toMatch(/resisted/i)
    }
  })
})

/**
 * The two branches that were wrong before a test fixture happened to hit them.
 */
describe('recoveryStep · the no-history case', () => {
  const clean = journal({ startedOn: '2026-09-01', urgeLog: [], relapses: [] })

  it('never claims a record for someone who has never reset', () => {
    // `streakStats` derives `best` as max(stored, current, longestGap), so with
    // no relapses current IS best every day — `recordApproach` says `record`
    // forever, and "past your old record" would be this page's permanent and
    // false headline for the people it is least useful to.
    const step = recoveryStep(clean, TODAY)
    expect(step.id).not.toBe('record')
    expect(step.text).not.toMatch(/past your old record/i)
  })

  it('says what is true instead: this is the record so far', () => {
    expect(recoveryStep(clean, TODAY).text).toMatch(/no resets logged/i)
  })

  it('never prints a number it does not have', () => {
    // The fixture that found this printed "best null": `nofap.best` was
    // absent, `Math.max(undefined, …)` is NaN, and NaN stringifies to null in
    // JSON and renders as "NaN" on the page. Guarded in `streak.ts` now; this
    // asserts the sentence rather than the helper.
    for (const j of [clean, journal({ relapses: [{ id: 'r', date: '2026-10-01' }], startedOn: '2026-10-02' })]) {
      const t = recoveryStep(j, TODAY).text
      expect(t).not.toMatch(/NaN|null|undefined/)
    }
  })
})

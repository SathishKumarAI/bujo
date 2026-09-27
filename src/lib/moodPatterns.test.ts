import { describe, expect, it } from 'vitest'
import type { DailyMetric, JournalData, MoodReason, Relapse } from './types'
import { seedJournal } from './storage'
import {
  MOOD_REASONS, MOOD_REASON_LABEL, lapseDays, lapseMoodGap,
  moodAroundLapse, moodBandRisk, moodReasonImpact, moodSwingByWeek,
} from './moodPatterns'

/**
 * Named for the failure each one catches, because that is the only thing a test
 * name is for. Several of these exist specifically to fail on the bug pattern
 * `CLAUDE.md` records twice: **`count ? sum / count : 0`**, which makes "no data"
 * and "you scored zero" the same pixel.
 *
 * And note the trap that hides such a test: `expect(null).toBeGreaterThanOrEqual(0)`
 * **coerces null to 0 and passes**. So every assertion about an empty sample here
 * asserts `toBeNull()` first and never a numeric bound.
 */

const TODAY = '2026-03-15' // a Sunday, so week buckets line up predictably

function j(metrics: Partial<DailyMetric>[], relapses: string[] = [], urges: { date: string; intensity?: 1 | 2 | 3 | 4 | 5 }[] = []): JournalData {
  const data = seedJournal()
  data.metrics = metrics.map((m) => ({ date: '2026-01-01', ...m }) as DailyMetric)
  data.nofap = {
    ...data.nofap,
    relapses: relapses.map((date, i): Relapse => ({ id: `r${i}`, date, trigger: '', note: '' })),
    urgeLog: urges.map((u, i) => ({ id: `u${i}`, ...u })),
  }
  return data
}

/** `n` consecutive days ending on TODAY, every one rated `mood`. */
function run(n: number, mood: number, from = '2026-02-01'): Partial<DailyMetric>[] {
  const out: Partial<DailyMetric>[] = []
  const d = new Date(from + 'T00:00:00')
  for (let i = 0; i < n; i++) {
    out.push({ date: d.toISOString().slice(0, 10), mood })
    d.setDate(d.getDate() + 1)
  }
  return out
}

describe('the reason vocabulary', () => {
  it('lists every reason the label map defines, so a new union member cannot ship unlabelled', () => {
    // `Record<MoodReason, string>` is exhaustive by the compiler; MOOD_REASONS is
    // a plain array and is not. This is the only thing keeping them in step.
    expect([...MOOD_REASONS].sort()).toEqual(Object.keys(MOOD_REASON_LABEL).sort())
  })

  it('opens on a downward reason, so a bad day is not asked to scroll past “Exercised”', () => {
    expect(MOOD_REASONS[0]).toBe('slept-badly')
    expect(MOOD_REASONS[MOOD_REASONS.length - 1]).toBe('good-news')
  })
})

describe('moodReasonImpact', () => {
  it('returns nothing rather than a one-day average when a reason is under the floor', () => {
    const data = j([
      { date: '2026-02-01', mood: 2, moodReasons: ['argument'] },
      ...run(6, 7, '2026-02-02'),
    ])
    expect(moodReasonImpact(data)).toEqual([])
  })

  it('needs untagged days too, so a journal where every day carries one reason yields nothing', () => {
    const data = j(run(8, 5, '2026-02-01').map((m) => ({ ...m, moodReasons: ['lonely' as MoodReason] })))
    expect(moodReasonImpact(data)).toEqual([])
  })

  it('reports the gap and the n, and never counts an untagged day into a reason', () => {
    const data = j([
      { date: '2026-02-01', mood: 3, moodReasons: ['slept-badly'] },
      { date: '2026-02-02', mood: 3, moodReasons: ['slept-badly'] },
      { date: '2026-02-03', mood: 3, moodReasons: ['slept-badly'] },
      { date: '2026-02-04', mood: 8 },
      { date: '2026-02-05', mood: 8 },
      { date: '2026-02-06', mood: 8 },
    ])
    const rows = moodReasonImpact(data)
    expect(rows).toHaveLength(1)
    expect(rows[0].reason).toBe('slept-badly')
    expect(rows[0].days).toBe(3) // the three tagged days, not all six
    expect(rows[0].withReason).toBe(3)
    expect(rows[0].without).toBe(8)
    expect(rows[0].delta).toBe(-5)
  })

  it('sorts the heaviest drag first, so the row that matters is not below the fold', () => {
    const tag = (mood: number, r: MoodReason, day: number) =>
      ({ date: `2026-02-${String(day).padStart(2, '0')}`, mood, moodReasons: [r] })
    const data = j([
      tag(1, 'argument', 1), tag(1, 'argument', 2), tag(1, 'argument', 3),
      tag(5, 'money', 4), tag(5, 'money', 5), tag(5, 'money', 6),
      ...run(4, 7, '2026-02-07'),
    ])
    const rows = moodReasonImpact(data)
    expect(rows.map((r) => r.reason)).toEqual(['argument', 'money'])
    expect(rows[0].delta).toBeLessThan(rows[1].delta)
  })
})

describe('moodSwingByWeek', () => {
  it('reports a one-day week as no swing at all, not as a perfectly steady one', () => {
    // A population SD over a single observation is 0. Returned as 0 it would
    // draw the calmest week of the quarter out of one logged day.
    const weeks = moodSwingByWeek(j([{ date: '2026-03-11', mood: 6 }]), 2, TODAY)
    const withData = weeks.find((w) => w.days === 1)!
    expect(withData.swing).toBeNull()
    expect(withData.avg).toBeNull()
    expect(withData.low).toBe(6) // still says what it saw
  })

  it('separates a swinging week from a steady one at the same mean', () => {
    // The whole point of the card: identical averages, different weeks.
    // Two buckets, and the data sits in the FIRST — TODAY is itself a Sunday, so
    // the last bucket is the week that has only just started.
    const steady = moodSwingByWeek(j([
      { date: '2026-03-09', mood: 6 }, { date: '2026-03-10', mood: 6 },
      { date: '2026-03-11', mood: 6 }, { date: '2026-03-12', mood: 6 },
    ]), 2, TODAY)[0]
    const swinging = moodSwingByWeek(j([
      { date: '2026-03-09', mood: 2 }, { date: '2026-03-10', mood: 10 },
      { date: '2026-03-11', mood: 2 }, { date: '2026-03-12', mood: 10 },
    ]), 2, TODAY)[0]
    expect(steady.avg).toBe(swinging.avg)
    expect(steady.swing).toBe(0)
    expect(swinging.swing).toBeGreaterThan(3)
    expect(swinging.low).toBe(2)
    expect(swinging.high).toBe(10)
  })

  it('keeps an empty week as a gap rather than closing it', () => {
    const weeks = moodSwingByWeek(j([]), 4, TODAY)
    expect(weeks).toHaveLength(4)
    for (const w of weeks) {
      expect(w.avg).toBeNull()
      expect(w.swing).toBeNull()
      expect(w.days).toBe(0)
    }
  })

  it('buckets by calendar week so a run of days lands in the weeks it belongs to', () => {
    const weeks = moodSwingByWeek(j(run(14, 5, '2026-03-01')), 3, TODAY)
    // 2026-03-01 is a Sunday; 14 days covers two whole weeks and nothing of the third.
    expect(weeks.map((w) => w.days)).toEqual([7, 7, 0])
  })
})

describe('moodAroundLapse', () => {
  it('draws nothing below four lapse days, so a curve is never three anecdotes', () => {
    const data = j(run(30, 6, '2026-02-14'), ['2026-02-20', '2026-02-25', '2026-03-02'])
    expect(moodAroundLapse(data)).toBeNull()
  })

  it('separates “the low ran into it” from “it left me low”', () => {
    // Mood 7 everywhere, except day −1 before each of four lapses, which is 2.
    const lapseOn = ['2026-02-10', '2026-02-20', '2026-03-01', '2026-03-10']
    const metrics = run(45, 7, '2026-02-01').map((m) => {
      const dipDay = lapseOn.some((l) => {
        const d = new Date(l + 'T00:00:00')
        d.setDate(d.getDate() - 1)
        return d.toISOString().slice(0, 10) === m.date
      })
      return dipDay ? { ...m, mood: 2 } : m
    })
    const lag = moodAroundLapse(j(metrics, lapseOn), 3, 4, TODAY)!
    expect(lag).not.toBeNull()
    expect(lag.lapses).toBe(4)
    const at = (o: number) => lag.points.find((p) => p.offset === o)!
    expect(at(-1).avg).not.toBeNull()
    expect(at(-1).avg!).toBeLessThan(at(1).avg!) // before is lower than after
    expect(at(-1).days).toBe(4) // and it says so
  })

  it('carries a null-not-zero point when an offset has no rated day', () => {
    // Four lapses, but nothing rated on the lapse day itself.
    const lapseOn = ['2026-02-10', '2026-02-20', '2026-03-01', '2026-03-10']
    const metrics = run(45, 6, '2026-02-01').filter((m) => !lapseOn.includes(m.date!))
    const lag = moodAroundLapse(j(metrics, lapseOn), 3, 4, TODAY)!
    const zero = lag.points.find((p) => p.offset === 0)!
    expect(zero.avg).toBeNull()
    expect(zero.days).toBe(0)
  })

  it('always returns the full window so the shape cannot be read off a partial axis', () => {
    const lapseOn = ['2026-02-10', '2026-02-20', '2026-03-01', '2026-03-10']
    const lag = moodAroundLapse(j(run(45, 6, '2026-02-01'), lapseOn), 3, 4, TODAY)!
    expect(lag.points.map((p) => p.offset)).toEqual([-3, -2, -1, 0, 1, 2, 3])
  })

  it('flags overlapping windows rather than quietly double-counting a shared day', () => {
    const near = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04']
    const lag = moodAroundLapse(j(run(45, 6, '2026-02-01'), near), 3, 4, TODAY)!
    expect(lag.windowsOverlap).toBe(true)
    const far = ['2026-01-05', '2026-01-20', '2026-02-05', '2026-02-20']
    const farLag = moodAroundLapse(j(run(90, 6, '2025-12-20'), far), 3, 4, TODAY)!
    expect(farLag.windowsOverlap).toBe(false)
  })

  it('never reads a day after today as a mood of nothing', () => {
    const lapseOn = ['2026-03-13', '2026-03-14', '2026-03-15', '2026-03-12']
    const lag = moodAroundLapse(j(run(40, 6, '2026-02-10'), lapseOn), 3, 4, TODAY)!
    // Every future offset is absent, not averaged in.
    expect(lag.points.find((p) => p.offset === 3)!.days).toBeLessThan(4)
  })
})

describe('lapseDays', () => {
  it('counts one day once when two addictions lapse on the same evening', () => {
    const data = j([], ['2026-03-10'])
    data.nofap!.addictions = [
      { id: 'a1', name: 'Nicotine', startedOn: TODAY, best: 1, relapses: [{ id: 'x', date: '2026-03-10', trigger: '', note: '' }] },
      { id: 'a2', name: 'Sugar', startedOn: TODAY, best: 1, relapses: [{ id: 'y', date: '2026-03-11', trigger: '', note: '' }] },
    ]
    expect([...lapseDays(data)].sort()).toEqual(['2026-03-10', '2026-03-11'])
  })

  it('ignores the quantity, because ten cigarettes is not ten lapse days', () => {
    const data = j([])
    data.nofap!.relapses = [{ id: 'r', date: '2026-03-10', trigger: '', note: '', count: 10 }]
    expect(lapseDays(data).size).toBe(1)
  })
})

describe('moodBandRisk', () => {
  it('returns nothing under five rated days rather than three buckets of one', () => {
    expect(moodBandRisk(j(run(4, 5, '2026-03-01')))).toEqual([])
  })

  it('reports an unrated band as null, never as a clean zero', () => {
    // Nothing bright was ever logged. "You never lapse when bright" and "you
    // have not rated a bright day" must not print the same number.
    const rows = moodBandRisk(j(run(8, 2, '2026-03-01'), ['2026-03-02']))
    const bright = rows.find((r) => r.band === 'bright')!
    expect(bright.days).toBe(0)
    expect(bright.lapseRate).toBeNull()
    expect(bright.intensity).toBeNull()
  })

  it('splits the lapse share and the urge intensity by the band the day fell in', () => {
    const metrics = [
      { date: '2026-03-01', mood: 2 }, { date: '2026-03-02', mood: 2 },
      { date: '2026-03-03', mood: 5 }, { date: '2026-03-04', mood: 5 },
      { date: '2026-03-05', mood: 9 }, { date: '2026-03-06', mood: 9 },
    ]
    const rows = moodBandRisk(j(metrics, ['2026-03-01'], [
      { date: '2026-03-01', intensity: 5 }, { date: '2026-03-02', intensity: 3 },
      { date: '2026-03-05', intensity: 1 },
    ]))
    const low = rows.find((r) => r.band === 'low')!
    const bright = rows.find((r) => r.band === 'bright')!
    expect(low.days).toBe(2)
    expect(low.lapseDays).toBe(1)
    expect(low.lapseRate).toBe(0.5)
    expect(low.intensity).toBe(4) // (5 + 3) / 2
    expect(bright.lapseRate).toBe(0)  // rated days, no lapse — a real zero
    expect(bright.intensity).toBe(1)
  })

  it('keeps the bands in low → bright order, because the order is the meaning', () => {
    const rows = moodBandRisk(j(run(8, 5, '2026-03-01')))
    expect(rows.map((r) => r.band)).toEqual(['low', 'middling', 'bright'])
  })
})

describe('lapseMoodGap', () => {
  it('returns null for a side with no rated day instead of averaging to zero', () => {
    const gap = lapseMoodGap(j(run(6, 7, '2026-03-01')))
    expect(gap.onLapse).toBeNull()
    expect(gap.onLapseDays).toBe(0)
    expect(gap.otherwise).toBe(7)
  })

  it('states the two averages and both counts, which is the only claim the data supports', () => {
    const gap = lapseMoodGap(j([
      { date: '2026-03-01', mood: 3 }, { date: '2026-03-02', mood: 5 },
      { date: '2026-03-03', mood: 8 }, { date: '2026-03-04', mood: 8 },
    ], ['2026-03-01', '2026-03-02']))
    expect(gap.onLapse).toBe(4)
    expect(gap.onLapseDays).toBe(2)
    expect(gap.otherwise).toBe(8)
    expect(gap.otherwiseDays).toBe(2)
  })
})

import { describe, it, expect } from 'vitest'
import { emptyJournal } from './storage'
import type { DevSession } from './types'
import {
  weeklyCodingMinutes, focusStreak, avgWeighted, dailyCodingMinutes, topTags, projectedWeeklyMinutes,
  minutesByWeekday, longestSession, minutesByProject, interruptionsTrend, deepWorkHeatmap, focusByWeekday,
  weeklyVolume, focusByDuration, qualityByTag, interruptionCost, focusFindings, cumulativeHours, focusInsight,
} from './focus'

function withSessions(ss: DevSession[]) {
  const d = emptyJournal()
  d.devSessions = ss
  return d
}
const S = (p: Partial<DevSession>): DevSession => ({ id: 'x', date: '2026-06-11', durationMin: 60, focus: 7, stress: 3, ...p })

describe('focus helpers', () => {
  it('sums weekly coding minutes in the window', () => {
    const d = withSessions([S({ date: '2026-06-11', durationMin: 90 }), S({ date: '2026-06-09', durationMin: 30 }), S({ date: '2026-06-01', durationMin: 99 })])
    expect(weeklyCodingMinutes(d, '2026-06-11')).toBe(120)
  })
  it('counts the active-day streak', () => {
    const d = withSessions([S({ date: '2026-06-11' }), S({ date: '2026-06-10' })])
    expect(focusStreak(d, '2026-06-11')).toBe(2)
  })
  it('computes duration-weighted averages as whole numbers', () => {
    const d = withSessions([S({ durationMin: 60, focus: 8 }), S({ durationMin: 60, focus: 6 })])
    expect(avgWeighted(d, 'focus')).toBe(7)
  })
  it('builds a daily series and tag totals', () => {
    const d = withSessions([S({ date: '2026-06-11', durationMin: 45, tags: ['typescript'] })])
    const series = dailyCodingMinutes(d, '2026-06-11', 3)
    expect(series.length).toBe(3)
    expect(series[2]).toEqual({ date: '2026-06-11', min: 45 })
    expect(topTags(d)).toEqual([{ tag: 'typescript', min: 45 }])
  })
  it('projects weekly minutes from the observed pace', () => {
    // 200m over a 4-day span (oldest = 3 days ago) → 200/4*7 = 350
    const d = withSessions([
      S({ date: '2026-06-11', durationMin: 50 }),
      S({ date: '2026-06-08', durationMin: 150 }),
    ])
    expect(projectedWeeklyMinutes(d, '2026-06-11')).toBe(350)
  })
  it('returns null projection once the week is fully observed', () => {
    // oldest is 6 days ago → observed = 7 = window, nothing left to project
    const d = withSessions([S({ date: '2026-06-05', durationMin: 60 }), S({ date: '2026-06-11', durationMin: 60 })])
    expect(projectedWeeklyMinutes(d, '2026-06-11')).toBeNull()
  })
  it('returns null projection when nothing logged this week', () => {
    expect(projectedWeeklyMinutes(withSessions([]), '2026-06-11')).toBeNull()
  })
  it('buckets minutes by weekday (Sun..Sat)', () => {
    // 2026-06-11 is a Thursday (idx 4), 2026-06-08 is a Monday (idx 1)
    const d = withSessions([
      S({ date: '2026-06-11', durationMin: 60 }),
      S({ date: '2026-06-11', durationMin: 30 }),
      S({ date: '2026-06-08', durationMin: 45 }),
    ])
    const by = minutesByWeekday(d)
    expect(by.length).toBe(7)
    expect(by[4]).toEqual({ day: 4, label: 'Thu', min: 90 })
    expect(by[1]).toEqual({ day: 1, label: 'Mon', min: 45 })
    expect(by[0].min).toBe(0)
  })
  it('finds the longest session', () => {
    const d = withSessions([S({ id: 'a', durationMin: 30 }), S({ id: 'b', durationMin: 120 }), S({ id: 'c', durationMin: 90 })])
    expect(longestSession(d)?.id).toBe('b')
    expect(longestSession(withSessions([]))).toBeNull()
  })
  it('groups minutes by project, highest first, bucketing blanks', () => {
    const d = withSessions([
      S({ project: 'bujo', durationMin: 60 }),
      S({ project: 'bujo', durationMin: 30 }),
      S({ project: 'work', durationMin: 120 }),
      S({ project: '  ', durationMin: 15 }),
    ])
    expect(minutesByProject(d)).toEqual([
      { project: 'work', min: 120 },
      { project: 'bujo', min: 90 },
      { project: '(no project)', min: 15 },
    ])
    expect(minutesByProject(d, 1)).toEqual([{ project: 'work', min: 120 }])
    expect(minutesByProject(withSessions([]))).toEqual([])
  })
  it('builds an interruptions trend averaging per day, ignoring null', () => {
    const d = withSessions([
      S({ date: '2026-06-11', interruptions: 2 }),
      S({ date: '2026-06-11', interruptions: 4 }),
      S({ date: '2026-06-10', interruptions: 1 }),
      S({ date: '2026-06-09' }), // no interruptions field → not counted
    ])
    const t = interruptionsTrend(d, '2026-06-11', 3)
    expect(t.length).toBe(3)
    expect(t[0]).toEqual({ date: '2026-06-09', avg: 0, count: 0 })
    expect(t[1]).toEqual({ date: '2026-06-10', avg: 1, count: 1 })
    expect(t[2]).toEqual({ date: '2026-06-11', avg: 3, count: 2 })
  })

  it('builds a deep-work heatmap aligned to whole Sun..Sat weeks', () => {
    // today 2026-06-11 is a Thursday (wd 4) → window ends Sat 2026-06-13
    const d = withSessions([
      S({ date: '2026-06-11', durationMin: 120 }),
      S({ date: '2026-06-11', durationMin: 60 }), // same day → 180 total (busiest)
      S({ date: '2026-06-08', durationMin: 90 }),
    ])
    const { cells, max } = deepWorkHeatmap(d, '2026-06-11', 2)
    expect(cells.length).toBe(14) // 2 weeks * 7
    expect(max).toBe(180)
    expect(cells[0].weekday).toBe(0) // starts on a Sunday
    expect(cells[cells.length - 1].date).toBe('2026-06-13') // ends Saturday
    const thu = cells.find((c) => c.date === '2026-06-11')!
    expect(thu.min).toBe(180)
    expect(thu.level).toBe(4) // busiest day → top level
    const mon = cells.find((c) => c.date === '2026-06-08')!
    expect(mon.min).toBe(90)
    expect(mon.level).toBe(2) // 90/180 = 0.5 → ceil(2)
    const empty = cells.find((c) => c.date === '2026-06-09')!
    expect(empty.level).toBe(0)
  })

  it('heatmap reports a zero max and all-zero levels with no sessions', () => {
    const { cells, max } = deepWorkHeatmap(withSessions([]), '2026-06-11', 1)
    expect(max).toBe(0)
    expect(cells.every((c) => c.level === 0 && c.min === 0)).toBe(true)
  })

  it('averages focus score by weekday, duration-weighted', () => {
    // both Thursday: focus 8 over 60m and focus 6 over 60m → 7.0
    const d = withSessions([
      S({ date: '2026-06-11', durationMin: 60, focus: 8 }),
      S({ date: '2026-06-11', durationMin: 60, focus: 6 }),
      S({ date: '2026-06-08', durationMin: 30, focus: 9 }), // Monday
    ])
    const by = focusByWeekday(d)
    expect(by.length).toBe(7)
    expect(by[4]).toEqual({ day: 4, label: 'Thu', avg: 7, count: 2 })
    expect(by[1]).toEqual({ day: 1, label: 'Mon', avg: 9, count: 1 })
    expect(by[0]).toEqual({ day: 0, label: 'Sun', avg: 0, count: 0 })
  })
})

/**
 * The derivations added for the Focus rail.
 *
 * Every one of them can return `null`, and `expect(null).toBeGreaterThanOrEqual(0)`
 * **coerces and passes** — the twice-documented trap in CLAUDE.md. So every
 * numeric assertion below is preceded by `not.toBeNull()`, and the empty cases
 * assert `toBeNull()` rather than `toBe(0)`.
 */
/**
 * Two exports that had a reader and no test. `cumulativeHours` feeds the
 * all-time line and `focusInsight` the page's one sentence about stress; both
 * shipped uncovered, which is how a chart comes to plot a subtly wrong series
 * with every gate green. Found by auditing which `lib/focus.ts` exports anything
 * reads — see the PR body.
 */
describe('focus · previously untested exports', () => {
  it('runs cumulative hours over logged days only, ascending', () => {
    const d = withSessions([
      S({ date: '2026-06-11', durationMin: 90 }),
      S({ date: '2026-06-09', durationMin: 30 }),
      S({ date: '2026-06-09', durationMin: 30 }),
    ])
    // Two logged days, not the three calendar days between them: the series is
    // keyed on days that exist in the log.
    expect(cumulativeHours(d)).toEqual([
      { date: '2026-06-09', hours: 1 },
      { date: '2026-06-11', hours: 2.5 },
    ])
    expect(cumulativeHours(withSessions([]))).toEqual([])
  })

  it('withholds the stress insight until the correlation is worth stating', () => {
    // |r| < 0.4 is null, not a hedged sentence.
    expect(focusInsight(withSessions([S({ focus: 7, stress: 3 })]))).toBeNull()
    const rising = withSessions([
      S({ date: '2026-06-01', focus: 2, stress: 2 }),
      S({ date: '2026-06-02', focus: 5, stress: 5 }),
      S({ date: '2026-06-03', focus: 8, stress: 8 }),
    ])
    expect(focusInsight(rising)).toContain('higher stress')
    const falling = withSessions([
      S({ date: '2026-06-01', focus: 2, stress: 8 }),
      S({ date: '2026-06-02', focus: 5, stress: 5 }),
      S({ date: '2026-06-03', focus: 8, stress: 2 }),
    ])
    expect(focusInsight(falling)).toContain('lower stress')
  })
})

describe('focus · rolling weekly volume', () => {
  it('buckets minutes into rolling 7-day weeks ending today', () => {
    const d = withSessions([
      S({ date: '2026-06-11', durationMin: 60 }), // this week
      S({ date: '2026-06-05', durationMin: 90 }), // 6 days back → still week 2 of 2
      S({ date: '2026-06-04', durationMin: 30 }), // 7 days back → previous bucket
    ])
    const v = weeklyVolume(d, '2026-06-11', 2)
    expect(v.length).toBe(2)
    expect(v[1]).toMatchObject({ start: '2026-06-05', end: '2026-06-11', min: 150 })
    expect(v[0]).toMatchObject({ start: '2026-05-29', end: '2026-06-04', min: 30 })
  })

  it('reports 0 for a week with nothing logged — a week off is a measurement', () => {
    // Deliberately NOT null: unlike an average, a sum over an empty week has a
    // true answer, and a gap in a bar chart of volume reads as a gap in the log.
    const v = weeklyVolume(withSessions([]), '2026-06-11', 3)
    expect(v.map((w) => w.min)).toEqual([0, 0, 0])
  })
})

describe('focus · focus by session length', () => {
  it('bands sessions by duration and means the focus inside each band', () => {
    const d = withSessions([
      S({ durationMin: 20, focus: 4 }),
      S({ durationMin: 75, focus: 8 }),
      S({ durationMin: 80, focus: 9 }),
      S({ durationMin: 200, focus: 6 }),
    ])
    const bands = focusByDuration(d)
    expect(bands.map((b) => b.label)).toEqual(['under 30m', '30–60m', '60–90m', '90–120m', '2h+'])
    const b60 = bands[2]
    expect(b60.avg).not.toBeNull()
    expect(b60.avg).toBe(8.5) // plain mean of 8 and 9, not duration-weighted
    expect(b60.count).toBe(2)
    expect(b60.minutes).toBe(155)
    expect(bands[4].avg).toBe(6)
  })

  it('returns null — never 0 — for a band nobody has worked in', () => {
    const bands = focusByDuration(withSessions([S({ durationMin: 60, focus: 7 })]))
    expect(bands[1].count).toBe(0)
    expect(bands[1].avg).toBeNull()
    expect(bands[1].avg).not.toBe(0)
  })

  it('puts a boundary duration in the upper band', () => {
    // 60 is `60–90m`, not `30–60m`: the bands are [from, to).
    const bands = focusByDuration(withSessions([S({ durationMin: 60, focus: 7 })]))
    expect(bands[1].count).toBe(0)
    expect(bands[2].count).toBe(1)
  })
})

describe('focus · quality by tag', () => {
  it('weights focus by duration and keeps the minutes sort', () => {
    const d = withSessions([
      S({ durationMin: 180, focus: 4, tags: ['work'] }),
      S({ durationMin: 60, focus: 9, tags: ['rust'] }),
      S({ durationMin: 60, focus: 7, tags: ['rust'] }),
    ])
    const rows = qualityByTag(d)
    expect(rows.map((r) => r.tag)).toEqual(['work', 'rust']) // by minutes, like topTags
    expect(rows[0].avg).not.toBeNull()
    expect(rows[0].avg).toBe(4)
    expect(rows[1].avg).toBe(8) // (9*60 + 7*60) / 120
    expect(rows[1].count).toBe(2)
  })

  it('returns null, not 0, for a tag with no minutes to weight by', () => {
    const rows = qualityByTag(withSessions([S({ durationMin: 0, focus: 9, tags: ['ghost'] })]))
    expect(rows[0].tag).toBe('ghost')
    expect(rows[0].avg).toBeNull()
  })
})

describe('focus · what an interruption costs', () => {
  it('compares clean sessions against interrupted ones', () => {
    const d = withSessions([
      S({ focus: 9, interruptions: 0 }),
      S({ focus: 9, interruptions: 0 }),
      S({ focus: 5, interruptions: 3 }),
      S({ focus: 7, interruptions: 1 }),
    ])
    const c = interruptionCost(d)!
    expect(c).not.toBeNull()
    expect(c.clean).toBe(9)
    expect(c.noisy).toBe(6)
    expect(c.gap).toBe(3)
    expect(c.cleanCount).toBe(2)
    expect(c.noisyCount).toBe(2)
  })

  it('is null when either side has fewer than two sessions', () => {
    // One-against-one is noise wearing a decimal point.
    const thin = withSessions([S({ focus: 9, interruptions: 0 }), S({ focus: 4, interruptions: 2 })])
    expect(interruptionCost(thin)).toBeNull()
    // …and null when nobody logged the field at all, rather than a 0 gap.
    expect(interruptionCost(withSessions([S({}), S({}), S({}), S({})]))).toBeNull()
  })
})

describe('focus · findings', () => {
  it('says nothing at all on an empty journal', () => {
    // A findings list padded with "not enough data" is a list nobody reads.
    expect(focusFindings(withSessions([]), '2026-06-11')).toEqual([])
  })

  it('names the best duration band and what interruptions cost', () => {
    const d = withSessions([
      S({ date: '2026-06-11', durationMin: 75, focus: 9, interruptions: 0 }),
      S({ date: '2026-06-10', durationMin: 80, focus: 9, interruptions: 0 }),
      S({ date: '2026-06-09', durationMin: 200, focus: 5, interruptions: 3 }),
      S({ date: '2026-06-08', durationMin: 190, focus: 5, interruptions: 2 }),
    ])
    const ids = focusFindings(d, '2026-06-11').map((f) => f.id)
    expect(ids).toContain('duration')
    expect(ids).toContain('interruptions')
    expect(ids).toContain('longest')
    const dur = focusFindings(d, '2026-06-11').find((f) => f.id === 'duration')!
    expect(dur.text).toContain('60–90m')
    const int = focusFindings(d, '2026-06-11').find((f) => f.id === 'interruptions')!
    expect(int.text).toContain('Uninterrupted sessions score 4 higher')
  })

  it('has a stable id per finding, so nothing renders twice', () => {
    const d = withSessions([
      S({ date: '2026-06-11', durationMin: 75, focus: 9, interruptions: 0, tags: ['rust'] }),
      S({ date: '2026-06-10', durationMin: 80, focus: 8, interruptions: 0, tags: ['rust'] }),
      S({ date: '2026-06-09', durationMin: 200, focus: 5, interruptions: 3, tags: ['work'] }),
      S({ date: '2026-06-08', durationMin: 190, focus: 4, interruptions: 2, tags: ['work'] }),
    ])
    const ids = focusFindings(d, '2026-06-11').map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

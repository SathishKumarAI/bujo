import { describe, expect, it } from 'vitest'
import {
  HYPERTROPHY_PROGRAM, PROGRAMS, PULLUP_PROGRAM, allDays, dayComplete, dayStats, daysComplete,
  exerciseKey, resumeAt,
} from './programs'
import type { Program } from './programs'

/** Every key for one day — what ticking it off actually writes. */
const dayKeys = (p: Program, week: number, day: number) =>
  (p.weeks.find((w) => w.week === week)?.days.find((d) => d.day === day)?.exercises ?? [])
    .map((_, i) => exerciseKey(p.id, week, day, i))

/** Tick every day up to and including (week, day). */
function tickThrough(p: Program, week: number, day: number): string[] {
  const keys: string[] = []
  for (const w of p.weeks) {
    for (const d of w.days) {
      keys.push(...dayKeys(p, w.week, d.day))
      if (w.week === week && d.day === day) return keys
    }
  }
  return keys
}

describe('exerciseKey', () => {
  /**
   * `settings.programDone` holds these strings, so the format is storage, not
   * presentation. It lived as a closure inside ProgramTracker and anything else
   * reasoning about progress had to re-type the template literal — a second
   * spelling would read as "nothing is done" rather than as an error.
   */
  it('is the stored shape, unchanged', () => {
    expect(exerciseKey('pullup-zero', 2, 3, 0)).toBe('pullup-zero-w2d3-e0')
  })
})

describe('resumeAt', () => {
  const p = PULLUP_PROGRAM

  it('opens at the very start when nothing is done', () => {
    expect(resumeAt(p, [])).toEqual({ week: p.weeks[0].week, day: p.weeks[0].days[0].day })
  })

  /**
   * The bug this exists for: the tracker seeded from `p.weeks[0]`, so six weeks
   * in you were still greeted at week 1 day 1 — while the same render read
   * `programDone` to draw "12/30 days done" two lines away.
   */
  it('resumes on the first unfinished day, not the first day', () => {
    const done = tickThrough(p, 2, 3)
    const at = resumeAt(p, done)
    expect(at).not.toEqual({ week: 1, day: 1 })
    expect(dayComplete(p, at.week, at.day, done)).toBe(false)
    expect(at).toEqual({ week: 2, day: 4 })
  })

  it('rolls onto the next week when a week is finished', () => {
    const done = tickThrough(p, 1, p.weeks[0].days.at(-1)!.day)
    expect(resumeAt(p, done)).toEqual({ week: 2, day: 1 })
  })

  /**
   * "First incomplete", not "one past the last complete". People skip a day;
   * resuming past the gap would hide the day they meant to come back to.
   */
  it('goes back for a skipped day rather than past it', () => {
    const done = [...tickThrough(p, 1, 5), ...dayKeys(p, 2, 1), ...dayKeys(p, 2, 3)]
    expect(resumeAt(p, done)).toEqual({ week: 2, day: 2 })
  })

  it('stays on the last day of a finished program, not back at day 1', () => {
    const lastWeek = p.weeks.at(-1)!
    const lastDay = lastWeek.days.at(-1)!
    const done = tickThrough(p, lastWeek.week, lastDay.day)
    expect(daysComplete(p, done)).toBe(p.weeks.reduce((n, w) => n + w.days.length, 0))
    expect(resumeAt(p, done)).toEqual({ week: lastWeek.week, day: lastDay.day })
  })

  it('ignores the other program’s progress', () => {
    // Keys are namespaced by program id; both programs share one `programDone`.
    const other = PROGRAMS.find((x) => x.id !== p.id)!
    const done = tickThrough(other, other.weeks[0].week, other.weeks[0].days[0].day)
    expect(resumeAt(p, done)).toEqual({ week: p.weeks[0].week, day: p.weeks[0].days[0].day })
  })

  it('always names a day the program actually has', () => {
    for (const prog of PROGRAMS) {
      for (const done of [[], tickThrough(prog, prog.weeks[0].week, prog.weeks[0].days[0].day)]) {
        const at = resumeAt(prog, done)
        const week = prog.weeks.find((w) => w.week === at.week)
        expect(week, `${prog.id} resumed to a week that does not exist`).toBeDefined()
        expect(week!.days.some((d) => d.day === at.day)).toBe(true)
      }
    }
  })
})

describe('dayComplete', () => {
  it('needs every exercise, not the first', () => {
    const keys = dayKeys(PULLUP_PROGRAM, 1, 1)
    expect(keys.length).toBeGreaterThan(1)
    expect(dayComplete(PULLUP_PROGRAM, 1, 1, keys.slice(0, 1))).toBe(false)
    expect(dayComplete(PULLUP_PROGRAM, 1, 1, keys)).toBe(true)
  })

  it('is false for a day the program does not have', () => {
    // `every` over an empty list is true, so the guard has to be explicit —
    // without it a typo'd day number would report itself finished, and
    // `daysComplete` would count days that do not exist.
    expect(dayComplete(PULLUP_PROGRAM, 99, 99, [])).toBe(false)
  })
})

describe('allDays', () => {
  it('walks every day of every week, in order', () => {
    const days = allDays(PULLUP_PROGRAM)
    expect(days.length).toBe(PULLUP_PROGRAM.weeks.reduce((n, w) => n + w.days.length, 0))
    expect(days[0]).toEqual({ week: 1, day: 1, focus: 'Strength' })
    // The map draws one cell per entry, so a duplicate or a dropped day would
    // be a cell that navigates somewhere else than it says.
    expect(new Set(days.map((d) => `${d.week}-${d.day}`)).size).toBe(days.length)
  })
})

describe('dayStats', () => {
  /**
   * The session panel reads "7 lifts · 22 sets" off this. Asserted against the
   * record rather than a literal so the numbers cannot drift apart from the
   * program the page actually renders.
   */
  it('counts the day’s exercises and adds up their sets', () => {
    const day = HYPERTROPHY_PROGRAM.weeks[0].days[0]
    const expected = day.exercises.reduce((n, e) => n + Number(e.sets), 0)
    expect(dayStats(HYPERTROPHY_PROGRAM, 1, 1)).toEqual({ exercises: day.exercises.length, sets: expected })
  })

  it('is zero for a day the program does not have', () => {
    expect(dayStats(HYPERTROPHY_PROGRAM, 99, 99)).toEqual({ exercises: 0, sets: 0 })
  })
})

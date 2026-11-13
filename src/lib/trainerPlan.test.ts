import { describe, expect, it } from 'vitest'
import { TRAINER_PROGRAM } from './trainerPlan'
import { PROGRAMS, allDays } from './programs'
import { splitForFocus } from '../components/program/phone/programLog'

const days = TRAINER_PROGRAM.weeks.flatMap((w) => w.days)
const all = days.flatMap((d) => d.exercises)

describe('the trainer plan', () => {
  it('keeps all 25 sessions, five a week, and is offered as a program', () => {
    expect(days).toHaveLength(25)
    expect(allDays(TRAINER_PROGRAM)).toHaveLength(25)
    expect(PROGRAMS.map((p) => p.id)).toContain('trainer')
  })

  it('never swaps reps and sets — no set count over 5', () => {
    expect(all.filter((e) => Number(e.sets) > 5)).toEqual([])
  })

  it('puts warm-ups first and the finisher last on every day that has them', () => {
    for (const d of days) {
      const names = d.exercises.map((e) => e.name)
      const lastWarm = names.findLastIndex((n) => n.startsWith('Warm-up:'))
      const firstOther = names.findIndex((n) => !n.startsWith('Warm-up:'))
      if (lastWarm >= 0) expect(lastWarm, d.focus).toBeLessThan(firstOther)
      const fin = names.findIndex((n) => n.startsWith('Finisher:'))
      if (fin >= 0) expect(fin, d.focus).toBe(names.length - 1)
    }
  })

  it('files every day under a real split, not Other', () => {
    expect(days.filter((d) => splitForFocus(d.focus) === 'other').map((d) => d.focus)).toEqual([])
  })

  it('keeps the supersets as supersets', () => {
    expect(all.filter((e) => e.name.startsWith('Superset:')).length).toBeGreaterThanOrEqual(6)
  })
})

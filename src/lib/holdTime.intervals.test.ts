import { describe, expect, it } from 'vitest'
import { intervalsIn, startOf, stepAt } from './holdTime'

describe('intervalsIn — the run of steps a card asks for', () => {
  it('reads Tabata as 20 s work, 10 s rest, one round per set, no rest after the last', () => {
    const iv = intervalsIn('Planks (Tabata 20s/10s)', '20s work', 8)!
    expect(iv.manual).toBe(false)
    expect(iv.steps.filter((s) => s.kind === 'work')).toHaveLength(8)
    expect(iv.steps.filter((s) => s.kind === 'rest')).toHaveLength(7)
    expect(iv.steps.at(-1)).toMatchObject({ kind: 'work', secs: 20 })
    expect(startOf(iv.steps, iv.steps.length)).toBe(8 * 20 + 7 * 10)
  })

  it('reads a hold list as holds in turn, each started by you', () => {
    const iv = intervalsIn('Dead hangs', '15,30,15 s', 2)!
    expect(iv.manual).toBe(true)
    expect(iv.steps.map((s) => s.secs)).toEqual([15, 30, 15])
  })

  it('leaves a single hold and a rep plan alone', () => {
    expect(intervalsIn('Plank', '45 s', 3)).toBeNull()
    expect(intervalsIn('Hollow Rocks', '10', 2)).toBeNull()
  })
})

describe('stepAt — where the clock is', () => {
  const { steps } = intervalsIn('Burpees (Tabata 20s/10s)', '20s work', 2)!
  it('counts down work, then rest, then the next round, then stops', () => {
    expect(stepAt(steps, 0)).toEqual({ i: 0, left: 20 })
    expect(stepAt(steps, 19_100)).toEqual({ i: 0, left: 1 })
    expect(stepAt(steps, 20_000)).toEqual({ i: 1, left: 10 })
    expect(stepAt(steps, 30_000)).toEqual({ i: 2, left: 20 })
    expect(stepAt(steps, 50_000)).toEqual({ i: 3, left: 0 })
  })
})

describe('emomSteps — a beep every minute', () => {
  it('is one 60-second step per minute, saying the reps', async () => {
    const { emomSteps } = await import('./holdTime')
    const { steps } = emomSteps(10, 3)
    expect(steps).toHaveLength(10)
    expect(steps.every((s) => s.secs === 60)).toBe(true)
    expect(steps[2].label).toBe('Minute 3 of 10: 3 reps, then rest')
  })
})

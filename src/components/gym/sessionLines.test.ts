import { describe, expect, it } from 'vitest'
import { groupSets } from './sessionLines'
import type { WorkoutSet } from '../../lib/types'

const s = (exercise: string, weight: number | undefined, reps: number, kind?: WorkoutSet['kind']): WorkoutSet =>
  ({ exercise, weight, reps, kind })

/**
 * The two things this has to get right are both "a session is not its rows".
 *
 * Collapsing too much is the worse failure: a last set that broke is the
 * interesting part of a session, and `5,5,5,5,4` printed as "5 × 5" would
 * delete it.
 */
describe('groupSets', () => {
  it('collapses identical consecutive sets and keeps the count', () => {
    const g = groupSets([s('Bench Press', 65, 5), s('Bench Press', 65, 5), s('Bench Press', 65, 5)], 'lb')
    expect(g).toHaveLength(1)
    expect(g[0].exercise).toBe('Bench Press')
    expect(g[0].text).toBe('3 × 65lb × 5')
  })

  it('does not hide the set that broke', () => {
    const g = groupSets([s('Squat', 100, 5), s('Squat', 100, 5), s('Squat', 100, 4)], 'lb')
    expect(g.map((x) => x.text)).toEqual(['2 × 100lb × 5', '100lb × 4'])
  })

  it('writes bodyweight as BW rather than 0lb', () => {
    // `0lb × 8` on a dip reads as a logging bug, not as a pull-up.
    expect(groupSets([s('Dip', undefined, 8), s('Dip', 0, 8)], 'lb').map((x) => x.text))
      .toEqual(['BW × 8', 'BW × 8'])
  })

  it('keeps a warm-up separate from the working set it precedes', () => {
    const g = groupSets([s('Squat', 60, 5, 'warmup'), s('Squat', 60, 5, 'working')], 'kg')
    expect(g).toHaveLength(2)
    expect(g[0].kind).toBe('warmup')
  })

  it('gives every group a stable key even when a lift repeats later', () => {
    const g = groupSets([s('Squat', 100, 5), s('Dip', 0, 8), s('Squat', 100, 5)], 'lb')
    expect(new Set(g.map((x) => x.key)).size).toBe(3)
  })
})

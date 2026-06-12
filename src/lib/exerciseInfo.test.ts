import { describe, expect, it } from 'vitest'
import { exerciseInfo } from './exerciseInfo'

describe('exerciseInfo', () => {
  it('matches variations by keyword', () => {
    expect(exerciseInfo('Incline Dumbbell Press')?.cue).toMatch(/shoulder blades/i)
    expect(exerciseInfo('Conventional Deadlift')?.watch).toMatch(/round/i)
    expect(exerciseInfo('Wide-grip lat pulldown')?.cue).toMatch(/elbows/i)
  })

  it('returns null for unknown movements', () => {
    expect(exerciseInfo('interpretive dance')).toBeNull()
  })
})

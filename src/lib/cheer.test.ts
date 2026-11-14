import { describe, expect, it } from 'vitest'
import { cheer } from './cheer'

describe('cheer', () => {
  // The failure: the same line for the whole set, so nothing changes when
  // you need it most — the last seconds and the last round.
  it('changes with the moment, the last seconds winning over the last round', () => {
    const work = { phase: 'work' as const, idle: false }
    expect(cheer({ ...work, left: 20, frac: 0 })).toBe('You can do it.')
    expect(cheer({ ...work, left: 9, frac: 0.55 })).toBe('Past halfway. Keep going.')
    expect(cheer({ ...work, left: 15, frac: 0.25, lastRound: true })).toBe('Last round. Give it everything.')
    expect(cheer({ ...work, left: 3, frac: 0.85, lastRound: true })).toBe('Last 3 s. Push!')
  })

  it('says start before a run, breathe in a rest, and done at the end', () => {
    expect(cheer({ phase: 'work', idle: true, left: 20, frac: 0 })).toBe('Tap start when you are ready.')
    expect(cheer({ phase: 'rest', idle: false, left: 8, frac: 0.2 })).toBe('Good work. Breathe.')
    expect(cheer({ phase: 'done', idle: false, left: 0, frac: 1 })).toBe('Done. You showed up today.')
  })

  it('never counts down an open stopwatch', () => {
    expect(cheer({ phase: 'work', idle: false, left: null, frac: null })).toBe('You can do it.')
  })
})

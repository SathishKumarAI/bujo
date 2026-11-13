import { describe, expect, it } from 'vitest'
import { mmss, secondsIn } from './holdTime'

describe('secondsIn, which cards get a timer', () => {
  it.each([
    ['20s work', 20], ['45 s', 45], ['30 s each side', 30], ['15,30,15 s', 15],
    ['1 min', 60], ['10 min', 600], ['3×45s', 45], ['3 sets of 45 s', 45], ['40 seconds', 40],
    ['3×30s per side', 30],
  ])('%s is %i seconds', (plan, n) => expect(secondsIn(plan)).toBe(n))

  it.each(['10 reps', '3×12', '3 sets of 12', 'Max effort', '5 reps', '12–15 reps', '3x10 per side', 'reps not given'])(
    '%s is reps, no timer', (plan) => expect(secondsIn(plan)).toBeNull())
})

describe('mmss', () => {
  it('reads as a clock', () => {
    expect([mmss(5), mmss(20), mmss(65), mmss(600)]).toEqual(['0:05', '0:20', '1:05', '10:00'])
  })
})

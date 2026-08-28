import { describe, expect, it } from 'vitest'
import {
  bestSet, ladder, pullupAbility, pyramid, repScheme, repsOf, setLines,
  PULLUP_ABILITY, PULLUP_METHODS, PULLUP_PROGRESSIONS, PULLUP_WORKOUTS,
} from './pullups'
import { parseSet } from './fitness'

describe('rep schemes', () => {
  it('a ladder to 4 and a straight 4×4 are not the same session', () => {
    // Both come to "4" in the form. Sixteen reps versus ten, and four sets
    // versus four — the top set alone cannot tell them apart, which is why the
    // scheme is stored set by set rather than as a total.
    expect(repScheme('ladder', 4, 1)).toEqual([1, 2, 3, 4])
    expect(repScheme('straight', 4, 4)).toEqual([4, 4, 4, 4])
  })

  it('repeats the whole scheme per round', () => {
    expect(repScheme('ladder', 3, 2)).toEqual([1, 2, 3, 1, 2, 3])
    expect(repScheme('pyramid', 3, 2)).toEqual([1, 2, 3, 2, 1, 1, 2, 3, 2, 1])
  })

  it('treats EMOM as straight sets — the minute is a fact about the clock', () => {
    expect(repScheme('emom', 5, 10)).toEqual(repScheme('straight', 5, 10))
  })

  it('returns nothing for a half-filled form rather than a zero-rep session', () => {
    expect(repScheme('ladder', 0, 3)).toEqual([])
    expect(repScheme('ladder', 5, 0)).toEqual([])
    expect(repScheme('straight', -2, 3)).toEqual([])
  })

  it('ladder and pyramid agree at their shared bottom', () => {
    expect(ladder(1)).toEqual([1])
    expect(pyramid(1)).toEqual([1])
    expect(pyramid(4)).toEqual([1, 2, 3, 4, 3, 2, 1])
  })
})

describe('stored set lines', () => {
  it('round-trips through the count the page reads back', () => {
    const reps = repScheme('pyramid', 4, 2)
    expect(repsOf(setLines(reps))).toBe(reps.reduce((a, r) => a + r, 0))
  })

  it('writes one line per set, so downstream set counts are not lies', () => {
    // `parseSet` reads the reps and drops the leading set count, so a grouped
    // "Pull-up 5x3" would count once everywhere in `lib/fitness.ts`.
    const lines = setLines(repScheme('straight', 3, 5))
    expect(lines).toHaveLength(5)
    expect(lines[0]).toBe('Pull-up 1x3 @ 0kg')
  })

  it('parses with the shared strength parser, not a private format', () => {
    expect(parseSet(setLines([7])[0])).toEqual({ exercise: 'Pull-up', reps: 7, weight: 0 })
  })

  it('ignores a free-typed line that is not a pull-up set', () => {
    expect(repsOf(['Pull-up 1x5 @ 0kg', 'felt heavy', 'Dip 1x8 @ 0kg'])).toBe(5)
  })
})

describe('max and ability', () => {
  it('takes the max from the biggest single set ever logged', () => {
    const sessions = [
      { sets: setLines([3, 3, 3]) },
      { sets: setLines([1, 2, 3, 4, 5]) },
      { sets: setLines([2, 2]) },
    ]
    expect(bestSet(sessions)).toBe(5)
  })

  it('is 0, not NaN, with nothing logged', () => {
    expect(bestSet([])).toBe(0)
    expect(bestSet([{ sets: [] }])).toBe(0)
  })

  it('covers every max with no gap between the groups', () => {
    // The table's ranges are prose; this asserts the function behind them is
    // total. An uncovered max would fall through to Elite and prescribe 175
    // reps a day to someone who cannot do one.
    for (let max = 0; max <= 40; max++) {
      expect(PULLUP_ABILITY).toContain(pullupAbility(max))
    }
    expect(pullupAbility(0).group).toBe('Beginner')
    expect(pullupAbility(5).group).toBe('Novice')
    expect(pullupAbility(6).group).toBe('Intermediate')
    expect(pullupAbility(999).group).toBe('Elite')
  })
})

describe('the manual is the library, not a copy of it', () => {
  /**
   * Commit 531596f rewrote these lists inline in `views/Pullups.tsx`, which cut
   * fourteen workout formats to three and nine progressions to seven. Nothing
   * failed: the exports simply went unread. These counts are the gate.
   */
  it('still carries every workout format and progression', () => {
    expect(PULLUP_WORKOUTS.length).toBe(14)
    expect(PULLUP_PROGRESSIONS.length).toBe(9)
  })

  it('names a distinct method per rep scheme', () => {
    expect(new Set(PULLUP_METHODS.map((m) => m.value)).size).toBe(PULLUP_METHODS.length)
  })
})

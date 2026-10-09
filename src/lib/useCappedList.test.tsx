import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCappedList, HISTORY_CAP } from './useCappedList'

/**
 * COD-303. The sweep found five history lists with five rules, two of which
 * (`HomeWorkout`, `Pullups`) hard-sliced at 12 with no affordance — a list that
 * stops at twelve with nothing saying so has quietly deleted your history from
 * the only place you look for it.
 */
const rows = (n: number) => Array.from({ length: n }, (_, i) => `row-${i}`)

describe('useCappedList', () => {
  it('shows the first three and holds the rest back', () => {
    const { result } = renderHook(() => useCappedList(rows(24)))
    expect(result.current.shown).toHaveLength(HISTORY_CAP)
    expect(result.current.shown[0]).toBe('row-0')
    expect(result.current.hidden).toBe(21)
    expect(result.current.total).toBe(24)
  })

  it('expands to everything and back', () => {
    const { result } = renderHook(() => useCappedList(rows(24)))
    act(() => result.current.toggle())
    expect(result.current.expanded).toBe(true)
    expect(result.current.shown).toHaveLength(24)
    act(() => result.current.toggle())
    expect(result.current.shown).toHaveLength(HISTORY_CAP)
  })

  /**
   * The case that decides whether the button renders. A short list must not
   * grow a control that does nothing — that teaches people the control is
   * broken, and it is why `ShowMore` keys on `hidden` rather than on `total`.
   */
  it('hides nothing when the list is shorter than the cap', () => {
    for (const n of [0, 1, 2, 3]) {
      const { result } = renderHook(() => useCappedList(rows(n)))
      expect(result.current.shown, `${n} rows`).toHaveLength(n)
      expect(result.current.hidden, `${n} rows`).toBe(0)
    }
  })

  it('holds exactly one back at cap + 1 — the off-by-one that hides a row forever', () => {
    const { result } = renderHook(() => useCappedList(rows(HISTORY_CAP + 1)))
    expect(result.current.hidden).toBe(1)
    expect(result.current.shown).toHaveLength(HISTORY_CAP)
    act(() => result.current.toggle())
    expect(result.current.shown).toHaveLength(HISTORY_CAP + 1)
  })

  it('takes a caller-chosen cap, so a dense list is not forced to three', () => {
    const { result } = renderHook(() => useCappedList(rows(10), 5))
    expect(result.current.shown).toHaveLength(5)
    expect(result.current.hidden).toBe(5)
  })

  it('never reorders or drops — the rows are the caller\'s, in the caller\'s order', () => {
    // The hook slices; it does not sort. Every call site already sorts newest
    // first, and a hook that re-sorted would silently disagree with the one
    // that did not.
    const { result } = renderHook(() => useCappedList(rows(5)))
    expect(result.current.shown).toEqual(['row-0', 'row-1', 'row-2'])
  })
})

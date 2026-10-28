import { describe, expect, it } from 'vitest'
import { blankSession, carryOver, draftFrom, sessionPatch } from './sessionDraft'
import type { PickleballSession } from '../../lib/types'

/**
 * THE EDITOR AND THE LOG FORM WRITE THE SAME SHAPE.
 *
 * The history editor used to collect five of a session's fourteen fields, so
 * a session corrected there could be switched to doubles and never given a
 * partner — nor an opponent, location, level, points or scoring. These assert
 * the two translations that make one form serve both writers, because the
 * component itself needs a browser and this arithmetic does not.
 */
const FULL: PickleballSession = {
  id: 'p1',
  date: '2026-10-02',
  format: 'doubles',
  gamesWon: 3,
  gamesLost: 1,
  durationMin: 75,
  partner: 'Ravi',
  rpe: 7,
  notes: 'windy',
  opponent: 'Sam & Jo',
  location: 'Riverside',
  level: '3.5',
  pointsFor: 33,
  pointsAgainst: 28,
  scoring: '11',
  worked: ['Dinking', 'Serve'],
  toFix: ['Third-shot drop'],
  energy: 4,
  pain: false,
}

describe('a session survives the round trip through the form', () => {
  it('carries every stored field into the draft', () => {
    const d = draftFrom(FULL)
    // The count is the assertion: a field added to the session and forgotten
    // here is exactly the bug this file exists for, and it would show up as a
    // draft with fewer keys than the blank one.
    expect(Object.keys(d).sort()).toEqual(Object.keys(blankSession()).sort())
    expect(d.partner).toBe('Ravi')
    expect(d.opponent).toBe('Sam & Jo')
    expect(d.level).toBe('3.5')
    expect(d.pointsFor).toBe('33')
    expect(d.scoring).toBe('11')
  })

  it('writes every one of them back, unchanged', () => {
    const patch = sessionPatch(draftFrom(FULL))
    for (const k of Object.keys(patch) as (keyof PickleballSession)[]) {
      expect(patch[k], `${k} changed in the round trip`).toEqual(FULL[k])
    }
  })

  /**
   * `updatePickleball` MERGES the patch, so a key the patch omits means
   * "leave whatever was there". A cleared field therefore has to be present
   * and `undefined`, or clearing a partner would silently do nothing.
   */
  it('clears a field by naming it, not by omitting it', () => {
    const cleared = sessionPatch({ ...draftFrom(FULL), partner: '', opponent: '  ', level: '' })
    expect('partner' in cleared, 'partner must be named to be cleared').toBe(true)
    expect(cleared.partner).toBeUndefined()
    expect(cleared.opponent).toBeUndefined()
    expect(cleared.level).toBeUndefined()
  })

  /**
   * HOW IT WENT (COD-451). `pain: false` is an ANSWER — "no pain" — and must
   * not collapse into absent, which means "not asked"; and an emptied skill
   * list has to clear, by the same name-it-to-clear rule as the partner.
   */
  it('keeps "no pain" as false and clears an emptied skill list', () => {
    expect(sessionPatch(draftFrom(FULL)).pain).toBe(false)
    expect(sessionPatch({ ...draftFrom(FULL), pain: '' }).pain).toBeUndefined()
    const cleared = sessionPatch({ ...draftFrom(FULL), worked: [], energy: '' })
    expect('worked' in cleared).toBe(true)
    expect(cleared.worked).toBeUndefined()
    expect(cleared.energy).toBeUndefined()
    expect(cleared.toFix).toEqual(['Third-shot drop'])
  })

  /**
   * A SINGLES SESSION HAS NO PARTNER. The form hides Partner and Opponent 2
   * in singles but keeps their values, so a draft carried over from a doubles
   * session (`carryOver`, "Repeat last") and switched to singles still held
   * "Mara" — and wrote it. Found by the quick-log e2e (COD-452).
   */
  it('does not write a partner or a second opponent onto a singles session', () => {
    const patch = sessionPatch({ ...draftFrom(FULL), format: 'singles', opponent2: 'Jo' })
    expect('partner' in patch).toBe(true)
    expect(patch.partner).toBeUndefined()
    expect(patch.opponent2).toBeUndefined()
    expect(patch.opponent).toBe('Sam & Jo')
  })

  it('carries over what rarely changes and nothing about this session', () => {
    const d = carryOver(FULL)
    expect([d.format, d.durationMin, d.partner, d.location, d.level, d.scoring]).toEqual(['doubles', '75', 'Ravi', 'Riverside', '3.5', '11'])
    expect([d.gamesWon, d.gamesLost, d.rpe, d.notes, d.energy, d.pain]).toEqual(['', '', '', '', '', ''])
    expect(d.worked).toEqual([])
    expect(carryOver(undefined)).toEqual(blankSession())
  })

  it('keeps a zero score as a zero, not as absent', () => {
    // A 0–0 session is a real session — the sport's required field is the
    // duration — so the score must not fall back to undefined.
    const patch = sessionPatch({ ...blankSession(), gamesWon: '0', gamesLost: '0', durationMin: '40' })
    expect(patch.gamesWon).toBe(0)
    expect(patch.gamesLost).toBe(0)
    expect(patch.durationMin).toBe(40)
  })
})

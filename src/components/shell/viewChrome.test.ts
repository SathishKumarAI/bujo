import { describe, expect, it } from 'vitest'
import { VIEW_CHROME, type ViewId } from './viewChrome'
import { VIEW_IDS, NOT_SMOKED } from '../../../scripts/view-ids.mjs'

/**
 * The smoke gate navigates by a hand-written id list. This is what stops that
 * list drifting from the app.
 *
 * It had drifted: `program` and `nutrition` were both absent, so two Body tabs
 * were never opened and the gate's summary line read as full coverage anyway.
 * Same family as the `a11y-axe.mjs` `VIEWS` trap in CLAUDE.md and the retired
 * `BottomNav.PRIMARY` one — a list resolved against another source, with
 * nothing asserting the resolution.
 *
 * A missing id is the dangerous direction: it removes a page from a gate
 * silently, and a page that is never visited cannot fail.
 */
describe('the smoke gate covers every view', () => {
  it('names every view in the registry, or exempts it with a reason', () => {
    const registry = Object.keys(VIEW_CHROME) as ViewId[]
    const covered = new Set([...VIEW_IDS, ...Object.keys(NOT_SMOKED)])
    expect(registry.filter((v) => !covered.has(v))).toEqual([])
  })

  it('names nothing the app cannot route to', () => {
    // The other direction: an id retired from the app leaves the gate
    // navigating to a `?view=` that falls back to Today, which passes.
    expect(VIEW_IDS.filter((v) => !(v in VIEW_CHROME))).toEqual([])
  })

  it('exempts nothing without saying why', () => {
    for (const [id, reason] of Object.entries(NOT_SMOKED)) {
      expect(id in VIEW_CHROME, `${id} is exempted but is not a view`).toBe(true)
      expect(reason.length).toBeGreaterThan(10)
    }
  })

  it('lists each id once', () => {
    expect(new Set(VIEW_IDS).size).toBe(VIEW_IDS.length)
  })
})

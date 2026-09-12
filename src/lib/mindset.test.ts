import { describe, it, expect } from 'vitest'
import { MINDSET_CATEGORIES, MINDSET_LIBRARY, principleById } from './mindset'

/**
 * The library is static content with no other guard on it.
 *
 * CLAUDE.md records a pass that rewrote `views/Pullups.tsx`'s lists *inline*
 * instead of reading `lib/pullups.ts`, dropping eleven workout formats — and
 * tsc, eslint, vitest and the build were all clean, because an export nobody
 * imports is not an error. The counts below are the only thing that would
 * notice the same accident here, so they are asserted rather than described.
 */
describe('MINDSET_LIBRARY', () => {
  it('holds every principle the page groups', () => {
    expect(MINDSET_LIBRARY.length).toBe(46)
    expect(MINDSET_CATEGORIES.length).toBe(9)
  })

  it('gives every principle a category the library groups by', () => {
    const known = new Set<string>(MINDSET_CATEGORIES)
    const orphans = MINDSET_LIBRARY.filter((p) => !known.has(p.category))
    // An orphan renders nowhere: `LibraryList` iterates the categories, so a
    // principle in an unlisted one is silently unreachable rather than broken.
    expect(orphans.map((p) => p.id)).toEqual([])
  })

  it('leaves no category empty', () => {
    // `categoryCounts` returns every category, so an empty one draws a
    // permanent zero bar in the balance chart with nothing able to fill it.
    const empty = MINDSET_CATEGORIES.filter((c) => !MINDSET_LIBRARY.some((p) => p.category === c))
    expect(empty).toEqual([])
  })

  it('keeps ids unique', () => {
    // `mindsetPractice` is keyed by principle id; a duplicate would have two
    // rows sharing one practice history.
    const ids = MINDSET_LIBRARY.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('covers the desk as well as the court', () => {
    // The first seven categories were written for an athlete. These two carry
    // the job-holder and PhD-student framing; losing them to a merge would be
    // invisible on screen — the page would simply show seven filters again.
    expect(MINDSET_LIBRARY.filter((p) => p.category === 'Deep work').length).toBe(5)
    expect(MINDSET_LIBRARY.filter((p) => p.category === 'Craft & scholarship').length).toBe(6)
    expect(principleById('write-to-think')?.title).toBe('Write to find out what you think')
  })
})

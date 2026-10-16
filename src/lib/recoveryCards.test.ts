import { describe, expect, it } from 'vitest'
import { CARDS, FACETS, FACET_LABEL, GROUPS, visibleCards } from './recoveryCards'

/**
 * SUB-SECTIONS ARE DERIVED, NEVER LISTED.
 *
 * §16's rule, asserted: the chips come from the registry's `facet` field and
 * the cards render behind it, so "a chip that selects nothing" and "a card no
 * chip can reach" are both unrepresentable. The test exists because the
 * alternative shape — a chip list written beside the render conditions — has
 * failed in this repo four times (`BottomNav`'s `PRIMARY`, `view-ids.mjs`, the
 * a11y `VIEWS`, `demoFoodLog`'s food names), and every time it failed in
 * silence.
 */
describe('the patterns facets', () => {
  const patterns = CARDS.filter((c) => c.group === 'patterns')

  it('covers every card in the group it splits', () => {
    const missing = patterns.filter((c) => !c.facet).map((c) => c.id)
    expect(missing, 'a patterns card with no facet is a card no chip can reach').toEqual([])
  })

  it('uses only facets that exist', () => {
    for (const c of patterns) expect(FACETS).toContain(c.facet!)
  })

  it('leaves every other group alone — a facet on a four-card group is furniture', () => {
    const strays = CARDS.filter((c) => c.group !== 'patterns' && c.facet).map((c) => c.id)
    expect(strays).toEqual([])
  })

  it('splits into chips none of which is the whole group', () => {
    // A facet holding all nine narrows nothing; one holding a single card
    // costs more than it saves. §16 puts the threshold at about five cards.
    for (const f of FACETS) {
      const n = patterns.filter((c) => c.facet === f).length
      expect(n, `facet ${f}`).toBeGreaterThanOrEqual(2)
      expect(n, `facet ${f}`).toBeLessThan(patterns.length)
    }
  })

  it('names every facet it offers', () => {
    for (const f of FACETS) expect(FACET_LABEL[f].length).toBeGreaterThan(2)
  })

  it('is big enough to deserve splitting at all', () => {
    // If `patterns` ever drops below the threshold, the sub-navigation should
    // go with it — this fails loudly rather than leaving three chips over four
    // cards.
    expect(patterns.length).toBeGreaterThanOrEqual(6)
  })
})

/**
 * The registry is the page, so the things the page assumes about it are
 * asserted here rather than discovered on screen.
 */
describe('the recovery registry', () => {
  it('puts every card in a real group', () => {
    for (const c of CARDS) expect(GROUPS).toContain(c.group)
  })

  it('has no duplicate ids — two cards under one key is a silent render bug', () => {
    const ids = CARDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('finds a card by a word nobody would put in its title', () => {
    // `words` is what makes the filter worth having: "HALT" and "late night"
    // are what a person types, and neither is a heading.
    expect(visibleCards(null, 'hour').size).toBeGreaterThan(0)
    expect(visibleCards(null, 'money').size).toBeGreaterThan(0)
  })
})

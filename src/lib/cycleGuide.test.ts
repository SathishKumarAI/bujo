import { describe, expect, it } from 'vitest'
import { BBT_RULES, CYCLE_DISCLAIMER, CYCLE_PHASES, TRACKING_TIPS } from './cycleGuide'

/**
 * Counts, because nothing else will fail if a pass rewrites the view's lists
 * inline and this module quietly loses its reader — the Pullups trap
 * (`lib/pullups.test.ts` is the precedent and the reason this file exists).
 */
describe('cycle guide holds what the page promises', () => {
  it('covers all four phases, in cycle order', () => {
    expect(CYCLE_PHASES.map((p) => p.id)).toEqual(['menstrual', 'follicular', 'ovulation', 'luteal'])
    for (const p of CYCLE_PHASES) {
      expect(p.what.length).toBeGreaterThan(20)
      expect(p.feel.length).toBeGreaterThan(20)
      expect(p.tip.length).toBeGreaterThan(20)
    }
  })

  it('carries food guidance for every phase, and credits a real source for it', () => {
    for (const p of CYCLE_PHASES) {
      expect(p.cravings.length).toBeGreaterThan(40)
      expect(p.eat.length).toBeGreaterThan(40)
      // A dietary claim with no credit is the thing this field exists to stop.
      expect(p.sources.length).toBeGreaterThan(0)
      for (const s of p.sources) {
        expect(s.url).toMatch(/^https:\/\//)
        expect(s.label.length).toBeGreaterThan(4)
      }
    }
    // Five links across four phases: the luteal pair is deliberate (NHS for the
    // meal pattern, OWH for calcium and what to ease off), so a drop to four
    // means a source was lost rather than a phase merged.
    expect(CYCLE_PHASES.flatMap((p) => p.sources)).toHaveLength(5)
  })

  it('keeps the temperature rules and logging tips populated', () => {
    expect(BBT_RULES.length).toBe(5)
    expect(TRACKING_TIPS.length).toBe(4)
  })

  it('never ships without the medical disclaimer', () => {
    expect(CYCLE_DISCLAIMER).toMatch(/not medical advice/i)
    expect(CYCLE_DISCLAIMER).toMatch(/not contraception/i)
  })
})

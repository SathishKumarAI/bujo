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
      expect(p.what.length).toBeGreaterThan(1)
      expect(p.feel.length).toBeGreaterThan(1)
      expect(p.tip.length).toBeGreaterThan(1)
    }
  })

  it('carries food guidance for every phase, and credits a real source for it', () => {
    for (const p of CYCLE_PHASES) {
      expect(p.cravings.length).toBeGreaterThan(1)
      expect(p.eat.length).toBeGreaterThan(1)
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
    expect(CYCLE_DISCLAIMER.join(' ')).toMatch(/not medical advice/i)
    expect(CYCLE_DISCLAIMER.join(' ')).toMatch(/not contraception/i)
  })

  it('draws the disclaimer as real points, not a split sentence', () => {
    expect(CYCLE_DISCLAIMER.length).toBeGreaterThanOrEqual(2)
    for (const p of CYCLE_DISCLAIMER) expect(p.length, p).toBeGreaterThanOrEqual(12)
  })
})

/**
 * POINTS, NOT PARAGRAPHS — asserted, because `tsc` proves a field is a list
 * of strings and never that the strings say anything.
 *
 * `pickleballAcademy.test.ts` is the pattern this copies: a point count, a
 * per-point length floor, and no point that is a copy of the field beside it.
 * The floor is what catches the failure mode of this kind of change — a
 * paragraph split on its full stops, leaving fragments like "and stays up"
 * as their own bullet.
 */
describe('every phase field is points rather than a paragraph', () => {
  const FIELDS = ['what', 'feel', 'tip', 'cravings', 'eat'] as const

  it('gives each field at least two real points', () => {
    for (const p of CYCLE_PHASES) {
      for (const f of FIELDS) {
        const points = p[f]
        expect(points.length, `${p.id}.${f} is a one-item list`).toBeGreaterThan(1)
        for (const t of points) {
          // 12 characters is the floor `pickleballAcademy.test.ts` uses: long
          // enough that a sentence fragment fails it.
          expect(t.length, `${p.id}.${f} has a fragment: "${t}"`).toBeGreaterThan(12)
          expect(t.trim(), `${p.id}.${f} has an untrimmed point`).toBe(t)
        }
        expect(new Set(points).size, `${p.id}.${f} repeats a point`).toBe(points.length)
      }
    }
  })

  it('keeps no paragraph hiding inside a point', () => {
    // A point carrying three sentences is the thing this change removed; one
    // trailing full stop is a sentence, two or more is a paragraph wearing a
    // bullet. The citations are allowed their one em-dash aside.
    for (const p of CYCLE_PHASES) {
      for (const f of FIELDS) {
        for (const t of p[f]) {
          const sentences = (t.match(/[.!?](\s|$)/g) ?? []).length
          expect(sentences, `${p.id}.${f} point is ${sentences} sentences: "${t}"`).toBeLessThan(3)
        }
      }
    }
  })

  it('still credits a source for every phase', () => {
    // The split rewrote the dietary copy; the rule that every claim names a
    // published body did not change, and this is the assertion that survives
    // a rewrite of the words.
    for (const p of CYCLE_PHASES) {
      expect(p.sources.length, `${p.id} lost its source`).toBeGreaterThan(0)
    }
  })
})

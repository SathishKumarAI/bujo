import { describe, expect, it } from 'vitest'
import { GUIDE, TUTORIALS, asPoints } from './guide'
import { GLOSSARY } from './glossary'
import { RAPID_LOG_HOW, QUICK_CAPTURE } from './bullets'

/**
 * Help's phone draws its copy as points (CLAUDE.md "Points, not paragraphs").
 * `tsc` proves a field is a `string[]`; these prove each line is a real line —
 * the pattern from `pickleballAcademy.test.ts`: a point count, a per-point
 * length floor, and no point that repeats the heading above it.
 */
const FLOOR = 12

describe('tutorial steps are points, not paragraphs', () => {
  for (const t of TUTORIALS) {
    for (const s of t.steps) {
      it(`${t.id} · ${s.title} has two or more whole lines`, () => {
        expect(s.body.length).toBeGreaterThanOrEqual(2)
        for (const p of s.body) {
          expect(p.length, p).toBeGreaterThanOrEqual(FLOOR)
          expect(p.toLowerCase()).not.toBe(s.title.toLowerCase())
          // A whole sentence: the desktop joins these back into its paragraph.
          expect(p, p).toMatch(/[.!?"”)]$/)
        }
      })
    }
  }
})

describe('rapid logging as points', () => {
  it('has the three moves, each a real line', () => {
    expect(RAPID_LOG_HOW.length).toBeGreaterThanOrEqual(2)
    for (const p of RAPID_LOG_HOW) expect(p.length, p).toBeGreaterThanOrEqual(FLOOR)
  })

  it('lists every quick-capture prefix once', () => {
    expect(QUICK_CAPTURE.map((q) => q.key)).toEqual(['t', 'e', 'n', '*', '^', '#tag'])
  })
})

describe('asPoints splits copy it does not own without losing a word', () => {
  it('splits on a sentence end, never inside a number or "e.g."', () => {
    // Armed: a naive split on ". " would cut both of these.
    expect(asPoints('Rises 0.3–0.5 °F after ovulation. It stays up until the period.')).toEqual(['Rises 0.3–0.5 °F after ovulation.', 'It stays up until the period.'])
    expect(asPoints('Use a cue, e.g. the kettle. Then write one line.')).toEqual(['Use a cue, e.g. the kettle.', 'Then write one line.'])
  })

  it('keeps a three-word sentence with its neighbour instead of drawing a stub', () => {
    expect(asPoints('A Body tab. It logs your sets and the rest between them.')).toEqual(['A Body tab. It logs your sets and the rest between them.'])
  })

  const sources = [
    ...GUIDE.map((c) => [`guide · ${c.view}`, c.what] as const),
    ...GLOSSARY.map((t) => [`glossary · ${t.term}`, t.long] as const),
  ]
  it('reads every guide and glossary paragraph', () => {
    // A scan that matches nothing passes — so count what it scanned.
    expect(sources.length).toBeGreaterThan(30)
  })
  for (const [name, text] of sources) {
    it(`${name} becomes whole lines`, () => {
      const pts = asPoints(text)
      expect(pts.join(' ')).toBe(text.trim())
      for (const p of pts) expect(p.length, `${name}: "${p}"`).toBeGreaterThanOrEqual(FLOOR)
    })
  }
})

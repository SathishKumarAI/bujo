/**
 * HELP CONTENT LIVES IN ONE FILE, and the links in it resolve.
 *
 * The brief's Stage 7 sweep is "confirm every help string is imported from the
 * single content file". A grep proves absence of duplicates today; these tests
 * prove the file stays coherent tomorrow — which is the part that rots. The
 * palette in this repo was written down twice and disagreed for a release; the
 * phase hue still is, and only a test keeps it honest.
 */
import { describe, expect, it } from 'vitest'
import { CYCLE_HELP, cycleHelp, PHASE_FOOD } from './cycleHelp'
import { CYCLE_MANUAL, MANUAL_IDS } from './cycleManual'
import { CYCLE_PHASES } from './cycleGuide'

describe('the help content file is internally consistent', () => {
  it('has no duplicate keys', () => {
    const keys = CYCLE_HELP.map((h) => h.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('has non-empty text for every entry', () => {
    for (const h of CYCLE_HELP) expect(h.text.trim().length, h.key).toBeGreaterThan(20)
  })

  it('resolves a known key and returns undefined for an unknown one', () => {
    expect(cycleHelp('coverline')?.text).toMatch(/reference line/)
    // Unknown keys must not throw: an InfoTip with no entry renders nothing,
    // because a gap in the content file is not a reason to crash a page
    // someone is reading their own chart on.
    expect(cycleHelp('not-a-real-key')).toBeUndefined()
  })
})

describe('every "Learn more" lands somewhere', () => {
  it('points only at manual sections that exist', () => {
    for (const h of CYCLE_HELP) {
      if (!h.more) continue
      expect(MANUAL_IDS, `tip "${h.key}" links to a missing section "${h.more}"`).toContain(h.more)
    }
  })

  it('has unique section ids, or an anchor would be ambiguous', () => {
    expect(new Set(MANUAL_IDS).size).toBe(MANUAL_IDS.length)
  })

  it('gives every section a title, an intro and real points', () => {
    for (const s of CYCLE_MANUAL) {
      expect(s.title.trim().length, s.id).toBeGreaterThan(0)
      expect(s.intro.trim().length, s.id).toBeGreaterThan(0)
      // Points, not paragraphs: the guide is scanned, not read.
      expect(s.points.length, s.id).toBeGreaterThan(2)
      for (const pt of s.points) {
        expect(pt.label.trim().length, `${s.id} point label`).toBeGreaterThan(0)
        expect(pt.text.trim().length, `${s.id} point text`).toBeGreaterThan(0)
      }
    }
  })
})

describe('the manual covers what the brief requires it to cover', () => {
  const all = CYCLE_MANUAL
    .flatMap((s) => [s.intro, s.takeaway ?? '', ...s.points.flatMap((p) => [p.label, p.text])])
    .join(' ')
    .toLowerCase()

  it('states the clinician thresholds', () => {
    // These are the numbers someone might act on, so they are asserted rather
    // than trusted to survive an edit.
    expect(all).toContain('21 days or longer than 35')
    expect(all).toContain('more than 7 days')
    expect(all).toContain('90 days')
    expect(all).toContain('12 months')
    expect(all).toContain('after menopause')
  })

  it('names the conditions that make a chart irregular', () => {
    for (const c of ['breastfeeding', 'pcos', 'thyroid', 'perimenopause']) {
      expect(all, `limitations omit ${c}`).toContain(c)
    }
  })

  it('says it is not contraception and not medical advice', () => {
    expect(all).toContain('not contraception')
    expect(all).toContain('not medical advice')
  })

  it('says the data is excluded from every sync path, with no setting', () => {
    expect(all).toContain('no setting that turns that off')
  })
})

describe('the phase vocabularies agree with each other', () => {
  /**
   * `PHASE_FOOD` is keyed by phase NAME and matched against the label
   * `phaseOf` produces. A rename on either side silently drops the card to its
   * empty state, which looks like "no data" rather than like a bug.
   */
  it('names a food focus for every phase the page can be in', () => {
    const foodPhases = PHASE_FOOD.map((p) => p.phase.toLowerCase())
    for (const p of CYCLE_PHASES) {
      const label = p.name === 'Ovulation' ? 'ovulation window' : p.name.toLowerCase()
      expect(foodPhases, `no food focus for phase "${p.name}"`).toContain(label)
    }
  })
})

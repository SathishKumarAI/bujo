import { describe, expect, it } from 'vitest'
import { LAPSE_TRUTH, TECHNIQUES, resetCost } from './coping'

/**
 * The content rules, asserted — because `tsc` proves a field is a string and
 * never that the string says anything.
 *
 * Same pattern as `pickleballAcademy.test.ts`: point count, a per-point length
 * floor, and no point that is a copy of the field beside it. This is health
 * content read at the worst ninety seconds of someone's day, so the fact that
 * it is points rather than paragraphs is a property worth a test.
 */
describe('the coping techniques', () => {
  it('offers enough to choose from, and few enough to read', () => {
    expect(TECHNIQUES.length).toBeGreaterThanOrEqual(3)
    expect(TECHNIQUES.length).toBeLessThanOrEqual(6)
  })

  it('has a unique id and title for each', () => {
    expect(new Set(TECHNIQUES.map((t) => t.id)).size).toBe(TECHNIQUES.length)
    expect(new Set(TECHNIQUES.map((t) => t.title)).size).toBe(TECHNIQUES.length)
  })

  it('gives every technique real steps, not a sentence split on full stops', () => {
    for (const t of TECHNIQUES) {
      expect(t.steps.length, `${t.id} steps`).toBeGreaterThanOrEqual(3)
      for (const s of t.steps) expect(s.length, `${t.id}: "${s}"`).toBeGreaterThanOrEqual(12)
    }
  })

  it('says why each one is here, with at least three points', () => {
    for (const t of TECHNIQUES) {
      expect(t.why.length, `${t.id} why`).toBeGreaterThanOrEqual(3)
      for (const w of t.why) expect(w.length, `${t.id}: "${w}"`).toBeGreaterThanOrEqual(12)
    }
  })

  it('never repeats the summary as a step or a reason', () => {
    for (const t of TECHNIQUES) {
      expect(t.steps).not.toContain(t.summary)
      expect(t.why).not.toContain(t.summary)
    }
  })

  it('credits a reachable source for every one', () => {
    // This is the only content in the app that makes a claim about the world
    // rather than about the reader's own numbers, so the source is not
    // optional and a broken-looking one is a defect.
    for (const t of TECHNIQUES) {
      expect(t.source.label.length, t.id).toBeGreaterThan(8)
      expect(t.source.url, t.id).toMatch(/^https:\/\//)
    }
    expect(LAPSE_TRUTH.source.url).toMatch(/^https:\/\//)
  })

  it('says how long each takes, so the reader can pick one they have time for', () => {
    for (const t of TECHNIQUES) expect(t.minutes).toMatch(/min/)
  })
})

describe('the lapse writing', () => {
  it('is points, and enough of them to be a case rather than a slogan', () => {
    expect(LAPSE_TRUTH.points.length).toBeGreaterThanOrEqual(4)
    for (const p of LAPSE_TRUTH.points) expect(p.length).toBeGreaterThanOrEqual(30)
  })

  it('never calls the reader a failure, and never promises a cure', () => {
    const all = `${LAPSE_TRUTH.title} ${LAPSE_TRUTH.points.join(' ')}`.toLowerCase()
    for (const word of ['failure', 'weak', 'cure', 'guaranteed', 'never again']) {
      expect(all, word).not.toContain(word)
    }
  })

  it('names the mechanism rather than just reassuring', () => {
    // The difference between this and a motivational poster is that it says
    // WHAT turns a slip into a relapse, which is the thing a reader can act on.
    expect(LAPSE_TRUTH.points.join(' ').toLowerCase()).toContain('abstinence violation effect')
  })
})

describe('resetCost', () => {
  it('counts the run you would give up and the milestone that moves', () => {
    const c = resetCost(16, 24, 58)
    expect(c.days).toBe(16)
    expect(c.milestone?.daysAway).toBeGreaterThan(0)
    expect(c.fromBest).toBe(8)
  })

  it('always states what is KEPT, which is the half that stops it being a threat', () => {
    // A card that shows only the loss is the abstinence violation effect with
    // a chart on it. `kept` is the correction, not a consolation.
    expect(resetCost(16, 24, 58).kept).toBe(42)
  })

  it('does not claim a gap to a best you are already past', () => {
    expect(resetCost(30, 24, 90).fromBest).toBeNull()
    expect(resetCost(24, 24, 90).fromBest).toBeNull()
  })

  it('survives a day one, and a journal with nothing in it', () => {
    const zero = resetCost(0, 0, 0)
    expect(zero.days).toBe(0)
    expect(zero.kept).toBe(0)
    expect(zero.milestone).not.toBeNull()
  })

  it('never returns NaN from a journal missing its stored best', () => {
    // `Math.max(undefined, …)` is NaN and NaN renders — the defect this repo
    // shipped in `streakStats` and guarded in the same pass.
    const c = resetCost(10, undefined as unknown as number, 40)
    expect(Number.isFinite(c.days)).toBe(true)
    expect(Number.isFinite(c.kept)).toBe(true)
    expect(c.fromBest).toBeNull()
  })

  it('never reports a negative kept total', () => {
    expect(resetCost(60, 60, 10).kept).toBe(0)
  })
})

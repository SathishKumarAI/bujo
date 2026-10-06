import { describe, expect, it } from 'vitest'
import { HOME_MANUAL, HOME_SAFETY, HOME_SOURCES, chapterFor, sourceById } from './homeManual'
import { HOME_EQUIPMENT, HOME_GOALS, HOME_LEVERS, HOME_PRINCIPLES, HOME_ROUTINES } from './homeProgramming'
import { FAMILY_LABEL, exerciseById, filterExercises, type Family } from './homeExercises'

/**
 * The same gate as `pullups.test.ts`, for the same reason: commit 531596f added
 * "cards from the training guide" to a view by rewriting its data inline, which
 * cut fourteen workout formats to three and nine progressions to seven with
 * `tsc -b`, eslint, vitest and the build all green. An export nobody imports is
 * not an error. These counts are what makes it one.
 */
describe('the manual still carries what it carried', () => {
  it('has a chapter per movement family, and no orphans', () => {
    expect(HOME_MANUAL).toHaveLength(9)
    const families = HOME_MANUAL.map((c) => c.family)
    expect(new Set(families).size).toBe(families.length)
    expect([...families].sort()).toEqual((Object.keys(FAMILY_LABEL) as Family[]).sort())
    for (const f of Object.keys(FAMILY_LABEL) as Family[]) expect(chapterFor(f), f).toBeDefined()
  })

  it('keeps the programming, the kit and the sources', () => {
    expect(HOME_GOALS).toHaveLength(3)
    expect(HOME_LEVERS).toHaveLength(8)
    expect(HOME_PRINCIPLES).toHaveLength(5)
    expect(HOME_EQUIPMENT).toHaveLength(8)
    expect(HOME_ROUTINES).toHaveLength(7)
    expect(HOME_SOURCES).toHaveLength(31)
  })

  it('teaches each family rather than labelling it', () => {
    for (const c of HOME_MANUAL) {
      expect(c.setup.length, c.family).toBeGreaterThanOrEqual(3)
      expect(c.execution.length, c.family).toBeGreaterThanOrEqual(3)
      expect(c.progress.length, c.family).toBeGreaterThanOrEqual(2)
      expect(c.mistake.length, c.family).toBeGreaterThan(80)
      for (const s of [...c.setup, ...c.execution, ...c.progress]) {
        expect(s.length, `${c.family}: "${s}"`).toBeGreaterThan(40)
      }
    }
  })

  it('has a family with at least one movement behind every chapter', () => {
    // A chapter over an empty family is a heading standing over nothing, which
    // is the defect `docs/PAGE-SHAPE.md` records on Insights.
    for (const c of HOME_MANUAL) {
      expect(filterExercises({ family: c.family }).length, c.family).toBeGreaterThan(0)
    }
  })
})

describe('citations', () => {
  it('names each source once', () => {
    const ids = HOME_SOURCES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves every id anything cites', () => {
    const cited = [
      ...HOME_MANUAL.flatMap((c) => [...c.sources, ...c.cueSources]),
      ...HOME_GOALS.flatMap((g) => g.sources),
      ...HOME_SAFETY.sources,
      // The levers block in `components/homeworkout/Manual.tsx` cites these
      // inline, because they back the whole list rather than one lever.
      'acsm', 'umbrella', 'tempo', 'rom', 'doseresponse',
    ]
    expect(cited.filter((id) => !sourceById(id))).toEqual([])
  })

  it('cites something for the numbers in every chapter and every goal', () => {
    for (const c of HOME_MANUAL) expect(c.sources.length, c.family).toBeGreaterThan(0)
    for (const g of HOME_GOALS) expect(g.sources.length, g.id).toBeGreaterThan(0)
  })

  /**
   * **This is the gate that matters.** The first draft of `HOME_SOURCES` cited
   * five PubMed abstracts, the NSCA position-statement index and a Mayo Clinic
   * article. Every one of those hosts refuses an anonymous fetch — PubMed serves
   * a cookie wall with no abstract, nsca.com and mayoclinic.org answer 403, and
   * the ACSM position stand is 402 on journals.lww.com. They were plausible,
   * they were the obvious citations, and not one of them opens.
   *
   * A citation that does not open is worse than no citation, because it looks
   * checked. This test cannot fetch anything, so it does the one thing a static
   * check can: it refuses the hosts already known to be unreachable, by name.
   * Adding a host here is cheap; finding out in a bug report is not.
   */
  it('refuses the hosts that are known not to serve a citation', () => {
    const blocked = ['pubmed.ncbi.nlm.nih.gov', 'nsca.com', 'mayoclinic.org', 'journals.lww.com', 'ovid.com', 'mdpi.com', 'link.springer.com', 'europepmc.org', 'journals.humankinetics.com', 'peerj.com']
    const bad = HOME_SOURCES.filter((s) => blocked.some((h) => s.url.includes(h))).map((s) => `${s.id} → ${s.url}`)
    expect(bad).toEqual([])
  })

  it('cites over https, with a publisher and a label on every row', () => {
    for (const s of HOME_SOURCES) {
      expect(s.url, s.id).toMatch(/^https:\/\//)
      expect(s.publisher.length, s.id).toBeGreaterThan(3)
      expect(s.label.length, s.id).toBeGreaterThan(20)
    }
  })

  it('leaves the cue citation empty where nothing publishes one, rather than borrowing', () => {
    // Conditioning is the honest empty: no reachable authority publishes cues
    // for a burpee or a jumping jack, so the view prints that instead of
    // lending a physical-activity guideline's authority to a form cue.
    expect(chapterFor('conditioning')!.cueSources).toEqual([])
    // And every other family does have one, or the field is pointless.
    for (const c of HOME_MANUAL.filter((x) => x.family !== 'conditioning')) {
      expect(c.cueSources.length, c.family).toBeGreaterThan(0)
    }
  })
})

describe('the manual makes no medical claim', () => {
  /**
   * Required rather than tasteful. Every "why" the cited sources give is
   * mechanical — where the load sits, which way the joint is travelling — and
   * none of them says a cue prevents an injury or that an error causes one. A
   * training page that starts diagnosing is inventing, and the invention is
   * invisible in a diff because it reads like coaching.
   *
   * `HOME_SAFETY` is exempt: it is the one place that is allowed to say the
   * word, and what it says is the NHS's own wording.
   */
  const forbidden = ['prevent injur', 'avoid injur', 'injury risk', 'will injure', 'damages the', 'diagnos', 'treats ', 'cures ', 'heal ', 'tear the', 'rupture']

  it('never says a cue prevents an injury or an error causes one', () => {
    const prose = [
      ...HOME_MANUAL.flatMap((c) => [c.blurb, c.mistake, ...c.setup, ...c.execution, ...c.progress, c.cueNote ?? '']),
      ...HOME_GOALS.flatMap((g) => [g.aim, g.effort, g.sets, g.reps, g.rest]),
      ...HOME_LEVERS.map((l) => l.body),
      ...HOME_PRINCIPLES.map((p) => p.body),
      ...HOME_EQUIPMENT.map((e) => e.spec),
      ...HOME_ROUTINES.map((r) => r.how),
    ]
    const hits = prose.flatMap((p) => {
      const low = p.toLowerCase()
      return forbidden.filter((f) => low.includes(f)).map((f) => `"${f}" in: ${p.slice(0, 70)}…`)
    })
    expect(hits).toEqual([])
  })

  it('still tells you to stop if something hurts, in the NHS wording', () => {
    expect(HOME_SAFETY.stop).toContain('Stop the exercise immediately')
    expect(HOME_SAFETY.sources.length).toBeGreaterThan(0)
  })
})

describe('routines read the library rather than restating it', () => {
  it('points only at movements that exist', () => {
    const missing = HOME_ROUTINES.flatMap((r) => r.items.filter((id) => !exerciseById(id)).map((id) => `${r.id} → ${id}`))
    expect(missing).toEqual([])
  })

  it('names each movement once per routine', () => {
    for (const r of HOME_ROUTINES) expect(new Set(r.items).size, r.id).toBe(r.items.length)
  })

  it('is a session, not a single exercise', () => {
    for (const r of HOME_ROUTINES) expect(r.items.length, r.id).toBeGreaterThanOrEqual(5)
  })

  it('carries no reps of its own — the library decides those', () => {
    // If a routine ever gains a reps field, this is where it should be argued.
    // Two opinions about what a push-up set is diverge within a month, and the
    // page would show whichever one it happened to read.
    for (const r of HOME_ROUTINES) {
      expect(r.items.every((i) => typeof i === 'string'), r.id).toBe(true)
    }
  })

  it('has one routine runnable with nothing at all', () => {
    const bodyweight = HOME_ROUTINES.filter((r) =>
      r.items.every((id) => exerciseById(id)!.equipment === 'none'))
    expect(bodyweight.length).toBeGreaterThan(0)
  })
})

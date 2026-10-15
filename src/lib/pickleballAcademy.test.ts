import { describe, expect, it } from 'vitest'
import {
  ACADEMY_DRILLS, ACADEMY_LEVELS, DRILL_FIXES, MINDSET, TECHNIQUES, TWELVE_WEEK,
  ACADEMY_TOTAL_WEEKS, levelForRating,
} from './pickleballAcademy'
import { COURT_INJURIES, PROTECTIVE_GEAR, SAFETY_SOURCES, WARMUP, sourceSearchUrl } from './pickleballSafety'

/**
 * THE CONTENT GATE.
 *
 * Nothing else can catch what this catches. `tsc` proves a field exists and is
 * a string; it cannot prove the string says anything, and an empty string
 * renders as a silent gap in the middle of a card. The precedent is
 * `lib/pullups.test.ts`, written after a pass rewrote a view's lists inline
 * and `PULLUP_WORKOUTS` quietly went from fourteen formats to three with every
 * check green — an export nobody imports is not an error, and a field nobody
 * fills is not either.
 *
 * So: every record carries every scenario field, and no scenario field is a
 * stub. The counts are asserted too, for the same reason that file gives — a
 * list that shrinks is invisible on screen.
 */

/** Long enough to be a sentence about a situation, not a placeholder. */
const MIN = 40

describe('the scenario fields are filled, not merely typed', () => {
  /**
   * NO PARAGRAPHS IN THE UI. Asked for directly — "I don't think people love
   * to read paragraphs" — and it is now a rule in CLAUDE.md. A field people
   * read on a card is a list of points; this asserts the points exist and are
   * not fragments, which is the half a type cannot check.
   */
  it('every mindset principle says when it happens and what to do', () => {
    expect(MINDSET).toHaveLength(16)
    for (const m of MINDSET) {
      expect(m.when.length, `${m.title} · when`).toBeGreaterThan(MIN)
      expect(m.do.length, `${m.title} · do`).toBeGreaterThan(MIN)
      // "Stay calm" is not a move. A `do` that never names an action is the
      // failure this content was written to replace.
      expect(m.do, `${m.title} · do is the same text as why`).not.toBe(m.why)
    }
  })

  it('every level says how you know you are here and the one thing that moves you', () => {
    expect(ACADEMY_LEVELS).toHaveLength(5)
    for (const l of ACADEMY_LEVELS) {
      // Points, not a paragraph (CLAUDE.md's writing rule). Two or more, and
      // each one a real line rather than a fragment left over from a split.
      expect(l.youAreHere.length, `${l.name} · youAreHere points`).toBeGreaterThanOrEqual(2)
      for (const t of l.youAreHere) expect(t.length, `${l.name} · "${t}"`).toBeGreaterThan(12)
      expect(l.unlock.length, `${l.name} · unlock`).toBeGreaterThan(MIN)
      expect(l.skills.length, `${l.name} · skills`).toBeGreaterThanOrEqual(5)
    }
  })

  it('every shot says when to choose it, and that is not what the shot is', () => {
    expect(TECHNIQUES).toHaveLength(14)
    for (const t of TECHNIQUES) {
      expect(t.when.length, `${t.name} · when points`).toBeGreaterThanOrEqual(2)
      for (const line of t.when) expect(line.length, `${t.name} · "${line}"`).toBeGreaterThan(12)
      expect(t.when, `${t.name} · when duplicates what`).not.toContain(t.what)
      expect(t.how.length, `${t.name} · how`).toBeGreaterThanOrEqual(2)
    }
  })

  it('every drill group the data uses has a symptom, and none is orphaned', () => {
    const used = [...new Set(ACADEMY_DRILLS.map((d) => d.skill))]
    expect(used.length).toBeGreaterThanOrEqual(8)
    // Both directions. A missing key renders nothing (the dead-field trap);
    // an extra key is a group that was renamed in one place and not the other.
    expect(used.filter((g) => !DRILL_FIXES[g]), 'drill groups with no symptom line').toEqual([])
    expect(Object.keys(DRILL_FIXES).filter((k) => !used.includes(k)), 'symptom lines for groups that no longer exist').toEqual([])
  })

  it('the twelve-week roadmap is still twelve weeks with drills and a goal', () => {
    expect(TWELVE_WEEK).toHaveLength(ACADEMY_TOTAL_WEEKS)
    for (const w of TWELVE_WEEK) {
      expect(w.drills.length, `week ${w.week}`).toBeGreaterThanOrEqual(2)
      expect(w.goal.length, `week ${w.week} · goal`).toBeGreaterThan(10)
    }
  })
})

describe('the safety content', () => {
  it('every injury names the moment, the mechanism, and when to stop', () => {
    expect(COURT_INJURIES).toHaveLength(6)
    for (const x of COURT_INJURIES) {
      // `where` is the whole point of the rewrite — "protect the ankles" is
      // true and unusable; the shot you were playing is the trainable part.
      expect(x.where.length, `${x.id} · where points`).toBeGreaterThanOrEqual(2)
      expect(x.mechanism.length, `${x.id} · mechanism points`).toBeGreaterThanOrEqual(2)
      for (const t of [...x.where, ...x.mechanism]) expect(t.length, `${x.id} · "${t}"`).toBeGreaterThan(12)
      expect(x.now.length, `${x.id} · now`).toBeGreaterThanOrEqual(1)
      expect(x.prevent.length, `${x.id} · prevent`).toBeGreaterThanOrEqual(2)
      // The only near-instruction in the file, and the one that must never be
      // empty: a scenario with no red flags reads as "this is always fine".
      expect(x.redFlags.length, `${x.id} · redFlags`).toBeGreaterThanOrEqual(2)
    }
  })

  it('the warm-up is a sequence, and every block says which injury it is for', () => {
    expect(WARMUP.length).toBeGreaterThanOrEqual(6)
    for (const w of WARMUP) {
      expect(w.how.length, `${w.name} · how`).toBeGreaterThan(20)
      expect(w.why.length, `${w.name} · why`).toBeGreaterThan(20)
    }
  })

  it('every piece of gear states its limit', () => {
    // A claim with no limit is marketing. The knee sleeve is the reason this
    // assertion exists: it helps, and it does not stabilise a ligament.
    for (const g of PROTECTIVE_GEAR) expect(g.limit.length, `${g.item} · limit`).toBeGreaterThan(20)
  })

  it('every source is credited and its link is built from its own name', () => {
    expect(SAFETY_SOURCES.length).toBeGreaterThanOrEqual(4)
    for (const s of SAFETY_SOURCES) {
      const url = sourceSearchUrl(s.name, s.topic)
      expect(url.startsWith('https://'), s.name).toBe(true)
      // Built, never pinned — the whole point. If the name is not in the URL,
      // somebody has pinned a page, and a pinned page rots.
      expect(decodeURIComponent(url), s.name).toContain(s.name)
    }
  })
})

describe('levelForRating', () => {
  it('puts a rating on the rung whose band contains it', () => {
    expect(levelForRating(2.1).id).toBe('beginner')
    expect(levelForRating(3.0).id).toBe('novice')
    expect(levelForRating(3.4).id).toBe('intermediate')
    expect(levelForRating(4.0).id).toBe('advanced')
    expect(levelForRating(4.9).id).toBe('pro')
  })

  it('leaves no gap between the rungs', () => {
    // The bands have to cover the whole line: a rating of 2.9 belongs
    // somewhere, and `undefined` is not an answer a ladder can draw.
    for (let r = 0; r <= 6; r += 0.05) expect(levelForRating(Number(r.toFixed(2))), `rating ${r}`).toBeTruthy()
    for (let i = 0; i < ACADEMY_LEVELS.length - 1; i++) {
      expect(ACADEMY_LEVELS[i].band[1], `${ACADEMY_LEVELS[i].id} → ${ACADEMY_LEVELS[i + 1].id}`)
        .toBe(ACADEMY_LEVELS[i + 1].band[0])
    }
  })

  it('the demo seed lands inside a band and not on an edge', () => {
    // A seed sitting on a boundary makes the marked rung depend on whether the
    // comparison is inclusive, which is a test's job to pin and a seed's job
    // not to lean on.
    const seeded = 3.4
    const lvl = levelForRating(seeded)
    expect(seeded).toBeGreaterThan(lvl.band[0])
    expect(seeded).toBeLessThan(lvl.band[1])
  })
})

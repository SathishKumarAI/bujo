import { describe, expect, it } from 'vitest'
import { COACH_SESSIONS, COACH_TAGS, movesOf, setsOf, isSuperset, type Move } from './coachSessions'

/**
 * COD-302. These counts are the point of the file.
 *
 * `CLAUDE.md` records a pass that added "cards from the training guide" to
 * `views/Pullups.tsx` by rewriting the lists INLINE rather than reading
 * `lib/pullups.ts`: `PULLUP_WORKOUTS` fell from fourteen formats to three and
 * `PULLUP_PROGRESSIONS` from nine to seven, with `tsc`, eslint, vitest and the
 * build all clean — an export nobody imports is not an error, and the page
 * still rendered a plausible-looking list.
 *
 * This data is a record of what a coach actually prescribed. It is not
 * recoverable from a rendered page, and `docs/workouts/coach-sessions.md` is
 * the only other copy. So the numbers get asserted.
 */
const all = COACH_SESSIONS.flatMap(movesOf)

describe('the coach sessions survive intact', () => {
  it('holds all 29 sessions', () => {
    expect(COACH_SESSIONS).toHaveLength(29)
  })

  it('gives every session a unique id and a title', () => {
    expect(new Set(COACH_SESSIONS.map((s) => s.id)).size).toBe(29)
    for (const s of COACH_SESSIONS) {
      expect(s.id, s.title).toMatch(/^cs-\d\d$/)
      expect(s.title.length, s.id).toBeGreaterThan(3)
      expect(s.tags.length, s.id).toBeGreaterThan(0)
    }
  })

  it('has not quietly lost moves', () => {
    // A floor, not an exact count: adding a session should not fail this, but
    // halving the file must.
    expect(all.length).toBeGreaterThanOrEqual(280)
  })

  it('keeps every move traceable to the coach\'s own words', () => {
    // `raw` is the audit trail for the ambiguous notation. A move without it
    // is a number nobody can check.
    for (const mv of all) {
      expect(mv.name.length, JSON.stringify(mv)).toBeGreaterThan(1)
      expect(mv.raw.length, mv.name).toBeGreaterThan(0)
    }
  })

  /**
   * The ambiguity this whole file exists to resolve. The rule is "whichever
   * number would be absurd as a set count is the reps", so no move may end up
   * with an implausible set count — that is exactly what a backwards reading
   * produces (`Leg extension 5x15` read as 15 sets of 5).
   */
  it('never resolves a prescription into an absurd number of sets', () => {
    const absurd = all.filter((mv) => mv.sets != null && mv.sets > 6)
    expect(
      absurd.map((mv) => `${mv.name} "${mv.raw}" → ${mv.sets} sets`),
      'a set count above 6 almost always means reps and sets were read backwards',
    ).toEqual([])
  })

  it('never resolves one into an absurd number of reps either', () => {
    // 50 jumping jacks is real; 150 of anything is a misread.
    const absurd = all.filter((mv) => mv.reps != null && mv.reps > 50)
    expect(absurd.map((mv) => `${mv.name} "${mv.raw}" → ${mv.reps} reps`)).toEqual([])
  })

  /**
   * A move with no reps, no time, no scheme and no marker is a name with
   * nothing to do — which is how a half-transcribed line hides.
   *
   * Three things legitimately carry no number and are excluded by shape rather
   * than by name, so the check keeps biting:
   *
   * - **Warm-ups** are instructions ("Legs warmup cheyu"), not prescriptions.
   * - **Superset members** hold their set count on the block, not the move.
   * - **`noCount`** is the explicit "the coach wrote no number here" marker.
   *
   * The first draft of this test failed on 24 moves, every one of them
   * correct — the predicate was wrong, not the data. Worth keeping the shape
   * that caught them rather than deleting the assertion.
   */
  it('gives every main-list move a way to be performed, or says it has none', () => {
    const mains = COACH_SESSIONS.flatMap((s) =>
      s.main.flatMap((b) => (isSuperset(b) ? [] : [b])))
    const empty = mains.filter((mv: Move) =>
      mv.reps == null && mv.seconds == null && mv.minutes == null
      && mv.scheme == null && mv.toFailure !== true && mv.minReps == null
      && mv.sets == null && mv.noCount !== true)
    expect(empty.map((mv) => `${mv.name} "${mv.raw}"`)).toEqual([])
  })

  it('keeps the count-less lines to the two the thread really has', () => {
    // If this grows, something was transcribed lazily rather than faithfully.
    const declared = all.filter((mv) => mv.noCount)
    expect(declared.map((mv) => mv.name)).toEqual(['Shrugs', 'Bench tricep dips'])
  })
})

describe('the shapes the old model could not express', () => {
  it('carries supersets with the set count on the pair', () => {
    const supersets = COACH_SESSIONS.flatMap((s) => s.main.filter(isSuperset))
    // Sessions 7, 15 and 23 pair movements under one set count.
    expect(supersets.length).toBeGreaterThanOrEqual(7)
    for (const b of supersets) {
      expect(b.moves.length, 'a superset pairs at least two moves').toBeGreaterThanOrEqual(2)
      expect(b.sets).toBeGreaterThan(0)
    }
  })

  it('carries the pyramid and the drop set as schemes, not rep counts', () => {
    const schemes = all.filter((mv) => mv.scheme)
    expect(schemes.map((mv) => mv.scheme)).toContain('pyramid')
    expect(schemes.map((mv) => mv.scheme)).toContain('dropset')
    // Both must explain themselves — a scheme with no note is unusable.
    for (const mv of schemes) expect(mv.note ?? '', mv.name).not.toBe('')
  })

  it('carries "to failure" and "must reach" as floors, not targets', () => {
    const failure = all.filter((mv) => mv.toFailure)
    expect(failure).toHaveLength(1)
    expect(failure[0].minReps).toBe(25)
    // Session 28's "20reps ravali 3sets" is a floor without being to failure.
    expect(all.filter((mv) => mv.minReps != null).length).toBeGreaterThanOrEqual(2)
  })

  it('keeps the twelve named cardio finishers', () => {
    const withFinisher = COACH_SESSIONS.filter((s) => s.finisher.length > 0)
    expect(withFinisher).toHaveLength(12)
    for (const s of withFinisher) {
      for (const f of s.finisher) expect(f.minutes, `${s.id} ${f.name}`).toBeGreaterThan(0)
    }
  })
})

describe('derived helpers never become a second list', () => {
  it('derives the tags from the sessions', () => {
    expect(COACH_TAGS.length).toBeGreaterThan(5)
    for (const t of COACH_TAGS) {
      expect(COACH_SESSIONS.some((s) => s.tags.includes(t))).toBe(true)
    }
  })

  it('counts sets with a superset counting once, not twice', () => {
    const s7 = COACH_SESSIONS.find((s) => s.id === 'cs-07')!
    // Five supersets (4+4+3+4+3 = 18) plus shrugs 3, hanging leg raises 3,
    // knee tucks 3 = 27. The point is that a superset of two moves adds its
    // own set count once, not once per move.
    expect(setsOf(s7)).toBe(27)
  })

  it('expands supersets in order when flattening', () => {
    const s7 = COACH_SESSIONS.find((s) => s.id === 'cs-07')!
    const names = movesOf(s7).map((mv) => mv.name)
    expect(names.indexOf('Seated cable rowing')).toBeLessThan(names.indexOf('Side lateral raises'))
    expect(names).toContain('Knee tucks')
  })
})

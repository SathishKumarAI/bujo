import { describe, expect, it } from 'vitest'
import {
  HOME_EXERCISES, EQUIPMENT_ORDER, FAMILY_LABEL,
  exerciseById, exercisesForKit, filterExercises, musclesOf, progressionChain,
  demoUrl, searchUrl,
  type Family,
} from './homeExercises'

/**
 * These counts are a GATE, not trivia. `views/Pullups.tsx` once had "cards from
 * the training guide" added to it by rewriting the lists inline (531596f),
 * which cut `PULLUP_WORKOUTS` from fourteen to three and `PULLUP_PROGRESSIONS`
 * from nine to seven. `tsc -b`, eslint, vitest and the build were all clean,
 * because an export nobody imports is not an error, and the page still rendered
 * a plausible list. `lib/pullups.test.ts` is the gate that exists so it cannot
 * happen twice; this is the same gate for this library.
 */
describe('the library is the data module, not a copy of it', () => {
  it('still carries every movement', () => {
    expect(HOME_EXERCISES.length).toBe(83)
  })

  it('carries every id exactly once', () => {
    const ids = HOME_EXERCISES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('covers all nine families and all eight equipment values', () => {
    const families = new Set(HOME_EXERCISES.map((e) => e.family))
    expect([...families].sort()).toEqual(Object.keys(FAMILY_LABEL).sort())
    const kit = new Set(HOME_EXERCISES.map((e) => e.equipment))
    expect([...kit].sort()).toEqual([...EQUIPMENT_ORDER].sort())
  })

  it('keeps the twenty-one movements the first version of this page shipped', () => {
    // The pass that expanded this library is exactly the pass that dropped
    // fourteen pull-up formats to three, so name them rather than counting.
    const original = [
      'pushup', 'kneepushup', 'pikepushup', 'squat', 'lunge', 'reverselunge',
      'wallsit', 'calfraise', 'glutebridge', 'donkeykick', 'plank', 'sideplank',
      'bicycle', 'russiantwist', 'superman', 'birddog', 'tricepdip',
      'jumpingjack', 'highknees', 'mountainclimber', 'burpee',
    ]
    expect(original.filter((id) => !exerciseById(id))).toEqual([])
  })

  it('gives every movement real coaching text, not a stub', () => {
    for (const e of HOME_EXERCISES) {
      expect(e.cues.length, e.id).toBeGreaterThanOrEqual(3)
      // A cue short enough to be a label is a stub. The shortest real one in
      // the file is ~40 characters.
      for (const c of e.cues) expect(c.length, `${e.id}: "${c}"`).toBeGreaterThan(25)
      expect(e.mistake.length, e.id).toBeGreaterThan(30)
      expect(e.how.length, e.id).toBeGreaterThan(25)
    }
  })
})

describe('progression chains', () => {
  it('points only at movements that exist', () => {
    const missing: string[] = []
    for (const e of HOME_EXERCISES) {
      if (e.easier && !exerciseById(e.easier)) missing.push(`${e.id}.easier=${e.easier}`)
      if (e.harder && !exerciseById(e.harder)) missing.push(`${e.id}.harder=${e.harder}`)
    }
    expect(missing).toEqual([])
  })

  it('never points a movement at itself', () => {
    for (const e of HOME_EXERCISES) {
      expect(e.easier, e.id).not.toBe(e.id)
      expect(e.harder, e.id).not.toBe(e.id)
    }
  })

  it('reads the same chain from either end of a linear one', () => {
    // hang → scapular pulls → negatives → chin-up → pull-up. The point of the
    // function is that holding the middle gives you the whole thing.
    const names = (id: string) => progressionChain(id).map((e) => e.id)
    const bar = ['deadhang', 'scapularpull', 'negativepullup', 'chinup', 'pullup']
    expect(names('negativepullup')).toEqual(bar)
    expect(names('deadhang')).toEqual(bar)
    expect(names('pullup')).toEqual(bar)
  })

  it('walks one path through a branch, and says which', () => {
    // The push family is a tree, not a line: a push-up progresses to a decline
    // push-up AND to a wide one, and both lead to the archer. So "the chain"
    // is the path through the movement you asked about, and two members of the
    // same tree can legitimately return different lists. Asserted rather than
    // left implicit, because the obvious expectation — that a chain is a set —
    // is wrong here and a later test written on that assumption would be
    // "fixed" by flattening the data.
    const names = (id: string) => progressionChain(id).map((e) => e.id)
    expect(names('pushup')).toEqual(['wallpushup', 'inclinepushup', 'kneepushup', 'pushup', 'declinepushup', 'archerpushup'])
    expect(names('widepushup')).toEqual(['wallpushup', 'inclinepushup', 'kneepushup', 'pushup', 'widepushup', 'archerpushup'])
  })

  it('terminates on every movement in the library', () => {
    // A chain is walked by following ids, so a data-entry mistake that pointed
    // two movements at each other would hang the page rather than fail a type.
    // The `seen` guard is what makes this pass; it is cheap to keep honest.
    for (const e of HOME_EXERCISES) {
      const chain = progressionChain(e.id)
      expect(chain.length, e.id).toBeGreaterThanOrEqual(1)
      expect(chain.length, e.id).toBeLessThanOrEqual(HOME_EXERCISES.length)
      expect(chain.map((c) => c.id)).toContain(e.id)
    }
  })

  it('is empty for an id the library does not carry', () => {
    expect(progressionChain('nosuchthing')).toEqual([])
  })
})

describe('muscles are delegated, never duplicated', () => {
  /**
   * `lib/exerciseMuscles.ts` is the app's one keyword table for name → wger
   * muscle ids, and its own docstring says a second table would drift inside a
   * month. So this library has no muscle field and `musclesOf` delegates — which
   * only works while every name here matches a rule there. This is that check.
   * When it fails, the fix is a rule in `exerciseMuscles.ts`, not a field here.
   */
  it('resolves every movement to primary muscles', () => {
    const unresolved = HOME_EXERCISES.filter((e) => {
      const w = musclesOf(e)
      return w == null || w.primary.length === 0
    }).map((e) => `${e.id} · ${e.name}`)
    expect(unresolved).toEqual([])
  })

  it('maps a pike push-up to the shoulders, not the chest', () => {
    // The generic `push-up` rule would claim this one, and it is the clearest
    // case of why the specific rules have to sit above the generic ones.
    const pike = exerciseById('pikepushup')!
    expect(musclesOf(pike)!.primary).toContain(2) // wger: shoulders
    expect(musclesOf(pike)!.primary).not.toContain(4) // wger: chest
  })

  it('maps a kettlebell swing to the hinge, not the shoulders', () => {
    const swing = musclesOf(exerciseById('kbswing')!)!
    expect(swing.primary).toEqual(expect.arrayContaining([8, 11])) // glutes, hamstrings
  })
})

describe('filters', () => {
  it('narrows on nothing when every facet is null', () => {
    expect(filterExercises({})).toHaveLength(HOME_EXERCISES.length)
  })

  it('intersects facets rather than unioning them', () => {
    const rows = filterExercises({ equipment: 'dumbbell', family: 'push' })
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expect(r.equipment).toBe('dumbbell')
      expect(r.family).toBe('push')
    }
  })

  it('always leaves the no-equipment movements available to an empty kit', () => {
    const none = exercisesForKit([])
    expect(none.length).toBeGreaterThan(20)
    expect(new Set(none.map((e) => e.equipment))).toEqual(new Set(['none']))
  })

  it('adds a kit item without losing the bodyweight ones', () => {
    const withBands = exercisesForKit(['band'])
    expect(withBands.length).toBeGreaterThan(exercisesForKit([]).length)
    expect(new Set(withBands.map((e) => e.equipment))).toEqual(new Set(['none', 'band']))
  })

  it('offers something at every difficulty for a bodyweight-only kit', () => {
    // The page's whole promise is "you can train with nothing", so a kit of
    // nothing having no advanced movement would be a real gap, not a nit.
    for (const d of ['beginner', 'intermediate', 'advanced'] as const) {
      expect(filterExercises({ equipment: 'none', difficulty: d }).length, d).toBeGreaterThan(0)
    }
  })
})

describe('video links come from lib/video', () => {
  it('builds a search when nothing is pinned', () => {
    const pushup = exerciseById('pushup')!
    expect(pushup.yt).toBeUndefined()
    expect(demoUrl(pushup)).toContain('youtube.com/results')
    expect(demoUrl(pushup)).toContain(encodeURIComponent('Push-ups proper form technique'))
    expect(searchUrl(pushup)).toContain(encodeURIComponent('how to Push-ups exercise'))
  })

  it('uses the pinned clip when one is set', () => {
    // No movement pins one today — a pin is a claim nothing offline can check.
    // The branch still has to work for the day somebody verifies one by hand.
    expect(demoUrl({ ...exerciseById('pushup')!, yt: 'abc123' })).toBe('https://www.youtube.com/watch?v=abc123')
  })
})

describe('every family label is used', () => {
  it('has no label for a family no movement belongs to', () => {
    const used = new Set(HOME_EXERCISES.map((e) => e.family))
    const unused = (Object.keys(FAMILY_LABEL) as Family[]).filter((f) => !used.has(f))
    expect(unused).toEqual([])
  })
})

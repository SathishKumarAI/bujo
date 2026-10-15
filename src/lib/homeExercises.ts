// Home-training exercise library for `views/HomeWorkout.tsx`.
//
// WHAT THIS FILE OWNS: the movements — name, family, equipment, difficulty,
// rep target, the ordered form cues, the one mistake people make, and the
// easier/harder neighbour that makes a chain out of the list.
//
// WHAT IT DOES NOT OWN:
// - **Muscles.** `lib/exerciseMuscles.ts` already maps a name to primary and
//   secondary wger muscle ids and has ~20 callers. A second table here would
//   drift inside a month — that module's own docstring says so — so `musclesOf`
//   below delegates to it, and `homeExercises.test.ts` asserts every movement
//   in this file resolves. When a new name does not, the fix is a rule in THAT
//   file, not a field in this one.
// - **Video links.** `lib/video.ts` builds them from a name.
// - **Programming prose, goals, routines, sources.** `lib/homeManual.ts`.
//
// On `yt`: no movement here pins one. A pinned id is a claim that a specific
// clip exists and teaches this, and nothing offline can check it — a dead pin
// is worse than a search, because a search always lands somewhere useful. The
// field stays for the day someone verifies one by hand.

import { videoUrl, videoSearchUrl } from './video'
import { muscleWorkFor, type MuscleWork } from './exerciseMuscles'
import type { WorkoutSet } from './types'

export type Muscle = 'chest' | 'legs' | 'glutes' | 'core' | 'back' | 'shoulders' | 'arms' | 'full body' | 'cardio'

/**
 * What you need in the room. `none` is the floor and your own weight.
 *
 * `chair` is separate from `bench` on purpose: every home has a chair and a
 * bench is a purchase, so a filter that merges them tells someone with neither
 * that half the library is open to them.
 */
export type Equipment = 'none' | 'chair' | 'bar' | 'bench' | 'dumbbell' | 'band' | 'kettlebell' | 'rope'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

/**
 * The movement family — the unit the manual teaches in.
 *
 * Cues belong to a family, not to a variation: the set-up for a push-up is the
 * set-up for a decline push-up and for a dumbbell floor press, and writing it
 * out three times is how three copies come to disagree. Nine families, which
 * is why the manual is a rail rather than nine folds (`docs/PAGE-SHAPE.md`).
 */
export type Family = 'push' | 'overhead' | 'pull' | 'row' | 'squat' | 'lunge' | 'hinge' | 'core' | 'conditioning'

export const FAMILY_LABEL: Record<Family, string> = {
  push: 'Horizontal push',
  overhead: 'Vertical push',
  pull: 'Vertical pull',
  row: 'Horizontal pull',
  squat: 'Squat',
  lunge: 'Single leg',
  hinge: 'Hip hinge',
  core: 'Core',
  conditioning: 'Conditioning',
}

/**
 * The same nine, short enough for a chip row.
 *
 * Only the four push/pull families are abbreviated, and only the direction is:
 * `Horizontal push` is 15 characters of which 10 are the word everybody can see
 * from the group's own legend. The other five are already short, and a `Cond.`
 * saves four characters at the cost of a word nobody says out loud.
 *
 * **The full name is never lost.** `ChipPick` takes a visible `label`, a `name`
 * for the accessible name and a `hint` for the hover title — all three are
 * passed, so the chip reads `H push`, announces "Horizontal push", and says the
 * same on hover. A shortened label that is only shortened is a shortened *name*.
 */
export const FAMILY_SHORT: Record<Family, string> = {
  push: 'H push',
  overhead: 'V push',
  pull: 'V pull',
  row: 'H pull',
  squat: 'Squat',
  lunge: 'Single leg',
  hinge: 'Hip hinge',
  core: 'Core',
  conditioning: 'Conditioning',
}

/**
 * Chip order: the two pushes, then the two pulls, then legs, then the rest.
 *
 * `Object.keys(FAMILY_LABEL)` gave `H push · V push · V pull · H pull`, which
 * alternates direction in the middle of the row and reads as a mistake once the
 * labels are abbreviated. Pairing by movement instead means the row scans as
 * three groups — push, pull, legs — with no heading needed to say so.
 */
export const FAMILY_ORDER: Family[] = [
  'push', 'overhead', 'row', 'pull', 'squat', 'lunge', 'hinge', 'core', 'conditioning',
]

export interface HomeExercise {
  id: string
  name: string
  /** Which muscle filter this sits under. The detail comes from `musclesOf`. */
  muscle: Muscle
  family: Family
  equipment: Equipment
  difficulty: Difficulty
  /** One-line form cue — what the library tile shows without being opened. */
  how: string
  /** Ordered coaching cues. The order is the instruction: brace before you move. */
  cues: string[]
  /** The one error that makes this movement stop working. */
  mistake: string
  /** Sensible default rep/time target shown when adding to a session. */
  reps: string
  /** Id of the regression — the same movement with less of it. */
  easier?: string
  /** Id of the progression — the next version of the same movement. */
  harder?: string
  /** Optional pinned YouTube video id; when absent we use a search link. */
  yt?: string
}

/** Professional demo link — a pinned clip if set, else a proper-form search. */
export function demoUrl(ex: HomeExercise): string {
  return videoUrl(ex.name, ex.yt)
}

/** Always-available "find more" search link (the fallback the user asked for). */
export function searchUrl(ex: HomeExercise): string {
  return videoSearchUrl(ex.name)
}

/**
 * Sets and reps on a rep spec — `'3×12'`, `'3×10/side'`, `'5×60s'`.
 *
 * `/side` is **not** doubled: three sets of ten per side is three sets, and the
 * per-side detail stays in the stored line where a human reads it. A time hold
 * (`'3×30s'`) returns no `reps` rather than `reps: 30` — thirty seconds is not
 * thirty repetitions, and `WorkoutSet` has nowhere to put a duration. It still
 * counts as a set, which is what the muscle analytics ask of it.
 *
 * Tolerant because the field is editable in the session card: anything it cannot
 * read is one set with no reps, so a free-typed "as many as possible" still
 * records that a set of this movement happened. The `s` must be adjacent to the
 * digits, or "3x12 slow" would log as a twelve-second hold.
 */
export function parseRepSpec(spec: string): { sets: number; reps?: number } {
  const m = spec.match(/(\d+)\s*[x×]\s*(\d+)(s)?/i)
  if (!m) return { sets: 1 }
  return { sets: Math.max(1, Number(m[1])), reps: m[3] ? undefined : Number(m[2]) }
}

/**
 * Structured rows for a built session — **one row per set**, which is the shape
 * `lib/fitness.ts` counts: `weeklySetsPerMuscle` adds one per row, so a grouped
 * `3×12` row would count as a single set everywhere downstream. Same convention
 * `lib/pullups.ts setLines` writes, for the same reason.
 *
 * Why this exists: `logSession` used to write `sets: ['Push-up 3×12']` and no
 * `setRows` at all, and `fitness.parseSet` requires an `@ <weight>` segment a
 * home line has never had — so it returned `null` for every one of them and
 * every muscle, volume and frequency analytic counted a home session as zero.
 * 83 movements, a session builder, and nothing downstream could see any of it.
 *
 * `weight: 0` because these are bodyweight: `sessionVolume` multiplies by it so
 * a home session adds no load volume, and `exerciseProgression`/`e1rmProgression`
 * both skip a zero. All three are right — the set COUNT is what was missing.
 *
 * Both writers call this, `views/HomeWorkout.tsx logSession` and the demo seed
 * in `lib/demo.ts`. Two writers each holding their own opinion of the stored
 * shape is a bug this repo has already shipped twice.
 */
export function homeSetRows(items: { name: string; reps: string }[]): WorkoutSet[] {
  return items.flatMap(({ name, reps }) => {
    const spec = parseRepSpec(reps)
    return Array.from({ length: spec.sets }, () => ({
      exercise: name, reps: spec.reps, weight: 0, kind: 'working' as const,
    }))
  })
}

/**
 * The movements themselves live in `./homeExerciseData` and are re-exported
 * here, so every call site keeps one import. The split is the 500-line ceiling
 * in `~/coding/CLAUDE.md`, by concern: this file is types and behaviour, that
 * one is the list you append to.
 */
export { HOME_EXERCISES } from './homeExerciseData'
import { HOME_EXERCISES } from './homeExerciseData'

/** One movement by id, or `undefined` for an id this library does not carry. */
export function exerciseById(id: string): HomeExercise | undefined {
  return HOME_EXERCISES.find((e) => e.id === id)
}

/**
 * Muscles this movement works — delegated, never duplicated.
 *
 * `lib/exerciseMuscles.ts` already answers this for any name in the app, with
 * primary/secondary roles and wger's own muscle ids, and the 2D map and the 3D
 * view both read those numbers. A per-exercise field here would be a second
 * opinion about the same fact, which is the mistake its own docstring warns
 * about. `homeExercises.test.ts` asserts every name in this file resolves, so
 * "the table has nothing to say about this one" fails the suite rather than
 * rendering a blank body.
 */
export function musclesOf(ex: HomeExercise): MuscleWork | null {
  return muscleWorkFor(ex.name)
}

/**
 * The full easier → harder chain this movement sits in, in order.
 *
 * Walks `easier` to the bottom and `harder` to the top, so a movement in the
 * middle of a chain still returns the whole thing and the view does not have to
 * know which end it is holding.
 *
 * **Ceiling: the data is a tree, so this is a path and not a set.** A push-up
 * progresses to a decline push-up *and* to a wide one, and both lead to the
 * archer, so `progressionChain('pushup')` and `progressionChain('widepushup')`
 * legitimately differ — each is the path through the movement you asked about.
 * `homeExercises.test.ts` asserts both, so nobody "fixes" the data to make an
 * accidental symmetry assumption pass.
 *
 * Cycle-guarded by the visited set: a data-entry mistake that pointed two
 * movements at each other would otherwise hang the page rather than fail a type.
 */
export function progressionChain(id: string): HomeExercise[] {
  const start = exerciseById(id)
  if (!start) return []
  const seen = new Set<string>([id])
  const back: HomeExercise[] = []
  for (let cur = start.easier; cur && !seen.has(cur); cur = exerciseById(cur)?.easier) {
    const ex = exerciseById(cur)
    if (!ex) break
    seen.add(cur)
    back.unshift(ex)
  }
  const fwd: HomeExercise[] = []
  for (let cur = start.harder; cur && !seen.has(cur); cur = exerciseById(cur)?.harder) {
    const ex = exerciseById(cur)
    if (!ex) break
    seen.add(cur)
    fwd.push(ex)
  }
  return [...back, start, ...fwd]
}

/**
 * The library, narrowed. `null` on a facet means "do not narrow by it".
 *
 * One function rather than a filter per facet because the view offers three
 * at once, and three independent `.filter()` chains at the call site is how a
 * fourth facet gets added to two of them.
 */
export function filterExercises({ muscle = null, equipment = null, difficulty = null, family = null }: {
  muscle?: Muscle | null
  equipment?: Equipment | null
  difficulty?: Difficulty | null
  family?: Family | null
}): HomeExercise[] {
  return HOME_EXERCISES.filter((e) =>
    (muscle == null || e.muscle === muscle) &&
    (equipment == null || e.equipment === equipment) &&
    (difficulty == null || e.difficulty === difficulty) &&
    (family == null || e.family === family))
}

/** Every equipment value actually present, in the declared order. */
export const EQUIPMENT_ORDER: Equipment[] = ['none', 'chair', 'bar', 'bench', 'dumbbell', 'band', 'kettlebell', 'rope']

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  none: 'Nothing',
  chair: 'Chair or step',
  bar: 'Pull-up bar',
  bench: 'Bench',
  dumbbell: 'Dumbbells',
  band: 'Resistance band',
  kettlebell: 'Kettlebell',
  rope: 'Jump rope',
}

/** What you can train with only what the filter says you own. */
export function exercisesForKit(owned: Equipment[]): HomeExercise[] {
  const kit = new Set<Equipment>([...owned, 'none'])
  return HOME_EXERCISES.filter((e) => kit.has(e.equipment))
}

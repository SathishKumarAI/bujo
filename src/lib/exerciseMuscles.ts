import { musclesForExercise as flatMuscles } from './fitness'

/**
 * WHICH MUSCLES AN EXERCISE WORKS · offline, for any name you can type.
 *
 * The app already had anatomy art (`components/MuscleMap.tsx`, 776KB of wger
 * SVG, bundled) and a muscle list (`lib/muscles.ts`), and no way to connect
 * either to an exercise you actually logged:
 *
 * - `Gym` highlighted `musclesForSplit(split)` — the whole of "push", never
 *   the lift in front of you.
 * - `ExerciseDB` had per-exercise muscles, but only from `WgerExercise` — a
 *   **network** result. Offline, and for every name in the local
 *   `EXERCISE_LIBRARY`, there was nothing.
 *
 * So "I picked Tricep Extension, show me the triceps" had no data behind it at
 * all. This is that data, and it is the part that makes the 3D view mean
 * something rather than being a rotating mannequin.
 *
 * **Keyword rules, not an exercise table.** Same approach as
 * `lib/exerciseInfo.ts` next door, and for the same reason: people type
 * "incline dumbbell press", "DB bench", "close grip bench" — a table of exact
 * names matches none of those, and the library is user-extendable anyway.
 * First rule that matches wins, so the list is ordered most-specific first.
 *
 * Ids are wger's, the ones `MUSCLES` in `lib/muscles.ts` already uses, so the
 * existing 2D map and the new 3D view read the same numbers.
 */

/** wger muscle ids, named — so the rules below are readable. */
export const M = {
  biceps: 1,
  shoulders: 2,
  serratus: 3,
  chest: 4,
  triceps: 5,
  abs: 6,
  calves: 7,
  glutes: 8,
  traps: 9,
  quads: 10,
  hamstrings: 11,
  lats: 12,
  brachialis: 13,
  obliques: 14,
  soleus: 15,
} as const

export interface MuscleWork {
  /** Prime movers — what the exercise is FOR. */
  primary: number[]
  /** Assisting and stabilising. Shown dimmer, because they are working less. */
  secondary: number[]
}

const RULES: { match: string[]; work: MuscleWork }[] = [
  // ── Most specific first: "close grip bench" is a triceps lift, and would
  //    otherwise be caught by the generic `bench` rule below it. ──
  { match: ['close grip bench', 'close-grip bench'], work: { primary: [M.triceps], secondary: [M.chest, M.shoulders] } },
  { match: ['skull crusher', 'tricep', 'triceps', 'pushdown', 'push-down', 'french press', 'kickback', 'overhead extension'], work: { primary: [M.triceps], secondary: [M.shoulders] } },
  { match: ['dip'], work: { primary: [M.triceps, M.chest], secondary: [M.shoulders] } },

  { match: ['hammer curl', 'zottman'], work: { primary: [M.brachialis, M.biceps], secondary: [] } },
  { match: ['curl'], work: { primary: [M.biceps], secondary: [M.brachialis] } },

  { match: ['lateral raise', 'side raise'], work: { primary: [M.shoulders], secondary: [M.traps] } },
  { match: ['face pull', 'rear delt', 'reverse fly'], work: { primary: [M.shoulders, M.traps], secondary: [M.lats] } },
  { match: ['overhead press', 'ohp', 'shoulder press', 'military press', 'push press', 'arnold'], work: { primary: [M.shoulders], secondary: [M.triceps, M.traps, M.abs] } },
  { match: ['upright row', 'shrug'], work: { primary: [M.traps], secondary: [M.shoulders] } },

  { match: ['incline'], work: { primary: [M.chest, M.shoulders], secondary: [M.triceps] } },
  { match: ['fly', 'flye', 'pec deck', 'cable crossover'], work: { primary: [M.chest], secondary: [M.shoulders] } },
  { match: ['bench', 'chest press', 'push up', 'push-up', 'pushup'], work: { primary: [M.chest], secondary: [M.triceps, M.shoulders] } },

  { match: ['pull-up', 'pullup', 'chin-up', 'chinup', 'lat pulldown', 'pulldown', 'pull-down', 'dead hang', 'negatives', 'scapular'], work: { primary: [M.lats], secondary: [M.biceps, M.brachialis, M.traps] } },
  { match: ['pullover'], work: { primary: [M.lats], secondary: [M.chest, M.triceps] } },
  { match: ['row'], work: { primary: [M.lats, M.traps], secondary: [M.biceps, M.brachialis] } },

  { match: ['romanian deadlift', 'rdl', 'stiff leg', 'stiff-leg', 'good morning'], work: { primary: [M.hamstrings, M.glutes], secondary: [M.lats, M.abs] } },
  { match: ['deadlift', 'rack pull'], work: { primary: [M.hamstrings, M.glutes, M.traps], secondary: [M.lats, M.quads, M.abs] } },
  { match: ['hip thrust', 'glute bridge'], work: { primary: [M.glutes], secondary: [M.hamstrings] } },
  { match: ['leg curl', 'hamstring curl', 'nordic'], work: { primary: [M.hamstrings], secondary: [M.calves] } },
  { match: ['leg extension'], work: { primary: [M.quads], secondary: [] } },
  { match: ['squat', 'leg press', 'lunge', 'step up', 'step-up', 'split squat', 'pistol'], work: { primary: [M.quads, M.glutes], secondary: [M.hamstrings, M.abs, M.calves] } },
  { match: ['calf', 'heel raise'], work: { primary: [M.calves, M.soleus], secondary: [] } },
  { match: ['hyperextension', 'back extension'], work: { primary: [M.glutes, M.hamstrings], secondary: [M.lats] } },

  { match: ['russian twist', 'woodchop', 'side bend', 'oblique'], work: { primary: [M.obliques], secondary: [M.abs] } },
  { match: ['plank', 'hollow', 'leg raise', 'l-sit', 'sit-up', 'situp', 'crunch', 'ab wheel', 'dead bug', 'mountain climber'], work: { primary: [M.abs], secondary: [M.obliques, M.serratus] } },

  { match: ['burpee', 'thruster', 'clean', 'snatch', 'turkish'], work: { primary: [M.quads, M.glutes, M.shoulders], secondary: [M.abs, M.traps, M.hamstrings] } },
  { match: ['run', 'sprint', 'jog', 'cycle', 'bike', 'row erg', 'jump rope', 'skipping'], work: { primary: [M.quads, M.calves], secondary: [M.hamstrings, M.glutes] } },
  { match: ['swim'], work: { primary: [M.lats, M.shoulders], secondary: [M.abs, M.triceps] } },
]

/**
 * Muscles worked by an exercise name, or `null` when nothing matches.
 *
 * **`null`, not an empty result.** "We do not know this lift" and "this lift
 * works no muscles" are different answers, and the caller renders them
 * differently — an unknown name should say so rather than draw a grey body
 * that looks like a verdict.
 */
export function muscleRolesFor(name: string): MuscleWork | null {
  const n = name.toLowerCase().trim()
  if (!n) return null
  for (const r of RULES) if (r.match.some((m) => n.includes(m))) return r.work
  return null
}

/**
 * Every muscle an exercise touches, primary first.
 *
 * **Falls back to `lib/fitness.musclesForExercise`,** which already keyword-
 * matched exercise names to muscle ids before this module existed and has
 * ~20 callers. Two independent keyword tables would drift within a month —
 * this one exists only to add the *roles* the flat list cannot express
 * (a close-grip bench is triceps-primary, chest-secondary; the flat list says
 * only "both"). Where these rules have nothing to say, the older table still
 * answers, and its answer is treated as all-primary because that is exactly
 * as much as it knows.
 */
export function allMusclesForExercise(name: string): number[] {
  const w = muscleRolesFor(name)
  if (w) return [...w.primary, ...w.secondary]
  return flatMuscles(name)
}

/** Roles if we have them; otherwise the older flat table, as all-primary. */
export function muscleWorkFor(name: string): MuscleWork | null {
  const w = muscleRolesFor(name)
  if (w) return w
  const flat = flatMuscles(name)
  return flat.length ? { primary: flat, secondary: [] } : null
}

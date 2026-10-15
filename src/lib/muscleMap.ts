// Exercise name → wger muscle ids, by keyword. A LEAF: it imports nothing from
// this folder, and that is the whole point of the file existing.
//
// WHAT THIS FILE OWNS: the substring table and the matcher over it.
//
// WHY IT IS NOT IN `fitness.ts` ANY MORE: `exerciseMuscles.ts` holds a curated
// per-movement roles table and uses this matcher as its own fallback, so it
// imported `fitness`. That made `fitness` → `exerciseMuscles` a cycle, and
// `fitness` needs to reach the roles table for the 32 of 83 home movements this
// keyword table cannot name at all (COD-316). Moving the matcher down a level
// turns the cycle into a line: fitness → exerciseMuscles → muscleMap.
//
// Nothing moved inside the block below. It is the same table and the same
// matcher, byte for byte, so no number this app has ever printed changes
// because of this file.

// Map an exercise name to wger muscle ids by keyword. Specific keys first so
// "leg curl" doesn't also match "curl". Works for our library + wger names.
const MUSCLE_KEYWORDS: [string, number[]][] = [
  ['leg press', [10, 8]],
  ['leg curl', [11]],
  ['leg extension', [10]],
  ['hip thrust', [8, 11]],
  ['romanian', [11, 8]],
  ['deadlift', [11, 8, 9, 12, 10]],
  ['bench', [4, 2, 5]],
  ['incline', [4, 2, 5]],
  ['chest', [4, 2, 5]],
  ['push-up', [4, 2, 5]],
  ['pushup', [4, 2, 5]],
  ['dip', [4, 5, 2]],
  ['overhead', [2, 5, 9]],
  ['shoulder press', [2, 5, 9]],
  ['military', [2, 5, 9]],
  ['lateral raise', [2]],
  ['front raise', [2]],
  ['tricep', [5]],
  ['pull-up', [12, 1, 9]],
  ['pullup', [12, 1, 9]],
  ['chin', [12, 1]],
  ['pulldown', [12, 1]],
  ['row', [12, 9, 1]],
  ['face pull', [2, 9]],
  ['bicep', [1, 13]],
  ['curl', [1, 13]], // after leg curl
  ['squat', [10, 8, 11]],
  ['lunge', [10, 8, 11]],
  ['calf', [7, 15]],
  ['plank', [6, 14]],
  ['crunch', [6]],
  ['lat', [12]],
  ['glute', [8]],
  ['quad', [10]],
  ['hamstring', [11]],
  ['trap', [9]],
  ['shrug', [9]],
  ['delt', [2]],
  ['shoulder', [2]],
  ['pec', [4]],
]

/**
 * wger muscle ids worked by an exercise name (best-effort keyword match).
 * Keywords are ordered specific→general; a matched keyword is consumed so a
 * shorter substring (e.g. "curl" inside "leg curl") can't double-match.
 *
 * **Matched at a word boundary, not as a bare substring.** A plain `includes`
 * read "chin" out of the middle of "ma·chin·e", so every machine exercise
 * reported Lats and Biceps — "Machine chest press" highlighted the back on a
 * push day. Only the *leading* edge is anchored, so the plurals the table
 * relies on ("triceps", "lats", "delts", "pecs") still match.
 */
const boundary = (kw: string) => new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g')

export function musclesForExercise(name: string): number[] {
  let n = name.toLowerCase()
  const ids = new Set<number>()
  for (const [kw, m] of MUSCLE_KEYWORDS) {
    const consumed = n.replace(boundary(kw), ' ')
    if (consumed !== n) {
      m.forEach((id) => ids.add(id))
      n = consumed
    }
  }
  return [...ids]
}

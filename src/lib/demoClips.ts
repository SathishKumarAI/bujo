// A pinned form-demo clip for a lift, found by its NAME. Owns the catalogue and
// the name matching; does not build URLs (`lib/video.ts` does) or render
// anything (`components/VideoLink.tsx`).
//
// The catalogue is the whole Videos tab of ChadMollickDotCom
// (youtube.com/@ChadMollickDotCom), 65 clips, chosen by the owner 2026-10-29.
// Each is a short, single-lift demo titled with the lift's plain name, which is
// what a "watch how" link wants and what a search often does not return.
//
// This is the one place the repo pins video ids, against `video.ts`'s own rule
// that pinned ids rot. It holds because nothing breaks when one does:
// `videoUrl` only reaches for a clip here, and a name with no clip — or a clip
// that is taken down — still has the search. If a clip dies, delete its row.
//
// Matching is EXACT after normalising (case, punctuation, plurals, DB/EZ), plus
// a hand-checked alias list. Never fuzzy: a wrong demo is worse than a search,
// and "Front squats" (a barbell lift) is not the Smith-machine front squat here
// even though every word matches. Leave a name out rather than guess.

/** Title as the channel spells it (typos included), and the video id. */
export const DEMO_CLIPS: readonly (readonly [title: string, id: string])[] = [
  ['Bench Dip', 'RWwVKsXnSVg'],
  ['Body Weight Crunch', 'z6LRile4YiE'],
  ['Body Weight Pushup', 'i_dDCs2CcD4'],
  ['Body Weight Reverse Crunch', 'YDvaOlhaA1U'],
  ['Box Jump', 'uf9LGXfQ_1Y'],
  ['Box Step-Up', '5kO1l2DimYc'],
  ['Cable Curl', 'DSz3qg_FJFo'],
  ['Cable Decline Press', 'mZWhDtuTtOw'],
  ['Cable Drag Curl', '3ib-M9kKSvU'],
  ['Cable Press Down', '9KduWK4QGxg'],
  ['Cable Reverse Push Down', 'kuSFFIY4MpU'],
  ['Decline Bench Reverse Crunch', '6w30ZwGS7uI'],
  ['Decline Bench Sit-Up', 'YSQ6w0YynpI'],
  ['Dropset Explained', 'ZoGi7vyuTFo'],
  ['Dual Cable Crossover', '1TePkEq43XU'],
  ['Dumbbell Pull Over', 'ziQjOthccIs'],
  ['Dumbbell Squat', 'eRyV7lmmK8k'],
  ['Easy Bar Reverse Curl', 'kPXvDlFNb3s'],
  ['Easy Bar Standing Curl', 'ecYVja6rzvc'],
  ['Exercise Ball Back Extension', 'WAKmar2JoVU'],
  ['Exercise Ball Crunch', 'Yam1AHpSqqM'],
  ['Exercise Ball Knee Tuck', 'WhC9EcbyEzo'],
  ['Flat Dumbbell Fly', 'o-2l5tklWjQ'],
  ['Flat Dumbbell Press', 'nMZyhKF5g48'],
  ['Front Cable Raise', 'hBf1E1CUOws'],
  ['Front Deltoid Plate Raise', 'hikbChhbeLI'],
  ['Front Overhead Lateral Pulldown', 'c38zwsnr6uI'],
  ['Hanging Leg Raise', '3MVS21BhdEc'],
  ['Incline Dumbbell Press', '-t7yCaj1fkI'],
  ['Inverted Row', 'HRk37Dpy7CQ'],
  ['Kneeling Lat Pull', 'Yw0Sf6mNGFM'],
  ['Lying Easy Curl Tricep Extension', 'jmg7iyCiwMY'],
  ['Machine Calf Press', 'SuzObm3U5GE'],
  ['Machine Leg Press', 't5Y7p1LcM5Q'],
  ['Narrow Underhand Grip Lat Pull', '4iz80wiTRjw'],
  ['One Arm Dumbbell Row', 'zhQQ7lyBXtk'],
  ['Overhand Barbell Row', 'H8S2EiQi3Fo'],
  ['Overhead Cable Tricep Extension', 'ns-RGsbzqok'],
  ['Overhead Dumbbell Extension', 'IV7SekKI7Ns'],
  ['Overhead Easy Curl Bar Extension', 'aNgaeq7iEZw'],
  ['Plank', 'C8kjpC1n96o'],
  ['Rack Chin', 'vcWleBeSjes'],
  ['Reverse Cable Curl', 'HwB-DevuJjU'],
  ['Romanian Dumbbell Deadlift', 'nXZ9prr2qVM'],
  ['Seated Dumbbell Curl', 'BsULGO70tcU'],
  ['Seated Dumbbell Front Raise', 'vMfLbnc-xhs'],
  ['Seated Dumbbell Hammer Curl', 'BbxA1QF3TxY'],
  ['Seated Dumbbell Rear Delt Raise', 'p1yQnTNE808'],
  ['Seated Miltary Dumbbell Press', 'WMvbYow942A'],
  ['Smith Machine Barbell Shrug', 'cT5_GyOXIgE'],
  ['Smith Machine Decline Press', '7z0i0uFIOTM'],
  ['Smith Machine Front Squat', 'ZycG46U0kE8'],
  ['Smith Machine Incline Press', 'RD6QkPCYO-M'],
  ['Smith Machine Lunge', 'KlSn8ABffAI'],
  ['Smith Machine Shoulder Press', 'Pbc3_K5pSXE'],
  ['Smith Machine Squat', 'iNQU9T_FcjU'],
  ['Standing Calf Raise', 'k67UjgvJdEk'],
  ['Standing Dumbbell Front Raise', 'Q7G67jq9rjM'],
  ['Standing Dumbbell Hammer Curl', 'VXj0Zx4v5go'],
  ['Standing Dumbbell Lateral Raise', 'pOmbQuGeHf8'],
  ['Standing Dumbbell Row', 'pTT_MCK0L90'],
  ['Standing Dumbbell Shrug', '9LNcILnLRZk'],
  ['Standing Rear Delt Dumbbell Raise', 'WPaVyXi03Rk'],
  ['Underhand Barbell Row', 'tBo2jn-wyXk'],
  ['Walking Lunge', 'oN1uZAt9aYk'],
]

/**
 * Names the app uses → the clip title they mean. Every key is a name that
 * appears in `lib/programs.ts` or `lib/fitness.ts` `EXERCISE_LIBRARY`, or is the
 * plain name someone types; each checked by hand against the clip. Plurals and
 * case are already handled by `normaliseLift`, so one spelling is enough.
 */
const ALIASES: Record<string, string> = {
  'Push-up': 'Body Weight Pushup',
  'Triceps pushdown': 'Cable Press Down',
  'DB pullover': 'Dumbbell Pull Over',
  'EZ-bar curls': 'Easy Bar Standing Curl',
  'Flat dumbbell flys': 'Flat Dumbbell Fly',
  'Front raise w/ plate': 'Front Deltoid Plate Raise',
  'Lat Pulldown': 'Front Overhead Lateral Pulldown',
  'Wide-grip lat pulldown': 'Front Overhead Lateral Pulldown',
  'Wide-grip lat pull-down': 'Front Overhead Lateral Pulldown',
  'Triceps skull crusher': 'Lying Easy Curl Tricep Extension',
  'Leg press': 'Machine Leg Press',
  'Barbell Row': 'Overhand Barbell Row',
  'Triceps DB overhead ext': 'Overhead Dumbbell Extension',
  'Planks (Tabata 20s/10s)': 'Plank',
  'Romanian Deadlift': 'Romanian Dumbbell Deadlift',
  'Bicep Curl': 'Seated Dumbbell Curl',
  'Dumbbell curls': 'Seated Dumbbell Curl',
  'Dumbbell shoulder press': 'Seated Miltary Dumbbell Press',
  'Seated shoulder press': 'Seated Miltary Dumbbell Press',
  'Smith machine shrugs': 'Smith Machine Barbell Shrug',
  'Calf Raise': 'Standing Calf Raise',
  'Hammer curls': 'Standing Dumbbell Hammer Curl',
  'Lateral Raise': 'Standing Dumbbell Lateral Raise',
  'Dumbbell lateral raises': 'Standing Dumbbell Lateral Raise',
  'Dumbbell shrugs': 'Standing Dumbbell Shrug',
  'Supine-grip barbell rows': 'Underhand Barbell Row',
  'Lunge': 'Walking Lunge',
  'Dumbbell walking lunges': 'Walking Lunge',
}

/** Case, punctuation, a plural `s` and the DB/EZ shorthands stop mattering. */
export function normaliseLift(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bdb\b/g, 'dumbbell')
    .replace(/\bez[\s-]?bar\b|\beasy (curl )?bar\b/g, 'ez bar')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w.length > 2 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
    .join(' ')
}

const BY_NAME = new Map<string, string>(DEMO_CLIPS.map(([title, id]) => [normaliseLift(title), id]))
for (const [alias, title] of Object.entries(ALIASES)) {
  const id = BY_NAME.get(normaliseLift(title))
  if (id) BY_NAME.set(normaliseLift(alias), id)
}

/** The pinned demo id for a lift, or undefined when there is no clip for it. */
export function demoClipId(name: string): string | undefined {
  return BY_NAME.get(normaliseLift(name))
}

/** Every alias target, for the test that keeps the list honest. */
export const ALIAS_TARGETS = Object.values(ALIASES)

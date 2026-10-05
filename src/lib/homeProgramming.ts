// HOW TO PROGRAM HOME TRAINING · sets, reps, rest, the overload levers you have
// when you cannot add weight, the principles, the kit, and the ready-made
// sessions.
//
// Split from `lib/homeManual.ts` when the two together passed this repo's
// 500-line ceiling. The split is by concern and the line is clean: that file
// teaches a MOVEMENT (set-up, execution, the mistake, how to progress it); this
// one decides a SESSION and a WEEK. `HOME_SOURCES` and `sourceById` stay there
// and are imported here, because one citation ledger is the whole point of
// having one.
//
// Every number here is cited and every citation was fetched — see the long note
// on `HOME_SOURCES`. The famous ACSM 2009 rep/load/rest table is deliberately
// absent: it is paywalled and could not be read, so quoting it would be quoting
// a memory.

import type { EquipmentItem, Principle } from './pullups'

// ── Programming ──────────────────────────────────────────────────────────────

export interface Goal {
  id: 'strength' | 'hypertrophy' | 'endurance'
  label: string
  /** What you are actually chasing. */
  aim: string
  sets: string
  reps: string
  rest: string
  /** How hard each set should be, in words rather than RPE. */
  effort: string
  sources: string[]
}

/**
 * Sets, reps and rest by goal — only the figures that could be verified.
 *
 * The familiar ACSM 2009 table is not here, on purpose: it is paywalled (402)
 * and could not be read, so quoting it would be quoting a memory. These numbers
 * come from the 2026 ACSM update, the 2022 umbrella review, the 2021 tempo
 * review and the 2024 Bayesian rest meta-analysis, all of which are open.
 *
 * Note what the evidence does *not* say, because a training page that only
 * reports the tidy half is the kind people copy and then over-read:
 *
 * - **Rest is a small effect, not a big one.** The rest meta-analysis puts
 *   ≤60s at an effect size around 0.47 against >60s at around 0.55, and finds
 *   nothing more past 90s. It also notes this is inconsistent with the NSCA's
 *   own 30–90s hypertrophy prescription.
 * - **Volume has diminishing returns, and faster for strength than for size.**
 * - **Frequency, with weekly volume held equal, does not meaningfully change
 *   hypertrophy.** It is a way to fit the volume in, which is exactly what makes
 *   it useful at home.
 * - **The endurance row is a classification, not a prescription.** The only
 *   verified number in that band is the umbrella review's "<30% 1RM, >20 reps",
 *   which is how it labels the low-load zone — nobody open recommended it. The
 *   row says so rather than inventing a prescription to fill the gap.
 */
export const HOME_GOALS: Goal[] = [
  {
    id: 'strength', label: 'Strength', aim: 'Produce more force. The number on the dumbbell, or the first rep of a harder variation.',
    sets: '2–3 sets per exercise', reps: '1–5 reps at a heavy load (ACSM: around 80% of a one-rep max), or the hardest variation you can hold the shape in',
    rest: 'More than 60 seconds; nothing extra is gained past about 90',
    effort: 'Hard but short of failure. Leaving about three reps in reserve cuts the post-set velocity loss from roughly 25% to 8%, for far less fatigue and far less discomfort.',
    sources: ['acsm', 'tempo', 'rest', 'failure'],
  },
  {
    id: 'hypertrophy', label: 'Muscle size', aim: 'More muscle. The goal most home programmes are actually running, whether or not they say so.',
    sets: 'Around 10 sets per muscle per week; more does not clearly add, and as few as 4 still gives substantial gains',
    reps: '8–12 reps (40–70 seconds under tension) — but loads under 60% of a max match heavier ones *as long as the set goes close to failure*, which is what makes bodyweight work viable',
    rest: 'More than 60 seconds. The benefit over short rest is real and small.',
    effort: 'Close to failure. With a light load this is not optional — it is the condition under which light loads work at all.',
    sources: ['acsm', 'umbrella', 'doseresponse', 'rest'],
  },
  {
    id: 'endurance', label: 'High-rep / low-load', aim: 'Repeat the movement for longer. What circuits and most bodyweight work do by default.',
    sets: '2–3 circuits', reps: 'More than 20 reps, at under 30% of a one-rep max — the umbrella review\'s label for this band',
    rest: 'Short, or straight into the next movement',
    effort: 'Steady, ending with the shape intact. Flagged honestly: no source reachable here *prescribes* this band — it is described, and the aerobic guidelines are what actually justify circuit work.',
    sources: ['umbrella', 'pag', 'cdc'],
  },
]

export interface Lever {
  name: string
  body: string
}

/**
 * HOW TO PROGRESS WHEN YOU CANNOT ADD WEIGHT.
 *
 * This is the one thing a home programme needs that a gym programme does not.
 * Progressive overload is the requirement; load is only the most convenient way
 * to supply it, and at home it is the one you do not have. Ordered by how early
 * you should reach for each.
 */
export const HOME_LEVERS: Lever[] = [
  { name: 'More reps', body: 'The simplest. Keep the sets and the movement and add a rep or two per set per week until you reach the top of the range, then make the movement harder and start again at the bottom.' },
  { name: 'More sets', body: 'Weekly volume is the lever with the clearest dose–response for muscle size. Adding a fourth set to three movements is a bigger change than it looks.' },
  { name: 'Slower tempo', body: 'Three seconds down instead of one roughly triples the time the muscle spends under tension for the same rep count. It is free, and it is the first thing to try when reps have run away.' },
  { name: 'Pauses', body: 'A two-second hold at the hardest point of the range removes every bit of momentum from the rep. The bottom of a squat, the bottom of a push-up, the top of a row.' },
  { name: 'Worse leverage', body: 'Raise the feet, lower the hands, move the load further from the joint. The angle is the load in bodyweight training, and it adjusts in much finer steps than a dumbbell rack.' },
  { name: 'One side at a time', body: 'Half the limbs, the same body. A split squat is close to double a squat, and a one-arm row is the only way to make a row hard with a light dumbbell.' },
  { name: 'Longer range', body: 'Deficit push-ups between two chairs, a deeper squat, a full dead hang at the bottom of every pull. Range you do not train is range you do not keep.' },
  { name: 'Less rest', body: 'Last, and only for endurance and conditioning. Cutting rest makes a session harder without making you stronger, and it makes the strength and size work worse.' },
]

export const HOME_PRINCIPLES: Principle[] = [
  { name: 'Progressive overload', color: 'mauve', body: 'Something has to go up over time — reps, sets, tempo, leverage or range. A programme that repeats last month exactly is maintenance, and that is a valid choice as long as it is the choice you made.' },
  // Worth stating carefully, because the popular version of this is wrong and
  // the evidence is specific: with weekly volume held equal, frequency does not
  // meaningfully change hypertrophy. It is how you FIT the volume in, which at
  // home is the thing that decides whether the volume happens at all.
  { name: 'Frequency is how the volume fits', color: 'green', body: 'Split the week into two or three shorter sessions per muscle rather than one long one. Not because spreading it is a better stimulus — with weekly sets held equal it measurably is not — but because a 25-minute session at home is the one that actually happens. Two or more muscle-strengthening days a week is the public-health floor.' },
  { name: 'Quality is the rep, not the count', color: 'blue', body: 'A set ends when the shape breaks. Reps performed badly train the badly-performed version, and in bodyweight training the shape IS the load — a sagging plank is a lighter plank.' },
  { name: 'Push and pull in the same quantity', color: 'sky', body: 'Push needs nothing and pull needs a bar, so a home programme drifts push-heavy on its own. Count the sets, not the sessions.' },
  { name: 'Recover on purpose', color: 'peach', body: 'Leave a day between hard sessions for the same muscle, sleep, and eat enough. The training is the stimulus; the adaptation happens afterwards or not at all.' },
]

export const HOME_EQUIPMENT: EquipmentItem[] = [
  { item: 'Nothing', spec: 'Thirty-odd movements in this library need no equipment at all, at every difficulty from a wall push-up to a pistol squat. Start here and buy later.' },
  { item: 'A sturdy chair or step', spec: 'The highest-value thing you already own: incline and decline push-ups, dips, step-ups, Bulgarian split squats and elevated pike push-ups all come from it. Check it does not slide.' },
  { item: 'Resistance bands', spec: 'The cheapest way to add real load, and the only way to train rows and pulldowns without a bar. Pick the strength that lets you do 10–15 reps with the shape under control; colour schemes differ by brand, but lighter usually means easier. Hardest at the end of the range, which is the opposite of a dumbbell.', url: 'https://www.hss.edu/health-library/move-better/resistance-band-workout' },
  { item: 'Adjustable dumbbells', spec: 'The single best purchase if you make one. Load in small steps is what makes progressive overload simple instead of a puzzle, and they open the whole press, row, curl and hinge list.' },
  { item: 'One kettlebell', spec: 'A 12–16kg bell for most beginners, heavier for the swing than you would press. It buys the ballistic hinge — the swing — which nothing else in a house does.' },
  { item: 'A pull-up bar', spec: 'Doorway-mounted is the cheapest way in and its low height suits negatives and partials. See the Pull-ups page for heights and the full progression.' },
  { item: 'A bench', spec: 'Last. A chair covers most of what a bench does; buy one when the dumbbells are no longer the limit.' },
  { item: 'A jump rope', spec: 'The most conditioning per square metre of floor, and it packs into a pocket.' },
]

// ── Ready-made sessions ──────────────────────────────────────────────────────

export interface Routine {
  id: string
  name: string
  /** What it trains, for the chip hint. */
  focus: string
  /** What you need in the room. */
  needs: string
  /** How to run it. */
  how: string
  /**
   * Exercise ids, in order.
   *
   * **Ids only.** The reps come from `lib/homeExercises.ts` when a routine is
   * loaded, so a routine cannot carry its own private opinion of what a push-up
   * set is. That divergence is exactly the failure mode behind the pull-up
   * page's inline rewrite.
   */
  items: string[]
}

export const HOME_ROUTINES: Routine[] = [
  { id: 'fullbody', name: 'Full body · no kit', focus: 'Everything, nothing needed', needs: 'Nothing', how: 'Three rounds. Rest a minute between movements and two between rounds.',
    items: ['pushup', 'squat', 'reverselunge', 'glutebridge', 'superman', 'plank'] },
  { id: 'upper', name: 'Upper body', focus: 'Push and pull, matched', needs: 'A bar or a band', how: 'Three rounds, alternating a push with a pull so one rests while the other works.',
    items: ['pushup', 'invertedrow', 'pikepushup', 'bandrow', 'tricepdip', 'bandpullapart'] },
  { id: 'lower', name: 'Legs and hips', focus: 'Squat, hinge and single leg', needs: 'Nothing', how: 'Three rounds. The hinge movements come after the squats on purpose.',
    items: ['squat', 'splitsquat', 'slglutebridge', 'sidelunge', 'calfraise', 'wallsit'] },
  { id: 'core', name: 'Core · ten minutes', focus: 'Anti-movement, not sit-ups', needs: 'Nothing', how: 'Two rounds, 40 seconds on and 20 off. End a set when the shape breaks.',
    items: ['deadbug', 'plank', 'sideplank', 'birddog', 'hollowhold', 'lyinglegraise'] },
  { id: 'dumbbell', name: 'Dumbbell full body', focus: 'Loaded, in small steps', needs: 'Dumbbells', how: 'Three or four sets each, 8–12 reps, two minutes between sets.',
    items: ['dbbenchpress', 'dbrow', 'dbshoulderpress', 'dbrdl', 'dblunge', 'dbcurl'] },
  { id: 'conditioning', name: 'Conditioning · fifteen minutes', focus: 'Breathing work', needs: 'Nothing', how: 'Five rounds of 40 seconds on, 20 off. Stop the set when the landings get loud.',
    items: ['jumpingjack', 'highknees', 'mountainclimber', 'lateralskater', 'burpee'] },
  { id: 'beginner', name: 'First two weeks', focus: 'Learn the shapes', needs: 'A chair', how: 'Two rounds, 10 reps each, three days a week with a day between. Add a rep per set each session.',
    items: ['inclinepushup', 'chairsquat', 'reverselunge', 'glutebridge', 'deadbug', 'birddog'] },
]

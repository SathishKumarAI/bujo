// THE HOME-TRAINING MANUAL · how to perform each movement family, and the
// citation ledger the whole feature's numbers hang off.
//
// Companion to `lib/homeExercises.ts`, which owns the movements themselves, and
// to `lib/homeProgramming.ts`, which decides a session and a week (sets, reps,
// rest, overload levers, kit, routines). The line between this file and that
// one: **a chapter here teaches a movement; that file programs a week.**
//
// It is in `lib/` and not in `views/HomeWorkout.tsx` for the reason the
// workspace rule gives — constants live in one module — and for the sharper one
// this repo learned the hard way: a pass that "added cards from the training
// guide" to `views/Pullups.tsx` rewrote its lists inline and silently cut
// fourteen workout formats to three, with every gate green.
// `homeManual.test.ts` asserts these counts.
//
// **Sources are cited by id, on the thing they support, and separately for
// numbers and for cues** — see `HOME_SOURCES` and `ManualChapter.cueSources`.
// Nothing here makes a medical or injury claim; see `HOME_SAFETY` for where the
// line is and why.

import type { Family } from './homeExercises'

// ── Sources ──────────────────────────────────────────────────────────────────

export interface Source {
  id: string
  /** What it is, in the words someone would search for. */
  label: string
  publisher: string
  url: string
}

/**
 * Every claim in this file that is a *number* or a *guideline* traces to one of
 * these, and **every URL here was fetched and returned a readable 200.** That
 * is not pedantry: the first draft of this list cited five PubMed abstracts, the
 * NSCA's position-statement index and a Mayo Clinic article, and *none of them
 * is reachable* — PubMed serves a cookie wall with no abstract, nsca.com and
 * mayoclinic.org answer 403, and the ACSM position stand itself is paywalled at
 * 402 on journals.lww.com. A citation that does not open is worse than none: it
 * looks checked.
 *
 * The consequence is that the famous **ACSM 2009 table** (1–6 reps for
 * strength, 8–12 for hypertrophy, 10–25 for endurance; 2–3 min versus 1–2 min
 * rest) and the **"+2–10% load when you clear the target by 1–2 reps"** rule are
 * NOT in `HOME_GOALS`, despite being repeated everywhere. They could not be
 * verified, so what is quoted instead comes from the 2026 ACSM update and from
 * the meta-analyses, which are open.
 *
 * Form cues are a different kind of claim and are marked differently — see
 * `ManualChapter.cueSources`.
 */
export const HOME_SOURCES: Source[] = [
  { id: 'acsm', label: 'Resistance training guidelines update (2026 position stand) — loads, sets and weekly frequency per goal, and bodyweight/band training at home', publisher: 'American College of Sports Medicine', url: 'https://acsm.org/resistance-training-guidelines-update-2026/' },
  { id: 'acsmpa', label: 'Physical activity guidelines resources — the ACSM/AHA adult recommendation, including strength on two or more days a week', publisher: 'American College of Sports Medicine', url: 'https://acsm.org/education-resources/trending-topics-resources/physical-activity-guidelines/' },
  { id: 'pag', label: 'Physical Activity Guidelines for Americans — adult aerobic and muscle-strengthening targets, and the "start small and build up" progression', publisher: 'ODPHP, U.S. Dept. of Health & Human Services', url: 'https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines/about-physical-activity-guidelines/questions-answers' },
  { id: 'cdc', label: 'How much physical activity do adults need?', publisher: 'U.S. Centers for Disease Control and Prevention', url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html' },
  { id: 'nhs', label: 'Physical activity guidelines for adults aged 19 to 64', publisher: 'NHS (UK)', url: 'https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/' },
  { id: 'nhsflex', label: 'Strength and Flex exercise plan — press-up, squat, pull-up, bench dip and calf raise, with the NHS safety wording', publisher: 'NHS (UK)', url: 'https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan-how-to-videos/' },
  { id: 'nhsstrength', label: 'Strength exercises — mini-squat, calf raise, wall press-up and leg raises, and "build up slowly"', publisher: 'NHS (UK)', url: 'https://www.nhs.uk/live-well/exercise/strength-exercises/' },
  { id: 'umbrella', label: 'Resistance-training variables for hypertrophy and strength: an umbrella review of 14 meta-analyses (178 studies, 4,784 participants)', publisher: 'Frontiers in Sports and Active Living', url: 'https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2022.949021/full' },
  { id: 'doseresponse', label: 'Resistance-training volume and frequency dose–response, with diminishing returns (67 studies, 2,058 participants)', publisher: 'SportRxiv — Pelland, Remmert, Robinson, Hinson & Zourdos', url: 'https://sportrxiv.org/index.php/server/preprint/view/460' },
  { id: 'rest', label: 'Inter-set rest and hypertrophy — a Bayesian meta-analysis (Singer et al., 2024)', publisher: 'Frontiers in Sports and Active Living', url: 'https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/full' },
  { id: 'failure', label: 'Training to failure versus leaving reps in reserve — fatigue and perceptual cost (Refalo et al., 2023)', publisher: 'Sports Medicine – Open 9:10', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9908800/' },
  { id: 'tempo', label: 'Repetition tempo and time under tension per goal (Wilk, Zając & Tufano, 2021)', publisher: 'Sports Medicine', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8310485/' },
  { id: 'rom', label: 'Range of motion and training at long muscle lengths (Androulakis Korakakis, Wolf et al., 2023)', publisher: 'SportRxiv', url: 'https://sportrxiv.org/index.php/server/preprint/view/349' },
  { id: 'harvard', label: 'Modified front plank — form and the 15-second to two-minute progression', publisher: 'Harvard Health Publishing', url: 'https://www.health.harvard.edu/heart-health/move-of-the-month-modified-front-plank' },
  { id: 'hss', label: 'Resistance-band workout — picking a band strength, and 10–15 reps with control', publisher: 'Hospital for Special Surgery', url: 'https://www.hss.edu/health-library/move-better/resistance-band-workout' },
  { id: 'sferrors', label: 'Two common errors in a kettlebell swing set — stand a foot behind the bell, find the hinge before you reach', publisher: 'StrongFirst (Brett Jones)', url: 'https://www.strongfirst.com/2-common-errors-kettlebell-swing-set/' },
  { id: 'sfrhythm', label: 'Power and rhythm in the kettlebell swing — the two pauses, and the standing plank at the top', publisher: 'StrongFirst', url: 'https://www.strongfirst.com/power-rhythm-kettlebell-swing/' },
  // ACE's exercise library gives cues AND an explicit "do not" per movement,
  // which is the half most form writing leaves out. Each page is the source for
  // one family's `mistake` line below. Three of them describe a barbell variant
  // (row, forward lunge, calf raise) — `cueNote` says so at the call site,
  // because a citation that contradicts the exercise beside it is worse than
  // silence.
  { id: 'acepushup', label: 'Push-Up — bracing, hand position, and "do not allow your low back to sag or your hips to hike upwards"', publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/41/push-up/' },
  { id: 'aceohp', label: 'Seated Overhead Press — scapular position, and pressing without arching the low back', publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/45/seated-overhead-press/' },
  { id: 'acepullup', label: 'Pull-ups — depress and retract the scapulae, elbows at 3 and 9 o\'clock, and "avoid swinging your body"', publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/191/pull-ups/' },
  { id: 'acerow', label: 'Bent-over Row (barbell) — flat back, and pulling to the navel rather than the chest', publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/12/bent-over-row/' },
  { id: 'acesquat', label: 'Bodyweight Squat — hips back then down, knees over the second toe, and depth limited by the heels lifting or the torso rounding', publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/135/bodyweight-squat/' },
  { id: 'acelunge', label: 'Forward Lunge (barbell) — back knee almost to the floor, chest lifted', publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/8/forward-lunge/' },
  { id: 'acestepup', label: 'Step-Up — knee over the second toe, and "avoid pushing excessively with the trailing leg"', publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/28/step-up/' },
  { id: 'acerdl', label: 'The ACE Do It Better Series: the Romanian Deadlift — keep the bar against the body, and the three named errors (spinal rounding, mirror-gazing, squatting)', publisher: 'American Council on Exercise (Pete McCall)', url: 'https://www.acefitness.org/continuing-education/certified/may-2025/8865/the-ace-do-it-better-series-the-romanian-deadlift/' },
  { id: 'aceswing', label: 'Swing — sink back into the hips, and "the strength to move the weight should come from the legs and hips, NOT the shoulders"', publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/391/swing/' },
  { id: 'aceplank', label: 'Front Plank — stiffen the torso, shoulders over elbows, keep breathing, and avoid sagging or hiking', publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/32/front-plank/' },
  { id: 'acedeadbug', label: 'Supine Dead Bug — navel toward the spine without moving the hips or rib cage; the heel and hand touch lightly rather than rest', publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/147/supine-dead-bug/' },
  { id: 'acesideplank', label: 'Side Plank with Straight Leg — elbow under the shoulder, brace before lifting the hips', publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/101/side-plank-with-straight-leg/' },
  { id: 'acecalf', label: 'Calf Raises (barbell) — pause at the top, roll the heels slowly back down, pause again', publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/51/calf-raises/' },
  { id: 'acecarry', label: "Farmer's Carry — firm grip, arms at the sides, straight back, a pre-determined distance", publisher: 'American Council on Exercise', url: 'https://www.acefitness.org/resources/everyone/exercise-library/359/farmer-s-carry/' },
]

/** One source by id — `undefined` for an id nothing carries. */
export function sourceById(id: string): Source | undefined {
  return HOME_SOURCES.find((s) => s.id === id)
}

// ── The family chapters ──────────────────────────────────────────────────────

export interface ManualChapter {
  family: Family
  /** What this family is for, in one line. */
  blurb: string
  /** How to get into position. Ordered — the order is the instruction. */
  setup: string[]
  /** How to perform the rep. */
  execution: string[]
  /** The error that makes the whole family stop working, and why. */
  mistake: string
  /** How to make it harder, in the order you should reach for them. */
  progress: string[]
  /** Source ids backing the programming claims above. */
  sources: string[]
  /**
   * Source ids whose published cues and named error this chapter follows.
   *
   * **Separate from `sources` because it is a different kind of claim, and
   * empty is a real answer.** No reachable authority publishes cues for a pike
   * push-up, a Pallof press or a dip, and none publishes them for burpees or
   * jumping jacks — so `conditioning` carries none and the view says so out
   * loud. The alternative is citing a guideline next to a cue it does not
   * support, which is the citation equivalent of the `help ?? subtitle` trap:
   * it looks checked.
   */
  cueSources: string[]
  /** Where the cited source describes a different variant to the ones here. */
  cueNote?: string
}

export const HOME_MANUAL: ManualChapter[] = [
  {
    family: 'push',
    blurb: 'Pushing something away from your chest — the push-up and everything shaped like it.',
    setup: [
      'Hands under the shoulders, a little wider than them, fingers pointing forward and the weight spread through the whole hand rather than the heel of it.',
      'Set the body before the first rep: tuck the pelvis, brace the abs as if about to be poked, and squeeze the glutes. A push-up is a moving plank, and the plank has to exist first.',
      'Feet hip-width. Wider is more stable and easier; together is harder and reveals whether the brace is real.',
    ],
    execution: [
      'Lower by bending the elbows back at roughly 45° from the ribs, not flared straight out to the sides. The 45° position is the one the shoulder has room in.',
      'Take the chest to the floor — the chest, not the head. The neck stays in line with the spine the whole way.',
      'Press the floor away rather than lifting yourself up; it is the same movement and the cue produces a straighter body.',
      'Finish with the arms straight and the shoulder blades spread apart. That last inch is range most people never train.',
    ],
    mistake: 'Elbows at 90° to the body. It feels wider and stronger, the hands end up level with the shoulders instead of the lower chest, and it is the position where the shoulder joint has the least room to work in.',
    progress: [
      'Raise the hands to make it easier (wall, then a chair, then knees); raise the feet to make it harder. The angle is the load.',
      'Then slow the lowering phase to three seconds. More time under tension is a load increase you can make with no equipment at all.',
      'Then take the hands narrower (diamond) or wider (archer) to shift the work and shorten the base.',
      'Then make it one-sided — archer, then a one-arm push-up — or add the only real external load a home has: a band across the back, or dumbbells and a bench.',
    ],
    sources: ['acsm', 'umbrella', 'rom'],
    cueSources: ['acepushup', 'nhsstrength'],
  },
  {
    family: 'overhead',
    blurb: 'Pressing a load above your head. The family where keeping the ribs down matters most.',
    setup: [
      'Stand or kneel tall with the ribs stacked over the hips. Brace the abs and squeeze the glutes — without that, the lower back arches to find the overhead position and the press happens in the spine.',
      'Start with the hands at about ear height and the elbows slightly in front of the body rather than flared level with the shoulders.',
      'For a pike push-up, walk the feet in until the hips sit above the hands; the closer to vertical the torso is, the more of your weight is overhead.',
    ],
    execution: [
      'Press up and very slightly back, finishing with the weight over the ears rather than in front of the face.',
      'Keep the wrists stacked over the elbows. A bent-back wrist puts the load behind the forearm.',
      'Lower under control to the start; do not let the weight drop into the catch.',
    ],
    mistake: 'Leaning back to get the weight up. It turns an overhead press into a standing incline press and moves the work from the shoulders to the lower back.',
    progress: [
      'Band or dumbbell press first, because the load is adjustable in small steps.',
      'For bodyweight: incline pike, then pike, then feet elevated, then a wall handstand push-up. Hold a wall handstand for 30 seconds before attempting a rep of one.',
      'Add reps before you add difficulty, and add difficulty before you add range.',
    ],
    sources: ['acsm', 'acsmpa'],
    cueSources: ['aceohp'],
    cueNote: 'The cited cues describe a seated dumbbell press. No reachable authority publishes cues for a pike or handstand push-up — those here are standard coaching language, not a citation.',
  },
  {
    family: 'pull',
    blurb: 'Pulling your body up to a bar. The hardest family to start and the one with the most progressions.',
    setup: [
      'Full grip, pinky knuckle over the top of the bar, and grip hard — the grip is what the rest of the pull hangs off.',
      'Hang with the arms straight but the shoulders not shrugged up to the ears. Pull the arms down into the shoulder sockets.',
      'Tuck the pelvis and tighten the abs before you leave the floor. Legs together, toes pointed, head neutral.',
    ],
    execution: [
      'Start the pull by dropping the shoulder blades down and back — the opposite of a shrug — before the elbows bend at all.',
      'Pull with the elbows, driving them down toward the ribs. Thinking about the hands produces a shorter, jerkier rep.',
      'Chin all the way over the bar without craning the neck to get there.',
      'Lower completely to a full dead hang. Half a rep up is still a rep; half a rep down is a rep you did not do.',
    ],
    mistake: 'Stopping short at the bottom so the next rep starts from a bent arm. It hides the range you are actually missing, which is almost always the first third of the pull.',
    progress: [
      'Dead hang for time, then scapular pulls, then slow negatives from the top, then chin-ups, then pull-ups.',
      'A negative is the highest-value step: you are stronger lowering than lifting, so it trains the full range before you can pull it.',
      'Spread the volume across the day rather than into one set to failure — the dedicated Pull-ups page in this app carries the full programme.',
    ],
    sources: ['acsm', 'umbrella', 'doseresponse'],
    cueSources: ['acepullup', 'nhsflex'],
  },
  {
    family: 'row',
    blurb: 'Pulling toward your body horizontally. The half of the upper body that pushing ignores, and the reason posture changes when people start training.',
    setup: [
      'Hinge at the hips until the back is between 45° and parallel with the floor, knees soft, and hold that angle. The trunk holding the angle is most of the exercise.',
      'Let the arm hang straight down so the movement starts from full extension.',
      'For an inverted row, set the heels and squeeze the glutes so the body is one line before you pull.',
    ],
    execution: [
      'Begin by pulling the shoulder blade back, then bend the elbow.',
      'Row to the hip or the lower ribs rather than to the shoulder — the elbow should finish past the ribs.',
      'Return all the way to straight arms. The stretched position is where the work is.',
    ],
    mistake: 'Shrugging the shoulders up to the ears, or twisting the torso up with each rep. Both move the weight without the back doing the moving.',
    progress: [
      'Band row, then one-arm dumbbell row, then an inverted row under a bar or a table, then feet elevated.',
      'Match your weekly rowing sets to your pressing sets. A home programme drifts push-heavy because push needs nothing.',
    ],
    sources: ['acsm', 'doseresponse'],
    cueSources: ['acerow'],
    cueNote: 'The cited page describes a barbell bent-over row, rated advanced. The hinge, the flat back and pulling to the navel transfer to every version here; the load does not.',
  },
  {
    family: 'squat',
    blurb: 'Bending the knees and hips together under load. The pattern every other leg exercise is measured against.',
    setup: [
      'Feet about shoulder-width, toes forward or turned slightly out — whichever lets the knees track over them without the heels lifting.',
      'Brace the abs and set the chest before the first inch of movement.',
      'Hold a weight at the chest if you have one. Load in front keeps the chest up for you, which is why the goblet squat is the easiest version to do well.',
    ],
    execution: [
      'Break at the hips and knees together, sitting back and down at the same time.',
      'Let the knees travel forward over the toes. Keeping them behind the toes on purpose forces the back to take the angle instead.',
      'Keep the whole foot on the floor; the heel lifting is the depth limit for today.',
      'Go as deep as you can keep a flat back, then stand and finish with the hips under the ribs.',
    ],
    mistake: 'Chasing depth past where the lower back rounds. Depth is earned by ankles and hips that move, not by sinking further on a spine that has run out.',
    progress: [
      'Chair squat, then bodyweight, then a weight at the chest, then one leg at a time (split squat, then Bulgarian, then pistol).',
      'Slowing the descent to three seconds and pausing at the bottom are both load increases with no equipment.',
      'Single-leg work is where a home programme finds real load: half the legs, the same body.',
    ],
    sources: ['acsm', 'umbrella', 'tempo'],
    cueSources: ['acesquat', 'acecalf', 'nhsstrength'],
    cueNote: 'The calf-raise cues come from ACE\'s barbell version; the pause at the top and the slow return are the same without the bar.',
  },
  {
    family: 'lunge',
    blurb: 'One leg at a time. Where you can keep making legs harder after bodyweight squats stop being hard.',
    setup: [
      'Step far enough that both knees can reach about 90°. A short step leaves the front knee well ahead of the toes, which is where the load goes with it.',
      'Front shin close to vertical at the bottom, back heel up.',
      'Torso upright with the ribs over the hips.',
    ],
    execution: [
      'Lower straight down rather than forward. Think of the back knee dropping to the floor, not the chest travelling.',
      'Drive back up through the front heel and the whole foot.',
      'Keep the stance you set. Drifting forward a little each rep hands the work to the back leg.',
    ],
    mistake: 'Leaning the torso forward over the front leg. It feels easier because the lower back has taken over; the front leg gets less, not more.',
    progress: [
      'Reverse lunge first: the front shin stays vertical, so less of the load sits ahead of the knee.',
      'Then forward, then walking, then a back foot elevated (Bulgarian), then add dumbbells.',
      'Count reps per leg, not steps, or a set quietly becomes half a set.',
    ],
    sources: ['acsm', 'nhs'],
    cueSources: ['acelunge', 'acestepup'],
    cueNote: 'ACE\'s forward lunge is the barbell version. Its step-up page is unloaded, and is where "avoid pushing excessively with the trailing leg" comes from.',
  },
  {
    family: 'hinge',
    blurb: 'Hips back, back flat — the deadlift shape. The strongest pattern the body has and the one most often done as a squat by mistake.',
    setup: [
      'Stand tall, soft bend in the knees, and then that knee angle stops changing. The knees bending more is the tell that the hips have stopped moving.',
      'Find the shape without load first: stand a foot from a wall, push the hips back and touch it, keeping a flat back.',
      'For a kettlebell swing, stand about a foot behind the bell and find the hinge FIRST, then reach for the handle without losing it. Reaching first and hinging second is the error StrongFirst names before any other.',
    ],
    execution: [
      'Push the hips back and let the load travel down the legs, staying close to them.',
      'Stop where the hamstrings tighten or where the back starts to round, whichever comes first. That is your range today, and it gets longer.',
      'Stand by driving the hips forward and squeezing the glutes — not by pulling with the arms or the lower back.',
      'A swing is that hinge thrown fast: hike the bell back until the upper arms touch the ribs and the forearms touch the upper inner thighs, then snap the hips and let the bell float. The arms only steer.',
      'The top of a swing is a standing plank — tall, glutes and abs tight, not rounded in the upper back, soft in the hips, or arched in the lower back.',
    ],
    mistake: 'Squatting instead of hinging — bending the knees to lower the weight rather than pushing the hips back. With a kettlebell it shows up as lifting the bell with the shoulders, which is a front raise with a hinge attached.',
    progress: [
      'Bodyweight glute bridge, then one leg, then a hip thrust from a bench, then a Romanian deadlift with dumbbells, then single-leg.',
      'For power rather than strength, the kettlebell swing: a deadlift is the shape, the swing is the shape done fast.',
      'Hinge heavy is where a home gym runs out of load first. One kettlebell goes further here than anywhere else in this manual.',
    ],
    sources: ['acsm', 'umbrella'],
    cueSources: ['acerdl', 'aceswing', 'sferrors', 'sfrhythm'],
  },
  {
    family: 'core',
    blurb: 'Not bending. Most of what the trunk does is resist movement, which is why planks and dead bugs beat sit-ups for it.',
    setup: [
      'Find a neutral spine first: on your back, press the lower back into the floor and keep it there; in a plank, tuck the pelvis and pull the ribs down.',
      'Elbows under the shoulders for a plank; elbow under the shoulder for a side plank.',
      'Squeeze the glutes. It is the fastest way to stop the hips sagging and it is doing half the work.',
    ],
    execution: [
      'Hold the shape and breathe. Holding your breath is what makes a plank feel impossible before the muscles are tired.',
      'In the anti-movement exercises — dead bug, bird dog, Pallof press, suitcase carry — the set ends the moment the shape breaks, not when the clock does.',
      'In the flexion exercises — crunches, leg raises — move the ribs toward the hips rather than pulling on the head.',
    ],
    mistake: 'Holding a sagging plank for longer. Thirty honest seconds is worth more than two slack minutes, and the slack version trains the position you are trying to get away from.',
    progress: [
      'Shorten the lever or lengthen it: knees-down to knees-up, bent legs to straight legs, arms in to arms overhead.',
      'Then take a limb away (one-leg plank, side plank) or add rotation to resist (Pallof, suitcase carry).',
      'Then hang: hanging leg raises are the top of this family and need the bar.',
    ],
    sources: ['acsm', 'harvard'],
    cueSources: ['aceplank', 'acedeadbug', 'acesideplank', 'acecarry', 'harvard'],
    cueNote: 'Covers the plank, side plank, dead bug and carry. No reachable authority publishes cues for a Pallof press or a hanging leg raise — those here are standard coaching language.',
  },
  {
    family: 'conditioning',
    blurb: 'Breathing work. What covers the aerobic half of the activity guidelines when there is no room to run.',
    setup: [
      'Clear enough floor to land without clipping anything, and land on something with some give if you can.',
      'Start with two or three easy minutes of the same movement you are about to do fast.',
      'Decide the work and rest before you start. "As many as possible" is how a conditioning session becomes a bad strength session.',
    ],
    execution: [
      'Land on the whole foot with soft knees, and absorb each landing by bending the hips and knees.',
      'Keep the quality constant and end the set when it drops, rather than grinding out a target with a collapsing shape.',
      'Loud landings mean tired legs. That is the signal to stop the set.',
    ],
    mistake: 'Treating conditioning as the thing you do until you cannot. Intervals you can repeat tomorrow beat one session you need three days to recover from.',
    progress: [
      'Add rounds before you add intensity; add intensity before you add complexity.',
      'The guideline to aim at is 150–300 minutes a week of moderate aerobic activity, or 75–150 vigorous, plus muscle-strengthening on two or more days.',
      'Circuits of the strength movements count as both, which is what makes them worth the awkwardness.',
    ],
    sources: ['pag', 'cdc', 'nhs'],
    /* Deliberately empty. Nothing reachable publishes cues for a burpee, a
       jumping jack or a skater jump — the fitness bodies that do publish cues
       cover the resistance movements. The view prints that rather than
       borrowing a guideline citation to fill the row. */
    cueSources: [],
  },
]

/** The chapter for a family. Every family has one — asserted in the test. */
export function chapterFor(family: Family): ManualChapter | undefined {
  return HOME_MANUAL.find((c) => c.family === family)
}

// ── What this manual does not claim ──────────────────────────────────────────

/**
 * The boundary, stated in the data so the page can print it.
 *
 * **Nothing in this file claims that a cue prevents an injury, or that an error
 * causes one.** Every "why" here is mechanical — where the load sits, which way
 * the joint is travelling, what the muscle is doing — because that is the only
 * kind of "why" the sources above give. They are coaching and public-health
 * documents, not clinical ones, and the moment a training page starts
 * diagnosing it is making things up.
 *
 * The two sentences are the NHS's own wording, which is the plainest version of
 * this anyone publishes.
 */
export const HOME_SAFETY = {
  stop: 'Stop the exercise immediately if you feel any pain or become unwell.',
  ask: 'Get advice from a healthcare professional first if you are not sure the exercises suit your current fitness, if you have a health problem, an injury or any symptoms, or if you have had a recent health event.',
  sources: ['nhsflex', 'nhs'],
} as const


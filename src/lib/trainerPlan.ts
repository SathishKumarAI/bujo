// The gym trainer's plan — 25 sessions sent as chat messages (2024-02), one
// message per session, encoded as a program so the Program page can tick it.
//
// OWNS: the sessions as data. DOES NOT OWN: how a program is drawn or
// tracked (`lib/programs.ts`, `components/program/`).
//
// Each day runs in the order a session does — that order IS the structure:
//   1. `Warm-up: …`   — the bike / treadmill and mobility the message opens with
//   2. the main work  — a `Superset: A + B` row is two moves back to back, one
//                       set count (the same convention as the hypertrophy block)
//   3. `Finisher: …`  — the cardio the message ends with
//
// Editorial choices, so a reader can check them against the messages:
// - The trainer wrote `15x4` and `4x15` for the same thing; the bigger number
//   is the reps and the smaller the sets throughout (no set count here is over 5).
// - A missing number stays missing ("reps not given", 1 set) rather than being
//   borrowed from another day.
// - Messages that continue the one before ("Then pushups…") are merged, and the
//   four-message legs-and-biceps day is one day. 25 sessions, 5 per week.
// - Telugu / Hindi phrases are translated into the exercise; the trainer's
//   name is not stored.
// - A focus starts with a split word (Push, Pull, Legs, Upper, Full body) so
//   `splitForFocus` files the logged session under the right split.

import type { Program, ProgramDay, ProgramExercise } from './programs'

const ex = (name: string, qty: string, sets: number | string): ProgramExercise => ({ name, qty, sets: String(sets) })
/** Reps × sets. */
const r = (name: string, reps: number, sets: number) => ex(name, `${reps} reps`, sets)
/** A hold or a timed effort × sets. */
const t = (name: string, time: string, sets: number) => ex(name, time, sets)
const wu = (name: string, time = 'before you start') => ex(`Warm-up: ${name}`, time, 1)
const fin = (name: string, time: string) => ex(`Finisher: ${name}`, time, 1)
const ss = (a: string, b: string, sets: number, qty = 'each move') => ex(`Superset: ${a} + ${b}`, qty, sets)
const notGiven = (name: string, sets = 1) => ex(name, 'reps not given', sets)
const d = (day: number, focus: string, exercises: ProgramExercise[]): ProgramDay => ({ day, focus, exercises })

const SESSIONS: { focus: string; exercises: ProgramExercise[] }[] = [
  { focus: 'Pull · back & core', exercises: [
    r('Bird dogs', 10, 2), r('Superman back extension', 10, 2), r('Squat jumps', 15, 3), r('Pull-ups', 10, 3),
    r('Front lat pulldown', 15, 4), r('Close-grip lat pulldown', 15, 4), r('One-arm dumbbell row', 12, 3), r('Mid row', 15, 4),
    r('Abdominal crunches', 15, 3), t('Plank', '45 s', 2), fin('Treadmill', '30 min'),
  ] },
  { focus: 'Legs', exercises: [
    wu('Cycle', '15 min'), wu('Leg warm-up'),
    r('Squat jumps', 20, 3), r('Backward lunges', 10, 3), r('Leg press', 12, 4), r('Leg extension', 15, 5),
    r('Glute bridges', 20, 3), r('Calf raises', 20, 3), fin('Treadmill', '25 min'),
  ] },
  { focus: 'Upper · shoulders & triceps', exercises: [
    wu('General warm-up'), wu('Shoulder mobility stretches'),
    r('Burpees', 10, 3), r('Mountain climbers', 30, 3), t('Side plank', '30 s each side', 1),
    r('Dumbbell shoulder press', 15, 3), r('Dumbbell lateral raises', 12, 4), r('Plate front raise', 20, 3), notGiven('Shrugs'),
    r('Tricep rope pushdown', 15, 3), r('Overhead dumbbell press', 15, 4),
  ] },
  { focus: 'Legs & abs', exercises: [
    wu('Cycle', '10 min'), wu('Leg warm-up'),
    r('Basic squats', 20, 3), r('Leg extension', 15, 5), r('Outer thigh (hip abduction)', 15, 3), r('Weighted squats', 15, 4),
    r('Lying hamstring curl', 15, 4), r('Hanging leg raises', 12, 3), r('Abdominal crunches', 20, 4), r('Calf raises', 20, 4),
    fin('Treadmill', '25 min'),
  ] },
  { focus: 'Full body · conditioning', exercises: [
    r('Burpees', 10, 4), t('Battle rope', '30 s', 1), r('Alternating leg raises', 30, 4), r('Squat jumps', 20, 4),
    r('Mountain climbers', 30, 4), t('Plank', '45 s', 3), fin('Treadmill', '40 min'),
  ] },

  { focus: 'Push · chest & triceps', exercises: [
    wu('Cycle', '10 min'), ex('Warm-up: Push-ups', '10 reps', 3),
    r('Flat bench press', 15, 4), r('Incline dumbbell press', 15, 3), r('Flat dumbbell press', 12, 3), r('Cable crossover', 12, 3),
    r('Tricep rope pushdown', 15, 4), r('Overhead dumbbell extension', 15, 4), r('Tricep bench dips', 20, 3),
    fin('Treadmill', '30 min'),
  ] },
  { focus: 'Pull · back & shoulders', exercises: [
    wu('Cycle', '10 min'), wu('Shoulder mobility'),
    r('Pull-ups', 10, 3),
    ss('Seated cable row', 'side lateral raises', 4),
    ss('Front lat pulldown', 'dumbbell shoulder press', 4),
    ss('T-bar row', 'dumbbell bent-over flys', 3),
    ss('Close-grip lat pulldown', 'plate rotation', 4),
    ss('Chest-supported incline dumbbell row', 'alternating face pulls', 3),
    notGiven('Shrugs', 3), r('Hanging leg raises', 15, 3), r('Knee tucks', 20, 3),
    fin('Treadmill', '30 min'),
  ] },
  { focus: 'Push · chest & core', exercises: [
    wu('Cycle', '10 min'),
    r('Abdominal crunches', 20, 3), r('Basic push-ups', 20, 3), r('Burpees', 10, 4), r('Kettlebell swings', 25, 3),
    r('Incline dumbbell press', 15, 3), r('Flat dumbbell press', 12, 4), r('Cable crossover', 15, 3), r('Rope pushdown', 20, 3),
    r('Bar tricep extension', 15, 3), t('Plank', '45 s', 3), fin('Cross trainer', '25 min'),
  ] },
  { focus: 'Legs & shoulders', exercises: [
    wu('Cycle', '10 min'), wu('Leg and shoulder warm-up'),
    r('Basic squats', 20, 4), r('Seated shoulder press', 15, 4), r('Leg extension', 20, 5), r('Single-arm lateral raises', 15, 4),
    r('Walking lunges', 15, 3), r('Dumbbell front raises', 15, 3), r('Leg press', 20, 4), r('Face pulls', 20, 3),
    r('Lying leg curl', 15, 3), r('Calf raises', 20, 4), r('Shrugs', 20, 4), fin('Cross trainer', '20 min'),
  ] },
  { focus: 'Pull · back & biceps', exercises: [
    wu('Cycle', '10 min'), ex('Warm-up: Jumping jacks', '50 reps', 4),
    r('Pull-ups', 10, 3), r('T-bar row', 15, 3), r('Seated cable row', 15, 4), r('Front lat pulldown', 12, 4),
    r('Barbell bent-over row', 15, 3), r('Reverse-grip lat pulldown', 15, 3), r('EZ-bar close-grip curl', 15, 4),
    r('Incline dumbbell curls', 12, 3), r('Hammer curls', 15, 4), r('Bird dogs', 15, 4), t('Plank', '1 min', 3),
    fin('Treadmill', '30 min'),
  ] },

  { focus: 'Upper · shoulders & chest', exercises: [
    wu('Cycle', '10 min'), ex('Warm-up: Mountain climbers', '30 reps', 3), ex('Warm-up: Burpees', '10 reps', 4), wu('Shoulder mobility'),
    r('Hanging leg raises', 15, 3), r('Face pulls', 15, 3), r('Seated shoulder press', 15, 4), r('Side lateral raises', 15, 4),
    r('Barbell bent-over flys', 20, 3), r('Shrugs', 20, 3),
    r('Push-ups', 10, 4), r('Flat bench press', 15, 4), r('Cable crossover', 12, 3), r('Decline dumbbell press', 12, 3),
    r('Incline dumbbell flys', 15, 3), fin('Treadmill', '30 min'),
  ] },
  { focus: 'Legs', exercises: [
    r('Squat jumps', 20, 4), r('Backward lunges', 15, 3), r('Weighted squats', 12, 4), r('Leg press', 15, 5),
    r('Seated hamstring curl', 15, 3), r('Mountain climbers', 30, 4), r('Hanging leg raises', 15, 3), r('Calf raises', 20, 4),
  ] },
  { focus: 'Push · chest & triceps', exercises: [
    wu('Cycle', '15 min'),
    r('Push-ups', 10, 4), r('Incline dumbbell press', 15, 4), r('Cable crossover', 12, 3), r('Bench press', 12, 5),
    r('Parallel bar dips', 12, 3), r('Close-grip incline chest press', 15, 3), r('Tricep rope pushdown', 15, 4),
    r('Overhead dumbbell press', 20, 4), r('Tricep dips', 20, 4), r('Abdominal crunches', 20, 4), r('Hanging leg raises', 15, 3),
  ] },
  { focus: 'Upper · shoulders & triceps', exercises: [
    wu('Cycle', '20 min'), wu('Shoulders with 2 kg dumbbells'),
    r('Seated shoulder press', 15, 4), r('Standing dumbbell front raises', 12, 3),
    ex('Superset: Side lateral raises + rope pushdown', 'drop set on the last set', 1),
    r('Plate rotation', 20, 3), r('Upright row', 15, 3), r('Overhead dumbbell press', 20, 3),
    r('Flat bench dumbbell skull crusher', 20, 3), notGiven('Bench tricep dips'), fin('Cross trainer', '20 min'),
  ] },
  { focus: 'Full body · core & conditioning', exercises: [
    wu('Treadmill', '20 min'),
    r('Bird dogs', 10, 3), r('Superman extension', 15, 3), r('Squat jumps', 20, 4), r('Burpees', 10, 4),
    r('Kettlebell swings', 20, 4), r('Cable crunches', 20, 3), r('Toe touches', 20, 3), r('Shoulder taps', 20, 3),
    t('Side plank', '45 s', 3), fin('Cross trainer', '20 min'),
  ] },

  { focus: 'Full body · chest & legs', exercises: [
    r('Basic squats', 20, 3), r('Push-ups', 10, 3), r('Incline dumbbell press', 15, 3), r('Walking lunges', 15, 3),
    r('Cable crossover', 15, 3), r('Lying hamstring curl', 20, 4), r('Bench press', 15, 4), r('Leg press', 20, 4),
    r('Parallel bar dips', 10, 2), r('Bulgarian split squats', 12, 3), ex('Push-ups to failure', 'at least 25 reps', 1),
    r('Calf raises', 20, 3),
  ] },
  { focus: 'Upper · arms & conditioning', exercises: [
    wu('Cycle', '20 min'),
    r('Burpees', 10, 4), r('Mountain climbers', 30, 4), ex('Battle rope', '30 taps', 1), r('Decline crunches', 20, 4),
    ss('Push-ups', 'shoulder taps', 4, '20 reps'), r('EZ-bar bicep curl', 15, 3), r('Incline bicep curl', 15, 4),
    r('Hammer curls', 15, 4),
  ] },
  { focus: 'Pull · biceps & conditioning', exercises: [
    r('Squat jumps', 20, 4), r('Pull-ups', 10, 4), r('Mountain climbers', 30, 4), t('Battle rope', '40 s', 3),
    r('Hanging leg raises', 20, 4), r('Barbell bicep curl', 15, 3), r('Inner hammer curls', 15, 4), r('Preacher curl', 15, 4),
    r('Concentration curl', 12, 3),
  ] },
  { focus: 'Pull · back & shoulders', exercises: [
    r('Pull-ups', 10, 3), r('One-arm dumbbell row', 15, 3), r('Behind-the-neck lat pulldown', 15, 3), r('T-bar row', 15, 3),
    r('Reverse-grip lat pulldown', 15, 4), r('Arnold press', 15, 3), r('Bent-over flys', 20, 3), r('Side lateral raises', 15, 3),
    r('Face pulls', 20, 3), r('Shrugs', 20, 3), r('Abdominal crunches', 20, 3),
  ] },
  { focus: 'Push · chest & triceps', exercises: [
    ex('Warm-up: Burpees', '10 reps', 3),
    r('Push-ups', 15, 3), r('Incline dumbbell press', 15, 4), r('Incline cable flys', 15, 4), r('Bench press', 15, 4),
    r('Parallel bar dips', 10, 3), r('Dumbbell skull crusher', 15, 3), r('Rope cable pushdown', 20, 4),
    r('Overhead dumbbell press', 15, 3), r('Alternating leg raises', 30, 4), t('Side plank', '30 s', 3),
  ] },

  { focus: 'Legs & biceps', exercises: [
    r('Basic squats', 20, 3), r('Hip adduction + abduction machine', 15, 3),
    ex('Leg press ladder', '25 kg a side × 50, then +10 kg a side and 10 fewer reps, down to 10', 5),
    ss('Bulgarian split squats', 'leg extension', 1, 'reps not given'),
    ex('Goblet squats, heavy', 'reps not given', 4),
    ex('Lying hamstring curl', '20 reps, drop set on the last', 4),
    r('Hip thrust', 15, 3), r('Seated dumbbell bicep curls', 15, 4), r('EZ-bar wide-grip curl', 15, 3),
    r('Preacher curl', 15, 4), r('Calf raises', 20, 4),
  ] },
  { focus: 'Push · chest & shoulders', exercises: [
    wu('Cardio', 'time not given'),
    r('Push-ups', 15, 3), r('Incline dumbbell press', 12, 4), r('Cable lateral raise', 15, 3), r('Parallel bar dips', 10, 3),
    r('Seated shoulder press', 15, 4), r('Flat bench press', 15, 4), r('Plate front raise', 20, 3),
    r('Decline cable crossover', 15, 3), r('Face pulls', 20, 3), r('Hanging leg raises', 20, 3),
  ] },
  { focus: 'Legs & conditioning', exercises: [
    r('Squat jumps', 20, 4), r('Leg extension', 20, 5), r('Sumo squats', 20, 3), t('Battle rope', '45 s', 3),
    r('Thrusters', 20, 4), r('Leg extension', 15, 5), r('Kettlebell swings', 30, 3), r('Weighted squats', 15, 3),
    t('Side plank', '45 s', 3), r('Calf raises', 20, 4),
  ] },
  { focus: 'Pull · back & biceps', exercises: [
    r('Pull-ups', 10, 3), r('Renegade row', 15, 3), r('Seated cable row', 15, 4), r('One-arm dumbbell row', 15, 3),
    r('Front lat pulldown', 15, 4), r('Straight-arm pulldown', 15, 3), r('Long-bar bicep curl', 20, 3),
    r('Incline dumbbell curls', 15, 4), r('Rope hammer curls', 20, 3), r('Abdominal crunches', 20, 3),
    r('Hanging leg raises', 20, 3),
  ] },
  { focus: 'Upper · shoulders & triceps', exercises: [
    r('Burpees', 10, 4), r('Thrusters', 20, 4), r('Arnold press', 15, 4), r('Plate front raises', 20, 4),
    r('Behind-the-neck Smith machine press', 15, 3), r('Bent-over flys', 20, 4), r('Cable lateral raises', 15, 5),
    r('Shrugs', 20, 3), r('Rope tricep extension', 15, 4), r('Single-arm dumbbell extension', 20, 3),
    r('Single-arm cable pushdown', 15, 3), r('Kickbacks', 20, 3),
  ] },
]

export const TRAINER_PROGRAM: Program = {
  id: 'trainer',
  name: 'Gym Trainer Plan',
  short: 'Trainer',
  home: 'program',
  source: '25 sessions from your trainer · 5 days/week · warm-up, work, cardio finisher',
  note: [
    'Start every day with its Warm-up rows, end with its Finisher',
    'Superset: do both moves back to back, then rest',
  ],
  weeks: Array.from({ length: SESSIONS.length / 5 }, (_, w) => ({
    week: w + 1,
    days: SESSIONS.slice(w * 5, w * 5 + 5).map((s, i) => d(i + 1, s.focus, s.exercises)),
  })),
}

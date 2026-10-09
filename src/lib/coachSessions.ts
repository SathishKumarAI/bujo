// The coach's 29 sessions, as data. COD-302.
//
// Source: a WhatsApp thread dated 2024-02-24, captured verbatim in
// `docs/workouts/coach-sessions.md`. Read that first — it holds the original
// text, the Telugu/Hindi vocabulary, and the reasoning this file depends on.
//
// ── Every move keeps the coach's own words ─────────────────────────────────
//
// `raw` is the prescription exactly as written. It is not decoration: the
// notation is ambiguous, this file resolves it, and a resolution you cannot
// audit is a resolution you have to trust. With `raw` beside the parsed
// numbers, a wrong reading is a two-second diff rather than an archaeology dig.
//
// ── The ambiguity, and the rule used to resolve it ─────────────────────────
//
// One separator, two meanings:
//
//     Squat jumps 15x3      15 reps × 3 sets
//     Bird dogs 10x2 sets   10 reps × 2 sets   ("sets" is on the SECOND number)
//     Leg extension 5x15    5 SETS × 15 reps
//     Bench press 4x15      4 SETS × 15 reps
//
// The rule is **not positional**. It is "whichever number would be absurd as a
// set count is the rep count" — nobody does fifteen sets of five leg
// extensions, and nobody does five reps of fifteen sets. Applied here with a
// bias toward the reading that produces a sane session; every line is
// recoverable from `raw` if a call lands wrong.
//
// Getting one backwards does not make a typo. It makes a session nobody can
// complete, shipped as though the coach had written it.
//
// ── Why this module exists before any view imports it ──────────────────────
//
// `CLAUDE.md` records a pass that added "cards from the training guide" to
// `views/Pullups.tsx` by rewriting the lists INLINE instead of reading
// `lib/pullups.ts`: `PULLUP_WORKOUTS` went from fourteen formats to three,
// `PULLUP_PROGRESSIONS` from nine to seven, and `tsc`, eslint, vitest and the
// build were all clean, because an export nobody imports is not an error.
//
// `coachSessions.test.ts` asserts the counts for exactly that reason. **If a
// view ever stops importing this module, that is the finding** — the numbers
// here are the record of what the coach actually prescribed, and they are not
// recoverable from a rendered page.

/** One prescribed movement. `raw` is the coach's text; the rest is this file's reading of it. */
export interface Move {
  name: string
  /** Verbatim from the thread. The audit trail for every number beside it. */
  raw: string
  sets?: number
  reps?: number
  /** Holds and ropes: "Plank 45 seconds 3 sets" → seconds 45, sets 3. */
  seconds?: number
  /** Cardio: "30 minutes treadmill" → minutes 30. */
  minutes?: number
  /** "Failure pushups 1 set minimum 25 ravali". */
  toFailure?: boolean
  /** A floor rather than a target: "20 reps ravali" = must reach 20. */
  minReps?: number
  /** A scheme the rep/set pair cannot express. */
  scheme?: 'pyramid' | 'dropset' | 'alternating'
  /**
   * The coach prescribed no number for this one.
   *
   * Declared rather than left empty. A move with no reps, no time and no
   * scheme is indistinguishable from a line that was half-transcribed, and
   * `coachSessions.test.ts` fails on exactly that shape — so the two places
   * where the thread really does just say "shruggs" say so out loud.
   */
  noCount?: true
  note?: string
}

/** Two movements performed together, the set count applying to the pair. */
export interface Superset {
  superset: true
  sets: number
  moves: Move[]
  note?: string
}

export type Block = Move | Superset

export function isSuperset(b: Block): b is Superset {
  return (b as Superset).superset === true
}

export interface CoachSession {
  id: string
  title: string
  /** Coarse focus, for grouping. Not a muscle map — `exerciseMuscles.ts` owns that. */
  tags: string[]
  /** Cardio and mobility done before the main work. */
  warmup: Move[]
  main: Block[]
  /** The named cardio the session ends on. Empty when the coach named none. */
  finisher: Move[]
}

const m = (name: string, raw: string, o: Omit<Partial<Move>, 'name' | 'raw'> = {}): Move =>
  ({ name, raw, ...o })

/** Cardio shorthand — twelve sessions end on one of these. */
const cardio = (name: string, minutes: number): Move => m(name, `${minutes} minutes`, { minutes })

export const COACH_SESSIONS: CoachSession[] = [
  {
    id: 'cs-01', title: 'Back, posterior chain and pull', tags: ['back', 'pull', 'core'],
    warmup: [],
    main: [
      m('Bird dogs', '10x2 sets', { reps: 10, sets: 2 }),
      m('Superman back extension', '10x2', { reps: 10, sets: 2 }),
      m('Squat jumps', '15x3', { reps: 15, sets: 3 }),
      m('Pull-ups', '10x3', { reps: 10, sets: 3 }),
      m('Front lat pulldown', '15x4', { reps: 15, sets: 4 }),
      m('Close-grip lat pulldown', '15x4', { reps: 15, sets: 4 }),
      m('One-arm dumbbell row', '12x3', { reps: 12, sets: 3 }),
      m('Mid rowing', '15x4', { reps: 15, sets: 4 }),
      m('Abdominal crunches', '15x3', { reps: 15, sets: 3 }),
      m('Plank', '45seconds 2 sets', { seconds: 45, sets: 2 }),
    ],
    finisher: [cardio('Treadmill', 30)],
  },
  {
    id: 'cs-02', title: 'Legs', tags: ['legs'],
    warmup: [cardio('Cycle', 15), m('Legs warm-up', 'Legs warmup cheyu')],
    main: [
      m('Squat jumps', '20x3', { reps: 20, sets: 3 }),
      m('Backward lunges', '10x3', { reps: 10, sets: 3 }),
      m('Leg press', '12x4', { reps: 12, sets: 4 }),
      m('Leg extension', '5x15', { sets: 5, reps: 15 }),
      m('Glute bridges', '20x3', { reps: 20, sets: 3 }),
      m('Calf raises', '20x3', { reps: 20, sets: 3 }),
    ],
    finisher: [cardio('Treadmill', 25)],
  },
  {
    id: 'cs-03', title: 'Shoulders', tags: ['shoulders', 'triceps'],
    warmup: [
      m('Shoulder mobility stretches', 'shoulder mobility streches cheyu'),
      m('Burpees', '10x3', { reps: 10, sets: 3 }),
      m('Mountain climbers', '30x3', { reps: 30, sets: 3 }),
      m('Side plank', '30 seconds each side', { seconds: 30, note: 'each side' }),
    ],
    main: [
      m('Shoulder dumbbell press', '15x3', { reps: 15, sets: 3 }),
      m('Dumbbell lateral side raises', '12x4', { reps: 12, sets: 4 }),
      m('Plate front raise', '20x3', { reps: 20, sets: 3 }),
      m('Shrugs', 'shruggs', { noCount: true }),
      m('Tricep rope pushdown', '15x3', { reps: 15, sets: 3 }),
      m('Overhead dumbbell press', '15x4', { reps: 15, sets: 4 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-04', title: 'Legs and core', tags: ['legs', 'core'],
    warmup: [cardio('Cycle', 10), m('Legs warm-up', 'Legs warmup cheyu')],
    main: [
      m('Basic squats', '20x3', { reps: 20, sets: 3 }),
      m('Leg extension', '5x15', { sets: 5, reps: 15 }),
      m('Outer thigh', '15x3', { reps: 15, sets: 3 }),
      m('Weighted squats', '4x15', { sets: 4, reps: 15 }),
      m('Lying hamstring curl', '4x15', { sets: 4, reps: 15 }),
      m('Hanging leg raises', '12x3', { reps: 12, sets: 3 }),
      m('Abdominal crunches', '20x4', { reps: 20, sets: 4 }),
      m('Calf raises', '20x4', { reps: 20, sets: 4 }),
    ],
    finisher: [cardio('Treadmill', 25)],
  },
  {
    id: 'cs-05', title: 'Conditioning', tags: ['conditioning', 'core'],
    warmup: [],
    main: [
      m('Burpees', '10x4', { reps: 10, sets: 4 }),
      m('Battle rope', '30seconds', { seconds: 30 }),
      m('Alternating leg raises', '30x4', { reps: 30, sets: 4 }),
      m('Squat jumps', '20x4', { reps: 20, sets: 4 }),
      m('Mountain climbers', '30x4', { reps: 30, sets: 4 }),
      m('Plank', '45 seconds 3 tyms', { seconds: 45, sets: 3 }),
    ],
    finisher: [cardio('Treadmill', 40)],
  },
  {
    id: 'cs-06', title: 'Chest and triceps', tags: ['chest', 'triceps'],
    warmup: [cardio('Cycle', 10), m('Pushups', '10x3', { reps: 10, sets: 3 })],
    main: [
      m('Flat bench press', '15x4', { reps: 15, sets: 4 }),
      m('Incline dumbbell press', '15x3', { reps: 15, sets: 3 }),
      m('Flat dumbbell press', '12x3', { reps: 12, sets: 3 }),
      m('Cable crossover', '12x3', { reps: 12, sets: 3 }),
      m('Tricep rope pushdown', '4x15', { sets: 4, reps: 15 }),
      m('Overhead dumbbell extension', '15x4', { reps: 15, sets: 4 }),
      m('Tricep bench dips', '20x3', { reps: 20, sets: 3 }),
    ],
    finisher: [cardio('Treadmill', 30)],
  },
  {
    id: 'cs-07', title: 'Back and shoulders, supersets', tags: ['back', 'shoulders', 'pull'],
    warmup: [cardio('Cycle', 10), m('Shoulder mobility', 'shoulder mobility cheyu'), m('Pull-ups', '10 x3', { reps: 10, sets: 3 })],
    main: [
      { superset: true, sets: 4, moves: [m('Seated cable rowing', '4sets'), m('Side lateral raises', '4sets')] },
      { superset: true, sets: 4, moves: [m('Front lat pulldown', '4sets'), m('Shoulder dumbbell press', '4sets')] },
      { superset: true, sets: 3, moves: [m('T-bar row', '3 sets'), m('Bent-over flys with dumbbells', '3 sets')] },
      { superset: true, sets: 4, moves: [m('Close-grip lat pulldown', '4 sets'), m('Plate rotation', '4 sets')] },
      {
        superset: true, sets: 3,
        moves: [m('Incline bench chest-supported dumbbell row', '3 sets'), m('Alternating face pulls', '3 sets')],
        note: 'Lying face-down on an incline bench, a dumbbell in each hand.',
      },
      m('Shrugs', '3sets', { sets: 3 }),
      m('Hanging leg raises', '15x3', { reps: 15, sets: 3 }),
      m('Knee tucks', '20x3', { reps: 20, sets: 3 }),
    ],
    finisher: [cardio('Treadmill', 30)],
  },
  {
    id: 'cs-08', title: 'Core, chest and triceps', tags: ['core', 'chest', 'triceps'],
    warmup: [cardio('Cycle', 10)],
    main: [
      m('Abdominal crunches', '20x3', { reps: 20, sets: 3 }),
      m('Basic pushups', '20x3', { reps: 20, sets: 3 }),
      m('Burpees', '10x4', { reps: 10, sets: 4 }),
      m('Kettlebell swings', '25 x3', { reps: 25, sets: 3 }),
      m('Incline dumbbell press', '15x3', { reps: 15, sets: 3 }),
      m('Flat dumbbell press', '4x12', { sets: 4, reps: 12 }),
      m('Cable crossover', '15x3', { reps: 15, sets: 3 }),
      m('Rope pushdown', '20x3', { reps: 20, sets: 3 }),
      m('Rod tricep extension', '15x3', { reps: 15, sets: 3 }),
      m('Plank', '45 seconds 3 sets', { seconds: 45, sets: 3 }),
    ],
    finisher: [cardio('Cross trainer', 25)],
  },
  {
    id: 'cs-09', title: 'Legs and shoulders', tags: ['legs', 'shoulders'],
    warmup: [cardio('Cycle', 10), m('Legs and shoulder warm-up', 'Legs nd shoulder warmup cheyu')],
    main: [
      m('Basic squats', '20x4', { reps: 20, sets: 4 }),
      m('Seated shoulder press', '15x4', { reps: 15, sets: 4 }),
      m('Leg extension', '20x5', { reps: 20, sets: 5 }),
      m('Single lateral raises', '15x4', { reps: 15, sets: 4 }),
      m('Walking lunges', '15x3', { reps: 15, sets: 3 }),
      m('Dumbbell front raises', '15x3', { reps: 15, sets: 3 }),
      m('Leg press', '20x4', { reps: 20, sets: 4 }),
      m('Face pulls', '20x3', { reps: 20, sets: 3 }),
      m('Lying leg curl', '15x3', { reps: 15, sets: 3 }),
      m('Calf raises', '20x4', { reps: 20, sets: 4 }),
      m('Shrugs', '20x4', { reps: 20, sets: 4 }),
    ],
    finisher: [cardio('Cross trainer', 20)],
  },
  {
    id: 'cs-10', title: 'Back and biceps', tags: ['back', 'biceps', 'pull'],
    warmup: [cardio('Cycle', 10), m('Jumping jacks', '50x4', { reps: 50, sets: 4 })],
    main: [
      m('Pull-ups', '10x3', { reps: 10, sets: 3 }),
      m('T-bar row', '15x3', { reps: 15, sets: 3 }),
      m('Seated cable row', '15x4', { reps: 15, sets: 4 }),
      m('Front lat pulldown', '12x4', { reps: 12, sets: 4 }),
      m('Barbell bent-over row', '15x3', { reps: 15, sets: 3 }),
      m('Reverse-grip lat pulldown', '15x3', { reps: 15, sets: 3 }),
      m('Zig-zag rod close-grip bicep curl', '15x4', { reps: 15, sets: 4 }),
      m('Incline dumbbell bicep curls', '12x3', { reps: 12, sets: 3 }),
      m('Hammer curls', '15x4', { reps: 15, sets: 4 }),
      m('Bird dogs', '15x4', { reps: 15, sets: 4 }),
      m('Plank', '1minute 3sets', { seconds: 60, sets: 3 }),
    ],
    finisher: [cardio('Treadmill', 30)],
  },
  {
    id: 'cs-11', title: 'Shoulders', tags: ['shoulders', 'conditioning'],
    warmup: [
      cardio('Cycle', 10),
      m('Mountain climbers', '30x3', { reps: 30, sets: 3 }),
      m('Burpees', '10x4', { reps: 10, sets: 4 }),
      m('Hanging leg raises', '15x3', { reps: 15, sets: 3 }),
      m('Shoulder mobility', 'Shoulder mobility cheyu'),
    ],
    main: [
      m('Face pulls', '15x3', { reps: 15, sets: 3 }),
      m('Seated shoulder press', '15x4', { reps: 15, sets: 4 }),
      m('Side lateral', '15x4', { reps: 15, sets: 4 }),
      m('Barbell bent-over flys', '20x3', { reps: 20, sets: 3 }),
      m('Shrugs', '20x3', { reps: 20, sets: 3 }),
    ],
    finisher: [cardio('Treadmill', 30)],
  },
  {
    id: 'cs-12', title: 'Chest', tags: ['chest'],
    warmup: [m('Pushups', '10x4', { reps: 10, sets: 4 })],
    main: [
      m('Flat bench press', '15x4', { reps: 15, sets: 4 }),
      m('Cable crossover', '12x3', { reps: 12, sets: 3 }),
      m('Decline dumbbell press', '12x3', { reps: 12, sets: 3 }),
      m('Incline dumbbell flys', '15x3', { reps: 15, sets: 3 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-13', title: 'Legs', tags: ['legs', 'core'],
    warmup: [],
    main: [
      m('Squat jumps', '20x4', { reps: 20, sets: 4 }),
      m('Backward lunges', '15x3', { reps: 15, sets: 3 }),
      m('Weighted squats', '4x12', { sets: 4, reps: 12 }),
      m('Leg press', '5x15', { sets: 5, reps: 15 }),
      m('Seated hamstring curl', '3x15', { sets: 3, reps: 15 }),
      m('Mountain climbers', '30x4', { reps: 30, sets: 4 }),
      m('Hanging leg raises', '15x3', { reps: 15, sets: 3 }),
      m('Calf raises', '20x4', { reps: 20, sets: 4 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-14', title: 'Chest and triceps', tags: ['chest', 'triceps', 'core'],
    warmup: [cardio('Cycle', 15), m('Pushups', '10x4', { reps: 10, sets: 4 })],
    main: [
      m('Incline dumbbell press', '15x4', { reps: 15, sets: 4 }),
      m('Cable crossover', '12x3', { reps: 12, sets: 3 }),
      m('Bench press', '5x12', { sets: 5, reps: 12 }),
      m('Parallel bar', '12x3', { reps: 12, sets: 3 }),
      m('Incline chest press, close grip', '15x3', { reps: 15, sets: 3 }),
      m('Tricep rope pushdown', '15x4', { reps: 15, sets: 4 }),
      m('Overhead dumbbell press', '20x4', { reps: 20, sets: 4 }),
      m('Tricep dips', '20x4', { reps: 20, sets: 4 }),
      m('Abdominal crunches', '20x4', { reps: 20, sets: 4 }),
      m('Hanging leg raises', '15x3', { reps: 15, sets: 3 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-15', title: 'Shoulders and triceps', tags: ['shoulders', 'triceps'],
    warmup: [cardio('Cycle', 20), m('Shoulder warm-up with 2 kg dumbbells', 'Shoulder warmup karoo 2 kg dbells leke')],
    main: [
      m('Seated shoulder press', '4x15', { sets: 4, reps: 15 }),
      m('Standing dumbbell front raises', '3x12', { sets: 3, reps: 12 }),
      {
        superset: true, sets: 1,
        moves: [m('Side lateral raises', 'side lateral raises'), m('Rope pushdown', 'rope push down')],
        note: 'Drop-set both on the last set.',
      },
      m('Plate rotation', '20x3', { reps: 20, sets: 3 }),
      m('Upright row', '3x15', { sets: 3, reps: 15 }),
      m('Overhead dumbbell press', '20x3', { reps: 20, sets: 3 }),
      m('Flat bench dumbbell skull crusher', '20x3', { reps: 20, sets: 3 }),
      m('Bench tricep dips', 'bench tricep dips', { noCount: true }),
    ],
    finisher: [cardio('Cross trainer', 20)],
  },
  {
    id: 'cs-16', title: 'Core and conditioning', tags: ['core', 'conditioning'],
    warmup: [cardio('Treadmill', 20)],
    main: [
      m('Bird dogs', '10x3', { reps: 10, sets: 3 }),
      m('Superman extension', '15x3', { reps: 15, sets: 3 }),
      m('Squat jumps', '20x4', { reps: 20, sets: 4 }),
      m('Burpees', '10x4', { reps: 10, sets: 4 }),
      m('Kettlebell swings', '20x4', { reps: 20, sets: 4 }),
      m('Cable crunches', '20x3', { reps: 20, sets: 3 }),
      m('Toe touches', '20x3', { reps: 20, sets: 3 }),
      m('Shoulder taps', '20x3', { reps: 20, sets: 3 }),
      m('Side plank', '45seconds 3 sets', { seconds: 45, sets: 3 }),
    ],
    finisher: [cardio('Cross trainer', 20)],
  },
  {
    id: 'cs-17', title: 'Full body', tags: ['full-body', 'legs', 'chest'],
    warmup: [],
    main: [
      m('Basic squats', '20x3', { reps: 20, sets: 3 }),
      m('Pushups', '10x3', { reps: 10, sets: 3 }),
      m('Incline dumbbell press', '15x3', { reps: 15, sets: 3 }),
      m('Walking lunges', '15x3', { reps: 15, sets: 3 }),
      m('Cable crossover', '15x3', { reps: 15, sets: 3 }),
      m('Lying hamstring curl', '20x4', { reps: 20, sets: 4 }),
      m('Bench press', '4x15', { sets: 4, reps: 15 }),
      m('Leg press', '20x4', { reps: 20, sets: 4 }),
      m('Parallel bar', '10x2', { reps: 10, sets: 2 }),
      m('Bulgarian split squats', '12x3', { reps: 12, sets: 3 }),
      m('Pushups to failure', '1 set minimum 25 ravali', { sets: 1, toFailure: true, minReps: 25 }),
      m('Calf raises', '20x3', { reps: 20, sets: 3 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-18', title: 'Conditioning and biceps', tags: ['conditioning', 'biceps', 'core'],
    warmup: [cardio('Cycle', 20)],
    main: [
      m('Burpees', '10x4', { reps: 10, sets: 4 }),
      m('Mountain climbers', '30x4', { reps: 30, sets: 4 }),
      m('Battle rope', '30 taps', { reps: 30, note: 'taps' }),
      m('Decline crunches', '20x4', { reps: 20, sets: 4 }),
      m('Pushups and shoulder taps', '20x4', { reps: 20, sets: 4 }),
      m('Zig-zag rod bicep curl', '15x3', { reps: 15, sets: 3 }),
      m('Incline bicep curl', '15x4', { reps: 15, sets: 4 }),
      m('Hammer curls', '15x4', { reps: 15, sets: 4 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-19', title: 'Biceps and conditioning', tags: ['biceps', 'conditioning'],
    warmup: [],
    main: [
      m('Squat jumps', '20x4', { reps: 20, sets: 4 }),
      m('Pull-ups', '10x4', { reps: 10, sets: 4 }),
      m('Mountain climbers', '30x4', { reps: 30, sets: 4 }),
      m('Battle rope', '40seconds 3sets', { seconds: 40, sets: 3 }),
      m('Hanging leg raises', '20x4', { reps: 20, sets: 4 }),
      m('Bicep barbell curl', '15x3', { reps: 15, sets: 3 }),
      m('Inner hammer curls', '15x4', { reps: 15, sets: 4 }),
      m('Preacher curl', '15x4', { reps: 15, sets: 4 }),
      m('Concentration curl', '12x3', { reps: 12, sets: 3 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-20', title: 'Back and shoulders', tags: ['back', 'shoulders', 'pull'],
    warmup: [],
    main: [
      m('Pull-ups', '10x3', { reps: 10, sets: 3 }),
      m('One-arm dumbbell row', '15x3', { reps: 15, sets: 3 }),
      m('Back lat pulldown', '15x3', { reps: 15, sets: 3 }),
      m('T-bar row', '15x3', { reps: 15, sets: 3 }),
      m('Reverse-grip lat pulldown', '4x15', { sets: 4, reps: 15 }),
      m('Arnold press', '15x3', { reps: 15, sets: 3 }),
      m('Bent-over flys', '20x3', { reps: 20, sets: 3 }),
      m('Side lateral raises', '15x3', { reps: 15, sets: 3 }),
      m('Face pulls', '20x3', { reps: 20, sets: 3 }),
      m('Shrugs', '20x3', { reps: 20, sets: 3 }),
      m('Abdominal crunches', '20x3', { reps: 20, sets: 3 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-21', title: 'Chest and triceps', tags: ['chest', 'triceps', 'core'],
    warmup: [m('Burpees', '10x3', { reps: 10, sets: 3 }), m('Pushups', '15x3', { reps: 15, sets: 3 })],
    main: [
      m('Incline dumbbell press', '15x4', { reps: 15, sets: 4 }),
      m('Incline cable flys', '15x4', { reps: 15, sets: 4 }),
      m('Bench press', '15x4', { reps: 15, sets: 4 }),
      m('Parallel bar', '10x3 sets', { reps: 10, sets: 3 }),
      m('Dumbbell skull crusher', '15x3', { reps: 15, sets: 3 }),
      m('Rope cable pushdown', '20x4', { reps: 20, sets: 4 }),
      m('Overhead dumbbell press', '15x3', { reps: 15, sets: 3 }),
      m('Alternating leg raises', '30x4', { reps: 30, sets: 4 }),
      m('Side plank', '30seconds 3sets', { seconds: 30, sets: 3 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-22', title: 'Legs — leg-press pyramid', tags: ['legs'],
    warmup: [],
    main: [
      m('Basic squats', '20x3', { reps: 20, sets: 3 }),
      m('Hip adduction machine, inner and outer thigh', '3x15', { sets: 3, reps: 15 }),
      m('Leg press', 'first 25kgs each side add cheyu total 50 reps ravali then each side 10 add nd 40 reps cheyu ala add chestu 10 reps varaku cheyali', {
        scheme: 'pyramid',
        note: 'Start at 25 kg a side and reach 50 total reps; add 10 kg a side and do 40; keep adding and dropping reps down to 10.',
      }),
    ],
    finisher: [],
  },
  {
    id: 'cs-23', title: 'Legs — split squats and goblets', tags: ['legs'],
    warmup: [],
    main: [
      {
        superset: true, sets: 1,
        moves: [m('Bulgarian split squats', 'Bulgarian split squats'), m('Leg extension', 'leg extension')],
        note: 'Alternating.',
      },
      m('Goblet squats', 'weigt knchm heavy tesko 4sets', { sets: 4, note: 'Take a heavier weight.' }),
    ],
    finisher: [],
  },
  {
    id: 'cs-24', title: 'Hamstrings', tags: ['legs'],
    warmup: [],
    main: [
      m('Lying hamstring curl', '20x4', { reps: 20, sets: 4, scheme: 'dropset', note: 'Drop the total weight on the last set.' }),
    ],
    finisher: [],
  },
  {
    id: 'cs-25', title: 'Glutes and biceps', tags: ['legs', 'biceps'],
    warmup: [],
    main: [
      m('Hip thrust', '3sets 15 reps', { sets: 3, reps: 15 }),
      m('Seated dumbbell bicep curls', '15x4', { reps: 15, sets: 4 }),
      m('Zig-zag rod wide-grip bicep curl', '15x3', { reps: 15, sets: 3 }),
      m('Preacher curl', '15x4', { reps: 15, sets: 4 }),
      m('Calf raises', '20x4', { reps: 20, sets: 4 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-26', title: 'Push, after cardio', tags: ['chest', 'shoulders', 'core'],
    warmup: [m('Cardio', 'After cardio')],
    main: [
      m('Pushups', '15x3', { reps: 15, sets: 3 }),
      m('Incline dumbbell press', '4x12', { sets: 4, reps: 12 }),
      m('Cable lateral side raise', '3x15', { sets: 3, reps: 15 }),
      m('Parallel bar', '3sets 10 reps', { sets: 3, reps: 10 }),
      m('Seated shoulder press', '4x15', { sets: 4, reps: 15 }),
      m('Flat bench press', '4x15', { sets: 4, reps: 15 }),
      m('Plate front raise', '20x3', { reps: 20, sets: 3 }),
      m('Decline cable crossover', '3x15', { sets: 3, reps: 15 }),
      m('Face pulls', '20x3', { reps: 20, sets: 3 }),
      m('Hanging leg raises', '20x3', { reps: 20, sets: 3 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-27', title: 'Legs and conditioning', tags: ['legs', 'conditioning'],
    warmup: [],
    main: [
      m('Squat jumps', '20x4', { reps: 20, sets: 4 }),
      m('Extension', '20x5', { reps: 20, sets: 5 }),
      m('Sumo squats', '3x20', { sets: 3, reps: 20 }),
      m('Battle rope', '45seconds 3sets', { seconds: 45, sets: 3 }),
      m('Thrusters', '20x4', { reps: 20, sets: 4 }),
      m('Leg extension', '15x5', { reps: 15, sets: 5 }),
      m('Kettlebell swings', '30x3', { reps: 30, sets: 3 }),
      m('Weighted squats', '15x3', { reps: 15, sets: 3 }),
      m('Side plank', '45seconds 3 sets', { seconds: 45, sets: 3 }),
      m('Calf raises', '20x4', { reps: 20, sets: 4 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-28', title: 'Back and biceps', tags: ['back', 'biceps', 'pull'],
    warmup: [],
    main: [
      m('Pull-ups', '10x3', { reps: 10, sets: 3 }),
      m('Renegade row', '15x3', { reps: 15, sets: 3 }),
      m('Seated cable row', '4x15', { sets: 4, reps: 15 }),
      m('One-arm dumbbell row', '3x15', { sets: 3, reps: 15 }),
      m('Front lat pulldown', '15x4', { reps: 15, sets: 4 }),
      m('Straight-arm pulldown', '15x3', { reps: 15, sets: 3 }),
      m('7-foot rod bicep curl', '20reps ravali 3sets', { sets: 3, minReps: 20 }),
      m('Incline dumbbell curls', '4x15', { sets: 4, reps: 15 }),
      m('Rope hammer curls', '20x3', { reps: 20, sets: 3 }),
      m('Abdominal crunches', '20x3', { reps: 20, sets: 3 }),
      m('Hanging leg raises', '20x3', { reps: 20, sets: 3 }),
    ],
    finisher: [],
  },
  {
    id: 'cs-29', title: 'Shoulders and triceps', tags: ['shoulders', 'triceps'],
    warmup: [],
    main: [
      m('Burpees', '10x4', { reps: 10, sets: 4 }),
      m('Thrusters', '20x4', { reps: 20, sets: 4 }),
      m('Arnold press', '15x4', { reps: 15, sets: 4 }),
      m('Plate front raises', '20x4', { reps: 20, sets: 4 }),
      m('Behind-neck smith machine press', '15x3', { reps: 15, sets: 3 }),
      m('Bent-over flys', '20x4', { reps: 20, sets: 4 }),
      m('Cable lateral side raises', '5x15', { sets: 5, reps: 15 }),
      m('Shrugs', '20x3', { reps: 20, sets: 3 }),
      m('Rope tricep extension', '15x4', { reps: 15, sets: 4 }),
      m('Single-hand dumbbell extension', '20x3', { reps: 20, sets: 3 }),
      m('Single-hand cable pressdown', '15x3', { reps: 15, sets: 3 }),
      m('Kickbacks', '20x3', { reps: 20, sets: 3 }),
    ],
    finisher: [],
  },
]

/** Every distinct tag, for grouping in a picker. Derived — never a second list. */
export const COACH_TAGS: string[] = [...new Set(COACH_SESSIONS.flatMap((s) => s.tags))].sort()

/** Flattened moves of a session, supersets expanded in order. */
export function movesOf(s: CoachSession): Move[] {
  return [...s.warmup, ...s.main.flatMap((b) => (isSuperset(b) ? b.moves : [b])), ...s.finisher]
}

/** Total working sets, for a "how big is this" line. Supersets count once per set. */
export function setsOf(s: CoachSession): number {
  return s.main.reduce((n, b) => n + (isSuperset(b) ? b.sets : (b.sets ?? 0)), 0)
}

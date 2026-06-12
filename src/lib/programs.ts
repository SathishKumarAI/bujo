// Built-in training programs (encoded as data, not the source PDF — the PDFs in
// docs/pdf are gitignored). "Starting From Zero: Pull-up Program" — a 5-day/week
// progression toward a first pull-up.

export interface ProgramExercise {
  name: string
  qty: string // reps / time / effort, free-form (e.g. "3x8", "15,30,15 s", "Max effort")
  sets: string
}
export interface ProgramDay {
  day: number
  focus: string
  exercises: ProgramExercise[]
}
export interface ProgramWeek {
  week: number
  days: ProgramDay[]
}
export interface Program {
  id: string
  name: string
  source: string
  weeks: ProgramWeek[]
}

const ex = (name: string, qty: string, sets: string): ProgramExercise => ({ name, qty, sets })

// Repeating weekly shape: D1 strength · D2 negatives · D3 conditioning · D4 negatives · D5 conditioning.
function week(n: number, neg: string, jump: string, plankSets: number, partner: string, runMeters: string): ProgramWeek {
  return {
    week: n,
    days: [
      { day: 1, focus: 'Strength', exercises: [ex('Pull-up assessment', 'Max effort', '1'), ex('Hollow Rocks', '10', String(plankSets <= 8 ? 2 : plankSets <= 12 ? 3 : 4)), ex('Scapular retractions', '5 reps', String(plankSets <= 8 ? 2 : plankSets <= 12 ? 3 : 4)), ex('Dead hangs', '15,30,15 s', '2'), ex('Planks (Tabata 20s/10s)', '20s work', String(plankSets))] },
      { day: 2, focus: 'Negatives', exercises: [ex('Pull-up assessment', 'Max effort', '1'), ex('Body-weight negatives', neg, '8'), ex('Jumping pull-ups', jump, '10'), ex('Modified L-Sits', '5,10,15 s', '2'), ex('Burpees (Tabata 20s/10s)', '20s work', String(plankSets))] },
      { day: 3, focus: 'Conditioning', exercises: [ex('Pull-up assessment', 'Max effort', '1'), ex('Partner assisted pull-ups', partner, '4'), ex('Partial ROM pull-ups (bottom)', '1,2,1', '1'), ex('Hanging leg raises', '1,2,1', '2'), ex('Sprints', '30s / 30s jog', '6')] },
      { day: 4, focus: 'Negatives', exercises: [ex('Pull-up assessment', 'Max effort', '1'), ex('Body-weight negatives', neg, '8'), ex('Jumping pull-ups', jump, '10'), ex('Dead hangs', '15,30,15 s', '2'), ex('Air squats (Tabata 20s/10s)', '20s work', String(plankSets))] },
      { day: 5, focus: 'Conditioning', exercises: [ex('Pull-up assessment', 'Max effort', '1'), ex('Partner assisted pull-ups', partner, '4'), ex('Partial ROM pull-ups (bottom)', '1,2,1', '1'), ex('Hanging leg raises', '1,2,1', '2'), ex(`${runMeters} max-effort run`, 'repeats w/ jog', '1')] },
    ],
  }
}

export const PULLUP_PROGRAM: Program = {
  id: 'pullup-zero',
  name: 'Starting From Zero — Pull-up Program',
  source: 'Novice pull-up program · 6 weeks · 5 days/week',
  weeks: [
    week(1, '3 seconds', '1 rep', 8, '1, 2', '400 m'),
    week(2, '5 seconds', '1 rep', 8, '1, 2', '400 m'),
    week(3, '3 seconds (jumping)', '2 reps', 8, '3, 2, 1', '800 m'),
    week(4, '5 seconds (jumping)', '2 reps', 16, '3, 2, 1', '400 m'),
    week(5, '3 s weighted (10 lb)', '3 reps', 16, '3, 2, 1', '800 m'),
    week(6, '5 s weighted (10 lb)', '3 reps', 16, '4, 3, 2, 1', '1600 m'),
  ],
}

export const PROGRAMS: Program[] = [PULLUP_PROGRAM]

// ── Pull-up Training Guide: ability groups → training set + volume targets ────
export interface PullupAbility {
  group: string
  range: string // max strict pull-ups, e.g. "1-5"
  trainingSet: number // reps per working set
  daily: string // recommended daily volume
  weekly: string // recommended weekly volume
}

export const PULLUP_ABILITY: PullupAbility[] = [
  { group: 'Beginner', range: '<1', trainingSet: 3, daily: '25–50 progression reps', weekly: '75–150 progression reps' },
  { group: 'Novice', range: '1–5', trainingSet: 1, daily: '30–60 reps', weekly: '90–180 reps' },
  { group: 'Intermediate', range: '6–8', trainingSet: 2, daily: '40–70 pull-ups', weekly: '120–210 pull-ups' },
  { group: 'Intermediate+', range: '9–12', trainingSet: 3, daily: '50–80 pull-ups', weekly: '150–240 pull-ups' },
  { group: 'Advanced', range: '13–16', trainingSet: 4, daily: '60–90 pull-ups', weekly: '180–270 pull-ups' },
  { group: 'Expert', range: '17–20', trainingSet: 5, daily: '75–120 pull-ups', weekly: '225–360 pull-ups' },
  { group: 'Elite', range: '21–24', trainingSet: 6, daily: '100–175 pull-ups', weekly: '300–525 pull-ups' },
]

/** Your ability group from a max strict-pull-up count. */
export function pullupAbility(max: number): PullupAbility {
  if (max < 1) return PULLUP_ABILITY[0]
  if (max <= 5) return PULLUP_ABILITY[1]
  if (max <= 8) return PULLUP_ABILITY[2]
  if (max <= 12) return PULLUP_ABILITY[3]
  if (max <= 16) return PULLUP_ABILITY[4]
  if (max <= 20) return PULLUP_ABILITY[5]
  return PULLUP_ABILITY[6]
}

/** Ladder rep scheme: 1,2,…,n. */
export function ladder(n: number): number[] {
  return Array.from({ length: Math.max(1, n) }, (_, i) => i + 1)
}
/** Pyramid rep scheme: 1,2,…,n,…,2,1. */
export function pyramid(n: number): number[] {
  const up = ladder(n)
  return [...up, ...up.slice(0, -1).reverse()]
}

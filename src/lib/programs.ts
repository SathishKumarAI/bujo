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

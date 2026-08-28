// Built-in multi-week training programs, encoded as data rather than read from
// the source PDFs (which are gitignored). Two of them:
//
// - "Starting From Zero" — 6 weeks × 5 days, toward a first pull-up.
// - "12-Week Hypertrophy Block" — 3 phases × 4 weeks, 6 days, push/pull/legs.
//
// Both render through `components/ProgramTracker`, which takes `only: <id>` to
// pin itself to one; each has a `home` view that owns it. Progress lives in
// `settings.programDone` / `programActuals`, keyed `<id>-w<week>d<day>-e<i>`.
//
// The pull-up *reference* material — workout formats, progressions, the ability
// table — is not a program and lives in `lib/pullups.ts`.

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
  /** Optional human label for the block, e.g. "Phase 1 · Weeks 1–4". */
  label?: string
  days: ProgramDay[]
}
export interface Program {
  id: string
  name: string
  /**
   * One word for a chip or a segmented control, where `name` will not fit.
   * "12-Week Hypertrophy Block" is a page title; "Hypertrophy" is a tab.
   */
  short: string
  /**
   * The view that owns this program — where a progress row or chip should send
   * you when tapped.
   *
   * Both of these live on the record because three call sites were branching on
   * `id === 'pullup-zero'` to derive them (`Goals`'s row, `TodayPlanCard`'s chip,
   * `ProgramTracker`'s picker). Two programs made that survivable; the third
   * would have had to find all three, and a missed one is a chip labelled
   * "Hypertrophy" that opens the pull-up page.
   */
  home: 'pullups' | 'program'
  source: string
  /** Short note shown under the title (cardio / cadence guidance). */
  note?: string
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
  short: 'Pull-ups',
  home: 'pullups',
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

// ── 12-week, 3-phase hypertrophy block (6 days/week) ─────────────────────────
// Encoded generically from a coaching plan (PDF gitignored, no personal data).
// Each "week" entry is a 4-week phase; pick a day to check off / load its lifts.
const d = (day: number, focus: string, exercises: ProgramExercise[]): ProgramDay => ({ day, focus, exercises })

export const HYPERTROPHY_PROGRAM: Program = {
  id: 'hyper12',
  name: '12-Week Hypertrophy Block',
  short: 'Hypertrophy',
  home: 'program',
  source: '3 phases × 4 weeks · 6 days/week · push/pull/legs',
  note: 'Cardio: 20 min fast walk post-workout daily · Sun: rest / 1-hr walk / 10K steps. Rest: 12+ reps→30s · 8–10→120s · <8→180s.',
  weeks: [
    {
      week: 1, label: 'Phase 1 · Weeks 1–4',
      days: [
        d(1, 'Push', [ex('Machine chest press', '12 reps', '3'), ex('Incline dumbbell press', '8–10 reps', '4'), ex('Pec deck / decline cable flys', '8–12 reps', '3'), ex('Tricep pushdown', '10–12 reps', '3'), ex('Cable tricep ext (rope)', '10–12 reps', '3'), ex('Seated shoulder press', '12 reps', '3'), ex('Lateral raises', '12–15 reps', '3')]),
        d(2, 'Pull', [ex('Barbell rows', '12 reps', '3'), ex('Machine rows', '12 reps', '3'), ex('Wide-grip lat pulldown', '8–10 reps', '4'), ex('Smith machine shrugs', '12 reps', '3'), ex('Barbell curls', '10 reps', '3'), ex('Dumbbell curls', '12 reps', '4'), ex('Reverse cable curls', '12 reps', '3')]),
        d(3, 'Legs', [ex('Barbell squats', '12 reps', '3'), ex('Leg press', '10 reps', '4'), ex('Bulgarian split squats', '12 reps ea', '3'), ex('Lying hamstring curls', '10 reps', '3'), ex('Leg extensions', '12 reps', '3'), ex('Seated calf raises', '12 reps', '3')]),
        d(4, 'Push', [ex('Overhead press', '12 reps', '3'), ex('Flat barbell bench', '10 reps', '4'), ex('Pec deck / decline cable flys', '8–12 reps', '3'), ex('Lateral raises', '10 reps', '3'), ex('Cable rear-delt fly', '10 reps', '3'), ex('Triceps dips / French press', '10 reps', '4'), ex('Cable tricep ext (rope)', '12–15 reps', '3')]),
        d(5, 'Pull', [ex('Barbell rows', '12 reps', '3'), ex('Pull-ups', '6 reps', '4'), ex('Machine rows', '10 reps', '3'), ex('Wide-grip lat pulldown', '8–10 reps', '3'), ex('Rack pulls / dumbbell shrugs', '8–10 reps', '4'), ex('Cable curls', '10 reps', '4'), ex('Reverse cable curls', '12 reps', '3')]),
        d(6, 'Legs', [ex('Barbell squats', '12 reps', '3'), ex('Leg press', '10 reps', '4'), ex('Stiff-leg deadlift', '10 reps', '4'), ex('Lying hamstring curls', '10 reps', '3'), ex('Leg extensions', '12 reps', '3'), ex('Seated calf raises', '12 reps', '3')]),
      ],
    },
    {
      week: 2, label: 'Phase 2 · Weeks 5–8',
      days: [
        d(1, 'Push', [ex('Flat barbell bench', '6 reps', '5'), ex('Incline dumbbell press', '6–8 reps', '4'), ex('Pec deck flys', '8–12 reps', '3'), ex('Chest dips / close-grip bench', '10–12 reps', '3'), ex('Triceps pushdown', '10–12 reps', '3'), ex('Triceps DB overhead ext', '10–12 reps', '3'), ex('Machine shoulder press', '8 reps', '4'), ex('Cable lateral raises', '12–15 reps', '3')]),
        d(2, 'Pull', [ex('Barbell rows', '6–8 reps', '4'), ex('Single-arm machine rows', '8 reps', '4'), ex('Wide-grip lat pulldown', '8–10 reps', '4'), ex('Smith machine shrugs', '12 reps', '3'), ex('Barbell curls', '10 reps', '4'), ex('Reverse cable curls', '12 reps', '3')]),
        d(3, 'Legs', [ex('Barbell squats', '5 reps', '5'), ex('Narrow-stance leg press', '10 reps', '4'), ex('Bulgarian split squats', '15 reps ea', '3'), ex('Lying hamstring curls', '10 reps', '3'), ex('Leg extensions', '12 reps', '3'), ex('Seated calf raises', '12 reps', '3')]),
        d(4, 'Push', [ex('Overhead press', '4 reps', '5'), ex('Flat barbell bench', '8 reps', '4'), ex('Pec deck / decline cable flys', '8–12 reps', '3'), ex('Dumbbell lateral raises', '10 reps', '3'), ex('Rear-delt cable flys', '10 reps', '3'), ex('Triceps skull crusher', '10 reps', '4'), ex('Triceps rope extensions', '12–15 reps', '3')]),
        d(5, 'Pull', [ex('Barbell rows', '6–8 reps', '4'), ex('Pull-ups', '6 reps', '4'), ex('Machine rows', '10 reps', '3'), ex('Wide-grip lat pulldown', '8 reps', '4'), ex('Rack pulls / dumbbell shrugs', '8–10 reps', '4'), ex('Cable curls', '10 reps', '4'), ex('Reverse cable curls', '12 reps', '3')]),
        d(6, 'Legs', [ex('Conventional deadlift', '8 reps', '4'), ex('Leg press', '10 reps', '4'), ex('Lying hamstring curls', '10 reps', '4'), ex('Leg extensions', '12 reps', '4'), ex('Seated calf raises', '12 reps', '3')]),
      ],
    },
    {
      week: 3, label: 'Phase 3 · Weeks 9–12',
      days: [
        d(1, 'Legs (quad)', [ex('Front squats', '5 reps', '5'), ex('Narrow-stance leg press', '10 reps', '4'), ex('Bulgarian split squat', '10 reps', '3'), ex('EZ-bar walking lunges', '10 reps', '4'), ex('Standing calf raises', '15 reps', '3')]),
        d(2, 'Upper', [ex('Incline bench press', '8 reps', '4'), ex('Pec deck / machine chest press', '10 reps', '4'), ex('Dumbbell shoulder press', '12 reps', '3'), ex('V-bar lat pulldown', '12 reps', '3'), ex('Supine-grip barbell rows', '10 reps', '3'), ex('Superset: DB pullover + diamond push-ups', '10–12 reps', '4')]),
        d(3, 'Upper', [ex('Overhead press', '8 reps', '4'), ex('Close-grip bench press', '10 reps', '4'), ex('Zottman curls', '12 reps', '3'), ex('Superset: tri skull crusher + bi hammer curls', '10–12 reps', '4'), ex('Superset: EZ-bar curls + tri overhead cable', '10–12 reps', '4'), ex('Front raise w/ plate', '10 reps', '4'), ex('Cable upright rows', '10 reps', '4')]),
        d(4, 'Legs (ham)', [ex('Conventional deadlift', '4–6 reps', '5'), ex('Unilateral leg press', '10 reps', '4'), ex('Lying hamstring curls', '10 reps', '4'), ex('Dumbbell walking lunges', '15 reps ea', '3'), ex('Standing calf raises', '15 reps', '3')]),
        d(5, 'Push', [ex('Decline barbell bench press', '8 reps', '4'), ex('Incline dumbbell press', '8–10 reps', '3'), ex('Flat dumbbell flys', '8–12 reps', '3'), ex('Tricep skull crusher', '10 reps', '3'), ex('Close-grip bench press', '10 reps', '3'), ex('EZ-bar upright row', '10 reps', '4'), ex('Dumbbell lateral raises', '12 reps', '4')]),
        d(6, 'Pull', [ex('Superset: barbell rows + hyperextension', '6–10 reps', '4'), ex('Seated cable rows', '10 reps', '3'), ex('Wide-grip lat pull-down', '8–10 reps', '4'), ex('Barbell shrugs', '12 reps', '3'), ex('Cable curls', '12 reps', '3'), ex('Zottman curls', '12 reps', '3')]),
      ],
    },
  ],
}

export const PROGRAMS: Program[] = [PULLUP_PROGRAM, HYPERTROPHY_PROGRAM]

// ── Where you are in a program ───────────────────────────────────────────────
//
// Pure, and separate from `ProgramTracker` on purpose: "which day am I on" is
// the whole promise of a program that runs for six weeks, and it should be
// checkable without mounting a component and a store.

/**
 * The progress key for one exercise. **The only place this shape is written.**
 *
 * It was previously a closure inside `ProgramTracker`, so anything else that
 * wanted to reason about progress had to re-derive the format from a template
 * literal — and a second spelling of a storage key is a silent data loss, not a
 * type error. `settings.programDone` holds these strings.
 */
export const exerciseKey = (programId: string, week: number, day: number, i: number) =>
  `${programId}-w${week}d${day}-e${i}`

/** Every exercise of this day ticked. A day with no exercises is not "done". */
export function dayComplete(p: Program, week: number, day: number, done: string[]): boolean {
  const exs = p.weeks.find((w) => w.week === week)?.days.find((d) => d.day === day)?.exercises ?? []
  return exs.length > 0 && exs.every((_, i) => done.includes(exerciseKey(p.id, week, day, i)))
}

/** How many of the program's days are fully ticked. */
export function daysComplete(p: Program, done: string[]): number {
  return p.weeks.reduce((n, w) => n + w.days.filter((d) => dayComplete(p, w.week, d.day, done)).length, 0)
}

/**
 * Where to open the tracker: the first day that is not finished.
 *
 * The tracker used to seed its state with `p.weeks[0]`, so a six-week program
 * you were four weeks into greeted you at week 1 day 1 every single time, and
 * `settings.programDone` — which it was already reading two lines later to draw
 * the progress count — had no say in it.
 *
 * "First incomplete", not "one past the last complete": people skip days, and
 * resuming past a gap would quietly hide the day they meant to come back to.
 *
 * A finished program returns its **last** day rather than wrapping to the
 * start. Landing someone who has done all thirty days back on day 1 reads as
 * progress lost; the last day they did is the honest place to be.
 */
export function resumeAt(p: Program, done: string[]): { week: number; day: number } {
  for (const w of p.weeks) {
    for (const d of w.days) {
      if (!dayComplete(p, w.week, d.day, done)) return { week: w.week, day: d.day }
    }
  }
  const last = p.weeks[p.weeks.length - 1]
  return { week: last.week, day: last.days[last.days.length - 1].day }
}

/** Every day of the program in order — what a progress map walks. */
export function allDays(p: Program): { week: number; day: number; focus: string }[] {
  return p.weeks.flatMap((w) => w.days.map((d) => ({ week: w.week, day: d.day, focus: d.focus })))
}

/**
 * The size of one day: how many exercises, and how many working sets they add
 * up to.
 *
 * `sets` is a free-form string on the record because a few entries are not
 * numbers ("Max effort" days carry '1', but the pull-up program's Tabata rows
 * carry a count derived at build time). Anything that does not parse counts as
 * zero rather than NaN — a session summary reading "22 sets" and one reading
 * "NaN sets" are not equally wrong.
 */
export function dayStats(p: Program, week: number, day: number): { exercises: number; sets: number } {
  const exs = p.weeks.find((w) => w.week === week)?.days.find((d) => d.day === day)?.exercises ?? []
  return {
    exercises: exs.length,
    sets: exs.reduce((n, e) => n + (Number.parseInt(e.sets, 10) || 0), 0),
  }
}

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
  /** Optional human label for the block, e.g. "Phase 1 · Weeks 1–4". */
  label?: string
  days: ProgramDay[]
}
export interface Program {
  id: string
  name: string
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

// ── Pull-up workout formats (the "menu" of session types) ────────────────────
export interface PullupWorkout {
  name: string
  profile: string // volume/intensity + suggested duration
  rx: string // prescribed standard
  scale: string // scaled option
  how: string // one-line execution
}

export const PULLUP_WORKOUTS: PullupWorkout[] = [
  { name: 'Ladders', profile: 'High volume · moderate intensity · 10–20 min', rx: 'Strict pull-ups', scale: 'Partner-assisted', how: 'Ascending sets 1,2,3… up to your training set; 3+ min between ladders.' },
  { name: 'Pyramids', profile: 'High volume · moderate intensity · 10–20 min', rx: 'Strict pull-ups', scale: 'Partner-assisted', how: '1,2,…,n,…,2,1; rest 10–20s within, 3+ min between pyramids.' },
  { name: 'Escalators', profile: 'High intensity · moderate volume · 10–15 min', rx: 'Unbroken strict sets', scale: 'Jumping pull-ups', how: 'EMOM +1 rep each minute until you miss — last on the bar wins. Max once/month.' },
  { name: 'Elevators', profile: 'Moderate–high intensity · low volume · 10–20 min', rx: 'Strict + holds', scale: 'Partial ROM / dead-hangs', how: 'Coach calls "floors" (basement→roof-top); hold each position till the next call.' },
  { name: 'Bus Stops', profile: 'High volume · moderate intensity · 10–20 min', rx: 'Strict pull-ups', scale: 'Partner-assisted', how: 'Pause at top/bottom for set seconds; keep rep schemes low, not to failure.' },
  { name: 'Moving Walkways', profile: 'High volume · low–moderate intensity · 15–25 min', rx: 'Strict pull-ups', scale: 'Jumping pull-ups', how: '1 pull-up every 10/15/20/30s for set rounds or until you miss.' },
  { name: 'EMOMs', profile: 'High volume · moderate intensity · 15–20 min', rx: 'Strict pull-ups', scale: 'Jumping pull-ups', how: 'Fixed reps every minute (a straight set = your training set) for set time.' },
  { name: 'Cliffhangers', profile: 'High volume · moderate intensity · 10–20 min', rx: 'Strict pull-ups', scale: 'Partial ROM', how: 'Partner "I-go-you-go" ascending ladder without dismounting the bar.' },
  { name: 'Sally', profile: 'Low volume · high intensity · 3 min', rx: 'Unbroken strict sets', scale: 'Jumping pull-ups', how: 'Pull-ups to "Bring Sally Up" — 30 pull-ups across the 3-min song.' },
  { name: 'Burpee Pull-ups', profile: 'High volume · moderate intensity · 15–20 min', rx: 'Strict pull-ups', scale: 'Jumping pull-ups', how: 'Straight sets / ladders / pyramids where every rep is a burpee pull-up.' },
  { name: 'Super-Sets', profile: 'High volume · moderate intensity · 15–20 min', rx: 'Pull-ups + hanging leg-raises', scale: 'Jumping pull-ups / knees-to-elbow', how: 'Pair each pull-up set with a set of hanging leg-raises.' },
  { name: 'Face Off', profile: 'Low volume · high intensity · 1–3 min', rx: 'Strict pull-ups', scale: 'Partial ROM', how: 'Two athletes match sets of "1" until one misses. Max once/month.' },
  { name: 'Ladders+', profile: 'High volume · mod–high intensity · 15–20 min', rx: 'Strict pull-ups', scale: 'Partner-assisted', how: 'Ladders where the top set = 50% of your max set; 3+ min recovery.' },
  { name: 'Pyramids+', profile: 'High volume · mod–high intensity · 15–20 min', rx: 'Strict pull-ups', scale: 'Partner-assisted', how: 'Pyramids where the peak = 50% of your max set; 3+ min recovery.' },
]

// ── Pull-up progression exercises (how to build toward a first pull-up) ───────
export interface Progression {
  name: string
  why: string
  how: string
}

export const PULLUP_PROGRESSIONS: Progression[] = [
  { name: 'Partner-assisted pull-ups', why: 'Best progression — full ROM with just-enough help at the right time.', how: 'Pull as far as you can; partner spots your mid/upper back (not feet) only after you stall.' },
  { name: 'Partial ROM pull-ups', why: 'Trains the range you have; great when no spotter is available.', how: 'From bottom: pull halfway and lower. From top: chin over bar, lower halfway, pull back up.' },
  { name: 'Body-weight negatives', why: 'Eccentric overload — you’re ~1.5× stronger lowering than pulling.', how: 'Get chin over bar (step/jump), then resist a slow 3–7s descent to a full dead-hang.' },
  { name: 'Jumping pull-ups', why: 'Explosive concentric assistance from the legs.', how: 'Stand under a reachable bar, jump into a pull-up using momentum, lower slowly.' },
  { name: 'Dead-hangs', why: 'Grip, forearm and midsection base; gets you comfortable on the bar.', how: 'Hang in a hollow body, lats engaged; aim 15s → 30–60s holds.' },
  { name: 'Hanging leg raises', why: 'Grip + midline strength for a tight body.', how: 'Hollow hang, raise straight legs to touch toes to bar without kipping.' },
  { name: 'L-sits', why: 'Adds midline difficulty without extra equipment.', how: 'Hang and hold legs at 90° parallel to the floor for 5–10s × several sets.' },
  { name: 'Hollow rocks', why: 'Gymnastics core staple — keeps the body tight during pulls.', how: 'On your back, arms & legs off the floor in a hollow shape; rock without breaking form.' },
  { name: 'Scapular retractions', why: 'Teaches initiating the pull from the shoulder blades.', how: 'From a dead-hang, pull shoulders down/back (no elbow bend), pause, release.' },
]

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

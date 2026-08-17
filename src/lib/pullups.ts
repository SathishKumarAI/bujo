// Pull-up reference data: workout formats, progression exercises, and the
// ability table that turns "max strict pull-ups" into a training set.
//
// Split out of `lib/programs.ts`, which held two unrelated things: the built-in
// multi-week *programs* (shared by the Program and Pull-ups views through
// `ProgramTracker`) and this, which only `views/Pullups.tsx` has ever read.
// Keeping them together meant every consumer of `PROGRAMS` pulled ~85 lines of
// pull-up prose it had no use for.
//
// The "Starting From Zero" program itself stays in `programs.ts` — it is a
// program, and it is what `PROGRAMS` is for.

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

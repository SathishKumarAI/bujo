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

// ── The manual: form cues, principles, equipment ─────────────────────────────
//
// Prose from the training guide, here rather than in `views/Pullups.tsx` for
// the reason the workspace rule gives: constants live in one module. It also
// stops the next "add cards from the guide" pass rewriting them inline — that
// happened once already (531596f) and it silently shrank `PULLUP_WORKOUTS`
// from fourteen formats to three and rewrote nine progressions into seven.

export interface FormPhase {
  phase: string
  /** Ordered cues. Order is the instruction — "tighten abs" comes before
   *  "mount the bar" because doing it after is a different, worse set-up. */
  cues: string[]
}

export const PULLUP_FORM: FormPhase[] = [
  {
    phase: 'Set up',
    cues: [
      'Tuck the pelvis and tighten the abs — hold that tightness throughout',
      'Mount the bar and grip it hard, pinky knuckle over the top',
      'Pull the arms down into the shoulder sockets',
      'Pull the shoulders down with the lats — the opposite of a shrug',
      'Squeeze the glutes, re-tighten the abs, legs straight, head neutral',
    ],
  },
  {
    phase: 'Execution',
    cues: [
      'Stay tight and lean back',
      'Pull with the elbows, not the hands — drive them to the ribs',
      'Chin all the way over the bar. Do not crane the chin to get there',
      'Lower completely to a dead hang',
    ],
  },
]

export interface Principle {
  name: string
  /** A `lib/colors` catppuccin key. */
  color: string
  body: string
}

export const PULLUP_PRINCIPLES: Principle[] = [
  { name: 'Specificity', color: 'mauve', body: 'Do pull-ups and pull-up progressions. During a session, spend the energy on the bar — not on supplementary work that leaves nothing for the pulls.' },
  { name: 'Quality over quantity', color: 'green', body: 'Perfect reps first, count second. Quality is: tight body, legs uncrossed and unbent, head neutral, no jerk or kip, all the way up and all the way down. Poor reps train the miss.' },
  { name: 'Frequency', color: 'blue', body: '3–5 times a day, 3–5 days a week. Spreading the volume across the day buys far more total reps than one session to failure.' },
  { name: 'Volume', color: 'sky', body: 'Accumulate against a daily and weekly target, and vary it — 100 reps over four days is better as 22/35/28/15 than as 25×4. Raise the target as the reps get easier.' },
]

export interface EquipmentItem {
  item: string
  spec: string
  url?: string
}

export const PULLUP_EQUIPMENT: EquipmentItem[] = [
  { item: 'Pull-up bar', spec: "Ideal height 5'8\"–6'6\" — low enough to use for progressions, high enough to hang from." },
  { item: 'Door-mounted bar', spec: 'Cheapest way in, installs in minutes, and its low height suits negatives and partials.' },
  { item: 'Adjustable bar', spec: '66" or 72" options, roughly $500–650.', url: 'https://torqueathletic.com/collections/pullup-systems' },
  { item: 'Plyo boxes', spec: '12", 18", 24", 30", 36" — what makes a too-high bar usable for jumping pull-ups and negatives.' },
  { item: 'Thick bar grips', spec: 'Trains grip and forearms on the same reps you were already doing.' },
  { item: 'Rings / TRX', spec: 'For rows and the supplementary pulling work.' },
  { item: 'Bands', spec: 'Optional. Part rubber, part cloth wears better than pure rubber against a bar.' },
]

// ── Recording a session ──────────────────────────────────────────────────────

export type PullupMethod = 'straight' | 'ladder' | 'pyramid' | 'emom'

export const PULLUP_METHODS: { value: PullupMethod; label: string; hint: string }[] = [
  { value: 'straight', label: 'Straight', hint: 'Rounds × the same set. Rest as needed.' },
  { value: 'ladder', label: 'Ladder', hint: '1,2,…,top per round. 10–20s inside a ladder, 3+ min between.' },
  { value: 'pyramid', label: 'Pyramid', hint: '1,…,top,…,1 per round. 10–20s inside, 3+ min between.' },
  { value: 'emom', label: 'EMOM', hint: 'The set every minute on the minute; rounds = minutes.' },
]

/**
 * The reps actually performed, set by set — the thing that gets stored.
 *
 * Returned per set rather than as a total because that is what the schemes
 * *are*: a ladder to 4 and a straight 4×4 both come to 10 and 16 reps, and
 * conflating them loses the session. `rounds` multiplies the whole scheme, so
 * "3 ladders to 4" is three passes of 1,2,3,4.
 */
export function repScheme(method: PullupMethod, top: number, rounds: number): number[] {
  const n = Math.max(0, Math.floor(top))
  const r = Math.max(0, Math.floor(rounds))
  if (n === 0 || r === 0) return []
  const one = method === 'ladder' ? ladder(n) : method === 'pyramid' ? pyramid(n) : [n]
  // `emom` and `straight` differ in rest, not in reps — a minute cap is a fact
  // about the clock, and the clock is `durationMin`. Same scheme, both.
  return Array.from({ length: r }, () => one).flat()
}

/**
 * Rep counts → the `Workout.sets` lines the rest of the app already parses.
 *
 * One line per set, in the `Name NxR @ Wkg` shape `lib/fitness.ts`'s `parseSet`
 * expects, at 0kg — the convention the seeded demo data already uses for
 * bodyweight moves. One line per set rather than a grouped "5x3" because
 * `parseSet` reads the reps and drops the set count, so a grouped line would
 * count as a single set everywhere downstream.
 */
export function setLines(reps: number[]): string[] {
  return reps.map((r) => `Pull-up 1x${r} @ 0kg`)
}

/**
 * Reps on one set line, or 0 for a line that is not a pull-up set.
 *
 * Deliberately narrower than `fitness.parseSet`: a pull-up session may hold a
 * free-typed note line, and anything that is not a `Pull-up` line must not be
 * counted into a pull-up rep total.
 */
function setReps(line: string): number {
  const m = line.match(/^Pull-ups?\s+\d+\s*[x×]\s*(\d+)/i)
  return m ? Number(m[1]) : 0
}

/** Reps in one stored session. Reads the lines back through the same shape. */
export function repsOf(sets: string[]): number {
  return sets.reduce((total, line) => total + setReps(line), 0)
}

/** Biggest single set ever logged — which is what "max strict pull-ups" means. */
export function bestSet(sessions: { sets: string[] }[]): number {
  return sessions.reduce(
    (best, s) => s.sets.reduce((b, line) => Math.max(b, setReps(line)), best),
    0,
  )
}

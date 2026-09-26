import type { Entry, Habit, JournalData, WorkoutSet } from './types'
import { seedJournal, uid } from './storage'
import { addDays, fromISODay, todayISO, ymOf } from './date'

// Tiny deterministic PRNG (mulberry32) so the demo looks the same each load.
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (n: number, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, Math.round(n)))

const TASKS = [
  'Find something red for game day', 'Get camp new food', 'Water the plants',
  'Reply to Mara', 'Plan weekend hike', 'Fix the trailer light', 'Call mom',
  'Buy oat milk', 'Stretch 10 min', 'Back up photos',
]
const EVENTS = ['Ecstatic dance', 'Farmers market', 'Sunset at the rim', 'Video call w/ Sam', 'Laundry day']
const NOTES = ['Switch to lamb blend', 'Eliminate dairy', 'Try the new trail east', 'Sleep earlier']
const GRATITUDE = ['warm coffee', 'a quiet morning', 'Baron’s laugh', 'clean water', 'the desert light', 'a good book', 'my health']
const MEMORIES = ['Saw a shooting star', 'Camp chased a lizard', 'First snow on the peaks', 'Made bread from scratch', 'Long talk under the stars']

/**
 * Build ~30 days of realistic, correlated demo data (sleep↑ → stress↓, mood↑)
 * so charts, streaks, correlations and the index all have something to show.
 */
export function generateDemoData(today = todayISO()): JournalData {
  const j = seedJournal()
  const rand = rng(42)
  const entries: Entry[] = []

  // Lived-in history: backdate the seeded habits and fill 90 days of completions
  // so the activity + cards heatmap grids look full (the wellbeing/charts data
  // still spans the recent 30 days below).
  const HIST_DAYS = 90
  j.habits.forEach((h) => { h.startedOn = addDays(today, -(HIST_DAYS - 1)) })
  for (let i = HIST_DAYS - 1; i >= 30; i--) {
    const d = addDays(today, -i)
    j.habitLog[d] = j.habits.filter(() => rand() > 0.4).map((h) => h.id)
  }

  for (let i = 29; i >= 0; i--) {
    const date = addDays(today, -i)

    // Correlated wellbeing.
    const sleep = clamp(5 + rand() * 4) // 5–9
    const stress = clamp(10 - sleep + (rand() * 3 - 1.5))
    const mood = clamp(sleep - 1 + (rand() * 3 - 1.5))
    j.metrics.push({
      date, sleep, stress, mood,
      fastBreak: rand() > 0.5 ? 'food' : 'drink',
      calories: 1800 + Math.floor(rand() * 700),
      protein: 110 + Math.floor(rand() * 60),
      carbs: 150 + Math.floor(rand() * 120),
      fat: 50 + Math.floor(rand() * 40),
      // The three fields only a device can fill — an Apple Health import, or a
      // voice capture. They have been on `DailyMetric` since the ingest
      // pipeline landed and the seed never wrote one, so nothing in the app had
      // ever been rendered or exported with them present. Same shape as the
      // unseeded `data.cycle` finding: a field the seed skips is a field the
      // gates silently do not check. Correlated with sleep on purpose, because a
      // flat random walk makes a trend chart look broken.
      steps: 4_000 + Math.floor(rand() * 9_000),
      restingHR: Math.round(70 - sleep * 1.5 + rand() * 6),
      activeKcal: 250 + Math.floor(rand() * 550),
    })

    // 1–3 entries/day.
    const n = 1 + Math.floor(rand() * 3)
    for (let k = 0; k < n; k++) {
      const roll = rand()
      const [type, pool] = roll < 0.6 ? (['task', TASKS] as const) : roll < 0.85 ? (['event', EVENTS] as const) : (['note', NOTES] as const)
      const text = pool[Math.floor(rand() * pool.length)]
      entries.push({
        id: uid('e'), date, type, text,
        status: type === 'task' ? (rand() > 0.4 ? 'done' : 'open') : 'open',
        important: rand() > 0.85, memory: false, tags: [], createdAt: date,
      })
    }

    // Habit dots (each habit ~55% chance/day).
    j.habitLog[date] = j.habits.filter(() => rand() > 0.45).map((h) => h.id)

    // Gratitude + memory most days.
    if (rand() > 0.2) j.gratitude.push({ date, text: GRATITUDE[Math.floor(rand() * GRATITUDE.length)] })
    if (rand() > 0.6) j.memories.push({ date, text: MEMORIES[Math.floor(rand() * MEMORIES.length)] })

    // A few workouts.
    if (rand() > 0.7) {
      const acts = ['run', 'strength', 'yoga', 'walk', 'cycle'] as const
      j.workouts.push({
        id: uid('w'), date, activity: acts[Math.floor(rand() * acts.length)],
        durationMin: 20 + Math.floor(rand() * 50), distanceKm: rand() > 0.5 ? Math.round(rand() * 10 * 10) / 10 : undefined,
        sets: [], rpe: 4 + Math.floor(rand() * 6), notes: '', calories: 150 + Math.floor(rand() * 400),
      })
    }

  }

  j.entries = entries

  // Future-log items + a couple recurring rules.
  entries.push(
    { id: uid('e'), date: addDays(today, 5), type: 'event', text: 'Super Bowl party', status: 'open', important: true, memory: false, tags: [], createdAt: today },
    { id: uid('e'), date: addDays(today, 12), type: 'task', text: 'Renew trailer registration', status: 'open', important: false, memory: false, tags: [], createdAt: today },
  )
  j.recurrences = [
    { id: uid('rec'), text: 'Take vitamins', type: 'task', important: false, freq: 'daily', weekdays: [], startedOn: today },
    { id: uid('rec'), text: 'Weekly review', type: 'task', important: false, freq: 'weekly', weekdays: [0], startedOn: today },
  ]

  // ── Plan view: tasks with a real migration history ──────────────────────
  // "Chronically deferred" only appears once the same task has been pushed
  // forward more than once, which the generator never did — so the card that
  // carries the whole point of migration was invisible in the demo. Each of
  // these is one thread: `hops` copies marked migrated and threaded back to
  // the root by originId, then a still-open copy landing a few days overdue.
  const DEFERRED: { text: string; hops: number; important?: boolean }[] = [
    { text: 'Book the dentist', hops: 4, important: true },
    { text: 'Fix the shed door', hops: 3 },
    { text: 'Sort the photo backlog', hops: 2 },
  ]
  DEFERRED.forEach(({ text, hops, important = false }, i) => {
    const rootId = uid('e')
    const base = { type: 'task' as const, text, important, memory: false, tags: [] as string[] }
    let date = addDays(today, -(hops * 3 + 4 + i))
    entries.push({ ...base, id: rootId, date, status: 'migrated', createdAt: date })
    for (let h = 1; h < hops; h++) {
      date = addDays(date, 3)
      entries.push({ ...base, id: uid('e'), date, status: 'migrated', originId: rootId, createdAt: date })
    }
    date = addDays(date, 3)
    entries.push({ ...base, id: uid('e'), date, status: 'open', originId: rootId, createdAt: date })
  })

  j.monthly = [{ ym: ymOf(today), location: 'Moab, Utah 🏜️', goals: '• Finish the trail map\n• Read 2 books\n• Call family weekly', photoCaption: 'Sunrise over the canyon' }]
  j.birthdays = [
    { id: uid('b'), name: 'Baron', month: 3, day: 14 },
    { id: uid('b'), name: 'Mom', month: 8, day: 2 },
    { id: uid('b'), name: 'Sam', month: 11, day: 27 },
  ]
  j.collections = [{ id: uid('col'), name: 'Books to read', icon: '📚', createdAt: today }]

  /**
   * PPL gym sessions · eighteen of them, six per split, every other day.
   *
   * **Each lift carries its own weight history, oldest first.** The previous
   * version logged one fixed `sets` string per split and repeated it, so every
   * lift read 60, 60, 60 — the demo journal contained no PR, ever, and every
   * analytic on `?view=gym` was measuring a flat line. `stalledLifts` was
   * therefore correct to fire on 7 of 7 (COD-90): the data really was stalled.
   * An alert that fires on everything is useless whether or not it is right.
   *
   * The mix is deliberate, so the page has something to discriminate between:
   * Bench, Overhead Press and Romanian Deadlift plateau (three sessions since
   * their last top set — flagged), Deadlift and Barbell Row climb the whole
   * way, Squat and Calf Raise have just PR'd. Dip and Pull-up stay at 0kg
   * because they are bodyweight, which is also worth having in the fixture —
   * they have no progression to walk at all.
   */
  const ppl = [
    {
      split: 'push' as const,
      lifts: [
        { name: 'Bench Press', scheme: '5x5', weights: [60, 62.5, 65, 65, 65, 65] },
        { name: 'Overhead Press', scheme: '5x5', weights: [35, 35, 37.5, 37.5, 37.5, 37.5] },
        { name: 'Dip', scheme: '3x8', weights: [0, 0, 0, 0, 0, 0] },
      ],
    },
    {
      split: 'pull' as const,
      lifts: [
        { name: 'Deadlift', scheme: '5x5', weights: [100, 105, 110, 115, 120, 125] },
        { name: 'Barbell Row', scheme: '5x5', weights: [55, 57.5, 60, 60, 62.5, 65] },
        { name: 'Pull-up', scheme: '3x8', weights: [0, 0, 0, 0, 0, 0] },
      ],
    },
    {
      split: 'legs' as const,
      lifts: [
        { name: 'Squat', scheme: '5x5', weights: [80, 85, 90, 95, 100, 100] },
        { name: 'Romanian Deadlift', scheme: '4x8', weights: [60, 60, 65, 65, 65, 65] },
        { name: 'Calf Raise', scheme: '4x12', weights: [40, 45, 45, 45, 50, 50] },
      ],
    },
  ]
  const PPL_SESSIONS = ppl[0].lifts[0].weights.length
  for (let i = 0; i < PPL_SESSIONS * ppl.length; i++) {
    const day = addDays(today, -i * 2 - 1)
    const w = ppl[i % 3]
    // `i` counts backwards from today, so the newest session reads the LAST
    // entry of each weight array. Getting this the wrong way round produces a
    // journal that deloads every week and looks plausible on the page.
    const s = PPL_SESSIONS - 1 - Math.floor(i / 3)
    // BOTH shapes, and the structured one is the point.
    //
    // The seed wrote only the legacy `sets` strings ("Squat 5x5 @ 100kg"),
    // which is not what the app has written for a long time — `Gym.finish`
    // produces `setRows`. So every `setRows` path in the analytics ran on its
    // string-parsing fallback in the demo and the primary path was exercised
    // by no gate at all, and `lastSessionOfSplit` — which refuses to guess a
    // weight from a legacy string — rendered empty for everybody.
    //
    // Same shape as the unseeded `data.cycle` finding one pass earlier: a
    // demo that produces an older shape than the app writes is a demo that
    // tests the wrong branch. `sets` stays because real journals still hold
    // it and the fallback must keep working.
    const setRows: WorkoutSet[] = w.lifts.flatMap((l) => {
      const [count, reps] = l.scheme.split('x').map(Number)
      return Array.from({ length: count }, (_, k) => ({
        exercise: l.name,
        weight: l.weights[s],
        // The last set of a straight-sets block is where reps fall off, which
        // is the shape the "did the last set hold" read is looking for.
        reps: k === count - 1 && rand() > 0.5 ? Math.max(1, reps - 1) : reps,
        kind: 'working' as const,
      }))
    })
    j.workouts.push({
      id: uid('w'), date: day, activity: w.split, split: w.split,
      durationMin: 55 + Math.floor(rand() * 20),
      sets: w.lifts.map((l) => `${l.name} ${l.scheme} @ ${l.weights[s]}kg`),
      setRows,
      rpe: 7 + Math.floor(rand() * 3), notes: '',
    })
  }
  for (let i = 29; i >= 0; i -= 3) {
    j.bodyMetrics.push({ date: addDays(today, -i), weight: Math.round((78 - i * 0.05 + (rand() - 0.5)) * 10) / 10, measurements: {} })
  }
  j.routines = [
    { id: uid('rt'), name: 'My Push', split: 'push', exercises: ['Bench Press', 'Overhead Press', 'Lateral Raise', 'Dip'] },
  ]
  // ── Pickleball sessions (last ~30 days) ──
  for (let i = 1; i <= 30; i += 3) {
    if (rand() > 0.35) {
      const won = 1 + Math.floor(rand() * 4)
      const lost = Math.floor(rand() * 3)
      j.pickleball = j.pickleball ?? []
      j.pickleball.push({
        id: uid('pk'), date: addDays(today, -i), format: rand() > 0.3 ? 'doubles' : 'singles',
        gamesWon: won, gamesLost: lost, durationMin: 45 + Math.floor(rand() * 45),
        partner: rand() > 0.5 ? 'Sam' : 'Mara', rpe: 5 + Math.floor(rand() * 4), notes: '',
      })
    }
  }
  j.settings.pickleballGoalGames = 12

  // ── Pickleball leagues & tournaments + 75-day 3.5→4.0 plan ──
  j.pickleballEvents = [
    { id: uid('pke'), date: addDays(today, -21), name: 'Spring Open', kind: 'tournament', format: 'pool-play', division: '3.5 Mixed Doubles', wins: 4, losses: 2, placement: 'Bronze', partner: 'Maya' },
    { id: uid('pke'), date: addDays(today, -7), name: 'Tuesday Night Ladder', kind: 'league', format: 'ladder', division: '3.5–4.0', wins: 3, losses: 1, placement: '2nd of 8' },
  ]
  j.settings.pickleballPlanStart = addDays(today, -22) // mid-plan, ~phase 2

  // ── Streak (abstinence) demo: a 16-day live run with prior resets + urges ──
  /**
   * Sundays, anchored to the run date.
   *
   * The quantified day log's headline reading is "Sundays average ten", and a
   * weekday pattern seeded at fixed day-offsets from `today` lands on a
   * different weekday every day of the week — so the demo would show a peak on
   * whichever weekday the gate happened to run, and the one thing the card
   * claims would be a coincidence. Anchoring to the most recent Sunday makes it
   * true on every run.
   */
  const lastSunday = addDays(today, -fromISODay(today).getDay())
  const sunday = (n: number) => addDays(lastSunday, -7 * n)
  j.nofap = {
    startedOn: addDays(today, -16),
    best: 24,
    urgesResisted: 5,
    /**
     * `intensity` on every row, and it was missing from all three.
     *
     * `intensityStats` skips any urge with no rating, so `rated` was **0** and
     * `UrgeIntensityCard` — gated on `rated > 0` — had never been rendered with
     * data by anything: not the a11y gate, not the clip gate, not a screenshot.
     * The field is written by the urge form on every real log; only the seed
     * omitted it. Same shape as the unseeded `data.cycle` in CLAUDE.md: a card
     * that never renders cannot fail.
     *
     * Three different levels, so the distribution has a shape and a mode rather
     * than one bar three high.
     */
    urgeLog: [
      { id: uid('u'), date: addDays(today, -1), at: `${addDays(today, -1)}T22:10:00`, trigger: 'Doomscrolling', intensity: 2 },
      { id: uid('u'), date: today, at: `${today}T09:30:00`, trigger: 'Smoking', intensity: 4 },
      { id: uid('u'), date: today, at: `${today}T14:05:00`, trigger: 'Porn', intensity: 3 },
    ],
    plans: [
      { id: uid('tp'), addiction: 'Smoking', trigger: 'after meals', coping: 'Brush teeth, chew gum, 5-min walk' },
      { id: uid('tp'), addiction: 'Doomscrolling', trigger: 'in bed at night', coping: 'Phone charges in another room; read instead' },
    ],
    // `count` on two of the three: a lapse day can carry a quantity, and a row
    // without one still reads as "once". Both branches of `count ?? 1` are
    // therefore on screen, which is the only way the gates see either.
    relapses: [
      { id: uid('r'), date: addDays(today, -58), trigger: 'Stress', note: 'Rough day at work — defaulted to the old pattern.', count: 3 },
      { id: uid('r'), date: addDays(today, -40), trigger: 'Boredom', note: 'Late night, nothing to do.' },
      { id: uid('r'), date: addDays(today, -16), trigger: 'Stress', note: 'Need an if-then plan for stressful evenings.', count: 2 },
    ],
    /**
     * Two tracked addictions, and the seed had **none** — so
     * "Per-addiction streaks" rendered its empty state on every gate run, and
     * `addictionStats`, the per-addiction cost field and now the day log had
     * never been rendered with data by anything. Same shape as the unseeded
     * `data.cycle` in CLAUDE.md, one level down.
     *
     * Nicotine carries counts (and a falling trend, heaviest on Sundays);
     * Doomscrolling deliberately does not, so `hasLapseQuantity` has a false
     * case on the page and the "how many" card has to justify its own presence.
     */
    addictions: [
      {
        id: uid('ad'), name: 'Nicotine', startedOn: today, best: 11, costPerDay: 9,
        // Eight weeks of Sundays, because the trend card's window is eight
        // weeks: seeded over six it read **rising** for a sequence that falls
        // 14 → 8, since the two empty leading buckets dragged the first half's
        // average below the second's. A trend seeded shorter than the window it
        // is read through tells the opposite story, confidently.
        relapses: [
          { id: uid('r'), date: sunday(7), trigger: 'Drinks out', note: '', count: 18 },
          { id: uid('r'), date: sunday(6), trigger: 'Drinks out', note: '', count: 16 },
          { id: uid('r'), date: sunday(5), trigger: 'Drinks out', note: '', count: 14 },
          { id: uid('r'), date: sunday(4), trigger: 'Drinks out', note: '', count: 12 },
          { id: uid('r'), date: addDays(sunday(4), 3), trigger: 'Work stress', note: '', count: 4 },
          { id: uid('r'), date: sunday(3), trigger: 'Drinks out', note: '', count: 11 },
          { id: uid('r'), date: sunday(2), trigger: 'Family lunch', note: '', count: 9 },
          { id: uid('r'), date: addDays(sunday(2), 2), trigger: 'After a meal', note: '', count: 3 },
          { id: uid('r'), date: sunday(1), trigger: 'Family lunch', note: '', count: 8 },
          { id: uid('r'), date: today, trigger: 'After a meal', note: '', count: 4 },
        ],
      },
      {
        id: uid('ad'), name: 'Doomscrolling', startedOn: addDays(today, -4), best: 9,
        relapses: [
          { id: uid('r'), date: addDays(today, -19), trigger: 'In bed', note: '' },
          { id: uid('r'), date: addDays(today, -4), trigger: 'In bed', note: '' },
        ],
      },
    ],
  }

  // ── Developer focus sessions (Focus view) ──
  const projects = ['bujo', 'pickleball-vision', 'work', 'side-project']
  const langs = [['typescript', 'react'], ['python'], ['typescript'], ['go', 'rust']]
  for (let i = 0; i <= 18; i += 2) {
    if (rand() > 0.3) {
      const li = Math.floor(rand() * langs.length)
      j.devSessions = j.devSessions ?? []
      j.devSessions.push({
        id: uid('dv'), date: addDays(today, -i), durationMin: 60 + Math.floor(rand() * 180),
        project: projects[li], focus: 5 + Math.floor(rand() * 5), stress: 2 + Math.floor(rand() * 5),
        interruptions: Math.floor(rand() * 4), tags: langs[li], notes: '',
      })
    }
  }

  // ── An active 75-day challenge with a week of check-ins ──
  const chId = uid('ch')
  j.challenges = [{ id: chId, name: '75 Hard', durationDays: 75, startDate: addDays(today, -8), rules: ['Workout 1', 'Workout 2', 'Diet', 'Read 10pp', 'Water 1gal'], strict: true }]
  j.challengeLog = { [chId]: {} }
  for (let i = 8; i >= 0; i--) {
    const day = addDays(today, -i)
    const doneCount = rand() > 0.25 ? 5 : 3 // mostly full days
    j.challengeLog[chId][day] = Array.from({ length: doneCount }, (_, k) => k)
  }

  // ── Friends (Collections) ──
  j.friends = [
    { id: uid('fr'), name: 'Sam', birthday: '11-27', notes: 'pickleball partner', createdAt: today },
    { id: uid('fr'), name: 'Mara', birthday: addDays(today, 9).slice(5), links: ['https://example.com'], createdAt: today },
  ]

  // ── #tags on a sample of entries so the tag cloud / manager have data ──
  const TAGGED = ['#travel walk the rim', '#health meal prep', '#travel pack the van', '#work ship the release', '#health 8h sleep', '#read finish chapter 4']
  for (let i = 0; i < TAGGED.length; i++) {
    const text = TAGGED[i]
    j.entries.push({ id: uid('e'), date: addDays(today, -i * 2), type: 'note', text, status: 'open', important: false, memory: false, tags: text.match(/#[\w-]+/g)?.map((t) => t.slice(1)) ?? [], createdAt: today })
  }

  // ── Weekly goals, chosen rather than sliced ──
  //
  // This was `j.habits.slice(0, 2)`, which is an arbitrary two — and the
  // default seed's first two are **Caffeine and Sugar**. Giving those a weekly
  // *target* of 5 and 7 says "drink more coffee": the Goals page rendered
  // "Caffeine 2/5" as a goal being missed when 2 is the good outcome. Half of
  // COD-48 was that inversion; the roll-up was demoing it.
  //
  // Named, and one of each kind, so the page shows both a target you reach and
  // a cap you stay under.
  const WEEKLY_GOALS: Record<string, { goal: number; avoid?: boolean }> = {
    Caffeine: { goal: 5, avoid: true }, // at most 5 coffees a week
    Sugar: { goal: 2, avoid: true },
    Exercise: { goal: 4 },
    Read: { goal: 6 },
  }
  j.habits.forEach((h) => {
    const g = WEEKLY_GOALS[h.name]
    if (!g) return
    h.weeklyGoal = g.goal
    if (g.avoid) h.avoid = true
  })
  // Assign times of day + cues so the routine-timeline lens demos well.
  const SLOT: Record<string, { t: 'morning' | 'afternoon' | 'evening' | 'anytime'; cue?: string }> = {
    Caffeine: { t: 'morning', cue: 'With breakfast' },
    Vitamins: { t: 'morning', cue: 'After coffee' },
    Exercise: { t: 'morning', cue: 'Before the workday' },
    Vegetables: { t: 'afternoon', cue: 'At lunch' },
    'Water 2L': { t: 'anytime' },
    Read: { t: 'evening', cue: 'Before bed' },
  }
  j.habits.forEach((h) => { const m = SLOT[h.name]; if (m) { h.timeOfDay = m.t; h.cue = m.cue } })

  // ── One habit of every shape, because the demo only had `check` habits ─────
  //
  // Three of the four renderings were therefore unreachable from demo data: the
  // avoid slip/clean path, the count stepper and the timer. The previous pass
  // had to hand-add two habits before it could see that the Evening close-out
  // was striking a *slip* through with a ✓ — a bug that shipped precisely
  // because no seeded journal could draw it. Demo data that exercises one code
  // path is a fixture that agrees with itself.
  //
  // The seeded eight are all `check`, so these are appended with the same
  // 90-day `startedOn` and then given logs of the right SHAPE: an avoid habit
  // is mostly absent from the log (present = you slipped), and count/timer
  // habits live in `habitValues`, not `habitLog`.
  const shaped: Habit[] = [
    { id: uid('habit'), name: 'Doomscrolling', category: 'wellness', color: 'red', startedOn: addDays(today, -(HIST_DAYS - 1)), avoid: true, emoji: '📱', timeOfDay: 'evening', cue: 'In bed' },
    { id: uid('habit'), name: 'Water', category: 'food', color: 'sky', startedOn: addDays(today, -(HIST_DAYS - 1)), type: 'count', target: 8, floor: 4, unit: 'glasses', timeOfDay: 'anytime' },
    { id: uid('habit'), name: 'Meditation', category: 'wellness', color: 'lavender', startedOn: addDays(today, -(HIST_DAYS - 1)), type: 'timer', target: 15, floor: 5, unit: 'min', timeOfDay: 'morning', cue: 'Before the first meeting' },
  ]
  j.habits.push(...shaped)
  const [avoidH, countH, timerH] = shaped
  j.habitValues ??= {}
  for (let i = HIST_DAYS - 1; i >= 0; i--) {
    const d = addDays(today, -i)
    // Slips get rarer as the run goes on, so the streak and the comeback chips
    // both have something real to describe rather than uniform noise.
    if (rand() < 0.28 - (HIST_DAYS - i) * 0.002) (j.habitLog[d] ??= []).push(avoidH.id)
    const vals = (j.habitValues[d] ??= {})
    vals[countH.id] = Math.round(3 + rand() * 6) // 3–9 glasses against a target of 8
    if (rand() > 0.35) vals[timerH.id] = Math.round(5 + rand() * 15) // 5–20 min, some days skipped
  }

  j.settings.fitnessGoalMin = 150

  // ── Reading log: one of each shelf so the view + stats demo nicely ──
  j.books = [
    { id: uid('bk'), title: 'Atomic Habits', author: 'James Clear', status: 'finished', totalPages: 320, currentPage: 320, rating: 5, startedOn: addDays(today, -40), finishedOn: addDays(today, -12), createdAt: addDays(today, -40), color: 'green',
      link: 'https://jamesclear.com/atomic-habits', notes: 'Systems > goals. The 1% better idea reframed how I plan.',
      learnings: [
        { date: addDays(today, -20), text: 'Habit stacking: attach a new habit to an existing one.' },
        { date: addDays(today, -14), text: 'Make it obvious, attractive, easy, satisfying — the 4 laws.' },
      ] },
    { id: uid('bk'), title: 'Deep Work', author: 'Cal Newport', status: 'reading', totalPages: 296, currentPage: 120, startedOn: addDays(today, -6), createdAt: addDays(today, -6), color: 'mauve',
      learnings: [{ date: addDays(today, -2), text: 'Schedule deep blocks; treat shallow work as the exception.' }] },
    { id: uid('bk'), title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', status: 'want', createdAt: addDays(today, -2), color: 'sky' },
  ]
  j.readLinks = [
    { id: uid('rl'), url: 'https://www.thedinkpickleball.com/third-shot-drop/', title: 'The third-shot drop, explained', createdAt: addDays(today, -3) },
    { id: uid('rl'), url: 'https://jamesclear.com/articles', title: 'James Clear — article archive', done: true, createdAt: addDays(today, -9) },
  ]
  j.settings.readingGoalBooks = 12

  // ── Mindset: a couple of principles in focus with notes ──
  // The cues are the one piece of demo copy a reader studies, because they are
  // the example of what they are meant to write themselves. These were written
  // for a pickleball court — "paddle tap after every miss", "grade myself on
  // shot selection" — which stopped matching the library the moment it was
  // rewritten for the desk as well as the court.
  j.mindsetFocus = [
    { id: uid('mf'), principleId: 'short-memory', note: 'When a run fails: write down what it ruled out, then start the next one. No re-reading the traceback twice.', createdAt: addDays(today, -5) },
    { id: uid('mf'), principleId: 'protect-mornings', note: 'No meetings before 11. The hard thinking goes in that block, and it is the block I defend.', createdAt: addDays(today, -2) },
  ]
  // Practice marks over the same 12 weeks the practice grid draws. Three
  // principles that are no longer in focus keep their history — that is the
  // point of keying the log by principle rather than by focus row, and the
  // category-balance chart is the only place it shows.
  // Spread across EVERY category, at deliberately uneven rates.
  //
  // The old seed touched five of the nine, so Category balance rendered four
  // rows whose bar was zero-width and whose number was `0` — a chart that
  // mostly showed the absence of data, in the one place on the page that is
  // supposed to tell you where your attention has actually gone. A balance
  // chart needs an imbalance to be about; it does not need empty rows to prove
  // the categories exist.
  //
  // The rates are the story: heavy on the two principles in focus, a long tail
  // on things practised earlier and dropped, and one category barely touched —
  // which is exactly the read the chart exists to give.
  j.mindsetPractice = Object.fromEntries(
    ([
      ['short-memory', 0.55, 70],
      ['protect-mornings', 0.5, 60],
      ['process', 0.4, 84],
      ['breathe', 0.3, 84],
      ['systems', 0.25, 84],
      ['write-to-think', 0.24, 84],
      ['switching-cost', 0.22, 70],
      ['self-talk', 0.18, 45],
      ['single-task', 0.15, 84],
      ['rough-draft', 0.14, 60],
      ['show-early', 0.12, 84],
      ['ask-early', 0.08, 84],
    ] as const).map(([id, rate, span]) => [
      id,
      Array.from({ length: span }, (_, i) => addDays(today, -(span - 1 - i))).filter(() => rand() < rate),
    ]),
  )

  // ── Cycle · four cycles of neutral log, because there were none ──────────
  //
  // `data.cycle` was the one domain the seed never touched, so the Cycle page
  // had never been seen with data by anything: the whole orientation block is
  // `{day != null && phase && …}`, the chart drew a bare grid, and the month
  // list rendered thirty empty rows. `npm run a11y` visits the page and could
  // not fail on any of it — the same shape as the empty-journal trap in
  // CLAUDE.md, one domain deep: a card that never renders cannot fail.
  //
  // Four cycles, not one, because the page's arithmetic needs gaps: a single
  // period start gives `avgCycleLength` nothing to average and
  // `nextPeriodEstimate` returns null, which is a correct answer to a question
  // the demo should not be asking. Lengths are 29/27/30/28 so the average is a
  // real average and the history chart has variance to draw.
  //
  // The temperatures are the part worth getting right. A basal chart is read
  // for its **biphasic shift** — roughly 97.3°F in the follicular half, a rise
  // of ~0.6°F after ovulation, holding through the luteal phase — so a flat
  // line with noise would look like data while teaching the chart to say
  // nothing. Noise is ±0.12°F, below the shift and above the resolution, and
  // some days are simply missing, because every real chart has gaps.
  const CYCLE_LENGTHS = [29, 27, 30, 28]
  const PERIOD_DAYS = 5
  {
    // Walk back from today so the newest cycle is in progress, which is the
    // state the page's "cycle day N" block exists to describe — and land it
    // on day 20, past the ~day-15 ovulation, so the running cycle actually
    // *shows* the biphasic shift and `coverline` has something to find.
    // Anchored at day 13 the chart was a flat follicular line with a 97.2–97.4
    // axis: honest, and a demo of nothing.
    let start = addDays(today, -19)
    const starts: string[] = []
    for (const len of CYCLE_LENGTHS) {
      starts.unshift(start)
      start = addDays(start, -len)
    }
    starts.forEach((cycleStart, ci) => {
      const len = ci < CYCLE_LENGTHS.length - 1 ? CYCLE_LENGTHS[ci + 1] : 28
      const ovulation = len - 14
      for (let d = 0; d < len; d++) {
        const date = addDays(cycleStart, d)
        if (date > today) break
        const day = d + 1
        const flags: string[] = []
        if (day <= PERIOD_DAYS) flags.push('period')
        if (day === PERIOD_DAYS + 1 && rand() > 0.5) flags.push('spotting')
        if (day >= ovulation - 1 && day <= ovulation + 1) flags.push('ovulation')
        if (day >= len - 4) flags.push('pms')
        if (day <= 2 && rand() > 0.35) flags.push('cramps')
        // Biphasic: low before ovulation, ~0.6°F higher after it.
        const base = day > ovulation ? 97.9 : 97.3
        const temp = Math.round((base + (rand() - 0.5) * 0.24) * 100) / 100
        // Drive, 1–5, rated on most days but not all. It rises toward
        // ovulation and dips while bleeding, because a seed where the number is
        // uniform noise renders a card with four identical bars and no peak —
        // which is a demo of the arithmetic working, not of the card. About one
        // day in six is left unrated on purpose: `driveByPhase` must keep
        // "unrated" distinguishable from a 1, and a seed with no gaps never
        // exercises that branch.
        const near = Math.abs(day - ovulation)
        const driveBase = day <= PERIOD_DAYS ? 2 : near <= 2 ? 4.5 : near <= 5 ? 3.6 : 3
        const drive = Math.min(5, Math.max(1, Math.round(driveBase + (rand() - 0.5) * 1.4)))
        const rated = rand() > 0.16 ? { drive } : {}
        // Two or three missed mornings per cycle — a chart with no gaps is a
        // chart nobody actually kept.
        if (rand() > 0.09) j.cycle.push({ date, temp, flags, ...rated })
        else if (flags.length) j.cycle.push({ date, flags, ...rated })
      }
    })
  }

  // Demo links skip the first-run storage gate.
  j.settings.storageMode = 'local'
  // Marked here rather than at the three call sites (the welcome screen, the
  // Settings button, and the `?demo=1` boot path), because a flag that each
  // caller has to remember to set is a flag that one of them will not — and
  // `?demo=1` was already that caller.
  j.settings.demoSeeded = true
  return j
}

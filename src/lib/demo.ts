import type { Entry, Habit, JournalData, MoodReason, WorkoutSet } from './types'
import { seedJournal, uid } from './storage'
import { addDays, fromISODay, todayISO, ymOf } from './date'
import { lapseDays } from './moodPatterns'

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

/**
 * WHY the day went the way it did, derived from the numbers the day already has.
 *
 * `DailyMetric.moodReasons` is optional and additive, so a seed that skipped it
 * would leave `moodReasonImpact` — and the whole "why is my mood changing"
 * answer — rendering its empty state on every gate run. The repo has paid for
 * that shape three times (`data.cycle`, `addictions`, `UrgeWin.intensity`), so
 * this is seeded on purpose and with a *shape* rather than at random:
 *
 * - `slept-badly` follows the night that was actually short, so the card's
 *   delta agrees with the sleep→mood correlation the matrix already shows. A
 *   demo where the two disagree teaches the reader to distrust both.
 * - the drags attach to low-mood days and the lifts to high-mood ones, which is
 *   the point of having **two upward reasons**: a seed of nine bad conditions
 *   draws nine negative bars and the reader cannot tell a heavy one from a light
 *   one.
 * - `no-plans` is a weekend thing and `illness` is rare, so the row order in
 *   the card is not all one hue of cause.
 *
 * Roughly a third of days come back empty, which is load-bearing:
 * `moodReasonImpact` needs untagged days as the comparison group and returns
 * `[]` when every rated day carries a reason. A seed that tagged all 90 days
 * would show an empty card while looking thoroughly seeded.
 */
function moodReasonsFor(sleep: number, mood: number, date: string, r: number): MoodReason[] {
  const out: MoodReason[] = []
  if (sleep < 6) out.push('slept-badly')
  if (mood <= 4) out.push(r < 0.4 ? 'work-stress' : r < 0.7 ? 'lonely' : 'argument')
  if (mood >= 8) out.push(r < 0.55 ? 'exercised' : 'good-news')
  const weekend = [0, 6].includes(fromISODay(date).getDay())
  if (weekend && r > 0.55) out.push('no-plans')
  // `mood <= 6` on this branch is not decoration. Without it `money` and
  // `illness` attached to days at random, and the first seeded run had **Money
  // worry at +1.3** — the demo asserting that a money worry lifts the mood by a
  // point. A demo that contradicts itself teaches the reader to discount the
  // card, and the card is the one claiming to say why a mood moved.
  if (r > 0.92 && mood <= 6) out.push(r > 0.97 ? 'illness' : 'money')
  return out
}

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
  // so the activity + cards heatmap grids look full.
  const HIST_DAYS = 90
  j.habits.forEach((h) => { h.startedOn = addDays(today, -(HIST_DAYS - 1)) })
  for (let i = HIST_DAYS - 1; i >= 30; i--) {
    const d = addDays(today, -i)
    j.habitLog[d] = j.habits.filter(() => rand() > 0.4).map((h) => h.id)
    /**
     * WELLBEING ACROSS THE WHOLE HISTORY, not just the recent thirty days.
     *
     * The habit grids got 90 days and the metrics got 30, so two thirds of the
     * lived-in history had no mood at all. Everything that reads mood over a
     * long window was therefore reading mostly nothing: the mood calendar drew
     * one month out of twelve, `moodSwingByWeek`'s twelve buckets had four with
     * data, and — the one that matters here — **the primary streak's three
     * relapses sit at −58, −40 and −16 days, so two of the three had no mood
     * within a week of them and the mood↔lapse join could not be drawn at all**.
     * Nothing failed; the charts just quietly described a month.
     *
     * Same trap as the unseeded `data.cycle` and the unseeded `addictions`
     * before it, one axis over: not a field the seed skipped, a *span* it
     * skipped. These rows carry only the four hand-typed wellbeing fields — the
     * nutrition and device figures stay on the recent thirty days, because those
     * arrive from an import and a year of them is not what a demo is claiming.
     */
    const hSleep = clamp(5 + rand() * 4)
    const hMood = clamp(hSleep - 1 + (rand() * 3 - 1.5))
    const hReasons = moodReasonsFor(hSleep, hMood, d, rand())
    j.metrics.push({
      date: d,
      sleep: hSleep,
      stress: clamp(10 - hSleep + (rand() * 3 - 1.5)),
      mood: hMood,
      ...(hReasons.length ? { moodReasons: hReasons } : {}),
    })
  }

  for (let i = 29; i >= 0; i--) {
    const date = addDays(today, -i)

    // Correlated wellbeing.
    const sleep = clamp(5 + rand() * 4) // 5–9
    const stress = clamp(10 - sleep + (rand() * 3 - 1.5))
    const mood = clamp(sleep - 1 + (rand() * 3 - 1.5))
    const moodReasons = moodReasonsFor(sleep, mood, date, rand())
    j.metrics.push({
      date, sleep, stress, mood,
      ...(moodReasons.length ? { moodReasons } : {}),
      /* The free-text escape hatch, on one day. It is the branch the nine chips
         cannot cover, and a seed that only ever writes the closed taxonomy
         leaves the read-back's `moodReasonNote` line unrendered by every gate. */
      ...(i === 3 ? { moodReasonNote: 'Dentist, and the landlord called' } : {}),
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

  /**
   * A REAL SLUMP, because the generator could not produce one.
   *
   * Mood is `clamp(sleep − 1 + (rand()×3 − 1.5))` over `sleep ∈ 5…9`, so its
   * arithmetic floor is **3** and 90 days of it produced exactly **two** days at
   * or below 3. `moodBandRisk`'s Low band (0–3) therefore held 2 days at a
   * **100% lapse rate** — the most alarming number on the page, standing on two
   * observations, and the card's own "not enough yet" guard suppressing the one
   * band a reader would look at first. A guard that fires on every run is
   * indistinguishable from a chart that does not work.
   *
   * So: a three-day slump and two scattered bad days, written over whatever the
   * generator produced. Everyone has a handful of 1s and 2s in three months; a
   * demo whose worst day is a 3 is the unrealistic one. The slump is
   * deliberately NOT placed on a lapse day — the lag chart must show a shape
   * the data really has, not one this block drew by hand.
   */
  const SLUMP: [number, number][] = [[-62, 2], [-61, 1], [-60, 2], [-44, 3], [-13, 2]]
  for (const [offset, mood] of SLUMP) {
    const day = addDays(today, offset)
    const m = j.metrics.find((x) => x.date === day)
    if (!m) continue
    m.mood = mood
    m.stress = clamp(10 - mood + 1)
    m.moodReasons = offset === -44 ? ['illness'] : ['slept-badly', 'work-stress']
  }

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
     *
     * **Three of the five carry the label of a tracked addiction, and two do
     * not — deliberately.** `urgesLabelled` is the only join between an urge and
     * an addiction this model has (`UrgeWin` has an `at` timestamp and no
     * addiction field, COD-251), so the per-addiction hour clock on
     * `AddictionBreakdownCard` needs both of its branches on screen or neither
     * can fail:
     *
     * - **Doomscrolling** gets three, clustered at 10–11 PM, so that card draws
     *   a real clock with a real peak. Two of them at hour 23, because with one
     *   urge per hour the peak is a tie broken by "earliest" and the card would
     *   claim 9 PM over three equal hours.
     * - **Nicotine** gets none, because the urge preset is `Smoking` and the
     *   addiction preset is `Nicotine` — the exact mismatch the two lists ship
     *   with. So that card renders the "no urge carries this label" branch,
     *   which is the honest reading and is what a real journal will look like
     *   until the capture side is fixed.
     *
     * That also makes the coverage line a real fraction (3 of 5) rather than
     * 100%, which is the number the card exists to print.
     */
    /**
     * …and the log spanned **two days out of ninety**, which is the other half
     * of the same problem. Anything that joins an urge to the day it happened
     * on — `moodBandRisk`, which asks whether an urge is rated more intense on
     * a low day — had at most two days of mood to join to, so two of its three
     * bands reported `intensity: null` and the column the card exists for was
     * blank however much else was seeded. Spread across eight weeks now, with
     * the intensities leaning up on the low-mood days rather than assigned at
     * random: a seed with no relationship in it makes a working chart look
     * broken, which is indistinguishable from a broken one.
     */
    urgeLog: [
      { id: uid('u'), date: addDays(today, -6), at: `${addDays(today, -6)}T23:05:00`, trigger: 'Doomscrolling', intensity: 4 },
      { id: uid('u'), date: addDays(today, -3), at: `${addDays(today, -3)}T23:40:00`, trigger: 'Doomscrolling', intensity: 5 },
      /* Two of these sit on the slump days seeded above (−61, −13) on purpose:
         `moodBandRisk`'s Low row had **zero** urges and therefore a dash in the
         intensity column — the single cell the card exists to fill. Put there by
         hand, like the Nicotine trend and the Sunday peak, because a demo has to
         contain the pattern it claims to reveal. */
      { id: uid('u'), date: addDays(today, -61), at: `${addDays(today, -61)}T23:40:00`, trigger: 'Alone in the evening', intensity: 5, halt: ['lonely', 'tired'], technique: 'delay' },
      { id: uid('u'), date: addDays(today, -41), at: `${addDays(today, -41)}T21:15:00`, trigger: 'Work stress', intensity: 4, halt: ['tired'], technique: 'surf' },
      { id: uid('u'), date: addDays(today, -33), at: `${addDays(today, -33)}T13:20:00`, trigger: 'Boredom', intensity: 2, technique: 'delay' },
      { id: uid('u'), date: addDays(today, -24), at: `${addDays(today, -24)}T22:50:00`, trigger: 'Doomscrolling', intensity: 4, halt: ['tired'], technique: 'halt' },
      { id: uid('u'), date: addDays(today, -13), at: `${addDays(today, -13)}T20:05:00`, trigger: 'Argument at home', intensity: 5, halt: ['angry', 'lonely'], technique: 'reach-out' },
      { id: uid('u'), date: addDays(today, -9), at: `${addDays(today, -9)}T11:45:00`, trigger: 'After a meal', intensity: 1, technique: 'surf' },
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

  /* ── Developer focus sessions (Focus view) ──
     **Nineteen days became twelve weeks, and that is a bug fix rather than more
     data for its own sake.** The page reads `deepWorkHeatmap(data, today, 26)`
     — 182 cells — and the seed lit up ten of them, so the signature visual on
     the page had never been seen with more than three sparse columns. Same for
     `weeklyVolume` (12 rolling weeks against 3 with anything in them) and
     `focusByDuration`, whose `60 + rand()*180` could never produce a session
     under 30 or between 30 and 60 minutes: **two of five bands were structurally
     unreachable**, which is the "a branch the seed never takes cannot fail"
     trap aimed at a chart axis instead of a colour.

     So durations now come from a spread that covers every band, and the focus
     score is correlated with the block length and anti-correlated with
     interruptions — because the findings on this page are *about* those
     relationships, and a seed of independent uniforms makes every one of them
     report "no pattern" no matter how the maths is written. A demo that cannot
     exhibit the finding cannot test the finding. */
  /**
   * THE MOOD↔LAPSE RELATIONSHIP, SEEDED ON PURPOSE.
   *
   * This has to run *after* `j.nofap`, because it reads the lapse days out of it.
   *
   * Without it the demo's flagship chart — mood at day −3…+3 around a lapse —
   * showed whatever the PRNG happened to line up. Measured on two different run
   * dates: a **5.1 against 5.7** gap on one and a **5.6 against 5.8** gap on
   * the next, because the primary streak's relapses sit at fixed day offsets
   * while the per-addiction ones are anchored to Sundays, so the whole geometry
   * re-shuffles with the weekday the demo is loaded on. A flagship chart whose
   * finding depends on the calendar is indistinguishable from one that does not
   * work — the same reason `sunday(n)` exists twenty lines above, and the same
   * reason the Nicotine counts are hand-written into a falling sequence rather
   * than rolled.
   *
   * So: **−2 on the lapse day, −1 on the day before.** A shape, not a cliff. It
   * gives the lag curve the reading it exists to make legible ("mood sagged into
   * it and bottomed on the day") while leaving days +1…+3 at the journal's own
   * level, so the *other* reading — the drop coming after — is visibly not what
   * this data says. Both halves matter: a demo that dips symmetrically teaches
   * nothing, because the whole point of the chart is that the two sides mean
   * different things.
   *
   * An upward reason is stripped from a dipped day, because "exercised" on a
   * mood-3 lapse day is the demo contradicting itself — the failure mode the
   * `mood <= 6` guard in `moodReasonsFor` exists for.
   *
   * This is a demo containing the pattern it claims to reveal. It is not a claim
   * that the pattern is in anyone's real journal, and the cards say so on screen:
   * every one states its n and none of them uses a causal verb.
   */
  for (const day of lapseDays(j)) {
    for (const [offset, drop] of [[0, 2], [-1, 1]] as const) {
      const m = j.metrics.find((x) => x.date === addDays(day, offset))
      if (!m || m.mood == null) continue
      m.mood = clamp(m.mood - drop)
      if (m.stress != null) m.stress = clamp(m.stress + drop)
      const kept = (m.moodReasons ?? []).filter((r) => r !== 'exercised' && r !== 'good-news')
      m.moodReasons = kept.length ? kept : ['work-stress']
    }
  }

  // ── Developer focus sessions (Focus view) ──
  const projects = ['bujo', 'pickleball-vision', 'work', 'side-project']
  const langs = [['typescript', 'react'], ['python'], ['typescript'], ['go', 'rust']]
  /* Every band `focusByDuration` declares, so none of the five is dead. */
  const blocks = [20, 25, 45, 50, 75, 90, 110, 150, 180]
  j.devSessions = []
  for (let i = 0; i <= 83; i++) {
    const date = addDays(today, -i)
    const wd = new Date(date + 'T00:00').getDay()
    // Weekends are thinner, which is what makes `minutesByWeekday` and the
    // weekday finding say something rather than draw seven equal bars.
    if (rand() > (wd === 0 || wd === 6 ? 0.75 : 0.35)) continue
    const li = Math.floor(rand() * langs.length)
    const durationMin = blocks[Math.floor(rand() * blocks.length)]
    const interruptions = Math.floor(rand() * 4)
    // Longer blocks run deeper, interruptions cost about a point each. Clamped
    // to the 0–10 the type promises.
    const focus = Math.max(1, Math.min(10, Math.round(4 + durationMin / 45 - interruptions * 0.9 + rand())))
    j.devSessions.push({
      id: uid('dv'), date, durationMin,
      project: projects[li], focus, stress: Math.max(0, Math.min(10, Math.round(2 + interruptions + rand() * 2))),
      interruptions, tags: langs[li], notes: '',
    })
  }

  /* ── Typing practice (Focus view) ──
     **This domain was never seeded at all.** `data.typingSessions` was written
     by nothing, so the whole Typing subject — best/avg WPM, the weekday goal
     bar, the 14-day WPM line and the recent-drills list — had never been
     rendered with data by any gate, at any theme or viewport. `page-census`
     reported `focus · charts 0` on a page holding a Recharts `LineChart`,
     because that chart is behind `wpmCount >= 2` and the count was always zero.
     Exactly the `data.cycle` hole in CLAUDE.md, one domain over.

     Weekdays only, with WPM drifting up, so `typingStreak` and the goal bar
     have a real answer and the trend line has a direction. */
  j.typingSessions = []
  const sources = ['Monkeytype', 'keybr', 'TypingClub', '10FastFingers']
  for (let i = 41; i >= 0; i--) {
    const date = addDays(today, -i)
    const wd = new Date(date + 'T00:00').getDay()
    if (wd === 0 || wd === 6) continue
    if (rand() > 0.8) continue // the occasional skipped day, so the streak is earned
    j.typingSessions.push({
      id: uid('ty'), date,
      durationMin: [10, 15, 20, 25, 30][Math.floor(rand() * 5)],
      // 62 → ~78 wpm over six weeks, plus day-to-day noise.
      wpm: Math.round(78 - (i / 42) * 16 + (rand() - 0.5) * 6),
      accuracy: Math.round(94 + rand() * 5),
      source: sources[Math.floor(rand() * sources.length)],
    })
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
  //
  // `limit` needs a fourth shape again, and the one that matters is ABSENCE.
  // Its three states are under / over / not logged, and the third is the whole
  // reason the type is not just `count` with the comparison flipped — so the
  // seed deliberately leaves some days unrecorded rather than writing a value
  // every day. A seed that logs every day cannot render the state the design
  // turns on.
  const shaped: Habit[] = [
    { id: uid('habit'), name: 'Doomscrolling', category: 'wellness', color: 'red', startedOn: addDays(today, -(HIST_DAYS - 1)), avoid: true, emoji: '📱', timeOfDay: 'evening', cue: 'In bed' },
    { id: uid('habit'), name: 'Water', category: 'food', color: 'sky', startedOn: addDays(today, -(HIST_DAYS - 1)), type: 'count', target: 8, floor: 4, unit: 'glasses', timeOfDay: 'anytime' },
    { id: uid('habit'), name: 'Meditation', category: 'wellness', color: 'lavender', startedOn: addDays(today, -(HIST_DAYS - 1)), type: 'timer', target: 15, floor: 5, unit: 'min', timeOfDay: 'morning', cue: 'Before the first meeting' },
    { id: uid('habit'), name: 'Coffee', category: 'stimulant', color: 'peach', startedOn: addDays(today, -(HIST_DAYS - 1)), type: 'limit', target: 2, unit: 'cups', emoji: '☕', timeOfDay: 'morning', cue: 'With breakfast' },
  ]
  j.habits.push(...shaped)
  const [avoidH, countH, timerH, limitH] = shaped
  j.habitValues ??= {}
  for (let i = HIST_DAYS - 1; i >= 0; i--) {
    const d = addDays(today, -i)
    // Slips get rarer as the run goes on, so the streak and the comeback chips
    // both have something real to describe rather than uniform noise.
    if (rand() < 0.28 - (HIST_DAYS - i) * 0.002) (j.habitLog[d] ??= []).push(avoidH.id)
    const vals = (j.habitValues[d] ??= {})
    vals[countH.id] = Math.round(3 + rand() * 6) // 3–9 glasses against a target of 8
    if (rand() > 0.35) vals[timerH.id] = Math.round(5 + rand() * 15) // 5–20 min, some days skipped
    // Coffee against a limit of 2: mostly 0–2 (a win), sometimes 3–4 (over),
    // and ~1 day in 6 left out entirely so the "not logged" state is reachable.
    if (rand() > 0.17) vals[limitH.id] = rand() < 0.72 ? Math.round(rand() * 2) : 3 + Math.round(rand())
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

import type { Entry, JournalData } from './types'
import { seedJournal, uid } from './storage'
import { addDays, todayISO, ymOf } from './date'

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
      const acts = ['Run', 'Strength', 'Yoga', 'Walk', 'Cycling']
      j.workouts.push({
        id: uid('w'), date, activity: acts[Math.floor(rand() * acts.length)],
        durationMin: 20 + Math.floor(rand() * 50), distanceKm: rand() > 0.5 ? Math.round(rand() * 10 * 10) / 10 : undefined,
        sets: [], rpe: 4 + Math.floor(rand() * 6), notes: '', calories: 150 + Math.floor(rand() * 400),
      })
    }

    // Occasional stickers.
    if (rand() > 0.8) j.stickers[date] = ['⭐']
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

  j.monthly = [{ ym: ymOf(today), location: 'Moab, Utah 🏜️', goals: '• Finish the trail map\n• Read 2 books\n• Call family weekly', photoCaption: 'Sunrise over the canyon' }]
  j.birthdays = [
    { id: uid('b'), name: 'Baron', month: 3, day: 14 },
    { id: uid('b'), name: 'Mom', month: 8, day: 2 },
    { id: uid('b'), name: 'Sam', month: 11, day: 27 },
  ]
  j.collections = [{ id: uid('col'), name: 'Books to read', icon: '📚', createdAt: today }]

  // PPL gym sessions + progressive body weight, so Gym view has data.
  const ppl = [
    { split: 'push' as const, sets: ['Bench Press 5x5 @ 60kg', 'Overhead Press 5x5 @ 35kg', 'Dip 3x8 @ 0kg'] },
    { split: 'pull' as const, sets: ['Deadlift 5x5 @ 100kg', 'Barbell Row 5x5 @ 55kg', 'Pull-up 3x8 @ 0kg'] },
    { split: 'legs' as const, sets: ['Squat 5x5 @ 80kg', 'Romanian Deadlift 4x8 @ 60kg', 'Calf Raise 4x12 @ 40kg'] },
  ]
  for (let i = 0; i < 9; i++) {
    const day = addDays(today, -i * 2 - 1)
    const w = ppl[i % 3]
    j.workouts.push({
      id: uid('w'), date: day, activity: `${w.split} day`, split: w.split,
      durationMin: 55 + Math.floor(rand() * 20), sets: w.sets, rpe: 7 + Math.floor(rand() * 3), notes: '',
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
  j.nofap = {
    startedOn: addDays(today, -16),
    best: 24,
    urgesResisted: 5,
    urgeLog: [
      { id: uid('u'), date: addDays(today, -1), at: `${addDays(today, -1)}T22:10:00`, trigger: 'Doomscrolling' },
      { id: uid('u'), date: today, at: `${today}T09:30:00`, trigger: 'Smoking' },
      { id: uid('u'), date: today, at: `${today}T14:05:00`, trigger: 'Porn' },
    ],
    plans: [
      { id: uid('tp'), addiction: 'Smoking', trigger: 'after meals', coping: 'Brush teeth, chew gum, 5-min walk' },
      { id: uid('tp'), addiction: 'Doomscrolling', trigger: 'in bed at night', coping: 'Phone charges in another room; read instead' },
    ],
    relapses: [
      { id: uid('r'), date: addDays(today, -58), trigger: 'Stress', note: 'Rough day at work — defaulted to the old pattern.' },
      { id: uid('r'), date: addDays(today, -40), trigger: 'Boredom', note: 'Late night, nothing to do.' },
      { id: uid('r'), date: addDays(today, -16), trigger: 'Stress', note: 'Need an if-then plan for stressful evenings.' },
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

  // ── Give a couple habits weekly goals so the Goals roll-up populates ──
  j.habits.slice(0, 2).forEach((h, i) => { h.weeklyGoal = i === 0 ? 5 : 7 })
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
  j.mindsetFocus = [
    { id: uid('mf'), principleId: 'short-memory', note: 'Deep breath + paddle tap after every miss. Next point only.', createdAt: addDays(today, -5) },
    { id: uid('mf'), principleId: 'process', note: 'Grade myself on shot selection, not the scoreboard.', createdAt: addDays(today, -2) },
  ]

  // Demo links skip the first-run storage gate.
  j.settings.storageMode = 'local'
  return j
}

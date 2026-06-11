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
  // Demo links skip the first-run storage gate.
  j.settings.storageMode = 'local'
  return j
}

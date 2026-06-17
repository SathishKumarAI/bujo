// Achievement badges (inspired by HarambeFit's badge system). Pure + derived
// from existing journal data — nothing new is stored; a badge is earned the
// moment the data satisfies its predicate. Framework-free so it's unit-tested.
import type { JournalData } from './types'
import { longestStreak } from './stats'
import { personalRecords } from './fitness'
import { fastHours } from './fasting'
import { dayDiff, todayISO } from './date'

/** Live abstinence streak in days (since nofap.startedOn) — not the relapse-only `best`. */
const cleanDays = (d: JournalData) => Math.max(0, dayDiff(d.nofap.startedOn, todayISO()))

export interface Achievement {
  id: string
  label: string
  emoji: string
  desc: string
  /** Catppuccin token for the earned badge tint. */
  color: string
  earned: (d: JournalData) => boolean
}

const workouts = (d: JournalData) => d.workouts.length
const homeWorkouts = (d: JournalData) => d.workouts.filter((w) => w.activity === 'Home').length
const moodDays = (d: JournalData) => d.metrics.filter((m) => m.mood != null).length
const activeHabits = (d: JournalData) => d.habits.filter((h) => !h.archived).length
const fasts = (d: JournalData) => d.fasts ?? []

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-entry', label: 'First words', emoji: '✍️', color: 'sky', desc: 'Log your first journal entry', earned: (d) => d.entries.length >= 1 },
  { id: 'entries-100', label: 'Centurion', emoji: '📚', color: 'sapphire', desc: 'Log 100 entries', earned: (d) => d.entries.length >= 100 },
  { id: 'streak-7', label: 'One week on', emoji: '🔥', color: 'peach', desc: '7-day journaling streak', earned: (d) => longestStreak(d) >= 7 },
  { id: 'streak-30', label: 'Unbroken', emoji: '🗓️', color: 'red', desc: '30-day journaling streak', earned: (d) => longestStreak(d) >= 30 },
  { id: 'habits-5', label: 'Routine', emoji: '✅', color: 'green', desc: 'Track 5 habits at once', earned: (d) => activeHabits(d) >= 5 },
  { id: 'mood-30', label: 'Self-aware', emoji: '🧠', color: 'mauve', desc: 'Log your mood on 30 days', earned: (d) => moodDays(d) >= 30 },
  { id: 'first-workout', label: 'Day one', emoji: '🏋️', color: 'teal', desc: 'Log your first workout', earned: (d) => workouts(d) >= 1 },
  { id: 'workouts-50', label: 'Gym rat', emoji: '💪', color: 'lavender', desc: 'Log 50 workouts', earned: (d) => workouts(d) >= 50 },
  { id: 'home-10', label: 'No excuses', emoji: '🏠', color: 'green', desc: 'Log 10 home workouts', earned: (d) => homeWorkouts(d) >= 10 },
  { id: 'first-pr', label: 'Personal best', emoji: '🥇', color: 'yellow', desc: 'Set your first lifting PR', earned: (d) => personalRecords(d).length >= 1 },
  { id: 'first-fast', label: 'Fasted', emoji: '⏳', color: 'blue', desc: 'Complete your first fast', earned: (d) => fasts(d).length >= 1 },
  { id: 'fast-16', label: '16:8', emoji: '🕗', color: 'sky', desc: 'Complete a 16-hour fast', earned: (d) => fasts(d).some((f) => fastHours(f) >= 16) },
  { id: 'photos-2', label: 'Progress', emoji: '📸', color: 'pink', desc: 'Keep two progress photos', earned: (d) => (d.progressPhotos ?? []).length >= 2 },
  { id: 'clean-7', label: '7 days clean', emoji: '🛡️', color: 'green', desc: 'A 7-day abstinence streak', earned: (d) => Math.max(d.nofap.best, cleanDays(d)) >= 7 },
]

/** The badges currently earned, in catalogue order. */
export function earnedAchievements(d: JournalData): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.earned(d))
}

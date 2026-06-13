import type { JournalData } from './types'
import type { ViewId } from '../components/shell/viewChrome'
import { dayDiff, todayISO } from './date'
import { habitStreak } from './stats'

export interface Recommendation {
  id: string // stable, so a dismissal sticks
  text: string
  action?: { label: string; view: ViewId }
}

/**
 * Contextual, non-intrusive suggestions ("smart defaults"). Pure + ordered by
 * usefulness; the UI shows the top couple and lets the user dismiss them.
 * Sensitive areas (cycle / nofap) are intentionally never recommended.
 */
export function recommendations(data: JournalData, today = todayISO()): Recommendation[] {
  const recs: Recommendation[] = []
  const s = data.settings

  // Backup nudge — only once there's something to lose and it's stale.
  if (data.entries.length >= 5) {
    const stale = !s.lastBackup || dayDiff(s.lastBackup, today) >= 7
    if (stale) recs.push({ id: 'backup', text: 'It’s been a while since your last backup — export a copy.', action: { label: 'Settings', view: 'settings' } })
  }

  // Suggest a daily reminder once journaling is a habit.
  if (!s.reminderEnabled && data.entries.length >= 8) {
    recs.push({ id: 'reminder', text: 'Journaling most days? A daily reminder helps it stick.', action: { label: 'Settings', view: 'settings' } })
  }

  // Per-habit nudges: weekly goal, then challenge-worthy streaks.
  for (const h of data.habits) {
    if (h.archived) continue
    const streak = habitStreak(data, h.id, today)
    if (streak >= 14) {
      recs.push({ id: `chal-${h.id}`, text: `${h.name} is on a ${streak}-day streak — turn it into a challenge.`, action: { label: 'Challenges', view: 'challenges' } })
    } else if (streak >= 7 && !h.weeklyGoal) {
      recs.push({ id: `goal-${h.id}`, text: `Set a weekly goal for ${h.name} to keep the momentum.`, action: { label: 'Trackers', view: 'trackers' } })
    }
  }

  // Encourage the Focus tracker for developers who tag dev work.
  if ((data.devSessions ?? []).length === 0 && data.habits.some((h) => /code|work|dev|program/i.test(h.name))) {
    recs.push({ id: 'focus', text: 'Track your coding time, flow and stress in Focus.', action: { label: 'Focus', view: 'focus' } })
  }

  return recs
}

import type { JournalData } from './types'
import { todayISO, dayDiff } from './date'
import { weeklyHabitCount } from './stats'
import { weeklyActiveMinutes } from './fitness'
import { PICKLE_PLAN } from './pickleballPlan'

/**
 * The coach turns logged data into a few proactive "what to do next" prompts —
 * the difference between a tracker (records the past) and a coach (guides the
 * next action). Pure + deterministic so it's testable and renders the same all
 * day. Returns the top few tips, highest-priority first.
 */
export interface CoachTip {
  id: string
  title: string
  detail: string
  to: string // ViewId to jump to
  tone: 'do' | 'win' | 'info'
}

export function coachTips(data: JournalData, today = todayISO()): CoachTip[] {
  const tips: CoachTip[] = []
  const dow = new Date(today + 'T00:00:00').getDay()

  // 1. Habits with a weekly goal that are behind pace and due today.
  for (const h of data.habits) {
    if (h.archived || !h.weeklyGoal) continue
    const scheduledToday = !h.activeDays || h.activeDays.length === 0 || h.activeDays.includes(dow)
    const doneToday = (data.habitLog[today] ?? []).includes(h.id)
    const cnt = weeklyHabitCount(data, h.id, today)
    if (cnt < h.weeklyGoal && scheduledToday && !doneToday) {
      tips.push({
        id: 'habit-' + h.id,
        title: `${h.emoji ? h.emoji + ' ' : ''}${h.name}`,
        detail: `${cnt}/${h.weeklyGoal} this week — do it today to stay on pace.`,
        to: 'trackers', tone: 'do',
      })
    }
  }

  // 2. Weekly movement goal.
  const fitGoal = data.settings.fitnessGoalMin ?? 150
  const mins = weeklyActiveMinutes(data, today)
  if (mins < fitGoal) {
    tips.push({ id: 'fit', title: 'Move more', detail: `${fitGoal - mins} min to your ${fitGoal}-min weekly goal.`, to: 'fitness', tone: 'do' })
  } else {
    tips.push({ id: 'fit-win', title: 'Movement goal hit', detail: `${mins} min active this week — keep it rolling.`, to: 'fitness', tone: 'win' })
  }

  // 3. Pickleball 3.5→4.0 plan: today's phase + a drill.
  if (data.settings.pickleballPlanStart) {
    const day = Math.max(1, dayDiff(data.settings.pickleballPlanStart, today) + 1)
    const ends = [18, 36, 54, 72, 75]
    const idx = ends.findIndex((e) => day <= e)
    const phase = PICKLE_PLAN[idx >= 0 ? idx : PICKLE_PLAN.length - 1]
    if (phase && day <= 75) {
      const drill = phase.drills[0]
      tips.push({ id: 'pb', title: `Pickleball day ${day}: ${phase.title}`, detail: `Drill — ${drill.name}: ${drill.how}`, to: 'pickleball', tone: 'info' })
    }
  }

  // 4. Highest priority: if today's mood isn't logged yet, check in first.
  const moodLogged = data.metrics.some((m) => m.date === today && m.mood != null)
  if (!moodLogged) {
    tips.unshift({ id: 'log', title: 'Check in', detail: 'Rate today’s mood & sleep and tick your habits.', to: 'today', tone: 'do' })
  }

  return tips.slice(0, 4)
}

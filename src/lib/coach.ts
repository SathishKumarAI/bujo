import type { JournalData } from './types'
import { todayISO, dayDiff, addDays } from './date'
import { weeklyHabitCount, habitDoneOn } from './stats'
import { weeklyActiveMinutes } from './fitness'
import { PICKLE_PLAN } from './pickleballPlan'
import { insights, type Insight } from './correlations'

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

/**
 * Completion rate (0–1) of a habit on its SCHEDULED days over the last `window`
 * days ending `today`. Only days where the habit was due (active weekday + after
 * it started) count toward the denominator, so changing your schedule or a fresh
 * habit doesn't read as a "drop". Returns null when nothing was scheduled.
 */
function scheduledRate(
  data: JournalData,
  h: JournalData['habits'][number],
  today: string,
  window: number,
): number | null {
  let due = 0
  let done = 0
  for (let i = 0; i < window; i++) {
    const day = addDays(today, -i)
    if (day < h.startedOn) continue
    const dow = new Date(day + 'T00:00:00').getDay()
    if (h.activeDays?.length && !h.activeDays.includes(dow)) continue
    due += 1
    if (habitDoneOn(data, h, day)) done += 1
  }
  return due ? done / due : null
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

  // 4. Early warning: a habit whose recent (7-day) completion on scheduled days
  //    has dropped sharply versus its 30-day baseline — catch the slip before
  //    the streak dies. Threshold: baseline was solid (≥50%) and the recent
  //    rate fell by at least 30 points (absolute) to clearly worse.
  for (const h of data.habits) {
    if (h.archived || h.avoid) continue
    const baseline = scheduledRate(data, h, today, 30)
    const recent = scheduledRate(data, h, today, 7)
    if (baseline == null || recent == null) continue
    if (baseline >= 0.5 && baseline - recent >= 0.3) {
      tips.push({
        id: 'slip-' + h.id,
        title: `${h.emoji ? h.emoji + ' ' : ''}${h.name} is slipping`,
        detail: `Down to ${Math.round(recent * 100)}% this week from ${Math.round(baseline * 100)}% — get back on it before the habit fades.`,
        to: 'trackers', tone: 'do',
      })
    }
  }

  // 5. Highest priority: if today's mood isn't logged yet, check in first.
  const moodLogged = data.metrics.some((m) => m.date === today && m.mood != null)
  if (!moodLogged) {
    tips.unshift({ id: 'log', title: 'Check in', detail: 'Rate today’s mood & sleep and tick your habits.', to: 'today', tone: 'do' })
  }

  return tips.slice(0, 4)
}

export interface CoachDigest {
  /** Top actionable tips (a trimmed slice of coachTips). */
  tips: CoachTip[]
  /** A single strongest data insight to pair with the tips, or null. */
  insight: Insight | null
  /** One-line headline summarising what to focus on, derived from the tips. */
  headline: string
}

/**
 * A compact "what to focus on" bundle for the Insights view: the top couple of
 * coach tips plus the single strongest correlation insight, with a derived
 * headline. Pairs the forward-looking coach (do this next) with the backward
 * pattern read (here's why) in one card. Pure + deterministic.
 */
export function coachDigest(data: JournalData, today = todayISO()): CoachDigest {
  const allTips = coachTips(data, today)
  const tips = allTips.slice(0, 2)

  // Strongest insight = highest |r|.
  const found = insights(data)
  const insight = found.length
    ? [...found].sort((a, b) => Math.abs(b.r) - Math.abs(a.r))[0]
    : null

  // Headline: prefer an urgent "do" tip, else celebrate a win, else neutral.
  let headline: string
  const doTip = allTips.find((t) => t.tone === 'do')
  const winTip = allTips.find((t) => t.tone === 'win')
  if (doTip) headline = `Next up: ${doTip.title}`
  else if (winTip) headline = `Nice — ${winTip.title.toLowerCase()}`
  else headline = 'You’re on track — keep the momentum.'

  return { tips, insight, headline }
}

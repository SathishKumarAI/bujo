import { describe, it, expect } from 'vitest'
import { coachTips } from './coach'
import { emptyJournal } from './storage'

describe('coach', () => {
  it('prompts a check-in when today has no mood logged', () => {
    const d = emptyJournal()
    const tips = coachTips(d, '2026-06-18')
    expect(tips[0].id).toBe('log')
  })

  it('does not prompt check-in once mood is logged', () => {
    const d = emptyJournal()
    d.metrics.push({ date: '2026-06-18', mood: 7 })
    const tips = coachTips(d, '2026-06-18')
    expect(tips.find((t) => t.id === 'log')).toBeUndefined()
  })

  it('nudges a behind-pace weekly habit due today', () => {
    const d = emptyJournal()
    d.metrics.push({ date: '2026-06-18', mood: 7 })
    d.habits.push({ id: 'h1', name: 'Read', category: 'wellness', color: 'mauve', startedOn: '2026-01-01', weeklyGoal: 5 })
    const tips = coachTips(d, '2026-06-18')
    expect(tips.find((t) => t.id === 'habit-h1')).toBeTruthy()
  })

  it('celebrates when the weekly movement goal is met', () => {
    const d = emptyJournal()
    d.metrics.push({ date: '2026-06-18', mood: 7 })
    d.settings.fitnessGoalMin = 30
    d.workouts.push({ id: 'w1', date: '2026-06-18', activity: 'Run', durationMin: 60, sets: [], notes: '' })
    const tips = coachTips(d, '2026-06-18')
    expect(tips.find((t) => t.id === 'fit-win')).toBeTruthy()
  })

  it('surfaces the active pickleball plan phase', () => {
    const d = emptyJournal()
    d.metrics.push({ date: '2026-06-18', mood: 7 })
    d.settings.pickleballPlanStart = '2026-06-01' // ~day 18 → phase 1
    const tips = coachTips(d, '2026-06-18')
    expect(tips.find((t) => t.id === 'pb')).toBeTruthy()
  })
})

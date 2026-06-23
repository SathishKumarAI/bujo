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

  it('warns when a habit completion rate drops sharply this week', () => {
    const d = emptyJournal()
    const today = '2026-06-30'
    d.metrics.push({ date: today, mood: 7 })
    d.habits.push({ id: 'h1', name: 'Meditate', category: 'wellness', color: 'mauve', startedOn: '2026-01-01' })
    // Strong 30-day baseline: done on days 8..30 ago, but NOT the recent 7 days
    // (days 0..6 ago) → recent rate 0, baseline high → sharp drop.
    function addDays(iso: string, delta: number) {
      const dt = new Date(iso + 'T00:00:00')
      dt.setDate(dt.getDate() + delta)
      return dt.toISOString().slice(0, 10)
    }
    for (let i = 7; i < 30; i++) {
      d.habitLog[addDays(today, -i)] = ['h1']
    }
    const tips = coachTips(d, today)
    expect(tips.find((t) => t.id === 'slip-h1')).toBeTruthy()
  })

  it('does not warn when a habit stays stable', () => {
    const d = emptyJournal()
    const today = '2026-06-30'
    d.metrics.push({ date: today, mood: 7 })
    d.habits.push({ id: 'h2', name: 'Meditate', category: 'wellness', color: 'mauve', startedOn: '2026-01-01' })
    function addDays(iso: string, delta: number) {
      const dt = new Date(iso + 'T00:00:00')
      dt.setDate(dt.getDate() + delta)
      return dt.toISOString().slice(0, 10)
    }
    // Done every day across the whole 30-day window → recent == baseline.
    for (let i = 0; i < 30; i++) {
      d.habitLog[addDays(today, -i)] = ['h2']
    }
    const tips = coachTips(d, today)
    expect(tips.find((t) => t.id === 'slip-h2')).toBeUndefined()
  })
})

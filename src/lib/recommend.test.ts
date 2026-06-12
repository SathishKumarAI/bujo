import { describe, it, expect } from 'vitest'
import { emptyJournal } from './storage'
import { recommendations } from './recommend'
import type { Entry, Habit } from './types'

const entry = (i: number): Entry => ({ id: `e${i}`, date: '2026-06-11', type: 'task', text: `t${i}`, important: false, memory: false, tags: [], status: 'open', createdAt: '2026-06-11T00:00:00.000Z' })

describe('recommendations', () => {
  it('nudges a backup once there are entries and none recorded', () => {
    const d = emptyJournal()
    d.entries = Array.from({ length: 6 }, (_, i) => entry(i))
    expect(recommendations(d, '2026-06-11').some((r) => r.id === 'backup')).toBe(true)
  })

  it('does not nudge a backup when one is recent', () => {
    const d = emptyJournal()
    d.entries = Array.from({ length: 6 }, (_, i) => entry(i))
    d.settings.lastBackup = '2026-06-10'
    expect(recommendations(d, '2026-06-11').some((r) => r.id === 'backup')).toBe(false)
  })

  it('suggests a weekly goal for a 7-day streak habit without one', () => {
    const d = emptyJournal()
    const h: Habit = { id: 'h1', name: 'Read', category: 'wellness', color: 'peach', startedOn: '2026-06-01' }
    d.habits = [h]
    d.habitLog = {}
    for (let i = 0; i < 7; i++) d.habitLog[`2026-06-${String(11 - i).padStart(2, '0')}`] = ['h1']
    expect(recommendations(d, '2026-06-11').some((r) => r.id === 'goal-h1')).toBe(true)
  })
})

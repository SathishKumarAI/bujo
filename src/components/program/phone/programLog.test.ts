import { describe, expect, it } from 'vitest'
import { actualOf, planRows, splitForFocus } from './programLog'
import { newSetRow } from '../../gym/setRow'
import type { JournalData } from '../../../lib/types'

const empty = { workouts: [] } as unknown as JournalData
const day = { day: 1, focus: 'Legs (quad)', exercises: [
  { name: 'Front squats', qty: '5 reps', sets: '3' },
  { name: 'Plank', qty: '30 s', sets: '2' },
] }

describe('planRows', () => {
  it('draws one row per prescribed set with the rep target filled in', () => {
    const rows = planRows(day, empty)
    expect(rows.map((r) => [r.exercise, r.reps])).toEqual([
      ['Front squats', '5'], ['Front squats', '5'], ['Front squats', '5'],
      ['Plank', ''], ['Plank', ''],
    ])
    expect(new Set(rows.map((r) => r.id)).size).toBe(5)
  })

  it('carries the weight from the last time the lift was logged', () => {
    const data = { workouts: [{ id: 'w', date: '2026-10-01', activity: 'strength', sets: [], setRows: [{ exercise: 'Front squats', weight: 80, reps: 5 }] }] } as unknown as JournalData
    expect(planRows(day, data)[0].weight).toBe('80')
  })
})

describe('splitForFocus', () => {
  it('reads the split out of a focus label and falls back to other', () => {
    expect(splitForFocus('Legs (quad)')).toBe('legs')
    expect(splitForFocus('Full body')).toBe('full')
    expect(splitForFocus('Arms & abs')).toBe('other')
  })
})

describe('actualOf', () => {
  it('writes weight×reps and skips empty sets', () => {
    expect(actualOf([newSetRow({ weight: '60', reps: '8' }), newSetRow(), newSetRow({ reps: '10' })], 'kg')).toBe('60kg×8, 10')
  })
})

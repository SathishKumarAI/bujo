import { describe, expect, it, beforeEach } from 'vitest'
import { clearPendingSession, peekPendingSession, setPendingSession } from './pendingSession'

describe('pendingSession', () => {
  beforeEach(() => clearPendingSession())

  it('holds nothing until something is handed over', () => {
    expect(peekPendingSession()).toBeNull()
  })

  it('hands the exercises over in order', () => {
    setPendingSession(['Machine chest press', 'Incline dumbbell press'])
    expect(peekPendingSession()).toEqual(['Machine chest press', 'Incline dumbbell press'])
  })

  // The whole reason peek and clear are separate: React may invoke a component
  // twice, and a read that consumed would leave the second invocation empty.
  it('survives repeated reads', () => {
    setPendingSession(['Lateral raises'])
    expect(peekPendingSession()).toEqual(['Lateral raises'])
    expect(peekPendingSession()).toEqual(['Lateral raises'])
  })

  it('is gone once cleared, so returning to Strength does not re-seed', () => {
    setPendingSession(['Lateral raises'])
    clearPendingSession()
    expect(peekPendingSession()).toBeNull()
  })

  // Guards the caller: an empty day must not look like a handoff, or the logger
  // would open with zero rows instead of its one blank row.
  it('treats an empty list as nothing handed over', () => {
    setPendingSession([])
    expect(peekPendingSession()).toBeNull()
  })

  it('copies, so a later edit to the caller-s array cannot change it', () => {
    const exercises = ['Seated shoulder press']
    setPendingSession(exercises)
    exercises.push('Sneaked in afterwards')
    expect(peekPendingSession()).toEqual(['Seated shoulder press'])
  })
})

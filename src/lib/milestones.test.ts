import { describe, it, expect } from 'vitest'
import { STREAK_MILESTONES, isStreakMilestone, milestoneLabel, milestoneEmoji } from './milestones'

describe('milestones', () => {
  it('recognises milestone days only', () => {
    expect(isStreakMilestone(7)).toBe(true)
    expect(isStreakMilestone(30)).toBe(true)
    expect(isStreakMilestone(8)).toBe(false)
    expect(isStreakMilestone(0)).toBe(false)
  })
  it('every milestone is recognised', () => {
    for (const n of STREAK_MILESTONES) expect(isStreakMilestone(n)).toBe(true)
  })
  it('labels scale with size', () => {
    expect(milestoneLabel(7)).toBe('7-day streak')
    expect(milestoneLabel(365)).toBe('One year strong')
    expect(milestoneLabel(100)).toContain('legendary')
  })
  it('emoji escalates', () => {
    expect(milestoneEmoji(7)).toBe('🔥')
    expect(milestoneEmoji(30)).toBe('⭐')
    expect(milestoneEmoji(365)).toBe('🏆')
  })
})

// Streak milestones — the celebratory moments a habit tracker rewards (the
// lovable.dev "milestone celebration" mechanic). Pure + tiny so it's testable.

export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 75, 100, 150, 200, 365] as const

export function isStreakMilestone(n: number): boolean {
  return (STREAK_MILESTONES as readonly number[]).includes(n)
}

export function milestoneLabel(n: number): string {
  if (n >= 365) return 'One year strong'
  if (n >= 100) return `${n} days — legendary`
  return `${n}-day streak`
}

/** A little burst of emoji for the celebration confetti. */
export function milestoneEmoji(n: number): string {
  if (n >= 365) return '🏆'
  if (n >= 100) return '💎'
  if (n >= 30) return '⭐'
  return '🔥'
}

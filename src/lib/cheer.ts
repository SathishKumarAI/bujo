/**
 * The line under a running timer that keeps you going (owner, 2026-11-14:
 * "show that you can do it … so the user can motivate himself"). Pure, so
 * the words are tested here and the timers only pass where they are.
 *
 * Ordered by what matters most at that moment: not started, the last five
 * seconds, the last round, past halfway, the start.
 */
export type CheerAt = {
  phase: 'work' | 'rest' | 'done'
  /** Not started yet. */
  idle: boolean
  /** Seconds left in this work or hold; null for an open stopwatch. */
  left: number | null
  /** How far through this work or hold, 0 to 1; null when there is no end. */
  frac: number | null
  /** This is the last round of the session. */
  lastRound?: boolean
}

export function cheer({ phase, idle, left, frac, lastRound }: CheerAt): string {
  if (phase === 'done') return 'Done. You showed up today.'
  if (idle) return 'Tap start when you are ready.'
  if (phase === 'rest') return 'Good work. Breathe.'
  if (left != null && left > 0 && left <= 5) return `Last ${left} s. Push!`
  if (lastRound) return 'Last round. Give it everything.'
  if (frac != null && frac >= 0.5) return 'Past halfway. Keep going.'
  return 'You can do it.'
}

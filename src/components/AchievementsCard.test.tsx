import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JournalProvider } from '../store'
import { AchievementsCard } from './AchievementsCard'
import { ACHIEVEMENTS } from '../lib/achievements'

/**
 * The failure this catches: an achievement's locked/earned state going back to
 * being carried by `opacity-50` and a tint alone. The padlock has always been
 * drawn, but as an unnamed `<svg>` — so the two states were announced
 * identically, and the audit that called this "styling-only" was reading the
 * rendered page correctly.
 *
 * Counting is the point. Asserting "a Locked label exists" would still pass if
 * thirteen of fourteen badges lost theirs.
 */
describe('AchievementsCard lock state', () => {
  afterEach(() => localStorage.clear())

  it('names every badge Locked or Unlocked, one per achievement', () => {
    render(<JournalProvider><AchievementsCard /></JournalProvider>)
    const locked = screen.queryAllByLabelText('Locked')
    const unlocked = screen.queryAllByLabelText('Unlocked')
    expect(locked.length + unlocked.length).toBe(ACHIEVEMENTS.length)
  })

  it('renders the badges as a list, so the count is announced', () => {
    render(<JournalProvider><AchievementsCard /></JournalProvider>)
    expect(screen.getAllByRole('listitem')).toHaveLength(ACHIEVEMENTS.length)
  })
})

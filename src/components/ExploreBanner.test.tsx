import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { NavProvider } from './shell/nav'
import { emptyJournal, STORAGE_KEY } from '../lib/storage'
import { ExploreBanner } from './ExploreBanner'

/**
 * The failure this catches: the sample-data strip going back to being
 * permanent. It has no empty state and no timer — the only thing standing
 * between "a nudge" and "an ad on every screen forever" is that the × sticks
 * across a reload, and nothing else in the app would notice if it stopped.
 */
function seedExploring() {
  const d = emptyJournal()
  d.settings.explore = true
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
}

const mount = () =>
  render(<JournalProvider><NavProvider navigate={() => {}}><ExploreBanner /></NavProvider></JournalProvider>)

describe('ExploreBanner', () => {
  afterEach(() => localStorage.clear())

  it('shows while exploring sample data', () => {
    seedExploring()
    mount()
    expect(screen.getByText(/exploring sample data/i)).toBeTruthy()
  })

  it('stays gone after it is dismissed, across a remount', async () => {
    seedExploring()
    const { unmount } = mount()
    await userEvent.click(screen.getByLabelText(/dismiss the sample-data notice/i))
    expect(screen.queryByText(/exploring sample data/i)).toBeNull()
    unmount()
    mount()
    expect(screen.queryByText(/exploring sample data/i)).toBeNull()
  })

  it('is absent outside the demo, dismissed or not', () => {
    mount()
    expect(screen.queryByText(/exploring sample data/i)).toBeNull()
  })
})

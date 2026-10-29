import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * The failure: a page unreachable, or far away, on a phone. Owner, twice on
 * 2026-10-29: "unable to … access the body or the other pages" and "unable to
 * navigate from body to … mind". Each test crosses a section in one gesture,
 * which is what the old tab strip could not do.
 */
vi.mock('../../lib/supabase', () => ({
  isConfigured: () => false,
  currentUser: async () => null,
  onAuthChange: () => () => {},
  signInGoogle: async () => {},
  signOut: async () => {},
}))

const { PhoneTopBar } = await import('./PhoneTopBar')
const { BottomNav } = await import('./BottomNav')
const { JournalProvider } = await import('../../store')
const { SECTIONS, tabsOf } = await import('./sections')
const { lastPageOf, rememberPage } = await import('./lastPage')
const { CursorProvider } = await import('./cursor')

const gates = { cycle: true, nofap: true }
afterEach(() => { cleanup(); localStorage.clear() })

describe('every page is one tap from anywhere on a phone', () => {
  it('the title opens every page of the app, and a Mind page is one tap from Body', async () => {
    const nav = vi.fn()
    render(<JournalProvider><PhoneTopBar view="fitness" gates={gates} onNavigate={nav} onQuickAdd={() => {}} /></JournalProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Body Fitness, all pages' }))
    const grid = screen.getByRole('navigation', { name: 'All pages' })
    const all = SECTIONS.flatMap((s) => tabsOf(s.id, gates))
    expect(within(grid).getAllByRole('button')).toHaveLength(all.length)
    expect(within(grid).getByRole('button', { name: 'Fitness' }).getAttribute('aria-current')).toBe('page')
    await userEvent.click(within(grid).getByRole('button', { name: 'Reading' }))
    expect(nav).toHaveBeenCalledWith('reading')
  })

  it('names the bar with the grid’s word for the page, not the view title', () => {
    render(<JournalProvider><CursorProvider><PhoneTopBar view="monthly" gates={gates} onNavigate={() => {}} onQuickAdd={() => {}} /></CursorProvider></JournalProvider>)
    expect(screen.getByRole('button', { name: 'Plan Month, all pages' })).toBeTruthy()
  })

  it('a second tap on the active tab opens the same grid', async () => {
    const nav = vi.fn()
    render(<BottomNav view="fitness" gates={gates} onNavigate={nav} />)
    await userEvent.click(screen.getByRole('link', { name: 'Body' }))
    expect(nav).not.toHaveBeenCalled()
    await userEvent.click(within(screen.getByRole('navigation', { name: 'All pages' })).getByRole('button', { name: 'Focus' }))
    expect(nav).toHaveBeenCalledWith('focus')
  })
})

describe('the bottom bar keeps each section’s place', () => {
  it('Body goes back to the Body page you left, not to Fitness', async () => {
    rememberPage('nutrition')
    const nav = vi.fn()
    render(<BottomNav view="reading" gates={gates} onNavigate={nav} />)
    await userEvent.click(screen.getByRole('link', { name: 'Body' }))
    expect(nav).toHaveBeenCalledWith('nutrition')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('never lands on a page that has since been switched off', () => {
    rememberPage('cycle')
    expect(lastPageOf('body', { cycle: true, nofap: true })).toBe('cycle')
    expect(lastPageOf('body', { cycle: false, nofap: true })).toBe('fitness')
  })
})

import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * The failure: a page of a section unreachable on a phone. Body's strip shows
 * 3 of 11 pages at 390px and nothing says it scrolls, so these two doors — the
 * strip's "All" and a second tap on the active bottom tab — are how the other
 * eight are found. Each test reaches a page that sits off the strip's edge.
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
const { tabsOf } = await import('./sections')

const gates = { cycle: true, nofap: true }
afterEach(cleanup)

describe('every Body page is reachable on a phone', () => {
  it('the strip’s All button lists all of them and navigates', async () => {
    const nav = vi.fn()
    render(<JournalProvider><PhoneTopBar view="fitness" gates={gates} onNavigate={nav} onQuickAdd={() => {}} /></JournalProvider>)
    const n = tabsOf('body', gates).length
    await userEvent.click(screen.getByRole('button', { name: `All ${n} pages` }))
    const sheet = screen.getByRole('dialog', { name: 'Body' })
    for (const t of tabsOf('body', gates)) expect(sheet.textContent).toContain(t.label)
    await userEvent.click(screen.getByRole('button', { name: /^Nutrition/ }))
    expect(nav).toHaveBeenCalledWith('nutrition')
  })

  it('a second tap on the active Body tab opens the same list', async () => {
    const nav = vi.fn()
    render(<BottomNav view="fitness" gates={gates} onNavigate={nav} />)
    await userEvent.click(screen.getByRole('link', { name: 'Body' }))
    expect(nav).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /^Coaching/ }))
    expect(nav).toHaveBeenCalledWith('coaching')
  })

  it('a tap on another section still just goes there', async () => {
    const nav = vi.fn()
    render(<BottomNav view="fitness" gates={gates} onNavigate={nav} />)
    await userEvent.click(screen.getByRole('link', { name: 'Mind' }))
    expect(nav).toHaveBeenCalledWith('mindset')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

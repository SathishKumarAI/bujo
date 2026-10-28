import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * The phone ☰ is the only way to Settings, Help and feedback on a phone once
 * the account menu left the bar. These are the three ways it can quietly stop
 * being one: the sheet does not open, a row does not navigate, or Escape drops
 * focus on <body> (Radix returns it to a `DialogTrigger`, and `Sheet` has none
 * — measured in the browser before `Sheet` remembered its opener).
 */
vi.mock('../../lib/supabase', () => ({
  isConfigured: () => false,
  currentUser: async () => null,
  onAuthChange: () => () => {},
  signInGoogle: async () => {},
  signOut: async () => {},
}))

const { PhoneTopBar } = await import('./PhoneTopBar')
const { JournalProvider } = await import('../../store')

function mount(onNavigate = vi.fn()) {
  render(
    <JournalProvider>
      <PhoneTopBar view="fitness" gates={{ cycle: true, nofap: true }} onNavigate={onNavigate} onQuickAdd={() => {}} />
    </JournalProvider>,
  )
  return onNavigate
}

afterEach(cleanup)

describe('PhoneTopBar menu', () => {
  it('opens a Menu sheet and a row navigates', async () => {
    const nav = mount()
    const btn = screen.getByRole('button', { name: /^Menu/ })
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(btn)
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(nav).toHaveBeenCalledWith('settings')
  })

  it('returns focus to the ☰ on Escape', async () => {
    mount()
    const btn = screen.getByRole('button', { name: /^Menu/ })
    await userEvent.click(btn)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(btn)
  })

  it('carries no search, microphone or logo', () => {
    mount()
    expect(screen.queryByRole('button', { name: /search/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /relay/i })).toBeNull()
    expect(screen.queryByText('Cadence')).toBeNull()
    expect(screen.getByRole('button', { name: 'Quick add' })).toBeTruthy()
  })
})

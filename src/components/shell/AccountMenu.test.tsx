import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * COD-134 was filed as "AccountMenu fetches the user once and never hears about
 * sign-in". It was closed by adding `onAuthChange` to `lib/supabase.ts` and
 * subscribing from `AccountCard` — **this component was never wired**, and it
 * is the one the ticket named: the avatar in the corner, which is where a
 * person looks to find out who they are signed in as.
 *
 * It was closed without a test, so it could reopen silently, and it did: a
 * successful Google sign-in left the menu reading "No name set · This device
 * only" with the yellow not-set-up dot still on the trigger. Reported as "able
 * to sign in, but it's not showing any kind of updates on my UI" (COD-291).
 *
 * This file is the regression guard that should have come with the first fix.
 */
const mockState = {
  configured: true,
  user: null as { email?: string; user_metadata?: Record<string, unknown> } | null,
}

vi.mock('../../lib/supabase', () => ({
  isConfigured: () => mockState.configured,
  currentUser: async () => mockState.user,
  onAuthChange: () => () => {},
  signInGoogle: async () => {},
  signOut: async () => {},
}))

const { AccountMenu } = await import('./AccountMenu')
const { JournalProvider } = await import('../../store')
const { __resetAuthUser } = await import('../../lib/authUser')
const { __resetAccountStatus, setAccountStatus } = await import('../../lib/accountStatus')

function mount() {
  return render(
    <JournalProvider>
      <AccountMenu view="today" onNavigate={() => {}} onCommand={() => {}} />
    </JournalProvider>,
  )
}

/** The menu's content is in a portal that only exists once the trigger is open. */
async function open() {
  await userEvent.click(screen.getByRole('button', { name: /account and app menu/i }))
}

afterEach(() => {
  cleanup()
  mockState.user = null
  __resetAuthUser()
  __resetAccountStatus()
  localStorage.clear()
})

describe('the header menu says who is signed in', () => {
  it('reads "No name set · This device only" with no account and no profile', async () => {
    mount()
    await open()
    expect(await screen.findByText('No name set')).toBeTruthy()
    expect(screen.getByText('This device only')).toBeTruthy()
  })

  it('shows the account name and email once signed in', async () => {
    mockState.user = { email: 'sam@example.com', user_metadata: { full_name: 'Sam Rivera' } }
    mount()
    await open()
    await waitFor(() => expect(screen.getByText('Sam Rivera')).toBeTruthy())
    // The email as well as the name: two Google accounts can share a display
    // name, and a user who has switched needs to know which one is live.
    expect(screen.getByText('sam@example.com')).toBeTruthy()
  })

  it('reports the real sync phase, not the blob passphrase, when signed in', async () => {
    mockState.user = { email: 'sam@example.com' }
    mount()
    setAccountStatus({ phase: 'no-passphrase' })
    await open()
    // Was "This device only" — which is the *other* sync mechanism's answer and
    // happened to be right for the wrong reason, so it could not be trusted.
    await waitFor(() => expect(screen.getByText('Not syncing yet')).toBeTruthy())
  })

  it('names the door "Account & sync" once there is an account to go to', async () => {
    mockState.user = { email: 'sam@example.com' }
    mount()
    await open()
    // With no local profile this used to read "Set up this journal" even while
    // signed in — the menu asking you to do a thing you had just done.
    await waitFor(() => expect(screen.getByText(/Account & sync/)).toBeTruthy())
    expect(screen.queryByText(/Set up this journal/)).toBeNull()
  })
})

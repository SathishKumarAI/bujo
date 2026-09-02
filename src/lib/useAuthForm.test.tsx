import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuthForm } from './useAuthForm'
import { emptyJournal } from './storage'

// The hook exists because three hand-rolled auth copies drifted; these tests
// pin the behaviours that drifted, chiefly confirm-before-replace on login.

const replaceAll = vi.fn()
vi.mock('../store', () => ({
  useJournal: () => ({ data: { ...emptyJournalForTest(), updatedAt: 'local' }, replaceAll }),
}))
function emptyJournalForTest() { return emptyJournal() }

const sb = vi.hoisted(() => ({
  supabaseEnabled: vi.fn(() => true),
  providerEnabled: vi.fn(async () => false),
  currentUser: vi.fn(async () => null),
  onAuthChange: vi.fn(() => () => {}),
  onPasswordRecovery: vi.fn(() => () => {}),
  signInGoogle: vi.fn(async () => {}),
  signUpEmail: vi.fn(async () => {}),
  signInEmail: vi.fn(async () => {}),
  signInGuest: vi.fn(async () => {}),
  signOut: vi.fn(async () => {}),
  resetPassword: vi.fn(async () => {}),
  updatePassword: vi.fn(async () => {}),
  pullJournal: vi.fn(async (): Promise<unknown> => null),
  pushJournal: vi.fn(async () => {}),
}))
vi.mock('./supabase', () => sb)

function Probe({ confirmReplace }: { confirmReplace: () => Promise<boolean> }) {
  const auth = useAuthForm({ confirmReplace })
  return (
    <div>
      <input aria-label="email" value={auth.email} onChange={(e) => auth.setEmail(e.target.value)} />
      <input aria-label="password" value={auth.pw} onChange={(e) => auth.setPw(e.target.value)} />
      <button onClick={() => auth.submit('login')}>login</button>
      <button onClick={() => auth.submit('signup')}>signup</button>
      <button onClick={auth.forgot}>forgot</button>
      <span data-testid="err">{auth.err}</span>
      <span data-testid="msg">{auth.msg}</span>
    </div>
  )
}

async function fillCredentials() {
  await userEvent.type(screen.getByLabelText('email'), 'a@b.co')
  await userEvent.type(screen.getByLabelText('password'), 'secret1')
}

describe('useAuthForm', () => {
  beforeEach(() => { vi.clearAllMocks(); sb.pullJournal.mockResolvedValue(null) })

  it('login with a cloud copy asks before touching local data, and declining keeps it', async () => {
    sb.pullJournal.mockResolvedValue(emptyJournal())
    const confirm = vi.fn(async () => false)
    render(<Probe confirmReplace={confirm} />)
    await fillCredentials()
    await userEvent.click(screen.getByText('login'))
    await waitFor(() => expect(sb.signInEmail).toHaveBeenCalled())
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(replaceAll).not.toHaveBeenCalled()
  })

  it('accepting the prompt replaces local data with the account copy', async () => {
    sb.pullJournal.mockResolvedValue(emptyJournal())
    render(<Probe confirmReplace={async () => true} />)
    await fillCredentials()
    await userEvent.click(screen.getByText('login'))
    await waitFor(() => expect(replaceAll).toHaveBeenCalledTimes(1))
  })

  it('signup pushes the local journal to the new account', async () => {
    render(<Probe confirmReplace={async () => true} />)
    await fillCredentials()
    await userEvent.click(screen.getByText('signup'))
    await waitFor(() => expect(sb.signUpEmail).toHaveBeenCalled())
    expect(sb.pushJournal).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('msg').textContent).toMatch(/Account created/)
  })

  it('forgot with an invalid email never calls resetPassword', async () => {
    render(<Probe confirmReplace={async () => true} />)
    await userEvent.type(screen.getByLabelText('email'), 'not-an-email')
    await userEvent.click(screen.getByText('forgot'))
    expect(sb.resetPassword).not.toHaveBeenCalled()
    expect(screen.getByTestId('err').textContent).not.toBe('')
  })
})

import { useState } from 'react'
import { Lock } from 'lucide-react'

/** Full-screen passcode gate shown when the journal is encrypted. */
export function LockScreen({ onUnlock }: { onUnlock: (passcode: string) => Promise<void> }) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!passcode || busy) return
    setBusy(true)
    setError('')
    try {
      await onUnlock(passcode)
    } catch {
      setError('Wrong passcode. Try again.')
      setPasscode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="aurora flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card-3d w-full max-w-sm rounded-2xl border border-surface1 bg-mantle p-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-surface0">
          <Lock size={22} className="text-mauve" />
        </div>
        <h1 className="font-display text-xl font-semibold text-text">Journal locked</h1>
        <p className="mt-1 text-sm text-subtext0">Enter your passcode to unlock.</p>
        <input
          type="password"
          autoFocus
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          aria-label="Passcode"
          className="mt-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-center text-sm text-text focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
        {error && <p className="mt-2 text-sm text-red">{error}</p>}
        <button
          type="submit"
          disabled={busy || !passcode}
          className="press-3d mt-4 w-full rounded-lg bg-mauve px-3 py-2 text-sm font-medium text-crust disabled:opacity-50"
        >
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
        <p className="mt-3 text-xs text-overlay0">Your passcode never leaves this device. Lost it = the data can’t be recovered.</p>
      </form>
    </div>
  )
}

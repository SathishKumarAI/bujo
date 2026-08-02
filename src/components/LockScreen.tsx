import { Lock } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { Button } from './ui/button'

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
      <form onSubmit={submit} className="card-3d w-full max-w-sm rounded-2xl border border-line-strong bg-ink-1 p-6 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-ink-2">
          <Icon as={Lock} size="lg" className="text-mauve" />
        </div>
        <h1 className="font-display text-title font-medium text-fg-1">Journal locked</h1>
        <p className="mt-1 text-body text-fg-2">Enter your passcode to unlock.</p>
        <input
          type="password"
          autoFocus
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          aria-label="Passcode"
          className="mt-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-center text-body text-fg-1 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
        {error && <p className="mt-2 text-body text-red">{error}</p>}
        <Button type="submit" disabled={busy || !passcode} className="press-3d mt-4 w-full">
          {busy ? 'Unlocking…' : 'Unlock'}
        </Button>
        <p className="mt-3 text-label text-fg-2">Your passcode never leaves this device. Lost it = the data can’t be recovered.</p>
      </form>
    </div>
  )
}

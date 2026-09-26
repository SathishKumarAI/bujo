import { useState } from 'react'
import { useJournal } from '../../store'
import { Card, Input } from '../ui'
import { Button } from '../ui/button'
import { useConfirm } from '../ConfirmDialog'



/** Encrypt the journal at rest behind a passcode (Web Crypto, local-only). */
export function PasscodeCard() {
  const confirm = useConfirm()
  const { setPasscode, encrypted } = useJournal()
  const [pc, setPc] = useState('')
  const [pc2, setPc2] = useState('')
  const [err, setErr] = useState('')
  function enable() {
    if (pc.length < 4) { setErr('Use at least 4 characters.'); return }
    if (pc !== pc2) { setErr('Passcodes don’t match.'); return }
    setPasscode(pc); setPc(''); setPc2(''); setErr('')
  }
  return (
    <Card band title="Passcode lock" subtitle="Encrypt this journal at rest (Web Crypto, stays on this device)">
      {encrypted ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-green/30 bg-green/10 px-3 py-1.5 text-body text-green">🔒 Journal is encrypted</span>
          <Button variant="danger" onClick={async () => { if (await confirm({
            title: 'Remove the passcode?',
            description: 'The journal will be stored unencrypted on this device. Anyone with access to this browser can read it.',
            confirmLabel: 'Remove passcode', destructive: true,
          })) setPasscode(null) }}>Remove passcode</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input type="password" value={pc} onChange={(e) => setPc(e.target.value)} placeholder="New passcode" aria-label="New passcode" />
            <Input type="password" value={pc2} onChange={(e) => setPc2(e.target.value)} placeholder="Confirm passcode" aria-label="Confirm passcode" />
          </div>
          {err && <p className="text-label text-red">{err}</p>}
          <Button variant="secondary" onClick={enable}>Encrypt journal</Button>
          <p className="text-label text-fg-2">There is no recovery. If you forget the passcode the data cannot be decrypted, so keep a JSON export as a backup.</p>
        </div>
      )}
    </Card>
  )
}

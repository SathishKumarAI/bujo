import { useState } from 'react'
import { useJournal } from '../../store'
import { useConfirm } from '../ConfirmDialog'
import { Cell, Cells } from '../ui/cells'

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
  async function remove() {
    if (await confirm({
      title: 'Remove the passcode?',
      description: 'The journal will be stored unencrypted on this device. Anyone with access to this browser can read it.',
      confirmLabel: 'Remove passcode', destructive: true,
    })) setPasscode(null)
  }

  // Grouped rows — the two fields inline, the action as a row of its own.
  return (
    <Cells title="Passcode lock" aside="stays on this device">
      {encrypted ? (
        <>
          <Cell title="Journal is encrypted" subtitle="Web Crypto, at rest" chevron={false} />
          <button type="button" className="cell cell-danger" onClick={remove}>Remove passcode</button>
        </>
      ) : (
        <>
          <label className="cell">
            <span className="w-[6.5rem] shrink-0 text-body text-fg-1">Passcode</span>
            <input type="password" className="cell-input" value={pc} onChange={(e) => setPc(e.target.value)} placeholder="New passcode" />
          </label>
          <label className="cell">
            <span className="w-[6.5rem] shrink-0 text-body text-fg-1">Confirm</span>
            <input type="password" className="cell-input" value={pc2} onChange={(e) => setPc2(e.target.value)} placeholder="Again" />
          </label>
          {err && <p className="cell text-label text-red" role="alert">{err}</p>}
          <button type="button" className="cell cell-action" onClick={enable}>Encrypt journal</button>
          <p className="cell text-label text-fg-2">No recovery — keep a JSON export as a backup.</p>
        </>
      )}
    </Cells>
  )
}

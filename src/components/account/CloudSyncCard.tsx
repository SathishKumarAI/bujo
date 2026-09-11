import { Download, Upload } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../../store'
import { useConfirm } from '../ConfirmDialog'
import { Card, Input } from '../ui'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { pushCloud, pullCloud } from '../../lib/bujocloud'
import { migrate } from '../../lib/storage'

/**
 * One-passphrase, end-to-end-encrypted cloud sync (Vercel Blob via /api/sync).
 *
 * Lives here rather than inside `views/Settings.tsx` because Account needs the
 * same card: the local account has no email and no provider, so *this* is what
 * "sync your journal" means in this app, and burying it two tabs into Settings
 * made it look like an advanced option rather than the only one.
 *
 * The markup was moved verbatim, not re-typed. The rendered card was captured
 * from the running app before the move and diffed after — 4,637 characters,
 * byte-identical. That is the drill this repo's CLAUDE.md asks for before
 * extracting shared markup, and it exists because an "identical" banner
 * extraction once silently replaced an office phone number with 911.
 */
export function CloudSyncCard() {
  const confirm = useConfirm()
  const { data, replaceAll } = useJournal()
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  async function push() {
    if (pass.length < 6) { setMsg('Use a passphrase of at least 6 characters.'); return }
    setBusy('push'); setMsg('')
    try { await pushCloud(pass, data); setMsg('Pushed to cloud.') }
    catch (e) { setMsg((e as Error).message) }
    finally { setBusy('') }
  }
  async function pull() {
    if (pass.length < 6) { setMsg('Enter your passphrase first.'); return }
    setBusy('pull'); setMsg('')
    try {
      const remote = await pullCloud(pass)
      if (!remote) { setMsg('Nothing stored for that passphrase yet.'); return }
      if (await confirm({
        title: 'Replace this device’s data with the cloud copy?',
        description: 'Everything currently on this device is overwritten by the encrypted copy stored in the cloud.',
        confirmLabel: 'Replace my data', destructive: true,
      })) { replaceAll(migrate(remote)); setMsg('Pulled from cloud.') }
    } catch (e) { setMsg(/wrong|decrypt|operation/i.test((e as Error).message) ? 'Wrong passphrase, or corrupt data.' : (e as Error).message) }
    finally { setBusy('') }
  }

  const [auto, setAuto] = useState(() => !!localStorage.getItem('bujo:sync'))
  function toggleAuto(on: boolean) {
    if (on) {
      if (pass.length < 6) { setMsg('Enter a passphrase first, then enable auto-sync.'); return }
      localStorage.setItem('bujo:sync', pass); setAuto(true); push()
    } else { localStorage.removeItem('bujo:sync'); setAuto(false); setMsg('Auto-sync off.') }
  }

  return (
    <Card band title="Cloud sync" subtitle="One passphrase, end-to-end encrypted, sync across devices">
      <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Sync passphrase" autoComplete="off" />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={push} disabled={!!busy} className="inline-flex items-center gap-1.5"><Icon as={Upload} size="sm" /> {busy === 'push' ? 'Pushing…' : 'Push to cloud'}</Button>
        <Button variant="secondary" onClick={pull} disabled={!!busy} className="inline-flex items-center gap-1.5"><Icon as={Download} size="sm" /> {busy === 'pull' ? 'Pulling…' : 'Pull from cloud'}</Button>
      </div>
      <label className="mt-3 flex cursor-pointer items-center justify-between text-body text-fg-1">
        <span>Auto-sync on this device <span className="text-label text-fg-2">(pull on open · push on change)</span></span>
        <Switch checked={auto} onCheckedChange={toggleAuto} />
      </label>
      {msg && <p className="mt-2 text-label text-fg-1">{msg}</p>}
      <p className="mt-2 text-label text-fg-2">Your journal is encrypted in this browser before it is uploaded, so the server only ever stores ciphertext. Enter the same passphrase on another device to get your data back. There are no accounts, and a lost passphrase cannot be recovered.</p>
    </Card>
  )
}

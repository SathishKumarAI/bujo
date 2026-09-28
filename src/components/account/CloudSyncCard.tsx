import { Download, Upload } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../../store'
import { useConfirm } from '../ConfirmDialog'
import { Card, Input } from '../ui'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { pushCloud, pullCloud } from '../../lib/bujocloud'
import { deriveSync, rememberSync, forgetSync, hasSync } from '../../lib/syncKey'
import { SyncTargetNotice } from './SyncTargetNotice'
import { migrate } from '../../lib/storage'

/**
 * One-passphrase, end-to-end-encrypted cloud sync (Vercel Blob via /api/sync).
 *
 * Lives here rather than inside `views/Settings.tsx` because Account needs the
 * same card: this is what "sync your journal" means in this app when no
 * account is configured, and burying it two tabs into Settings made it look
 * like an advanced option rather than the only one.
 *
 * The markup was moved verbatim, not re-typed. The rendered card was captured
 * from the running app before the move and diffed after — 4,637 characters,
 * byte-identical. That is the drill this repo's CLAUDE.md asks for before
 * extracting shared markup, and it exists because an "identical" banner
 * extraction once silently replaced an office phone number with 911.
 */
export function CloudSyncCard() {
  const confirm = useConfirm()
  const { data, replaceAll, setSettings, encrypted } = useJournal()
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  async function push() {
    if (pass.length < 6) { setMsg('Use a passphrase of at least 6 characters.'); return }
    setBusy('push'); setMsg('')
    try { await pushCloud(await deriveSync(pass), data); setMsg('Pushed to cloud.') }
    catch (e) { setMsg((e as Error).message) }
    finally { setBusy('') }
  }
  async function pull() {
    if (pass.length < 6) { setMsg('Enter your passphrase first.'); return }
    setBusy('pull'); setMsg('')
    try {
      const remote = await pullCloud(await deriveSync(pass))
      if (!remote) { setMsg('Nothing stored for that passphrase yet.'); return }
      if (await confirm({
        title: 'Replace this device’s data with the cloud copy?',
        description: 'Everything currently on this device is overwritten by the encrypted copy stored in the cloud.',
        confirmLabel: 'Replace my data', destructive: true,
      })) { replaceAll(migrate(remote)); setMsg('Pulled from cloud.') }
    } catch (e) { setMsg(/wrong|decrypt|operation/i.test((e as Error).message) ? 'Wrong passphrase, or corrupt data.' : (e as Error).message) }
    finally { setBusy('') }
  }

  const [auto, setAuto] = useState(() => hasSync())

  /**
   * Auto-sync needs a key it can use while nobody is watching. It used to keep
   * the **passphrase**, in plaintext, at `localStorage['bujo:sync']` — beside
   * `bujo:enc`, the ciphertext it opens. That made the passcode lock a promise
   * the code did not keep: read one string, call `pullCloud`, journal in
   * cleartext, passcode never in the way (F-8, `docs/AUTH.md`).
   *
   * Now it keeps a **non-extractable `CryptoKey` in IndexedDB** plus the blob
   * locator (`lib/syncKey.ts`). The passphrase is never written down anywhere,
   * and the key cannot be exported, copied out or carried off the device.
   *
   * **The warning stays, because the threat did not fully go away.** Script
   * running on this origin can still *use* the stored key. A browser cannot
   * keep a secret from someone holding the unlocked device, and any copy that
   * says otherwise is the same false promise in newer words. What changed is
   * that a storage dump now yields ciphertext instead of a journal — so the
   * confirm below describes that, precisely, rather than claiming it is solved.
   */
  async function toggleAuto(on: boolean) {
    if (on) {
      if (pass.length < 6) { setMsg('Enter a passphrase first, then enable auto-sync.'); return }
      if (encrypted && !await confirm({
        title: 'Auto-sync keeps a usable key on this device',
        description:
          'This journal has a passcode, so it is encrypted here. Auto-sync has to keep a key it can '
          + 'use on its own. Your passphrase is not stored — the key cannot be read out or copied '
          + 'off this device — but anything running in this browser can still use it to fetch and '
          + 'open the cloud copy without the passcode. Push and Pull by hand store nothing.',
        confirmLabel: 'Turn on auto-sync anyway',
        cancelLabel: 'Keep syncing by hand',
        destructive: true,
      })) return
      try {
        await rememberSync(pass)
      } catch {
        // Loud, never a silent fall back to storing the passphrase.
        setMsg('This browser refused to store the sync key, so auto-sync stays off. Push and Pull by hand still work.')
        return
      }
      // Exactly one auto-sync target writes at a time (F-7).
      setSettings({ syncTarget: 'blob' })
      setAuto(true)
      setMsg('Auto-sync on. Your passphrase is not stored on this device — keep your own copy of it.')
      push()
    } else {
      await forgetSync()
      // Cleared rather than set to 'none', so a configured folder or server
      // picks the job back up instead of the app silently syncing nowhere.
      setSettings({ syncTarget: undefined })
      setAuto(false)
      setMsg('Auto-sync off.')
    }
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
      {auto && encrypted && (
        <p className="mt-2 rounded-card border border-yellow/30 bg-ink-0 p-2 text-label text-yellow">
          Auto-sync keeps a key this browser can use, so anything running here can open the cloud
          copy of this journal without the passcode. Your passphrase itself is not stored. Switch it
          off to sync by hand instead.
        </p>
      )}
      <SyncTargetNotice />
      {msg && <p className="mt-2 text-label text-fg-1">{msg}</p>}
      <p className="mt-2 text-label text-fg-2">Your journal is encrypted in this browser before it is uploaded, so the server only ever stores ciphertext. Enter the same passphrase on another device to get your data back. A lost passphrase cannot be recovered, and it is not kept on this device — write it down somewhere.</p>
    </Card>
  )
}

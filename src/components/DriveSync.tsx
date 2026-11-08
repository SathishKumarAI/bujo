import { Cloud, CloudArrowDown, CloudArrowUp, MagnifyingGlass } from '@/components/icons'
import { useState } from 'react'
import { useJournal } from '../store'
import { migrate } from '../lib/storage'
import { forEgress, mergePulled, CYCLE_CLAUSE } from '../lib/cyclePrivacy'
import { todayISO } from '../lib/date'
import { connect, disconnect, isConnected, listFiles, pullData, pushData, type DriveFile } from '../lib/gdrive'
import { useConfirm } from './ConfirmDialog'
import { notify } from '../lib/notify'
import { Cell, Cells, FieldCell } from './ui/cells'

/**
 * Optional Google Drive sync card. Requires a Google OAuth Client ID
 * (see docs/GOOGLE_DRIVE.md). Local-first stays default; this is opt-in.
 */
export function DriveSync() {
  const confirm = useConfirm()
  const { data, setSettings, replaceAll } = useJournal()
  const clientId = data.settings.googleClientId ?? ''
  const [connected, setConnected] = useState(isConnected())
  const [busy, setBusy] = useState('')
  const [files, setFiles] = useState<DriveFile[]>([])
  const [q, setQ] = useState('')

  async function doConnect() {
    if (!clientId) return notify.error('Drive needs a client ID', 'Paste your Google OAuth Client ID above, then connect.')
    setBusy('connect')
    try {
      await connect(clientId)
      setConnected(true)
    } catch (e) {
      notify.error('Google would not sign you in', `${(e as Error).message}. Check the client ID and that this origin is authorised.`)
    } finally {
      setBusy('')
    }
  }

  async function backup() {
    setBusy('push')
    try {
      // `forEgress`, which this path went without for its whole life: Drive is
      // a network destination like the gist and the blob, and `pushData(data)`
      // raw uploaded the cycle log the Cycle page promises never leaves, plus
      // this device's `googleClientId`. See lib/cyclePrivacy.ts (COD-265).
      await pushData(forEgress(data))
      setSettings({ lastDriveSync: todayISO() })
      notify.success('Backed up to Google Drive')
    } catch (e) {
      notify.error('Backup did not finish', `${(e as Error).message}. Your journal on this device is untouched — try again.`)
    } finally {
      setBusy('')
    }
  }

  async function restore() {
    if (!await confirm({
      title: 'Replace this device’s journal with the Google Drive copy?',
      description: 'Everything currently on this device is overwritten by the copy stored in Drive.' + CYCLE_CLAUSE,
      confirmLabel: 'Replace my data', destructive: true,
    })) return
    setBusy('pull')
    try {
      const remote = await pullData()
      if (!remote) return notify.info('Nothing in Drive yet', 'Back up first, then you can restore from it.')
      // Pairs with the `forEgress` above: once Drive stops receiving the cycle
      // log, a raw replace from Drive starts erasing it. Both halves or neither.
      replaceAll(mergePulled(data, migrate(remote)))
      notify.success('Restored from Google Drive')
    } catch (e) {
      notify.error('Restore did not finish', `${(e as Error).message}. This device still has its own journal.`)
    } finally {
      setBusy('')
    }
  }

  async function search() {
    setBusy('search')
    try {
      setFiles(await listFiles(q.trim()))
    } catch (e) {
      notify.error('Drive search did not run', `${(e as Error).message}. Reconnect and try the search again.`)
    } finally {
      setBusy('')
    }
  }

  // Grouped rows. A Drive file is a row that opens it.
  return (
    <Cells title="Google Drive" aside="optional">
      <FieldCell label="Client ID" value={clientId} onChange={(v) => setSettings({ googleClientId: v.trim() || undefined })} placeholder="….apps.googleusercontent.com" />
      {!connected ? (
        <Cell icon={Cloud} tone="blue" title={busy === 'connect' ? 'Connecting…' : 'Connect Google Drive'} subtitle="Needs an OAuth Web client ID" chevron={false} onPress={doConnect} />
      ) : (
        <>
          <Cell icon={CloudArrowUp} tone="blue" title={busy === 'push' ? 'Backing up…' : 'Back up to Drive'} subtitle={data.settings.lastDriveSync ? `Last Drive sync ${data.settings.lastDriveSync}` : undefined} chevron={false} onPress={backup} />
          <Cell icon={CloudArrowDown} tone="teal" title={busy === 'pull' ? 'Restoring…' : 'Restore from Drive'} subtitle="Replaces this device’s copy — asks first" chevron={false} onPress={restore} />
          <button type="button" className="cell cell-danger" onClick={() => { disconnect(); setConnected(false) }}>Disconnect</button>
          <FieldCell label="Find a file" value={q} onChange={setQ} placeholder="images & docs" />
          <Cell icon={MagnifyingGlass} tone="overlay1" title={busy === 'search' ? 'Searching…' : 'Search Drive'} chevron={false} onPress={search} />
          {files.map((f) => <Cell key={f.id} href={f.webViewLink} title={f.name} />)}
        </>
      )}
      {!connected && data.settings.lastDriveSync && <Cell title="Last Drive sync" trail={data.settings.lastDriveSync} />}
    </Cells>
  )
}

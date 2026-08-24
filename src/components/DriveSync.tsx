import { ArrowSquareOut, Cloud, CloudArrowDown, CloudArrowUp, MagnifyingGlass } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Empty, Input } from './ui'
import { cat } from '../lib/colors'
import { migrate } from '../lib/storage'
import { todayISO } from '../lib/date'
import { connect, disconnect, isConnected, listFiles, pullData, pushData, type DriveFile } from '../lib/gdrive'
import { useConfirm } from './ConfirmDialog'
import { notify } from '../lib/notify'
import { Button } from './ui/button'

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
      await pushData(data)
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
      description: 'Everything currently on this device is overwritten by the copy stored in Drive.',
      confirmLabel: 'Replace my data', destructive: true,
    })) return
    setBusy('pull')
    try {
      const remote = await pullData()
      if (!remote) return notify.info('Nothing in Drive yet', 'Back up first, then you can restore from it.')
      replaceAll(migrate(remote))
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

  return (
    <Card band
      title={<span className="inline-flex items-center gap-2"><Icon as={Cloud} size="md" /> Cloud sync · Google Drive</span>}
      subtitle="Optional. Store your journal in Drive and reference images/docs from it."
      className="lg:col-span-2"
    >
      <label className="block text-body text-fg-1">
        Google OAuth Client ID
        <Input
          value={clientId}
          onChange={(e) => setSettings({ googleClientId: e.target.value.trim() || undefined })}
          placeholder="xxxxxxxx.apps.googleusercontent.com"
          className="mt-1 font-mono"
        />
      </label>
      <p className="mt-1 text-label text-fg-2">
        Create one in Google Cloud Console (OAuth 2.0, Web). Steps in
        <code className="mx-1">docs/GOOGLE_DRIVE.md</code>.
      </p>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
        {!connected ? (
          <Button variant="secondary" onClick={doConnect} className="press-3d inline-flex items-center gap-1.5">
            <Icon as={Cloud} size="sm" /> {busy === 'connect' ? 'Connecting…' : 'Connect Google Drive'}
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={backup} className="press-3d inline-flex items-center gap-1.5"><Icon as={CloudArrowUp} size="sm" /> {busy === 'push' ? 'Backing up…' : 'Back up to Drive'}</Button>
            <Button variant="secondary" onClick={restore} className="press-3d inline-flex items-center gap-1.5"><Icon as={CloudArrowDown} size="sm" /> {busy === 'pull' ? 'Restoring…' : 'Restore from Drive'}</Button>
            <Button variant="ghost" onClick={() => { disconnect(); setConnected(false) }} className="press-3d rounded-none text-red hover:text-red">Disconnect</Button>
          </>
        )}
      </div>
      {data.settings.lastDriveSync && <p className="mt-2 text-label text-fg-2">Last Drive sync: {data.settings.lastDriveSync}</p>}

      {connected && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-body text-fg-1">Reference a file from Drive</p>
          <div className="flex gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Drive images & docs…" onKeyDown={(e) => e.key === 'Enter' && search()} />
            <Button variant="secondary" onClick={search} className="press-3d inline-flex items-center gap-1.5"><Icon as={MagnifyingGlass} size="sm" /> Search</Button>
          </div>
          {files.length === 0 ? (
            <Empty>Search your Drive to list images and documents.</Empty>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {files.map((f) => (
                <a key={f.id} href={f.webViewLink} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-none border border-line bg-ink-0 transition-colors hover:border-mauve" title={f.name}>
                  <div className="grid h-24 place-items-center overflow-hidden bg-ink-1">
                    {f.thumbnailLink ? (
                      <img src={f.thumbnailLink} alt={f.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    ) : (
                      <img src={f.iconLink} alt="" className="h-8 w-8" style={{ filter: 'invert(0.8)' }} />
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1.5 text-label text-fg-1">
                    <Icon as={ArrowSquareOut} size="sm" style={{ color: cat('overlay1') }} /> <span className="truncate">{f.name}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

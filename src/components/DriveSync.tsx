import { useState } from 'react'
import { Cloud, CloudUpload, CloudDownload, Search, ExternalLink } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card, Empty, Input } from './ui'
import { cat } from '../lib/colors'
import { migrate } from '../lib/storage'
import { todayISO } from '../lib/date'
import { connect, disconnect, isConnected, listFiles, pullData, pushData, type DriveFile } from '../lib/gdrive'

/**
 * Optional Google Drive sync card. Requires a Google OAuth Client ID
 * (see docs/GOOGLE_DRIVE.md). Local-first stays default; this is opt-in.
 */
export function DriveSync() {
  const { data, setSettings, replaceAll } = useJournal()
  const clientId = data.settings.googleClientId ?? ''
  const [connected, setConnected] = useState(isConnected())
  const [busy, setBusy] = useState('')
  const [files, setFiles] = useState<DriveFile[]>([])
  const [q, setQ] = useState('')

  async function doConnect() {
    if (!clientId) return alert('Paste your Google OAuth Client ID first.')
    setBusy('connect')
    try {
      await connect(clientId)
      setConnected(true)
    } catch (e) {
      alert('Google sign-in failed: ' + (e as Error).message)
    } finally {
      setBusy('')
    }
  }

  async function backup() {
    setBusy('push')
    try {
      await pushData(data)
      setSettings({ lastDriveSync: todayISO() })
      alert('Backed up to Google Drive.')
    } catch (e) {
      alert('Backup failed: ' + (e as Error).message)
    } finally {
      setBusy('')
    }
  }

  async function restore() {
    if (!confirm('Replace this device’s journal with the copy on Google Drive?')) return
    setBusy('pull')
    try {
      const remote = await pullData()
      if (!remote) return alert('No backup found on Drive yet.')
      replaceAll(migrate(remote))
      alert('Restored from Google Drive.')
    } catch (e) {
      alert('Restore failed: ' + (e as Error).message)
    } finally {
      setBusy('')
    }
  }

  async function search() {
    setBusy('search')
    try {
      setFiles(await listFiles(q.trim()))
    } catch (e) {
      alert('Drive search failed: ' + (e as Error).message)
    } finally {
      setBusy('')
    }
  }

  return (
    <Card
      title={<span className="inline-flex items-center gap-2"><Cloud size={18} /> Cloud sync · Google Drive</span>}
      subtitle="Optional. Store your journal in Drive and reference images/docs from it."
      className="lg:col-span-2"
    >
      <label className="block text-sm text-subtext1">
        Google OAuth Client ID
        <Input
          value={clientId}
          onChange={(e) => setSettings({ googleClientId: e.target.value.trim() || undefined })}
          placeholder="xxxxxxxx.apps.googleusercontent.com"
          className="mt-1 font-mono"
        />
      </label>
      <p className="mt-1 text-xs text-overlay0">
        Create one in Google Cloud Console (OAuth 2.0, Web). Steps in
        <code className="mx-1">docs/GOOGLE_DRIVE.md</code>.
      </p>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-surface0 pt-3">
        {!connected ? (
          <Button variant="primary" onClick={doConnect} className="inline-flex items-center gap-1.5">
            <Cloud size={14} /> {busy === 'connect' ? 'Connecting…' : 'Connect Google Drive'}
          </Button>
        ) : (
          <>
            <Button variant="primary" onClick={backup} className="inline-flex items-center gap-1.5"><CloudUpload size={14} /> {busy === 'push' ? 'Backing up…' : 'Back up to Drive'}</Button>
            <Button onClick={restore} className="inline-flex items-center gap-1.5"><CloudDownload size={14} /> {busy === 'pull' ? 'Restoring…' : 'Restore from Drive'}</Button>
            <Button variant="danger" onClick={() => { disconnect(); setConnected(false) }}>Disconnect</Button>
          </>
        )}
      </div>
      {data.settings.lastDriveSync && <p className="mt-2 text-xs text-overlay0">Last Drive sync: {data.settings.lastDriveSync}</p>}

      {connected && (
        <div className="mt-4 border-t border-surface0 pt-3">
          <p className="mb-2 text-sm text-subtext1">Reference a file from Drive</p>
          <div className="flex gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Drive images & docs…" onKeyDown={(e) => e.key === 'Enter' && search()} />
            <Button onClick={search} className="inline-flex items-center gap-1.5"><Search size={14} /> Search</Button>
          </div>
          {files.length === 0 ? (
            <Empty>Search your Drive to list images and documents.</Empty>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {files.map((f) => (
                <a key={f.id} href={f.webViewLink} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-surface0 bg-base transition-colors hover:border-mauve" title={f.name}>
                  <div className="grid h-24 place-items-center overflow-hidden bg-mantle">
                    {f.thumbnailLink ? (
                      <img src={f.thumbnailLink} alt={f.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    ) : (
                      <img src={f.iconLink} alt="" className="h-8 w-8" style={{ filter: 'invert(0.8)' }} />
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1.5 text-xs text-subtext1">
                    <ExternalLink size={11} style={{ color: cat('overlay1') }} /> <span className="truncate">{f.name}</span>
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

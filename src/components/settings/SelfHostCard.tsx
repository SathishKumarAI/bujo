import { useState } from 'react'
import { useJournal } from '../../store'
import { Card, Input } from '../ui'
import { Button } from '../ui/button'
import { useConfirm } from '../ConfirmDialog'
import { migrate } from '../../lib/storage'
import { pullJournalFromServer, pushJournalToServer, serverConfigured } from '../../lib/serverSync'

/** Self-host sync: point at the Docker stack's now-SECURED PostgREST API. The
 *  journal is pulled on load and pushed on every change + on tab close (see
 *  ServerSync). The API requires HTTPS + a Bearer JWT (role=bujo_user,
 *  sub=<this device id>); mint one with the helper in
 *  docs/security/postgrest-hardening.md. */
export function SelfHostCard() {
  const confirm = useConfirm()
  const { data, setSettings, replaceAll } = useJournal()
  const s = data.settings
  const [msg, setMsg] = useState('')
  const configured = serverConfigured(s.selfHostUrl, s.selfHostToken)

  async function test() {
    if (!configured) { setMsg('Enter both an HTTPS URL and a Bearer token first.'); return }
    const ok = await pushJournalToServer(s.selfHostUrl ?? '', data, s.selfHostToken)
    setMsg(ok ? 'Pushed to the server.' : 'Could not reach the server (check URL, token, and TLS cert).')
  }
  async function pull() {
    if (!configured) { setMsg('Enter both an HTTPS URL and a Bearer token first.'); return }
    const r = await pullJournalFromServer(s.selfHostUrl ?? '', s.selfHostToken)
    if (r && await confirm({
      title: 'Load the server copy onto this device?',
      description: 'Everything currently on this device is replaced by the copy on your server.',
      confirmLabel: 'Load from server', destructive: true,
    })) { replaceAll(migrate(r)); setMsg('Loaded from the server.') }
    else setMsg(r ? 'Cancelled.' : 'Nothing on the server yet (or auth failed).')
  }

  return (
    <Card band title="Self-host sync" subtitle="Sync your journal with your own secured PostgREST API (the Docker stack)">
      <div className="space-y-2">
        <label className="block text-body text-fg-1">API URL
          <Input value={s.selfHostUrl ?? ''} onChange={(e) => setSettings({ selfHostUrl: e.target.value || undefined })} placeholder="https://localhost:8443" className="mt-1" />
        </label>
        <label className="block text-body text-fg-1">Bearer token <span className="text-fg-2">(HS256 JWT · required)</span>
          <Input value={s.selfHostToken ?? ''} onChange={(e) => setSettings({ selfHostToken: e.target.value || undefined })} placeholder="paste your minted JWT (role=bujo_user, sub=device id)" className="mt-1" />
        </label>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={test}>Test / Push now</Button>
          <Button variant="secondary" onClick={pull}>Pull from server</Button>
        </div>
        {msg && <p className="text-label text-fg-2">{msg}</p>}
        <p className="text-label text-fg-2">The API is secured: use the <code>https://…:8443</code> origin and paste a minted JWT (see docs/security/postgrest-hardening.md). Once set, the journal auto-syncs on change, on tab close, and pulls on load. Run the stack with <code>docker compose up -d</code>.</p>
      </div>
    </Card>
  )
}

import { useState } from 'react'
import { useJournal } from '../../store'
import { DEFAULT_ENDPOINT, DEFAULT_MODEL, isLocalEndpoint, listModels } from '../../lib/voice/model'
import { MagnifyingGlass } from '@/components/icons'
import { Cell, Cells, FieldCell, ToggleCell } from '../ui/cells'

/**
 * The local model the Talk panel can fall back to.
 *
 * It lives beside the weather toggle because they are the same kind of decision
 * — "may this app talk to something outside itself" — and the answer here is
 * narrower: **only to this machine**. `lib/voice/model.ts` refuses any other
 * host outright rather than warning about it, so this form cannot be used to
 * point a health journal at someone else's server.
 *
 * The model list is fetched rather than typed. A field asking a person to spell
 * `llama3.1:8b` from memory is a field that mostly holds typos, and the server
 * already knows the answer.
 */
export function VoiceModelCard() {
  /**
   * Served over HTTPS from somewhere that is not this machine.
   *
   * `localhost` and `127.0.0.1` are "potentially trustworthy" origins, so a
   * page on them may fetch plain-http localhost; anything else may not, and
   * no CSP directive changes that. COD-300 found this card telling hosted
   * users to check whether Ollama was running, which is a question about the
   * wrong machine.
   */
  const hostedBuild = typeof window !== 'undefined'
    && window.location.protocol === 'https:'
    && !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
  const { data, setSettings } = useJournal()
  const vm = data.settings.voiceModel ?? {}
  const endpoint = vm.endpoint ?? DEFAULT_ENDPOINT
  const [models, setModels] = useState<string[] | null>(null)
  const [checking, setChecking] = useState(false)
  const local = isLocalEndpoint(endpoint)

  async function check() {
    setChecking(true)
    try { setModels(await listModels(endpoint)) } finally { setChecking(false) }
  }

  const setVm = (patch: Partial<typeof vm>) => setSettings({ voiceModel: { ...vm, ...patch } })

  // Grouped rows; the server and model rows exist only while the switch is on.
  return (
    <Cells title="Local model" aside="this machine only">
      <ToggleCell title="Use a model on this machine" subtitle="Only a fallback · you confirm before saving" on={vm.enabled === true} onChange={(v) => setVm({ enabled: v })} />
      {vm.enabled && (
        <>
          <FieldCell label="Server" type="url" value={endpoint} onChange={(v) => setVm({ endpoint: v })} placeholder={DEFAULT_ENDPOINT} />
          {!local && <p className="cell text-label text-fg-1" role="alert">Not this machine, so it will not be used — only localhost and 127.0.0.1</p>}
          {models && models.length > 0 ? (
            <label className="cell">
              <span className="flex-1 text-body text-fg-1">Model</span>
              <select className="cell-select" value={vm.model ?? DEFAULT_MODEL} onChange={(e) => setVm({ model: e.target.value })}>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          ) : (
            <FieldCell label="Model" value={vm.model ?? DEFAULT_MODEL} onChange={(v) => setVm({ model: v })} />
          )}
          <Cell icon={MagnifyingGlass} tone="blue" title={checking ? 'Looking…' : 'Find models'} chevron={false}
            subtitle={models ? (models.length > 0 ? `${models.length} on this machine` : hostedBuild ? 'A hosted page cannot reach this machine' : 'Nothing answered — is Ollama running?') : 'Built against Ollama’s API'}
            onPress={checking || !local ? undefined : check} />
          {hostedBuild && <p className="cell text-label text-fg-2">Served over HTTPS, so it cannot reach a model here — use the desktop build or a self-hosted copy.</p>}
        </>
      )}
    </Cells>
  )
}

import { useState } from 'react'
import { useJournal } from '../../store'
import { Card } from '../ui'
import { Button } from '../ui/button'
import { onRaised } from '../../lib/colors'
import { DEFAULT_ENDPOINT, DEFAULT_MODEL, isLocalEndpoint, listModels } from '../../lib/voice/model'
import { Row, Toggle } from './shared'

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

  return (
    <Card band title="Local model" subtitle="Understands the sentences the Talk panel's own rules miss">
      <div className="space-y-3">
        <Toggle
          label="Use a model on this machine"
          on={vm.enabled === true}
          onChange={(v) => setSettings({ voiceModel: { ...vm, enabled: v } })}
        />
        <p className="text-label text-fg-2">
          Off by default, and only ever a fallback: a sentence the app already understands never waits for a model.
          It proposes — you still confirm before anything is saved.
        </p>

        {vm.enabled && (
          <div className="space-y-3 border-t border-line pt-3">
            {/* `Row`'s label is a <span>, so it names nothing — and all three
                fields below it only exist once the toggle above is on, which the
                demo seed never does (`voiceModel` is unset, so `enabled` is
                false). No rendering gate had ever seen them: axe walks what is
                on the page. Same family as the fold and the empty journal. */}
            <Row label="Server">
              <input
                value={endpoint}
                onChange={(e) => setSettings({ voiceModel: { ...vm, endpoint: e.target.value } })}
                placeholder={DEFAULT_ENDPOINT}
                aria-label="Model server URL"
                className="w-56 rounded-control border border-ctl-ring bg-ink-2 px-2 py-1.5 text-body text-fg-1"
              />
            </Row>
            {!local && (
              <p className="text-label" style={{ color: onRaised('red') }}>
                That is not this machine, so it will not be used. Only localhost and 127.0.0.1 are allowed —
                a journal of health data does not get a field that can send it anywhere.
              </p>
            )}
            <Row label="Model">
              {models && models.length > 0 ? (
                <select
                  value={vm.model ?? DEFAULT_MODEL}
                  onChange={(e) => setSettings({ voiceModel: { ...vm, model: e.target.value } })}
                  aria-label="Model"
                  className="w-56 rounded-control border border-ctl-ring bg-ink-2 px-2 py-1.5 text-body text-fg-1"
                >
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <input
                  value={vm.model ?? DEFAULT_MODEL}
                  onChange={(e) => setSettings({ voiceModel: { ...vm, model: e.target.value } })}
                  aria-label="Model"
                  className="w-56 rounded-control border border-ctl-ring bg-ink-2 px-2 py-1.5 text-body text-fg-1"
                />
              )}
            </Row>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={check} disabled={checking || !local}>
                {checking ? 'Looking…' : 'Find models'}
              </Button>
              {models && (
                <span className="text-label text-fg-2">
                  {models.length > 0
                    ? `${models.length} model${models.length === 1 ? '' : 's'} on this machine`
                    : 'Nothing answered — is Ollama running?'}
                </span>
              )}
            </div>
            <p className="text-label text-fg-3">
              Built against Ollama&apos;s API. Anything speaking it works; nothing leaves this machine either way.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

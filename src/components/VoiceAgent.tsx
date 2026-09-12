import { CheckCircle, Microphone, MicrophoneSlash, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useRef, useState } from 'react'
import { useJournal } from '../store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { EXERCISE_LIBRARY } from '../lib/fitness'
import { useSpeechInput } from '../lib/speech'
import { hush, say } from '../lib/voice/speak'
import { answer, CONFIRM_BELOW, understand, type VoiceIntent } from '../lib/voice/intent'
import { askModel } from '../lib/voice/model'
import { ofArray, plan } from '../lib/ingest/plan'
import { validateRecords } from '../lib/ingest/validate'
import { notify } from '../lib/notify'
import { cat } from '../lib/colors'

/**
 * TALK TO YOUR JOURNAL · say it, see what it heard, save it.
 *
 * The loop is deliberately four steps and not three: **listen → understand →
 * show → confirm**. An assistant that writes as you speak sounds better in a
 * demo and is the wrong shape for a journal — dictation mis-hears numbers
 * constantly, and a silently written "mood 77" is indistinguishable later from
 * a day you actually rated. So nothing is saved until it is on screen and
 * agreed to, and what gets saved goes through the same validator as an
 * imported file.
 *
 * It applies with **one** `replaceAll`, so an entire spoken sentence — a
 * session, a metric and a note together — is one ⌘Z. The alternative, a store
 * call per record, is what `onMetricsCsv` does and why a 365-row CSV evicts the
 * user's whole undo history.
 *
 * Typing is a first-class path, not a fallback for the unlucky: Firefox has no
 * Web Speech API at all, and a phone in a quiet room is a place you would
 * rather type. The textarea runs the identical pipeline.
 */
export function VoiceAgent({ open, onClose, date }: { open: boolean; onClose: () => void; date: string }) {
  const { data, replaceAll } = useJournal()
  const [heard, setHeard] = useState('')
  const [intent, setIntent] = useState<VoiceIntent | null>(null)
  const [typed, setTyped] = useState('')
  const [saving, setSaving] = useState(false)
  const [asking, setAsking] = useState(false)
  /** True when the proposal on screen came from the model, not from the rules. */
  const [fromModel, setFromModel] = useState(false)
  const spokenFor = useRef<string | null>(null)
  const modelOn = data.settings.voiceModel?.enabled === true

  const ctx = {
    exercises: [...new Set([...EXERCISE_LIBRARY, ...data.workouts.flatMap((w) => (w.setRows ?? []).map((s) => s.exercise)).filter(Boolean)])],
    habits: data.habits.filter((h) => !h.archived).map((h) => h.name),
    unit: data.settings.weightUnit,
  }

  /**
   * One sentence in, one proposal out — used by both the microphone and the
   * text box, so they cannot drift apart.
   *
   * The model is asked **only** when the rules fell through to "keep it as a
   * note", which is the one case where there is nothing to lose: a sentence the
   * app already understands never waits on a model, and a model that is off,
   * slow or absent leaves exactly the note that would have been kept anyway.
   */
  async function read(text: string) {
    setHeard(text)
    setFromModel(false)
    const guess = understand(text, ctx, date)
    const unrecognised = guess.records.length === 1 && guess.records[0].kind === 'entry' && !guess.ask
    if (!modelOn || !unrecognised) { setIntent(guess); return }

    setIntent({ ...guess, say: 'Let me think about that…' })
    setAsking(true)
    try {
      const r = await askModel(text, date, data.settings.voiceModel)
      if (r.records.length === 0) {
        // Every failure lands in the same place the rules already were — but it
        // has to SAY so. A refused model answer used to render as the plain
        // note, which is indistinguishable from the model never having run:
        // "kettlebell swings" came back as an activity that does not exist, was
        // rejected by the validator, and the panel showed nothing about it.
        const why = r.error ?? (r.rejected[0] ? `the model's answer did not fit — ${r.rejected[0].reason}` : null)
        setIntent({ ...guess, say: why ? `${why}. I'll keep it as a note.` : guess.say })
        return
      }
      setFromModel(true)
      setIntent({
        ...guess,
        records: r.records,
        confidence: 0.5, // never a one-tap save: the model guesses, and it shows
        say: `The model read that as ${r.records.map((x) => x.kind).join(' and ')}. Save it?`,
      })
    } finally {
      setAsking(false)
    }
  }

  const { listening, start, stop, supported, locality } = useSpeechInput((text) => { void read(text) })

  // Speak the proposal once per proposal. Keyed on the transcript rather than
  // on the object, because `understand` returns a fresh object each render pass
  // and speaking on every render is a stutter.
  useEffect(() => {
    if (!intent || spokenFor.current === intent.transcript) return
    spokenFor.current = intent.transcript
    say(intent.say, { enabled: data.settings.voiceReplies !== false })
  }, [intent, data.settings.voiceReplies])

  /**
   * Leaving mid-sentence must stop the microphone AND the voice. A dialog that
   * closes while still talking is the kind of thing that makes someone never
   * open it again.
   *
   * Done in the close handler rather than in an effect on `open`: closing is an
   * event, and resetting five pieces of state synchronously inside an effect is
   * a cascading render the linter is right to refuse. Every route out of the
   * dialog — the X, Escape, the backdrop — arrives here through
   * `onOpenChange`.
   */
  function close() {
    hush()
    stop()
    setHeard('')
    setIntent(null)
    setTyped('')
    setFromModel(false)
    spokenFor.current = null
    onClose()
  }

  // Unmounting is the one exit that is not a click. No state to reset — the
  // component is going away — only the two external systems to quieten.
  useEffect(() => () => { hush() }, [])

  function readTyped() {
    const text = typed.trim()
    if (!text) return
    void read(text)
  }

  async function save() {
    if (!intent || intent.records.length === 0) return
    setSaving(true)
    try {
      // The same two gates an imported file passes. A mis-heard number is
      // refused here, by range, rather than clamped into something plausible.
      const { records, rejected } = validateRecords(intent.records as unknown[])
      if (records.length === 0) {
        const why = rejected[0]?.reason ?? 'nothing usable in that'
        setIntent({ ...intent, say: `I can't save that — ${why}.` })
        say(`I can't save that. ${why}.`, { enabled: data.settings.voiceReplies !== false })
        return
      }
      const p = await plan(ofArray(records), data, { source: 'claude', weightUnit: data.settings.weightUnit === 'lb' ? 'lb' : 'kg' })
      replaceAll(p.next, { stamp: true })
      const saved = p.counts.added + p.counts.updated
      const line = saved === 0
        ? 'You already had that.'
        : `Saved${rejected.length ? `, and skipped ${rejected.length}` : ''}.`
      say(line, { enabled: data.settings.voiceReplies !== false })
      notify.success(line, 'Undo with ⌘Z.')
      setHeard('')
      setIntent(null)
      setTyped('')
      spokenFor.current = null
    } finally {
      setSaving(false)
    }
  }

  const unsure = intent != null && intent.confidence < CONFIRM_BELOW

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Talk to your journal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {supported ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => (listening ? stop() : start())}
                aria-label={listening ? 'Stop listening' : 'Start listening'}
                aria-pressed={listening}
                className={`grid size-14 shrink-0 place-items-center rounded-control border transition-colors ${
                  listening ? 'animate-pulse border-red bg-red/15 text-red' : 'border-line-strong text-fg-1 hover:bg-ink-2'
                }`}
              >
                <Icon as={listening ? MicrophoneSlash : Microphone} size="lg" />
              </button>
              <p className="text-body text-fg-2">
                {listening
                  ? 'Listening — say what you did.'
                  : 'Tap the microphone, then say something like "I played two games and scored 68".'}
              </p>
            </div>
          ) : (
            <p className="text-body text-fg-2">
              This browser has no speech recognition — Firefox and some Safari builds do not ship it.
              Type the sentence instead; it goes through exactly the same steps.
            </p>
          )}

          <div>
            <label htmlFor="voice-typed" className="mb-1 block text-label text-fg-2">
              {supported ? 'Or type it' : 'Say it in writing'}
            </label>
            <div className="flex gap-2">
              <input
                id="voice-typed"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') readTyped() }}
                placeholder="ran 5k in 28 minutes"
                className="w-full rounded-control border border-input bg-background px-3 py-2 text-body text-fg-1 placeholder:text-fg-2 focus-visible:border-ring focus-visible:outline-none"
              />
              <Button variant="secondary" onClick={readTyped} disabled={!typed.trim()}>Read it</Button>
            </div>
          </div>

          {heard && (
            <div className="rounded-card border border-line bg-ink-0 p-3">
              <p className="text-label text-fg-2">You said</p>
              <p className="text-body text-fg-1">“{heard}”</p>
            </div>
          )}

          {intent && (
            <div
              className="rounded-card border p-3"
              style={{ borderColor: cat(unsure ? 'peach' : 'green'), background: cat(unsure ? 'peach' : 'green') + '14' }}
            >
              <p className="text-label text-fg-2">
                {asking ? 'Asking the model on this machine…'
                  : fromModel ? 'The model read this — check it before saving'
                  : unsure ? 'I am not sure about this'
                  : 'I understood'}
              </p>
              <p className="text-body text-fg-1">{intent.say}</p>
              {intent.records.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-label text-fg-2">
                  {intent.records.map((r, i) => (
                    <li key={i} className="tabular-nums">
                      {r.kind} · {r.date}
                    </li>
                  ))}
                </ul>
              )}
              {intent.ask && (
                /* The one thing the sentence did not say. Asked inline rather
                   than assumed: `PickleballSession` has no "games played", so
                   an unanswered "two games" would otherwise be filed as two
                   losses. Skipping is allowed — it saves what was actually
                   said. */
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label htmlFor="voice-ask" className="text-label text-fg-1">{intent.ask.prompt}</label>
                  <input
                    id="voice-ask"
                    type="number"
                    min={0}
                    max={intent.ask.of}
                    inputMode="numeric"
                    className="w-20 rounded-control border border-input bg-background px-2 py-1 text-body tabular-nums text-fg-1"
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return
                      const n = Number((e.target as HTMLInputElement).value)
                      if (Number.isFinite(n)) setIntent(answer(intent, n))
                    }}
                    onBlur={(e) => {
                      const n = Number(e.target.value)
                      if (e.target.value !== '' && Number.isFinite(n)) setIntent(answer(intent, n))
                    }}
                  />
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="primary" size="sm" onClick={save} disabled={saving || asking || intent.records.length === 0}>
                  <Icon as={CheckCircle} size="sm" /> {saving ? 'Saving…' : 'Save it'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setIntent(null); setHeard(''); spokenFor.current = null }}>
                  <Icon as={X} size="sm" /> Not that
                </Button>
              </div>
            </div>
          )}

          {/* Say what actually happens to the audio.
              "This app sends no audio anywhere" is true of the app and
              misleading about the outcome: Chrome's default recogniser streams
              the microphone to Google's speech service, and a private journal
              that implies otherwise on the same screen has told a comfortable
              half-truth. `useSpeechInput` asks the browser first and sets
              `processLocally` where it can; this prints whichever answer came
              back, including "I don't know". */}
          <p className="text-label text-fg-3">
            Nothing is saved until you tap Save it.{' '}
            {!supported
              ? 'Typing never leaves this device.'
              : locality === 'on-device'
                ? 'Your browser is transcribing on this device — the audio does not leave it.'
                : locality === 'cloud'
                  ? 'Your browser transcribes speech on its own servers, so the audio leaves this device. Type instead to keep it here.'
                  : 'Your browser handles the speech, and does not say whether it does so locally; if that matters, type it instead.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

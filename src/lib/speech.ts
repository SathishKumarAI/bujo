import { useEffect, useRef, useState } from 'react'

// Minimal typings for the Web Speech API (not in lib.dom by default).
interface SpeechRecognitionAlternative { transcript: string }
interface SpeechRecognitionResult { 0: SpeechRecognitionAlternative; isFinal: boolean }
interface SpeechRecognitionEvent { resultIndex: number; results: { length: number; [i: number]: SpeechRecognitionResult } }
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  /** Chrome 139+ desktop: keep the audio on this machine. See `probeOnDevice`. */
  processLocally?: boolean
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error?: string }) => void) | null
}
type SpeechCtor = new () => SpeechRecognitionLike

/** Where the audio is transcribed. `unknown` until the first attempt settles it. */
export type SpeechLocality = 'on-device' | 'cloud' | 'unknown'

function getCtor(): SpeechCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const speechSupported = (): boolean => getCtor() != null

/**
 * Dictation hook over the Web Speech API. `listening` reflects mic state; toggle
 * with `start`/`stop`. Final transcript chunks are pushed to `onText` (caller
 * decides whether to append or replace). No-ops gracefully where unsupported.
 */
export function useSpeechInput(onText: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [locality, setLocality] = useState<SpeechLocality>('unknown')
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const onTextRef = useRef(onText)
  // Keep the latest callback without re-creating the recogniser. Assigning in
  // an effect rather than during render: a render can be thrown away or
  // replayed, and mutating a ref in that phase is exactly what
  // `react-hooks/refs` warns about. The recogniser only reads this from an
  // event callback, which always runs after commit, so the effect is soon
  // enough.
  useEffect(() => {
    onTextRef.current = onText
  }, [onText])

  useEffect(() => () => recRef.current?.stop(), [])

  /**
   * Start listening, asking for on-device transcription first.
   *
   * **Ask by setting the property, never by calling `SpeechRecognition
   * .available()`.** That static probe reads like the correct API and it
   * **crashes the renderer process** — a blank tab, no error, nothing catchable,
   * because a crashed renderer is not an exception. It took the whole app down
   * on every page load, and `npm run a11y` caught it as "Page crashed" on the
   * first navigation. A property write cannot do that.
   *
   * So: set the flag, and let the failure path tell us the truth. A browser with
   * no local model rejects the *session*, which arrives as an error event — we
   * restart once without the flag and mark the audio as leaving. A browser that
   * ignores the property transcribes in the cloud and we never learn otherwise,
   * which is why `unknown` is a state the UI prints honestly rather than
   * rounding to "private".
   */
  function start(allowRemote = false) {
    const Ctor = getCtor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = navigator.language || 'en-US'
    const wantLocal = !allowRemote
    if (wantLocal) {
      // A plain property write: unsupported browsers ignore it, and no browser
      // can crash on it.
      try { rec.processLocally = true } catch { /* frozen object — carry on */ }
    }
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e) => {
      // A result while we asked for local means it *is* local: a browser that
      // could not honour the flag would have failed the session instead.
      if (wantLocal) setLocality((l) => (l === 'unknown' ? 'on-device' : l))
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) onTextRef.current(r[0].transcript.trim())
      }
    }
    rec.onend = () => setListening(false)
    rec.onerror = (e) => {
      setListening(false)
      // "no local model for this language" — the one error worth retrying, and
      // only once, because a second failure is a real failure.
      const code = typeof e?.error === 'string' ? e.error : ''
      if (wantLocal && (code === 'language-not-supported' || code === 'service-not-allowed' || code === '')) {
        setLocality('cloud')
        start(true)
      }
    }
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  function stop() {
    recRef.current?.stop()
    setListening(false)
  }

  return { listening, start: () => start(), stop, supported: speechSupported(), locality }
}

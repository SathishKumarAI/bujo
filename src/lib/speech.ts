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
  onerror: (() => void) | null
}
type SpeechCtor = (new () => SpeechRecognitionLike) & {
  /** Chrome 139+: 'available' | 'downloadable' | 'downloading' | 'unavailable'. */
  available?: (o: { langs: string[]; processLocally: boolean }) => Promise<string>
}

/** Where the audio is transcribed. `unknown` where the browser will not say. */
export type SpeechLocality = 'on-device' | 'cloud' | 'unknown'

/**
 * Ask the browser whether it can transcribe **without sending the audio away**.
 *
 * This matters more than it looks. The default `webkitSpeechRecognition` path
 * in Chrome streams your microphone to Google's speech service — MDN says so
 * outright — and this app is a private journal that says on the same screen
 * that it sends nothing anywhere. That claim is only honest if the recogniser
 * is local, so ask, set the flag, and where the answer is no, say so instead of
 * implying otherwise.
 *
 * `processLocally = true` is set **only** when the probe says the language pack
 * is there: setting it otherwise makes Chrome fire an error instead of
 * recognising, which would trade a privacy caveat for a broken microphone.
 */
async function probeOnDevice(Ctor: SpeechCtor, lang: string): Promise<SpeechLocality> {
  if (typeof Ctor.available !== 'function') return 'unknown'
  try {
    const state = await Ctor.available({ langs: [lang], processLocally: true })
    return state === 'available' ? 'on-device' : 'cloud'
  } catch {
    return 'unknown'
  }
}

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

  // Ask once, on mount, so the UI can tell the truth about the microphone
  // before it is ever pressed rather than after.
  useEffect(() => {
    const Ctor = getCtor()
    if (!Ctor) return
    let live = true
    probeOnDevice(Ctor, navigator.language || 'en-US').then((l) => { if (live) setLocality(l) })
    return () => { live = false }
  }, [])

  function start() {
    const Ctor = getCtor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = navigator.language || 'en-US'
    // Only when the probe confirmed a local language pack — see `probeOnDevice`.
    if (locality === 'on-device') rec.processLocally = true
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) onTextRef.current(r[0].transcript.trim())
      }
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  function stop() {
    recRef.current?.stop()
    setListening(false)
  }

  return { listening, start, stop, supported: speechSupported(), locality }
}

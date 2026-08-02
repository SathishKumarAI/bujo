import { useEffect, useRef, useState } from 'react'

// Minimal typings for the Web Speech API (not in lib.dom by default).
interface SpeechRecognitionAlternative { transcript: string }
interface SpeechRecognitionResult { 0: SpeechRecognitionAlternative; isFinal: boolean }
interface SpeechRecognitionEvent { resultIndex: number; results: { length: number; [i: number]: SpeechRecognitionResult } }
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}
type SpeechCtor = new () => SpeechRecognitionLike

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

  function start() {
    const Ctor = getCtor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = navigator.language || 'en-US'
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

  return { listening, start, stop, supported: speechSupported() }
}

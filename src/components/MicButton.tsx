import { Mic, MicOff } from 'lucide-react'
import { useSpeechInput } from '../lib/speech'

/**
 * Mic toggle that dictates speech into text. Calls `onText` with each final
 * phrase; the parent appends it. Renders nothing where the Web Speech API is
 * unavailable (e.g. Firefox), so callers don't need to feature-check.
 */
export function MicButton({ onText, className = '' }: { onText: (text: string) => void; className?: string }) {
  const { listening, start, stop, supported } = useSpeechInput(onText)
  if (!supported) return null
  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start())}
      aria-label={listening ? 'Stop dictation' : 'Dictate by voice'}
      aria-pressed={listening}
      title={listening ? 'Listening… tap to stop' : 'Dictate by voice'}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors ${
        listening ? 'animate-pulse border-red bg-red/15 text-red' : 'border-input text-overlay1 hover:text-text'
      } ${className}`}
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  )
}

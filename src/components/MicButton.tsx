import { Microphone, MicrophoneSlash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useSpeechInput } from '../lib/speech'

/**
 * Microphone toggle that dictates speech into text. Calls `onText` with each final
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
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-control transition-colors ${
        listening ? 'animate-pulse bg-red/20 text-red' : 'bg-ink-2 text-fg-2 shadow-raise hover:bg-ink-3 hover:text-fg-1'
      } ${className}`}
    >
      {listening ? <Icon as={MicrophoneSlash} size="md" /> : <Icon as={Microphone} size="md" />}
    </button>
  )
}

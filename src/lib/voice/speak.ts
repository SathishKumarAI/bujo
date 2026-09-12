/**
 * The assistant's voice · `speechSynthesis`, and nothing else.
 *
 * Built into every browser this app runs in, needs no model, no download, no
 * key and no network — which is the whole reason it is this and not a neural
 * TTS. A 60 MB voice model to say "saved" is not a trade this app makes.
 *
 * Everything here no-ops where the API is missing, so a caller never has to ask
 * first. Speaking is a courtesy on top of a UI that already shows the same
 * words; it is never the only way to know what happened.
 */

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

export const speechOutSupported = (): boolean => synth() != null

/**
 * Say one line, cancelling whatever was being said.
 *
 * Cancel-then-speak rather than queue: this is a conversation, and an assistant
 * still reading out the last answer when you have already asked the next
 * question is worse than one that stops mid-sentence. `speechSynthesis` queues
 * by default, which in a rapid back-and-forth turns into a minute of backlog.
 */
export function say(text: string, opts: { enabled?: boolean; lang?: string } = {}): void {
  if (opts.enabled === false) return
  const s = synth()
  if (!s || !text.trim()) return
  try {
    s.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = opts.lang ?? (typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US')
    // Slightly quick. The default rate reads a two-clause confirmation like an
    // announcement; this is closer to how a person says "got it, mood 7 today".
    u.rate = 1.05
    s.speak(u)
  } catch { /* a browser that has the object and refuses the call — say nothing */ }
}

/** Stop talking now — for a cancel button, or unmounting mid-sentence. */
export function hush(): void {
  try { synth()?.cancel() } catch { /* nothing to stop */ }
}

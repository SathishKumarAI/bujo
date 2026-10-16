import { Icon } from '@/components/Icon'
import type { Icon as Glyph } from '@/components/icons'
import { cat, onRaised } from '../../lib/colors'

/**
 * THE ONE SENTENCE AT THE TOP OF A PAGE, as a control.
 *
 * WHAT THIS FILE OWNS: how a `nextStep` sentence is drawn, and the rule that
 * colour on it means urgency and nothing else.
 * WHAT IT DOES NOT OWN: what the sentence says (each page's own `nextStep`),
 * or which row it points into.
 *
 * ── Why it exists ────────────────────────────────────────────────────────
 *
 * It was written **four times** — `views/Fitness.tsx`, `views/Pickleball.tsx`,
 * `views/Nutrition.tsx` and `views/NoFap.tsx` — with the same `const shell =
 * 'mb-3 flex w-full items-center gap-2.5 rounded-control border-l-2 bg-ink-1
 * px-3 py-2 text-left'` in each, the same button/paragraph ternary under it,
 * and the same comment about dropping the destination hint on a phone. Four
 * copies of a layout is four places to fix the next time one of them is
 * wrong, and §15 described the pattern while every caller re-typed it.
 *
 * The parts that genuinely differ are three: the sentence, the tone, and the
 * icon. Those are props. Everything else was the same string.
 *
 * ── The rules it carries, so no caller has to remember them ─────────────
 *
 * **Colour means urgency, in the edge and the icon only.** The text is
 * `fg-1`. An accent as text on a wash of itself is the calibration trap in
 * CLAUDE.md — the accents are solved against the page ground, and a wash of
 * the accent moves that ground toward the text and spends the whole margin.
 *
 * **A button when a row holds the detail, a paragraph when none does.** A
 * sentence that looks pressable and is not is worse than one that does
 * nothing, and `onPick` being optional is what decides which this is.
 *
 * **The destination is named on a desktop and dropped on a phone.** Measured
 * on Pickleball: the row is 39px wide-screen and was **156px** at 390px —
 * four lines, because the sentence already wrapped to three and the panel name
 * added a fourth. The sentence names the destination in its own words, the
 * whole row is the button, and a phone has no hover to need the hint.
 */
export function NextStepBlock({ text, tone, icon, destination, onPick, className = '' }: {
  /** The sentence. Always present — every `nextStep` in this app is total. */
  text: string
  /** A palette name. Urgency, never category. */
  tone: string
  icon: Glyph
  /** The row this points into, named for the hint on the right. */
  destination?: string
  /** Omit and the block is a paragraph rather than a button. */
  onPick?: () => void
  className?: string
}) {
  const body = (
    <>
      <Icon as={icon} size="md" style={{ color: onRaised(tone) }} className="shrink-0" />
      <span className="min-w-0 text-body text-fg-1">{text}</span>
      {destination && (
        <span className="ml-auto hidden shrink-0 text-label text-fg-2 sm:inline">{destination} →</span>
      )}
    </>
  )
  const shell = `mb-3 flex w-full items-center gap-2.5 rounded-control border-l-2 bg-ink-1 px-3 py-2 text-left ${className}`
  return onPick ? (
    <button type="button" onClick={onPick} className={`${shell} transition-colors hover:bg-ink-2`} style={{ borderLeftColor: cat(tone) }}>
      {body}
    </button>
  ) : (
    <p className={shell} style={{ borderLeftColor: cat(tone) }}>{body}</p>
  )
}

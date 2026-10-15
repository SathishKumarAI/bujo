import { Icon } from '../Icon'
import { CaretLeft } from '../icons'

/**
 * The act column, shut — a slim rail on the right that reopens it.
 *
 * **Why this exists rather than just collapsing the card.** A `Card
 * collapsible` folds its *body*, and on a desktop that frees height and no
 * width at all: the act column is `38fr` of the page grid, so a collapsed card
 * left a ~400px empty lane beside the thing you were trying to read. Reported
 * exactly that way — "it just goes to the top, I wanted it to the right side so
 * I have more space to read".
 *
 * Shut, the grid becomes `1fr auto` and this strip is the `auto`: the review
 * column takes the width back, and the way back in is still on screen and in
 * the same place. Measured on both pages at 1440: the review zone goes from **678px to
 * 1054px** and the act from 416px to a **40px** strip — 55% more reading
 * width, and reopening restores both columns exactly.
 *
 * It is a real `<button>` with the full label as its accessible name — the
 * sideways text is decoration, and `aria-expanded` is what the a11y gate reads.
 */
export function ActStrip({ label, onOpen, summary }: {
  /** What reopens — "Log a session". Becomes the accessible name. */
  label: string
  onOpen: () => void
  /** One line of what is inside, so a shut panel is not a mystery. */
  summary?: string
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={false}
      aria-label={summary ? `${label} · ${summary}` : label}
      title={summary ? `${label} · ${summary}` : label}
      className="group sticky top-[calc(var(--header-h,3.5rem)+1rem)] flex h-fit w-10 flex-col items-center gap-2 rounded-card border border-line bg-ink-1 py-3 text-label text-fg-2 transition-colors hover:border-line-strong hover:text-fg-1"
    >
      <Icon as={CaretLeft} size="sm" className="shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
      {/* Sideways, so the strip stays 40px wide whatever the label says. The
          button's accessible name carries the real text; this is paint. */}
      <span aria-hidden className="whitespace-nowrap [writing-mode:vertical-rl]">{label}</span>
    </button>
  )
}

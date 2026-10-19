import { Icon } from '../Icon'
import { CaretLeft, CaretRight } from '../icons'

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
      data-act-strip
      className="group sticky top-[calc(var(--header-h,3.5rem)+1rem)] flex h-fit w-10 flex-col items-center gap-2 rounded-card border border-line bg-ink-1 py-3 text-label text-fg-2 transition-colors hover:border-line-strong hover:text-fg-1"
    >
      <Icon as={CaretLeft} size="sm" className="shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
      {/* Sideways, so the strip stays 40px wide whatever the label says — but
          only while it IS a column. Stacked, `.zone-act` is the full width of
          the page and a 40px tower of rotated text in the middle of it reads
          as a rendering fault; `layout.css` lays the same button down into a
          44px bar there. The accessible name is the real text either way; this
          span is paint. */}
      <span aria-hidden className="whitespace-nowrap [writing-mode:vertical-rl]">{label}</span>
      {summary && <span aria-hidden className="hidden text-fg-2 [.page-zones-single_&]:inline">· {summary}</span>}
    </button>
  )
}

/**
 * THE WAY OUT OF THE ACT COLUMN — one control, so it stops being five.
 *
 * WHAT THIS OWNS: the affordance that shuts zone 2 and hands the width back
 * to the review. It is `ActStrip`'s inverse and lives beside it for that
 * reason: the pair is one gesture with two ends, and they drifted apart
 * precisely because only one of them was a component.
 *
 * ── What it replaces ─────────────────────────────────────────────────────
 *
 * Nine pages have an act column. Audited at `c182ca3`, they shut it **five
 * different ways**:
 *
 * | pages | the control |
 * |---|---|
 * | Recovery, Nutrition | the `<h2>` title itself is the button, with a caret |
 * | Cycle | a separate button painting "Tap to hide" |
 * | Fitness, Gym, Pickleball | an icon-only ghost button, named `Hide the log` / `Hide the logger` |
 * | Pull-ups, Home workout | `Card collapsible`'s own caret, named `Collapse …` |
 * | Challenges | nothing at all, until COD-373 |
 *
 * Five shapes, four nouns for the same column, two different verbs, and one
 * page where the gesture did not exist. Reported as *"make sure we have all
 * places in a similar manner"*, which is exactly right: a reader who learns
 * the control on one page should not have to find it again on the next.
 *
 * ── The three decisions in it ────────────────────────────────────────────
 *
 * **The word is painted, not only announced.** The icon-only version is the
 * one Recovery's own comment calls "a feature nobody finds", and the `title`
 * it leaned on does not exist on a phone at all. A caret alone is a glyph
 * whose meaning you have to already know.
 *
 * **The accessible name CONTAINS the painted word.** `label-content-name-mismatch`
 * (WCAG 2.5.3) compares the name against what is DRAWN, because a
 * speech-input user says what they can see — so the name extends "Hide"
 * rather than replacing it. Cycle shipped this exact violation once, painting
 * "Tap to hide" while announcing "Hide the log", and `a11y:panels` caught it
 * on all twelve of that page's rows at once.
 *
 * **It is not `Card collapsible`.** That folds a card's *body*, which on a
 * desktop frees height and no width — the act column is a grid track, so a
 * folded card leaves a ~400px empty lane beside the thing you are reading.
 * `ActStrip`'s docstring has the measurement: 678px → 1054px of review only
 * when the TRACK goes.
 */
export function ActHide({ what, onHide, className = '' }: {
  /**
   * What is being put away, as a noun phrase: `the log`, `today`, `the
   * logger`. Used to finish the sentence the button announces; never drawn.
   */
  what: string
  onHide: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onHide}
      /* `aria-expanded` and not `aria-pressed`: this is a disclosure, and it
         is the attribute `openFolds()` in the a11y gate looks for — a control
         that hides content and does not say so is content the gate cannot
         reach. */
      aria-expanded
      aria-label={`Hide ${what} — the review takes the width`}
      className={`group inline-flex shrink-0 items-center gap-1 text-label text-fg-2 transition-colors hover:text-fg-1 ${className}`}
    >
      Hide
      <Icon as={CaretRight} size="sm" className="transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  )
}

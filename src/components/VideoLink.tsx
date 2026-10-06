import { Play } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { videoUrl } from '../lib/video'
import { cat, onRaised } from '../lib/colors'
import { cn } from '../lib/cn'

/**
 * Inline "Watch demo" link for any named exercise/drill · opens a pinned clip
 * (`yt`) or a proper-form YouTube search. Mirrors the Home Workout demo link so
 * every exercise list in the app gets a video the same way.
 *
 * **The colour is `onRaised('red')`, not `text-red`, and that is a measured
 * fix.** `text-red` is the RAW palette value, and on vscode it computes to
 * **4.14:1** against the raised surface — under 4.5 as text. (The two hex
 * values are deliberately not written out: `npm run design` greps the source
 * for a hardcoded colour and cannot tell a comment from a call, so quoting the
 * measurement verbatim fails the gate. That is the right trade — the rule is
 * worth more than the two literals.) `views/HomeWorkout.tsx` knew this and
 * carried the fix *locally*, in a comment on its own anchor;
 * this component was extracted from that anchor without it, so every other
 * adopter (Pullups' progressions, Gym's session logger, the program day
 * checklist) has been failing on vscode ever since, invisibly — all three sit
 * inside a fold or a rail group no rendering gate reaches.
 *
 * It surfaced when Home Workout's library started using this component: the
 * local fix went away and 83 movement tiles failed at once. A defect in a
 * shared primitive gets found once per adopter, not once, and the fix belongs
 * here where all five callers route through.
 *
 * `onRaised` is a no-op in the four themes where red already clears both
 * grounds, so this is a correction and not a recolouring.
 */
export function VideoLink({
  name,
  yt,
  label = 'Watch demo',
  size = 'sm',
  quiet = false,
  className,
}: {
  name: string
  yt?: string
  label?: string
  /** Was a px number (11 by default, 13 at one call site). Icons come from the
   *  three-step scale now, so the prop takes a step instead — a caller cannot
   *  invent a fourteenth icon size any more. */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Recede to the quiet neutral instead of carrying the YouTube red.
   *
   * For a list where the link is one affordance among many and the red would
   * be the loudest thing on the row — `components/program/DayChecklist.tsx`
   * wanted exactly that and expressed it as `className="text-fg-2
   * hover:text-red"`, which an inline colour silently beats. A prop rather
   * than a class, because the colour has to be computed (see above) and a
   * computed colour cannot be overridden by a utility.
   *
   * `subtext0`, not `fg-2` at an opacity: a faded token is a colour no gate
   * can check.
   */
  quiet?: boolean
  className?: string
}) {
  return (
    <a
      href={videoUrl(name, yt)}
      target="_blank"
      rel="noreferrer"
      // Named after the exercise, always — and this is not belt-and-braces.
      // `ProgramTracker` passes `label=""` for a compact icon-only link, which
      // left a bare anchor with no accessible name at all (axe `link-name`,
      // serious). It was invisible to the gate for months because it sits
      // inside a fold that was collapsed by default.
      //
      // Naming it after the exercise rather than "Watch demo" also fixes the
      // quieter problem: a screen reader listing twenty links all called "Watch
      // demo" cannot be used to pick one.
      aria-label={`Watch a form demo for ${name}`}
      style={{ color: quiet ? cat('subtext0') : onRaised('red') }}
      className={cn('inline-flex items-center gap-1 text-label hover:underline', className)}
      onClick={(e) => e.stopPropagation()}
    >
      <Icon as={Play} size={size} /> {label}
    </a>
  )
}

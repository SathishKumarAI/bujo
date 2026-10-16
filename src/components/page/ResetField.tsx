import { ArrowCounterClockwise } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Button } from '../ui/button'

/**
 * THE WAY BACK FROM A NUMBER YOU CHANGED.
 *
 * WHAT THIS FILE OWNS: the affordance that puts a stepped or typed value back
 * where it started, and the rule about when it is allowed to appear.
 * WHAT IT DOES NOT OWN: what the value is, or what "back" means — the caller
 * says both.
 *
 * Asked for directly: *"if sometimes I'm entering or increasing the values,
 * give me an option for reset as well — like in the plate calculator and food
 * and some other places"*. Correct, and it is the same family as
 * `USER-CONTROL.md`'s rule 1 one level down: `add` without `edit` is a bug, and
 * **a stepper without a way back is a stepper you are afraid to press**. Tapping
 * `+` eleven times to see what it does is the first thing anybody does with a
 * new control, and before this the only way out was to select the field and
 * retype the original — which you have to remember.
 *
 * ── Three rules, and they are what make it honest ─────────────────────────
 *
 * 1. **It renders nothing while the value is already the default.** A reset
 *    button that is always there is furniture, and a disabled one teaches
 *    people the control does not work (the same reasoning `ShowMore` uses for
 *    hiding itself when nothing is hidden).
 * 2. **The label says where it goes**, not just "reset": `Back to 2,000` tells
 *    you what will happen, and a bare glyph does not. The drawn text can be
 *    shortened — `aria-label` carries the full sentence — which is
 *    `ChipPick`'s draw-short/announce-long rule.
 * 3. **It is not a delete.** Reset restores a KNOWN value; clearing a record is
 *    a different verb with a different confirmation (`useConfirm`, naming what
 *    it removes). A control that says "reset" and empties a day is the kind of
 *    thing this repo has shipped once already.
 */
export function ResetField({ changed, to, onReset, what }: {
  /** Nothing renders while this is false. */
  changed: boolean
  /** What the value goes back to, drawn in the label. */
  to: string
  onReset: () => void
  /** The thing being reset, for the accessible name: "the calorie target". */
  what: string
}) {
  if (!changed) return null
  return (
    <Button
      variant="ghost"
      onClick={onReset}
      aria-label={`Reset ${what} to ${to}`}
      title={`Reset ${what} to ${to}`}
      className="inline-flex h-auto items-center gap-1 p-0 text-label text-fg-2 hover:text-fg-1"
    >
      <Icon as={ArrowCounterClockwise} size="sm" /> Back to {to}
    </Button>
  )
}

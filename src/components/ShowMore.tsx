import { Button } from './ui/button'
import type { CappedList } from '../lib/useCappedList'

/**
 * The one affordance for a capped list. COD-303.
 *
 * Pairs with `useCappedList`. Separate file from the hook because eslint's
 * react-refresh rule wants a module whose exports are all components — the
 * same reason `settings/download.ts` is not inside `settings/shared.tsx`.
 *
 * ── The label carries the total on purpose ─────────────────────────────────
 *
 * `Show all (24)`, not `Show all`. The contract's empty-state rule is that a
 * measurement and an absence must not look alike, and the same argument runs
 * here: a history collapsed to three rows with an unlabelled button cannot be
 * told from a history that only ever had three entries. The number is the
 * difference between "there is more" and "that is all there is", and it is the
 * reason this is not just a chevron.
 *
 * Precedent in this repo: the urge-coverage card prints `3 of 5` and names what
 * is missing rather than drawing an empty grid, because an empty grid reads as
 * a measurement ("no urges at any hour") when the truth is a gap in the record.
 *
 * Renders **nothing** when nothing is hidden. A disabled or no-op "Show all" on
 * a two-row list is a control that teaches people the control does not work.
 */
export function ShowMore({ list, className = '' }: { list: Pick<CappedList<unknown>, 'expanded' | 'hidden' | 'total' | 'toggle'>; className?: string }) {
  if (list.hidden === 0) return null
  return (
    <Button
      variant="ghost"
      onClick={list.toggle}
      // `h-auto p-0 text-label` matches the inline toggle Fitness already had,
      // which is the one call site that got this right before the sweep. A
      // header affordance is a quiet row, not a button the eye lands on first.
      className={`h-auto p-0 text-label ${className}`}
    >
      {list.expanded ? 'Show less' : `Show all (${list.total})`}
    </Button>
  )
}

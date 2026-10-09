import { useState } from 'react'

/**
 * Show the few most recent rows, and keep the rest one click away. COD-303.
 *
 * ── Why this is a shared hook and not four `useState`s ─────────────────────
 *
 * Asked for as "I see a lot of histories which I don't want to see — show the
 * last three and hide the rest". The reason it is worth a module is what the
 * sweep found: **five history lists, five different rules**, and two of them
 * silently lying.
 *
 * | view | before |
 * |---|---|
 * | `Fitness` | 8 rows + a "Show all (N)" toggle — the right shape, wrong number |
 * | `Focus` | **no cap at all**; every session, forever |
 * | `HomeWorkout` | `slice(0, 12)` and **no way to reach row 13** |
 * | `Pullups` | `slice(0, 12)` and **no way to reach row 13** |
 * | `Pickleball` | 5 rows in a fixed-height scroller — see below |
 *
 * The two hard slices are the actual defect here, and they are worse than the
 * long lists: a list that stops at twelve with nothing saying so is a list that
 * has quietly deleted your history from the only place you look for it. One
 * rule, one constant, one affordance.
 *
 * ── Pickleball is deliberately NOT a caller ────────────────────────────────
 *
 * It already solved this and wrote down the measurement: it was "eight rows and
 * a 'Show all 23' button, so the card was either 8 rows tall or 23 — and at 23
 * it pushed everything under it down a screen and a half". It now gives the
 * list a `max-h` with every row present, five visible and the sixth
 * half-visible as the affordance, so the card is the same height whichever you
 * are doing.
 *
 * That is a better answer to the same question for a card whose rows are all
 * one line, and it is reasoned rather than inherited. Converting it to this
 * hook would reintroduce the exact height jump its author measured and removed.
 * A rule applied to a case that already disagrees with it, for consistency's
 * sake, is how a considered decision gets silently reverted.
 */

/** Three, because that is what was asked for. One constant, not four literals. */
export const HISTORY_CAP = 3

export interface CappedList<T> {
  /** What to render now. */
  shown: T[]
  expanded: boolean
  /** How many rows the cap is holding back. 0 when everything is shown. */
  hidden: number
  /** Total, for the label — collapsing must never read as data loss. */
  total: number
  toggle: () => void
}

export function useCappedList<T>(items: T[], cap: number = HISTORY_CAP): CappedList<T> {
  const [expanded, setExpanded] = useState(false)
  return {
    // `slice` copes with a list shorter than the cap on its own, so there is no
    // branch here and no empty-state special case: a two-row history renders
    // its two rows and `hidden` is 0, which hides the button.
    shown: expanded ? items : items.slice(0, cap),
    expanded,
    hidden: Math.max(0, items.length - cap),
    total: items.length,
    toggle: () => setExpanded((v) => !v),
  }
}

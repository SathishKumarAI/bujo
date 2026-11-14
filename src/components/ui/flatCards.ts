import { createContext } from 'react'

/**
 * Under this provider a `Card` is a card, not a fold: no collapse caret (its
 * body is always drawn) and no ⓘ popover (its subtitle is drawn as a line).
 *
 * The owner's phone rule, 2026-11-13: nothing opens in place. A context and
 * not a phone check inside `Card`, because Help's phone sections fold on
 * purpose (#515) — each phone page opts in where its cards are drawn
 * (COD-590; Recovery's `RecoveryReview` first).
 */
export const FlatCards = createContext(false)

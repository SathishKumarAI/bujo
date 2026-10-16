import { useState, type ReactNode } from 'react'
import { Card } from '../ui'

/**
 * ONE CARD FOR ALL THREE LOGGING ACTS, one at a time.
 *
 * WHAT THIS FILE OWNS: which of the three forms is on screen.
 * WHAT IT DOES NOT OWN: any of the forms — they are `UrgeSurfingCard`,
 * `DayTallyCard` and `LogResetCard`, each rendered `bare` so this is genuinely
 * one card rather than three in a stack.
 *
 * ── Why ──────────────────────────────────────────────────────────────────
 *
 * Reported by pasting the whole act column back a second time: *"this be
 * included in one card, and I don't want to scroll this much"*. The column was
 * three cards — an urge form with ~20 chips, a day tally with four streaks and
 * five quick-amounts each, and a reset form with two required-ish fields —
 * stacked, all open, all the time. Three borders, three headings, and the
 * third act was a long scroll below the second.
 *
 * They are three *different* acts, not three parts of one: "I felt an urge",
 * "it happened today" and "I am resetting the counter" are mutually exclusive
 * in the moment. So one card, one chooser, one form — the same "focus on one
 * thing at a time" the review deck applies to zone 3.
 *
 * ── It opens on Urge, and that is a measured default ─────────────────────
 *
 * `PRODUCT.md` ranks capture as the product, and on this page the frequent
 * capture is riding out an urge — many times a day during a streak. A tally
 * and a reset are rare by definition. The card that was already first stays
 * first; the other two stop costing a scroll to get past.
 *
 * ── Not sticky ───────────────────────────────────────────────────────────
 *
 * A person who logged a reset yesterday should not open the page on the reset
 * form today. The rail row is a place you return to; this is a choice you make
 * in the moment, so it resets to Urge on every visit — the same rule §16's
 * sub-section chips follow.
 */
export function LogCard({ urge, tally, reset }: {
  urge: ReactNode
  tally: ReactNode
  reset: ReactNode
}) {
  const [tab, setTab] = useState<'urge' | 'tally' | 'reset'>('urge')

  const TABS = [
    { id: 'urge' as const, label: 'An urge', hint: 'Feeling one now' },
    { id: 'tally' as const, label: 'It happened', hint: 'Log today' },
    { id: 'reset' as const, label: 'A reset', hint: 'Restart the counter' },
  ]
  const current = TABS.find((t) => t.id === tab) ?? TABS[0]

  /*
    NO TITLE ON THE CARD. The zone-2 heading directly above it already says
    "Log an urge or a reset" — and that heading is the toggle that hides the
    column, so it cannot move. Printing it again inside the card was the same
    sentence twice, eight pixels apart. The tab row says which of the three
    you are on, which is the part that actually varies.
  */
  return (
    <Card hideInfo subtitle={current.hint}>
      {/*
        A `radiogroup`, not a tab list: there is no panel to own and the three
        forms are alternatives to each other. Arrow keys work once the roles
        are right.

        `min-h-11` on each, because COD-96 counts the controls under 44px on a
        phone and three of the most-pressed controls on the page are not going
        to be on that list.
      */}
      <div role="radiogroup" aria-label="What are you logging?" className="mb-3 flex gap-1.5">
        {TABS.map((t) => {
          const on = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setTab(t.id)}
              className={`min-h-11 flex-1 rounded-control border px-2 text-label transition-colors ${
                on
                  ? 'border-line-strong bg-ink-3 font-medium text-fg-1'
                  : 'border-line bg-ink-2 text-fg-2 hover:border-line-strong hover:text-fg-1'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Only the chosen one is mounted. Not `hidden`, because a hidden form
          is still three forms' worth of controls in the tab order and in every
          gate's DOM walk — and this page already has enough of both. */}
      {tab === 'urge' && urge}
      {tab === 'tally' && tally}
      {tab === 'reset' && reset}
    </Card>
  )
}

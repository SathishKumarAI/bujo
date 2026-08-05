import type { ReactNode } from 'react'
import { Segmented } from '../ui'

export interface StatFact {
  label: string
  value: ReactNode
  /** Optional destination — a fact you can act on becomes a button. */
  onClick?: () => void
}

/**
 * Zone 1. One horizontal bar, at most four facts, hairline dividers, 64px cap.
 *
 * A fact earns a place here only if it changes what you do in the next thirty
 * seconds. "This week: 90 of 150 minutes" does; "sessions all-time" does not —
 * that is zone 3. The four-fact cap is enforced rather than documented, because
 * an orientation bar that grows is just a stats card with worse manners.
 *
 * The active mode segment fills NEUTRAL. The page is allowed one accent-filled
 * control and it belongs to the primary button in zone 2; a mode toggle that
 * also fills with accent makes two, and then neither reads as the thing to do.
 */
export function StatBar<T extends string>({
  mode,
  onModeChange,
  segments,
  facts,
}: {
  mode?: T
  onModeChange?: (m: T) => void
  segments?: { value: T; label: ReactNode }[]
  facts: StatFact[]
}) {
  // Truncate rather than throw: a fifth fact is a design mistake, not a reason
  // to white-screen someone's journal. The warning is what fails the build's
  // conscience; the slice is what protects the user.
  if (import.meta.env.DEV && facts.length > 4) {
    console.error(
      `StatBar takes at most 4 facts, got ${facts.length}. A fifth fact is zone-3 content — put it in the SummaryStrip.`,
    )
  }
  const shown = facts.slice(0, 4)
  return (
    <div className="flex max-h-16 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line py-2 sm:flex-nowrap">
      {segments && mode !== undefined && onModeChange && (
        <Segmented tone="neutral" value={mode} onChange={onModeChange} options={segments} />
      )}
      <div className="flex min-w-0 flex-1 items-center">
        {shown.map((f, i) => (
          <Fact key={f.label} fact={f} first={i === 0} />
        ))}
      </div>
    </div>
  )
}

function Fact({ fact, first }: { fact: StatFact; first: boolean }) {
  const body = (
    <>
      <span className="block truncate text-micro text-fg-2">{fact.label}</span>
      <span className="num block truncate text-body font-medium text-fg-1">{fact.value}</span>
    </>
  )
  // The divider is a left border on every fact but the first, so the bar never
  // ends on a trailing rule and the count of dividers is always facts - 1.
  const shell = `min-w-0 flex-1 px-3 text-left ${first ? '' : 'border-l border-line'}`
  return fact.onClick ? (
    <button onClick={fact.onClick} className={`${shell} rounded-control transition-colors hover:bg-ink-2`}>
      {body}
    </button>
  ) : (
    <div className={shell}>{body}</div>
  )
}

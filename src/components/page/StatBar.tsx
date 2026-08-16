import type { ReactNode } from 'react'
import { Segmented } from '../ui'

export interface StatFact {
  label: string
  value: ReactNode
  /** Optional destination — a fact you can act on becomes a button. */
  onClick?: () => void
  /**
   * This fact is a sentence, not a figure — render it in the body face.
   *
   * `.num` sets the mono family and tabular figures, which is right for
   * "203 / 150 min" and wrong for "Whenever the court is free" or "Target met —
   * anything you like". It was applied to every fact unconditionally, so a third
   * of zone 1 read as a different application: mono is the app's signature on
   * *numerals*, and spending it on prose spends it on nothing.
   *
   * Declared rather than sniffed. A heuristic over the rendered string would
   * have to decide what "Walk · Tue, Jul 28" is, and the call site already
   * knows.
   */
  prose?: boolean
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
    // The 64px cap is a desktop rule. Below `sm` the facts are two rows, so
    // capping the height there just clips the second one.
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line py-2 sm:max-h-16 sm:flex-nowrap">
      {segments && mode !== undefined && onModeChange && (
        <Segmented tone="neutral" value={mode} onChange={onModeChange} options={segments} />
      )}
      {/*
        Two columns on a phone, one row from `sm` up.

        Four facts sharing one 390px row — beside a Segmented control, which
        takes its width first — left each fact **7px wide**. The clipped-text
        gate found "Push day · Sat, Aug 15" showing 7px of the 146px it needs,
        and "Target met — anything you like" 7px of 213px: an orientation bar
        rendering none of the orientation, on Fitness, Pull-ups and Home workout
        at once. It had never been measured at this width.

        A grid rather than `flex-wrap` because wrapping flex items with
        `flex-1` still lets them collapse below their content; a 2-column grid
        gives each fact a real, equal share.
      */}
      <div className="grid w-full grid-cols-2 gap-y-2 sm:flex sm:w-auto sm:min-w-0 sm:flex-1 sm:items-center">
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
      {/*
        A prose fact wraps; a figure truncates. "Target met — anything you like"
        is a sentence and needs 213px it will never get on a phone, so nowrap +
        ellipsis could only ever hide it. A figure is short enough to fit once
        the column is real, and truncating it is the safer failure.
      */}
      <span className={`block text-body font-medium text-fg-1 ${fact.prose ? '' : 'num truncate'}`}>{fact.value}</span>
    </>
  )
  // The divider is a left border on every fact but the first, so the bar never
  // ends on a trailing rule and the count of dividers is always facts - 1.
  // Only from `sm`: in the phone grid it would draw down the middle of the two
  // columns and on the wrong items.
  const shell = `min-w-0 px-3 text-left sm:flex-1 ${first ? '' : 'sm:border-l sm:border-line'}`
  return fact.onClick ? (
    <button onClick={fact.onClick} className={`${shell} rounded-control transition-colors hover:bg-ink-2`}>
      {body}
    </button>
  ) : (
    <div className={shell}>{body}</div>
  )
}

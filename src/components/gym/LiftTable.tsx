import { Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, Empty, Pill } from '../ui'
import { cat, onRaised } from '../../lib/colors'
import { epley1RM } from '../../lib/fitness'
import type { BigThreeTotal, PR, RelativeStrength } from '../../lib/fitness'

const BAND_COLOR: Record<string, string> = {
  Elite: 'mauve', Advanced: 'blue', Intermediate: 'green', Novice: 'yellow', Beginner: 'overlay0',
}

/**
 * EVERY LIFT, ONE ROW EACH · what you have lifted and what that is worth.
 *
 * This replaces two cards that stood side by side and listed **the same
 * lifts**: `Personal records` (best set, estimated 1RM) and
 * `Strength standards` (the same weight as a multiple of bodyweight, with a
 * band). Measured on the rendered page, eight of nine lift names appeared
 * twice on the same horizontal band, 360px apart — "Deadlift" at x=170 and
 * "Deadlift" at x=530.
 *
 * **This is the third round of the same mistake on this page.** COD-89
 * already folded `BigThreeCard` into `Strength standards` with the note that
 * "Deadlift 100kg came to appear on this page four times", and the two
 * survivors were left as separate cards because they came from different
 * places. They were never two subjects: `ratio` is `weight ÷ bodyweight` and
 * `weight` is the PR. They are two columns of one table, and the reading that
 * matters — *my deadlift is 125lb, which is 1.6× bodyweight, which is
 * Advanced* — could not be done at all when the halves were in different
 * cards with different row orders.
 *
 * So: one row per lift, four numbers across. The join is on exercise name,
 * which is what both helpers key on.
 *
 * A real `<table>` rather than a flex list, because it is one: five columns
 * with headers, which is what lets a screen reader read "Deadlift, ×
 * bodyweight, 1.6" instead of four unlabelled numbers. Rows are buttons for
 * the muscle-map focus the two lists both had.
 *
 * The big-three total keeps its place as the card's headline. It is not a
 * zone-1 fact — `StatBar` caps at four and an all-time powerlifting total is
 * exactly the "sessions all-time" case the contract names as zone 3.
 */
export function LiftTable({
  prs, relative, total, unit, focusEx, setFocusEx, className,
}: {
  prs: PR[]
  relative: RelativeStrength[]
  total: BigThreeTotal
  unit: string
  focusEx: string | null
  setFocusEx: (e: string | null) => void
  /** Grid span from the call site — five columns want the full row. */
  className?: string
}) {
  const ratioOf = new Map(relative.map((r) => [r.exercise, r]))

  return (
    <Card band className={className} title="Lifts" subtitle="Best set, estimated 1RM, and what it is worth against your bodyweight" defer>
      <div className="mb-3 flex items-baseline justify-between border-b border-line pb-3">
        <span className="inline-flex items-center gap-1.5 text-body text-fg-1">
          <Icon as={Trophy} size="sm" style={{ color: onRaised('yellow') }} /> Big three
        </span>
        {/* "—", not "0". Nobody has logged a squat is not the same as a squat
            of nothing — the rule `SummaryStrip` spells out. */}
        <span className="text-title font-medium" style={{ color: total.total > 0 ? cat('yellow') : cat('subtext0') }}>
          {total.total > 0 ? `${total.total}${unit}` : '—'}
        </span>
      </div>
      {total.total > 0 && !total.complete && (
        <p className="-mt-2 mb-3 text-caption text-fg-2">Squat, bench and deadlift — log all three for your true total.</p>
      )}

      {prs.length === 0 ? (
        <Empty>Log sets like “Bench 5x5 @ 60kg” to track PRs.</Empty>
      ) : (
        <table className="w-full text-body">
          <thead>
            <tr className="border-b border-line text-label text-fg-2">
              <th scope="col" className="pb-1 text-left font-normal">Lift</th>
              <th scope="col" className="pb-1 text-right font-normal">Best</th>
              <th scope="col" className="pb-1 text-right font-normal">1RM</th>
              <th scope="col" className="pb-1 text-right font-normal">÷ BW</th>
              <th scope="col" className="pb-1 text-right font-normal">Level</th>
            </tr>
          </thead>
          <tbody>
            {prs.map((pr) => {
              const rel = ratioOf.get(pr.exercise)
              const on = focusEx === pr.exercise
              // A weightless set (dips, pull-ups logged without added load)
              // used to print "0lb · 1RM ~0lb" — a data artifact dressed as a
              // record. Bodyweight is the honest name, and Epley of 0 is not
              // a 1RM.
              const loaded = pr.weight > 0
              return (
                <tr
                  key={pr.exercise}
                  className={`border-b border-line/60 last:border-b-0 ${on ? 'bg-ink-2' : 'hover:bg-ink-2/50'}`}
                >
                  <th scope="row" className="py-1 text-left font-normal">
                    <button
                      onClick={() => setFocusEx(on ? null : pr.exercise)}
                      className="w-full text-left text-fg-1"
                      title="Show this lift on the muscle map"
                    >
                      {pr.exercise}
                    </button>
                  </th>
                  <td className="num py-1 text-right" style={{ color: onRaised('yellow') }}>
                    {loaded ? `${pr.weight}${unit}` : `bw${pr.reps > 1 ? ` ×${pr.reps}` : ''}`}
                  </td>
                  {/* Em dash, not a blank cell: a 1RM that cannot be estimated
                      from a single-rep or unloaded set is "not applicable",
                      and an empty cell reads as a rendering fault. */}
                  <td className="num py-1 text-right text-fg-2">
                    {loaded && pr.reps > 1 ? `${epley1RM(pr.weight, pr.reps)}${unit}` : '—'}
                  </td>
                  <td className="num py-1 text-right text-fg-1">
                    {rel ? `${rel.ratio}×` : '—'}
                  </td>
                  <td className="py-1 text-right">
                    {rel
                      ? <Pill color={BAND_COLOR[rel.band] ?? 'overlay0'} size="micro">{rel.band}</Pill>
                      : <span className="text-fg-3">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {relative.length === 0 && prs.length > 0 && (
        <p className="mt-2 text-label text-fg-2">
          Log your bodyweight under “How is my body changing?” to fill the last two columns.
        </p>
      )}
    </Card>
  )
}

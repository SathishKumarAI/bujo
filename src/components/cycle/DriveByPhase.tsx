import { cat, onRaised } from '../../lib/colors'
import type { DrivePhase } from '../../lib/cycleInsights'

/**
 * DRIVE, FOLDED ALONG THE CYCLE · where it actually peaks for you.
 *
 * The rating is one tap in the day editor; this is the reason it is worth
 * taking. The textbook says libido rises around ovulation, and the only way to
 * know whether that is true of *you* is to average your own numbers by phase —
 * which is the difference between a journal and a diary.
 *
 * Four bars rather than a chart: there are four categories and one number each,
 * and recharts for that would be a 40KB axis around a value that fits in a row.
 * Bar length is `avg / 5`.
 *
 * **A phase with no ratings draws no bar and says so.** `driveByPhase` returns
 * `avg: null` there, and the empty row is information — it is usually the phase
 * you keep forgetting to rate, and a zero-length bar would read as "no drive".
 */
export function DriveByPhase({ rows, peak }: {
  rows: DrivePhase[]
  /** Highest-rated phase, or null when fewer than two phases have ratings. */
  peak: DrivePhase | null
}) {
  const rated = rows.filter((r) => r.avg != null)

  if (rated.length === 0) {
    return (
      <p className="text-label text-fg-2">
        Rate a few days with the <span className="text-fg-1">Drive</span> row in the day editor and
        this fills in. It answers one question: the textbook says libido rises around ovulation —
        does yours?
      </p>
    )
  }

  return (
    <>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-2 text-label">
            {/* Wraps rather than truncates, and 7rem rather than 6: "Ovulation
                window" needs 107px and `w-24 truncate` showed 96 — which the
                clipped gate caught at all three widths. A phase name that reads
                "Ovulation win…" beside a bar is the one word the row is for. */}
            <span className="w-28 shrink-0" style={{ color: onRaised(r.color) }}>{r.label}</span>
            <span className="h-2.5 min-w-0 flex-1 rounded-[2px]" style={{ background: cat('surface0') }}>
              {r.avg != null && (
                <span
                  className="block h-2.5 rounded-[2px]"
                  style={{ width: `${(r.avg / 5) * 100}%`, background: cat(r.color) }}
                />
              )}
            </span>
            <span className="w-20 shrink-0 text-right text-fg-2">
              {r.avg != null
                ? <><span className="num font-medium text-fg-1">{r.avg.toFixed(1)}</span> · {r.days}d</>
                /* `fg-2`, not the dimmer `fg-3`: the demo seed rates days in
                   every phase, so this branch never renders under `npm run
                   a11y` and a contrast bug here could not fail — the
                   branch-the-seed-never-takes trap. Cheaper to not have one. */
                : <span className="italic">not rated</span>}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-label text-fg-2">
        {peak
          ? <>Highest so far in your <span style={{ color: onRaised(peak.color) }}>{peak.label.toLowerCase()}</span> phase,
              averaging <span className="num text-fg-1">{peak.avg!.toFixed(1)}</span> over {peak.days} rated {peak.days === 1 ? 'day' : 'days'}.
              The textbook expects the rise around ovulation; yours is your own, and a handful of days is not yet a pattern.</>
          : <>Not enough rated days to compare phases yet — two phases have to carry ratings before
              one of them can be the highest.</>}
      </p>
    </>
  )
}

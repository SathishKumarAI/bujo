import { cat, onRaised } from '../../lib/colors'
import {
  contrastOutcomes, nextSteps, VERDICT_COPY, verdictOf, type FeedbackRow, type Ledger,
} from '../../lib/recoveryFeedback'

/**
 * WAS THAT A WIN OR A LOSS · both sides of each thing you are changing.
 *
 * The page recorded both outcomes and framed neither as one. Resisting wrote a
 * `UrgeWin`; slipping wrote a `Relapse`; the two never met, so the honest
 * question — *"I watched porn, is that good or bad here?"* — had no answer on
 * screen even though the app knew.
 *
 * Every row is one addiction, with:
 *
 * - **the two counts, signed** — `+12 resisted` against `−3 followed`, so the
 *   sign is the answer and nobody has to infer it;
 * - **a bar that is the ratio**, not the raw count, because logging more in a
 *   good week would otherwise look like getting worse;
 * - **a verdict in words**, and `quiet` when nothing was logged — a blank week
 *   scoring 100% would be a flattery machine;
 * - **what to try next**, derived from that row's own HALT drivers and the
 *   technique that actually worked, never a listicle.
 *
 * **A lapse is rendered as information, not as a red mark.** Peach, not red,
 * and the copy says "that is information, not a verdict". An app that punishes
 * the bad entry teaches people to stop making it, and then it knows nothing —
 * which is the failure mode that matters most on this page.
 */
export function FeedbackLedgerCard({ ledger }: { ledger: Ledger }) {
  if (ledger.rows.length === 0) {
    return (
      <p className="text-body text-fg-2">
        Add what you are working on below, and this shows both sides of it — the urges you
        resisted and the times you did not — for each one separately.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-label text-fg-2">
        Last {ledger.windowDays} days. <span className="text-fg-1">Resisting counts for you</span>;
        following the urge counts against. Both are logged, because a page that only counts the
        good days ends up knowing nothing.
      </p>

      <ul className="space-y-4">
        {ledger.rows.map((row) => <Row key={row.addictionId} row={row} />)}
      </ul>

      {ledger.unattributed > 0 && (
        <p className="border-t border-line pt-3 text-label text-fg-2">
          {ledger.unattributed} urge{ledger.unattributed === 1 ? '' : 's'} logged without saying
          which one it was for — counted in your totals, but not in a row above. Newly logged
          urges ask.
        </p>
      )}
    </div>
  )
}

function Row({ row }: { row: FeedbackRow }) {
  const verdict = verdictOf(row)
  const copy = VERDICT_COPY[verdict]
  const steps = nextSteps(row)
  const contrast = contrastOutcomes(row.urges)
  const pct = row.ratio == null ? null : Math.round(row.ratio * 100)
  const trend = row.ratio != null && row.prevRatio != null ? row.ratio - row.prevRatio : null

  return (
    <li className="rounded-card bg-ink-2 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-body font-medium text-fg-1">{row.name}</span>
        <span className="text-label" style={{ color: onRaised(copy.hue) }}>{copy.label}</span>
      </div>

      {/* THE TWO SIGNED COUNTS. This is the answer to the question. */}
      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-label">
          <span className="num font-medium" style={{ color: onRaised('green') }}>+{row.resisted}</span>
          <span className="ml-1 text-fg-2">resisted</span>
        </span>
        <span className="text-label">
          <span className="num font-medium" style={{ color: onRaised('peach') }}>−{row.lapses}</span>
          <span className="ml-1 text-fg-2">followed</span>
        </span>
        {row.cleanDays != null && (
          <span className="text-label text-fg-2">
            <span className="num text-fg-1">{row.cleanDays}</span> day{row.cleanDays === 1 ? '' : 's'} since the last
          </span>
        )}
      </div>

      {/* The ratio, not the raw count: logging more in a good week must not
          read as getting worse. */}
      {pct != null && (
        <div className="mt-2">
          <div className="h-2 overflow-hidden rounded-pill" style={{ background: cat('surface0') }}>
            <div className="h-full rounded-pill" style={{ width: `${pct}%`, background: cat(copy.hue) }} />
          </div>
          <p className="mt-1 text-label text-fg-2">
            <span className="num text-fg-1">{pct}%</span> of the pulls you logged, you did not follow
            {trend != null && Math.abs(trend) >= 0.1 && (
              <span style={{ color: onRaised(trend > 0 ? 'green' : 'peach') }}>
                {' · '}{trend > 0 ? 'up' : 'down'} {Math.abs(Math.round(trend * 100))} points on the month before
              </span>
            )}
          </p>
        </div>
      )}

      <p className="mt-2 text-label text-fg-2">{copy.line}</p>

      {(row.topDriver || row.topTechnique) && (
        <p className="mt-2 text-label text-fg-2">
          {row.topDriver && <>Most often you were <span className="text-fg-1">{row.topDriver}</span>. </>}
          {row.topTechnique && <>What worked: <span className="text-fg-1">{row.topTechnique}</span>.</>}
        </p>
      )}

      {/* WHAT WAS DIFFERENT · the comparison the outcome field exists for, and
          the only thing on this page that answers "how do I move away from it"
          with evidence instead of advice. Same person, same log, same fields —
          so a factor that shows up far more on the gave-in side is a lever. */}
      {contrast.length > 0 && (
        <div className="mt-3 border-t border-line pt-2">
          <p className="text-label font-medium text-fg-1">What was different on the days you gave in</p>
          <ul className="mt-1.5 space-y-1.5">
            {contrast.map((c) => (
              <li key={c.factor} className="text-label text-fg-2">{c.text}</li>
            ))}
          </ul>
        </div>
      )}

      {steps.length > 0 && (
        <div className="mt-3 border-t border-line pt-2">
          <p className="text-label font-medium text-fg-1">What to try next</p>
          <ul className="mt-1.5 space-y-2">
            {steps.map((s) => (
              <li key={s.title} className="text-label">
                <span className="text-fg-1">{s.title}</span>
                <span className="text-fg-2"> — {s.why}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}
